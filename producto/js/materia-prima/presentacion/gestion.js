/* global ko, opcionesPantalla, TIPO_MERCADERIA, opcionEnvase, jsonPresentacionGestion, opcionMarca */

var koPresentacionGestion = null;

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

//<editor-fold defaultstate="collapsed" desc="StringifyONCE">
JSON.stringifyOnce = function (obj, replacer, space) {
    var cache = [];
    var json = JSON.stringify(obj, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // circular reference found, discard key
                return;
            }
            // store value in our collection
            cache.push(value);
        }
        return replacer ? replacer(key, value) : value;
    }, space);
    cache = null;
    return json;
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.presentacionEdicion = ko.observable(null);

	self.simpleNueva	= new koPresentacion(
		ko.mapping.fromJS(ko.mapping.toJS(self.presentacionDummy), opcionesPantalla)
	);

	self.compuestaNueva = new koPresentacion(
		ko.mapping.fromJS(ko.mapping.toJS(self.presentacionDummy), opcionesPantalla)
	);
	self.compuestaNueva.presentacion = ko.observable();

	self.agregarSimpleInvalido	= ko.computed(function() {
		if (!self.simpleNueva.envase()
			|| !self.simpleNueva.marca()
			|| !self.simpleNueva.unidad()
			|| !self.simpleNueva.cantidad()
			|| self.simpleNueva.cantidad() === ''
			|| self.simpleNueva.cantidad() === 0
		) {
			return true;
		}
		return false;
	});

	self.agregarCompuestoInvalido	= ko.computed(function() {
		if (!self.compuestaNueva.envase()
			|| !self.compuestaNueva.presentacion()
			|| !self.compuestaNueva.cantidad()
			|| self.compuestaNueva.cantidad() === ''
			|| self.compuestaNueva.cantidad() === 0
		) {
			return true;
		}
		return false;
	});

	self.agregarSimple = function() {
		var simpleNueva		= self.simpleNueva;
		var relacion		= self.crearRelacionElementoPresentable(
			simpleNueva.cantidad(),
			simpleNueva.unidad().clave()
		);

		var presentacionKO = ko.mapping.fromJS(ko.mapping.toJS(simpleNueva));
		presentacionKO.elemento		= self.elemento;
		presentacionKO.elementos	= ko.observableArray([relacion]);
        presentacionKO.cantidad     = simpleNueva.cantidad();

		var presentacion = new koPresentacion(presentacionKO);

		self.guardar(presentacion, false);
	};

	self.agregarCompuesto = function() {
		var compuestaNueva = self.compuestaNueva;
		var presentaciones = self.crearRelacionPresentacion(
			compuestaNueva.presentacion(),
			compuestaNueva.cantidad()
		);

		var presentacionKO = ko.mapping.fromJS(ko.mapping.toJS(compuestaNueva));
		presentacionKO.relacionPresentaciones.push(presentaciones);
		presentacionKO.elemento		= self.elemento;
		presentacionKO.marca		= ko.observable(null);
		presentacionKO.unidad		= ko.observable(null);

		var presentacion	= new koPresentacion(presentacionKO);

		self.guardar(presentacion, false);
	};

	self.removerPresentacion = function(presentacion, e) {
		if (presentacion.presentacionHijo) {
			presentacion = presentacion.presentacionHijo();
		}
		self.eliminar(presentacion, e);
	};

	self.crearRelacionElementoPresentable = function(cantidad, unidad) {
		var relacion = null;
		switch (self.tipo()) {
			case TIPO_MERCADERIA:
				relacion = new koRelacionMercaderia();
				break;
			default:
				relacion = new koRelacionMateriaPrima();
				break;
		}
		relacion.setData({
			elemento	 : self.elemento,
			cantidad	 : cantidad,
			unidad		 : unidad
		});
		return relacion;
	};

	self.crearRelacionPresentacion = function(presentacionHijo, cantidad) {
		var relacionPresentacion = new koRelacionPresentacion({
			presentacionHijo : presentacionHijo,
			cantidad		 : cantidad
		});
		return relacionPresentacion;
	};

	self.reiniciarAltaSimple = function() {
		self.simpleNueva.envase(null);
		self.simpleNueva.cantidad(null);
		self.simpleNueva.unidad(null);
		self.simpleNueva.marca(null);
		self.simpleNueva.deReferencia(true);
		self.simpleNueva.ventaDirecta(false);
		self.simpleNueva.codigoBarras(null);
		ko.tasks.runEarly();
		$(".selectpicker").selectpicker('refresh');
	};

	self.reiniciarAltaCompuesta = function() {
		self.compuestaNueva.envase(null);
		self.compuestaNueva.cantidad(null);
		self.compuestaNueva.presentacion(null);
		self.compuestaNueva.deReferencia(true);
		self.compuestaNueva.ventaDirecta(false);
		self.compuestaNueva.codigoBarras(null);
		ko.tasks.runEarly();
		$(".selectpicker").selectpicker('refresh');
	};

	self.abrirEdicionPresentacion  = function(presentacion) {
		var presentacionClon = new koPresentacion(ko.mapping.fromJS(ko.mapping.toJS(presentacion)));
		if (presentacionClon.presentacionHijo) {
			presentacionClon = presentacionClon.presentacionHijo();
		}
		presentacionClon.unidad		 = presentacion.unidad;
		presentacionClon.unidadCorta = presentacion.unidadCorta;
		ko.utils.arrayForEach(self.envases(), function(envase) {
			if (envase.id() === presentacionClon.envase().id()) {
				presentacionClon.envase(envase);
			}
		});
		if (!presentacionClon.esCompuesta()) {
			ko.utils.arrayForEach(self.marcas(), function(marca) {
				if (marca.id() === presentacionClon.marca().id()) {
					presentacionClon.marca(marca);
				}
			});
		}
		self.presentacionEdicion(presentacionClon);
	};

	self.cerrarEdicionPresentacion = function(guardado) {
		if (guardado) {
			// Se reemplaza la presentación por la que se guardó para que
			// aparezca con los datos editados.
			ko.utils.arrayForEach(self.presentaciones(), function(presentacion) {
				if (presentacion.id() === self.presentacionEdicion().id()) {
					self.presentaciones.replace(presentacion, self.presentacionEdicion());
				}
			});
		}
		self.presentacionEdicion(null);
	};

	self.editar = function() {
		var presentacion = self.presentacionEdicion();
		if (!presentacion.envase()) {
			Notificacion('Debe elegir un envase', 'error');
			return;
		}
		self.guardar(presentacion, true);
	};

	self.guardar = function(presentacion, edicion) {
		var url	 = self.urls.guardar();
		var data = { presentacion: presentacion };
		data = {
			json	: JSON.stringifyOnce(ko.toJS(data)),
			edicion : edicion,
			tipo	: self.tipo()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}
					if (data.success) {
						if (!edicion) {
							Notificacion('Guardado exitoso', 'success');
							var id = data.success.id;
							presentacion.id(id);
							self.presentaciones.push(presentacion);
							if (presentacion.esCompuesta()) {
								self.agregarElementoComponeA(presentacion);
							}
							self.reiniciarAltaSimple();
							self.reiniciarAltaCompuesta();
						} else {
							Notificacion('Edición exitosa', 'success');
							self.cerrarEdicionPresentacion(true);
						}
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.eliminar = function(presentacion, e) {
		swal({
			title: 'Se eliminará la presentación',
			text: presentacion.nombre(),
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
			showLoaderOnConfirm: true
		}).then(function(resultado) {
			if (resultado.value !== true) {
				return;
			}
			var $presentacionDOM = $(e.target).closest(".presentacion-listado");
			var $botonRemover	 = $presentacionDOM.find(".presentacion-listado-remover");
			$botonRemover.attr("disabled", "disabled").find(".zmdi").removeClass("zmdi-plus-box").addClass("zmdi-spinner zmdi-hc-spin");

			var url				 = self.urls.eliminar();
			var opciones		 = self.getAjaxOpciones({
				url		: url,
				data	: {id: presentacion.id()},
				success : function (data, textStatus, jqXHR) {
					if (data) {
						if (data.error) {
							Notificacion(data.error, 'error');
							$botonRemover.removeAttr("disabled").find(".zmdi").removeClass("zmdi-spinner zmdi-hc-spin").addClass("zmdi-plus-box");
							return;
						}
						if (data.success) {
							$presentacionDOM.removeClass("fadeInUp").addClass('fadeOut');
							$presentacionDOM.on("animationend", function() {
								self.presentaciones.remove(presentacion);
								if (presentacion.esCompuesta()) {
									self.removerElementoComponeA(presentacion);
								}
								Notificacion('Borrado exitoso', 'success');
							});
						}
					} else {
						Notificacion('Error', 'error');
					}
				}
			});
			$.ajax(opciones);
		});
	};

	// Simulación de composicion en propiedad "componeA" para coordinar si
	// se puede eliminar la presentación o no.
	self.agregarElementoComponeA = function(presentacion) {
		var presentacionHijo = presentacion.relacionPresentaciones()[0].presentacionHijo;
		if (ko.isObservable(presentacionHijo)) {
			presentacionHijoId = presentacionHijo().presentacionesQueCompone.push(['plac']);
		} else {
			presentacionHijoId = presentacionHijo.presentacionesQueCompone.push(['plac']);
		}
	};

	self.removerElementoComponeA = function(presentacion) {
		var presentacionHijo	= presentacion.relacionPresentaciones()[0].presentacionHijo;
		var presentacionHijoId	= null;
		if (ko.isObservable(presentacionHijo)) {
			presentacionHijoId = presentacionHijo().id();
		} else {
			presentacionHijoId = presentacionHijo.id();
		}
		ko.utils.arrayForEach(self.presentaciones(), function(presentacion) {
			if (presentacion.id() === presentacionHijoId) {
				presentacion.presentacionesQueCompone.pop();
			}
		});
	};

	self.urlListar = function() {
		var salida = '';
		switch (self.tipo()) {
			case TIPO_MERCADERIA:
				salida = self.urls.mercaderiaListado();
				break;
			default:
				salida = self.urls.materiaPrimaListado();
				break;
		}
		return salida;
	};

	self.ordenarArrayNombre = function(array) {
		array.sort(function (a, b) {
			return a.nombre().toLowerCase() > b.nombre().toLowerCase() ? 1 : -1;
		});
	};

	//<editor-fold defaultstate="collapsed" desc="Alta de envase">
	self.$modalEnvaseAlta = $('#modal-envases-alta');

	self.abrirEnvaseAlta = function() {
		self.$modalEnvaseAlta.modal('show');
	};

	self.envaseNuevo = function(formulario) {
		var $formulario = $(formulario);

		var url			= self.urls.guardarEnvase();
		var data		= $formulario.formSerialize();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			async	: false,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.exito === 'undefined' || typeof data.envase === 'undefined' || !data.exito) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				var envase = ko.mapping.fromJS(data.envase, opcionEnvase);
				self.envases.push(envase);
				self.ordenarArrayNombre(self.envases);
				Notificacion('Envase creado exitosamente.', 'success');
				self.$modalEnvaseAlta.modal('hide');
				ko.tasks.runEarly();
	            $('.selectpicker').selectpicker('refresh');
				formulario.reset();
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Alta de marca">
	self.$modalMarcaAlta = $('#modal-marcas-alta');

	self.abrirMarcaAlta = function() {
		self.$modalMarcaAlta.modal('show');
	};

	self.marcaNueva = function(formulario) {
		var $formulario = $(formulario);

		var url			= self.urls.guardarMarca();
		var data		= $formulario.formSerialize();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			async	: false,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.exito === 'undefined' || typeof data.marca === 'undefined' || !data.exito) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				var marca = ko.mapping.fromJS(data.marca, opcionMarca);
				self.marcas.push(marca);
				self.ordenarArrayNombre(self.marcas);
				self.simpleNueva.marca(marca);
				Notificacion('Marca creada exitosamente.', 'success');
				self.$modalMarcaAlta.modal('hide');
				ko.tasks.runEarly();
	            $('.selectpicker').selectpicker('refresh');
				formulario.reset();
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax		= ko.observable(false);
	self.ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			alerta('Ha ocurrido el siguiente error: ' + textStatus, 'danger', $('#votacion'));
		},
		complete   : function(jqXHR, settings) {
			self.ajax(false);
		}
	};
	self.getAjaxOpciones = function(opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#presentaciones-gestion');
	ko.options.deferUpdates = true;
	koPresentacionGestion = new koPantalla(jsonPresentacionGestion, opcionesPantalla);
	ko.applyBindings(koPresentacionGestion, $seccion.get(0));
	koPresentacionGestion.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});