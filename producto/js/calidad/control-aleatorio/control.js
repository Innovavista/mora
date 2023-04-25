//<editor-fold defaultstate="collapsed" desc="Selectpicker">
ko.bindingHandlers.selectPicker = {
	after: ['options'], /* KO 3.0 feature to ensure binding execution order */
	init: function (element, valueAccessor, allBindingsAccessor) {
		$(element).addClass('selectpicker').selectpicker();
	},
	update: function (element, valueAccessor, allBindingsAccessor) {
		/* KO 3.3 will track any bindings we depend on automagically and call us on changes */
		allBindingsAccessor.get('options');
		allBindingsAccessor.get('value');
		allBindingsAccessor.get('selectedOptions');

		$(element).selectpicker('refresh');
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	//<editor-fold defaultstate="collapsed" desc="Títulos">
	self.titulo = ko.computed(function () {
		if (self.accion() === 'visualizar') {
			return  "Visualizar control aleatorio";
		} else if(self.accion() === 'editar') {
			return  "Editar control aleatorio";
		} else if(self.accion() === 'nuevo') {
			return "Nuevo control aleatorio";
		}
	});
	
	self.conceptoControlable = ucFirst(self.conceptoSingular());
	
	self.tituloControl =  ko.computed(function () {
		if (self.accion() === 'visualizar') {
			return  ucFirst(self.conceptoPlural()) + " controlados";
		} else {
			return  ucFirst(self.conceptoPlural()) + " a controlar";
		}
	});
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Inicialización de evaluaciones">
	if(json.evaluaciones === undefined || json.evaluaciones.length === 0) {
		self.evaluaciones = ko.observableArray();
	}
	
	self.controlables = ko.observableArray();
	
	if (self.evaluaciones().length > 0) {
		self.evaluaciones.sort(function (a, b) {
			var nombre1 = a.itemControlable.nombre();
			var nombre2 = b.itemControlable.nombre();
			var orden = nombre1 === nombre2 ? 0
					: nombre1 < nombre2 ? -1
					: 1;
			return orden;
		});
	}
	
	/**
	 * Mapea los controlables en el formato del modelo (Control, Evaluacion,
	 * EvaluacionValor)
	 * 
	 * @param {array} controlables
	 * @returns {undefined}
	 */
	self.crearEvaluaciones = function (controlables) {
		var data = {};
		data.evaluaciones = [];
		ko.utils.arrayForEach(controlables, function (controlable) {
			var valores = [];
			ko.utils.arrayForEach(self.atributos(), function (atributo) {
				var valor = {
					id: Math.random().toString(36).substr(2, 9),
					atributo: {
						id: atributo.id()
					},
					valor: null
				};
				valores.push(valor);
			});
			var evaluacion = {
				id: Math.random().toString(36).substr(2, 9), 
				itemControlable: controlable,
				valores: valores,
				observaciones: ''
			};
			data.evaluaciones.push(evaluacion);	
		});		
		ko.mapping.fromJS(data, opcionesPantalla, self);
	};

	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Variables de búsqueda">
	
	self.cantidadItems = ko.observable(10);
	if (json.evaluaciones.length !== 0) {
		self.cantidadItems(Object.keys(json.evaluaciones).length);
	} else {
		self.evaluaciones = ko.observableArray();
	}

	/**
	 * Verifica que las fechas no son ni futura ni son inválidas
	 */
	self.fechaControl.subscribe(function(valor) {
		if (valor > moment().format("YYYY-MM-DD")) {
			Notificacion('No puede elegir una fecha futura', 'error');
		}
	});
	
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Búsqueda de controlables">
	
	/**
	 * Realiza la búsqueda de items a controlar
	 * 
	 * @returns {bool}
	 */
	self.buscarControlables = function() {
		self.evaluaciones([]);
		self.controlables([]);
		if (!self.verificarCantidadItems()) {
			return true;
		}
		var url = self.urls.buscarControlables();
		var data = {
			cantidad: self.cantidadItems()
		};
		var opciones = self.getAjaxOpciones({
			url: url,
			data: data,
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					Notificacion(data.success.mensaje, 'success');
					ko.mapping.fromJS(data.success, opciones, self);
					self.crearEvaluaciones(self.controlables());
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function(error) {
						Notificacion(error, 'error');
					});					
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajaxBuscarEvaluaciones(true);
			},
			complete: function (jqXHR, settings) {
				self.ajaxBuscarEvaluaciones(false);
			}
		});
		$.ajax(opciones);
		return true;
	};
	
	/**
	 * Verifica que la cantidad ingresada de items a buscar no sea 0
	 * 
	 * @returns {Boolean}
	 */
	self.verificarCantidadItems = function() {
		if (self.cantidadItems() <= 0) {
			Notificacion('La cantidad de items no puede ser 0','error');
			self.cantidadItems(1);
			return false;
		}
		return true;
	};
	
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Tabla de control de evaluaciones">
	
	/**
	 * Busca el valor de una evaluacion segun el atributo
	 *
	 * @param {koAtributo} atributo	 * 
	 * @param {koEvaluacion} evaluacion
	 * @returns {object}
	 */
	self.buscarValorEvaluacion = function(atributo, evaluacion) {
		var encontrado = null;
		ko.utils.arrayFirst(evaluacion.valores(), function (valor) {
			if (valor.atributo.id() === atributo.id()) {
				encontrado = valor;				
			}
		});
		return encontrado;
	};
		
	/**
	 * Al hacer click sobre el atributo a controlar le cambia el valor al
	 * siguiente estado
	 * 
	 * @param {koEvaluacion} evaluacion
	 * @param {koAtributo} atributo
	 * @returns {undefined}
	 */
	self.clickValorEvaluacion = function(evaluacion, atributo) {
		var valor = self.buscarValorEvaluacion(atributo, evaluacion);
		self.manipulacionEstadoEvaluacion(valor);
	};
	
	/**
	 * Manipula el valor de un control sobre un atributo de un evaluacion
	 * 
	 * @param {koEvaluacionValor} valor
	 * @returns {undefined}
	 */
	self.manipulacionEstadoEvaluacion = function(valor) {
		if (valor.valor() === null) {
			valor.valor(true); 
		} else if (valor.valor()) {
			valor.valor(false);
		} else {
			valor.valor(null);
		}
	};
	
	/**
	 * Muestra un tilde, una cruz o nada dependiendo del valor de la
	 * evaluación de un atributo
	 * 
	 * @param {koAtributo} atributo	 * 
	 * @param {koEvaluacion} evaluacion
	 * @returns {String}
	 */
	self.renderizarValorRespuesta = function(atributo, evaluacion) {
		var valor = self.buscarValorEvaluacion(atributo, evaluacion);
		if (valor.valor() === null) {
			return '<i style="display: inline-block;"></i>';
		} else if (valor.valor() === true) {
			return '<i style="color: green;" class="fa fa-check fa-2x" aria-hidden="true"></i>';
		} else {
			return '<i style="color: red;" class="fa fa-times fa-2x" aria-hidden="true"></i>';
		}
	};
	
	/**
	 * Modal para modificar la observación del control del evaluacion
	 * 
	 * @param {koEvaluacion} evaluacion
	 * @param {jQuery.Event} event
	 * @returns {undefined}
	 */
	self.modalObservacion = function(evaluacion, event) {
		event.stopPropagation();
		var evaluacionOriginal = ko.utils.arrayFirst(self.evaluaciones(), function(ev) {
			return ev.itemControlable.id() === evaluacion.itemControlable.id();
		});
		var titulo = "";
		if (self.accion() === "nuevo") {
			titulo = "Agregar observaciones a la evaluación";
		} else if(self.accion() === "editar" && evaluacionOriginal.observaciones().length > 0) {
			titulo = "Editar observaciones de la evaluación";
		} else if(self.accion() === "visualizar") {
			titulo = "Visualizar observaciones de la evaluación";
		}
		swal({
			title: titulo,
			showCancelButton: self.accion() !== 'visualizar',
			showConfirmButton: self.accion() !== 'visualizar',
			showCloseButton: true,			
			confirmButtonText: 'Guardar observaciones',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
			allowEnterKey: true,
			focusConfirm: false,
			html:
					`<div style="display: flex; flex-direction: column">
						<div style="display: flex;flex-direction: column;align-items: center;
							justify-content: center;">
							<label id="label-observacion-evaluacion" style="margin: 10px; white-space: nowrap;"									>Observaciones:</label>
							<textarea
								id="textarea-observacion-evaluacion"
								type="text"
								class="swal2-input"
								style="width: 300px;height: auto;min-height: 120px;"
							></textarea>						
						</div>
					</div>`,
			onBeforeOpen: () => {
				document.getElementById("textarea-observacion-evaluacion").value = evaluacionOriginal.observaciones();
			},
			preConfirm: () => {
				var obs = document.getElementById("textarea-observacion-evaluacion").value;
				if (obs === "") {
					Notificacion("La observación no puede estar vacía", "error");
					return false;
				} else {
					evaluacionOriginal.observaciones(obs);		
					return true;
				}				
			}
		});
	};
	
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Guardado de control">
	
	/**
	 * Valida que los evaluaciones hayan sido evaluados o no estén repetidos
	 * 
	 * @returns {Boolean}
	 */
	self.datosValidados = function() {
		var bandera = true;
		ko.utils.arrayForEach(self.evaluaciones(), function(evaluacion) {
			var count = 0;
			ko.utils.arrayForEach(evaluacion.valores(), function(evaluacionValor) {
				if(evaluacionValor.valor() === null) {
					count++;
				}
			});
			if (count === evaluacion.valores().length) {
				Notificacion("El evaluacion " + evaluacion.itemControlable.nombre() + " no fue evaluado en ningún atributo", "error");
				bandera = false;
			}
		});
		if (!moment(self.fechaControl()).isValid()) {
			Notificacion("Cambie la fecha de control por una fecha válida","error");
			bandera = false;
		}
		return bandera;
	};
	
	/**
	 * Guarda el control con las evaluaciones y sus valores
	 * 
	 * @returns {undefined}
	 */
	self.guardarControl = function() {
		if (!self.datosValidados()) {
			return false;
		}
		var url = self.urls.guardarControl();
		var fecha	= moment(self.fechaControl());
		var data = {
			fecha: fecha.isValid() ? fecha.format("YYYY-MM-DD") : null,
			cantidad: self.cantidadItems(),
			evaluaciones: ko.mapping.toJS(self.evaluaciones())
		};
		var opciones = self.getAjaxOpciones({
			url: url,
			data: data,
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					Notificacion(data.success.mensaje, 'success');
					window.location.href = self.urls.tablero();
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function(error) {
						Notificacion(error, 'error');
					});					
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajaxGuardarItems(true);
			},
			complete: function (jqXHR, settings) {
				self.ajaxGuardarItems(false);
			}
		});
		$.ajax(opciones);
		return true;
	};
	
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">

	self.ajaxBuscarEvaluaciones = ko.observable(false);
	self.ajaxGuardarItems = ko.observable(false);
	self.ajaxOpciones = {
		method: 'POST',
		error: function (jqXHR, textStatus, errorThrown) {
			Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
		}
	};
	self.getAjaxOpciones = function (opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#crear-control-aleatorio');
	ko.options.deferUpdates = true;
	koNuevoControl = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koNuevoControl, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});

