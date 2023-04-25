//<editor-fold defaultstate="collapsed" desc="Extensiones">
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
	
	self.visualizar			= ko.observable(false);
	self.mercaderia			= self.presentaciones();
	self.presentable		= ko.observable(null);
	self.mercaderiaFiltrada = ko.observableArray(self.presentaciones());
	
	self.buscarDeposito = function(id) {
		var deposito = ko.utils.arrayFirst(self.depositos(), function(deposito) {
			return deposito.id() === id;
		});
		return deposito;
	};
	
	if (!ko.isObservable(self.pedido.deposito)) {
		var deposito = self.pedido.deposito;
		if (ko.isObservable(self.pedido.deposito.id)) {
			var idDeposito = self.pedido.deposito.id();
			deposito = self.buscarDeposito(idDeposito);
		}
		self.pedido.deposito = ko.observable(deposito.id());
	}
	
	//<editor-fold defaultstate="collapsed" desc="Líneas del pedido">
	
	//<editor-fold defaultstate="collapsed" desc="Búsqueda por código de barras">
	self.busquedaCodigo = ko.observable("");
	
	self.buscarPorCodigo = function(data, e) {
		var value = e.target.value;
		if (e.keyCode !== 13 || value.length < 3) {
			return true;
		}
		self.busquedaCodigo(value);
		return true;
	};
	
	self.busquedaCodigo.subscribe(function() {
		var busqueda		= self.busquedaCodigo();
		var presentaciones	= self.mercaderiaFiltrada();
		for (var i = 0; presentaciones.length > i; i++) {
			var presentacion = presentaciones[i];
			var codigo = presentacion.codigoBarras();
			if (!codigo) {
				continue;
			}
			if (codigo.toLowerCase() === busqueda.toLowerCase()) {
				self.busquedaCodigo("");
				return self.agregarLinea(presentacion);
			}
		}
	});
	//</editor-fold>
	
	/**
	 * Representa al item seleccionado dentro del select de genéricos.
	 */
	self.presentable.subscribe(function() {
		if (!self.presentable()) {
			return;
		}
		self.agregarLinea(self.presentable());		
	});
	
	self.agregarLinea = function(generico) {
		var linea = new koLinea({}, opciones);
		linea.comprable = generico;
		linea.agregarOpcionesUnidades();
		self.pedido.lineas.push(linea);
		self.actualizarGenericosLinea(linea, false);
		
	};
	
	self.quitarLinea = function(linea) {
		self.pedido.lineas.remove(linea);
		self.actualizarGenericosLinea(linea, true);
	};
	
	/**
	 * Actualiza los items a seleccionar tanto de 'Artículos' como 'Genéricos'
	 * 
	 * @param {koLinea} linea
	 * @param {bool} agregar
	 * @returns {void}
	 */
	self.actualizarGenericosLinea = function(linea, agregar) {
		var tipo	  = linea.comprable.tipoGenerico();
		var comprable = linea.comprable;
		if (agregar && (tipo === TIPO_MATERIA_PRIMA || tipo === TIPO_MERCADERIA)) {
			self.agregarPresentable(comprable);
		}
		if (agregar && tipo === TIPO_PRESENTACION) {
			self.mercaderiaFiltrada.push(comprable);
			self.ordenarPresentaciones();
		}
		
		if (!agregar && (tipo === TIPO_MATERIA_PRIMA || tipo === TIPO_MERCADERIA)) {
			self.quitarPresentable(comprable);
		}
		if (!agregar && tipo === TIPO_PRESENTACION) {
			self.mercaderiaFiltrada.remove(comprable);
		}
	};
	
	/**
	 * Agregar un presentable al select de 'Genéricos' y los ordena por 
	 * nombre.
	 * 
	 * @param {Object} presentable
	 * @returns {void}
	 */
	self.agregarPresentable = function(presentable) {
		self.presentables.push(presentable);
		self.ordenarPresentables();
		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
	};
	
	/**
	 * Quita un presentable del select de 'Genéricos'.
	 * 
	 * @param {object} presentable
	 * @returns {void}
	 */
	self.quitarPresentable = function(presentable) {
		var encontrado = self.getPresentable(presentable);
		self.presentables.remove(encontrado);
		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
	};
	
	/**
	 * Ordena los item de 'Artículos' por nombreLargo en forma descendente.
	 * 
	 * @returns {void}
	 */
	self.ordenarPresentaciones = function() {
		self.mercaderiaFiltrada.sort(function (l, r) {
			return l.nombreLargo().toLowerCase() > r.nombreLargo().toLowerCase() ? 1 : -1;
		});
	};
	
	/**
	 * Ordena los items del select 'Genéricos' por nombre en forma descendente.
	 * 
	 * @returns {void}
	 */
	self.ordenarPresentables = function() {
		self.presentables.sort(function (l, r) {
			return l.nombre().toLowerCase() > r.nombre().toLowerCase() ? 1 : -1;
		});
	};
	
	/**
	 * Para todos los artículos y genéricos le inicializa sus posibles unidades
	 * para que cuando sean agregados al pedido el select de unidades de la 
	 * linea ya tenga los datos necesarios para cargarlos.
	 * 
	 * @returns {void}
	 */
	self.inicializarSelectUnidades = function() {
		ko.utils.arrayForEach(self.pedido.lineas(), function(linea) {
			linea.agregarOpcionesUnidades(self.unidades);
		});
	};
	
	self.inicializarSelectUnidades();
	
	/**
	 * Busca una presentación por id.
	 * 
	 * @param {Object} presentacion
	 * @returns {Object|undefined}
	 */
	self.getPresentacion = function(presentacion) {
		var id		   = ko.isObservable(presentacion.id) ? presentacion.id() : presentacion.id;
		var encontrada = self.presentaciones().find(buscado => buscado.id() === id);
		return encontrada;
	};
	
	/**
	 * Busca una materia prima o mercadería por id.
	 * 
	 * @param {Object} presentable
	 * @returns {Object|undefined}
	 */
	self.getPresentable = function(presentable) {
		var id		    = ko.isObservable(presentable.id) ? presentable.id() : presentable.id;
		var tipo	    = ko.isObservable(presentable.tipoGenerico) ? presentable.tipoGenerico() : presentable.tipoGenerico;
		var encontrada  = self.presentables().find(presentable => presentable.id() === id && presentable.tipoGenerico() === tipo);
		return encontrada;
	};
	
	/**
	 * Actualiza los artículos y genéricos según las líneas del pedido.
	 * 
	 * @returns {void}
	 */
	self.actualizarArticulosYGenericos = function() {
		var lineas = self.pedido.lineas();
		for (var i = 0; lineas.length > i; i++) {
			var linea = lineas[i];
			
			var tipo	  = linea.comprable.tipoGenerico();
			var comprable = linea.comprable;
			if (tipo === TIPO_PRESENTACION) {
				var presentacion = self.getPresentacion(comprable);
				self.mercaderiaFiltrada.remove(presentacion);
			} else {
				var presentable = self.getPresentable(comprable);
				self.quitarPresentable(presentable);
			}
		}
	};
	
	if (parseInt(self.pedido.id()) > 0 && self.pedido.lineas().length > 0) {
		self.actualizarArticulosYGenericos();
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Guardar">
	self.guardarBorrador = function() {
		self.pedido.estado(ESTADO_BORRADOR);
		self.guardar();
	};
	
	self.guardarFinalizado = function() {
		self.pedido.estado(ESTADO_CERRADA);
		self.guardar();
	};
	
	/**
	 * Comprueba que el pedido sea válido, si mostrar es true acumula y muestra 
	 * los errores.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarGuardadoValido = function(mostrar) {
		var errores		= [];
		var fecha	    = self.pedido.fecha();
		var fechaMoment = moment(fecha).startOf('day');
		var fechaValida = fechaMoment.isValid();
		if (!fechaValida) {
			errores.push("La fecha de la nota de pedido no es válida.");
		}
		var hoy = moment().startOf('day');
		if (fechaMoment.isBefore(hoy)) {
			errores.push("La fecha de la nota de pedido no puede ser pasada.");
		}
		var deposito = self.pedido.deposito();
		if (typeof deposito === "undefined") {
			errores.push("Debe seleccionar un depósito.");
		}
		if (mostrar) {
			errores.forEach(error => { 
				Notificacion(error, "error");
			});
		}
		var lineasValidas = self.comprobarLineasValidas(mostrar);
		return errores.length === 0 && lineasValidas;
	};
	
	/**
	 * Comprueba que las líneas del pedido sean válidas, si mostrar es true 
	 * acumula y muestra los errores.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarLineasValidas = function(mostrar) {
		var lineas  = self.pedido.lineas();
		var errores = [];
		if (lineas.length === 0) {
			errores.push("Debe seleccionar al menos un artículo.");
		}
		ko.utils.arrayForEach(lineas, function(linea) {
			var tipo		 = linea.comprable.tipoGenerico ? linea.comprable.tipoGenerico() : "";
			var nombre		 = ko.isObservable(linea.comprable.nombre) ? linea.comprable.nombre() : linea.comprable.nombre;
			var tipoNombre	 = linea.comprable.tipoGenericoNombre ? linea.comprable.tipoGenericoNombre() : "";
			var preposicion  = tipo === TIPO_PRESENTACION ? "el" : "la";
			var descripcion  = "uno de los artículos";			
			if (tipo !== "") {
				descripcion = `${preposicion} ${tipoNombre.toString().toLowerCase()} "${nombre}"`;
			}
			
			var unidad = linea.unidad();
			if (typeof unidad === "undefined") {
				errores.push(`Debe seleccionar una unidad para ${descripcion}.`);
			}			
			
			var cantidad = linea.cantidad ? linea.cantidad() : 0;
			if (!Number.isInteger(cantidad) || parseInt(cantidad) < 0) {
				errores.push(`La cantidad para ${descripcion} no puede estar vacía o ser cero.`);
			}
			
			var hoy			 = moment().startOf('day');
			var fechaEntrega = moment(linea.fechaEntrega());
			if (!fechaEntrega.isValid()) {
				errores.push(`La fecha de entrega para ${descripcion} no es válida.`);
			}
			if (fechaEntrega.isBefore(hoy)) {
				errores.push(`La fecha de entrega para ${descripcion} no puede ser pasada.`);
			}
			
			var restante = linea.cantidadRestante();
			if (restante < 0) {
				errores.push(`Las observaciones para ${descripcion} no puede tener más de ${LONGITUD_OBSERVACIONES} caracteres.`);
			}
		});
		if (mostrar) {
			errores.forEach(error => { 
				Notificacion(error, "error");
			});
		}
		return errores.length === 0;
	};
	
	/**
	 * Guarda el pedido de compra en base de datos.
	 * 
	 * @returns {Boolean}
	 */
	self.guardar = function() {
		var valido = self.comprobarGuardadoValido(true);
		if (!valido) {
			return false;
		}
		
		var url		= self.urls.guardarPedido();
		var data	= {
			pedido	: self.pedido,
			edicion	: self.edicion()
		};
		data	 = { json: ko.mapping.toJSON(data) };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						Notificacion('La nota de pedido se ha guardado con éxito', 'success');
						window.location.href = self.volverA();
						return;
					}
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}					
				}
				Notificacion('Ha ocurrido un error al guardar la nota de pedido.', 'error');
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">

	self.ajax = ko.observable(false);
	self.ajaxOpciones = {
		method: 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
		},
		complete   : function(jqXHR, settings) {
			self.ajax(false);
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
	var $seccion = $('#compra-pedido-alta');
	ko.options.deferUpdates = true;
	koPedidoAlta = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koPedidoAlta, $seccion.get(0));
	
	var $form	   = $("#compra-pedido-alta");
	var $deposito  = $form.find("select.select-deposito");
	var idDeposito = $deposito.val();
	if (parseInt(idDeposito) > 0) {
		//Necesario para buscar el comedor en el módulo gastronomía
		$deposito.trigger('change');
	}
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});	
});