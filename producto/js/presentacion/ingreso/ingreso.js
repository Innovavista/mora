/* global ko, moment, opcionesPantalla, jsonMercaderiaIngreso */

var koMercaderiaIngreso = null;

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

	self.mercaderia				= self.presentaciones();
	self.mercaderiaFiltrada		= ko.observableArray(self.presentaciones());
	self.presentable			= ko.observableArray(null);

	self.fecha					= ko.observable(moment().format('YYYY-MM-DD'));
	self.clienteProveedor		= ko.observable(null);
	self.deposito				= ko.observable(null);
	self.observaciones			= ko.observable('');
	self.lineas					= ko.observableArray([]);

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

	if (self.depositos().length === 1) {
		self.deposito(self.depositos()[0]);
	}

	self.total = ko.computed(function() {
		var salida = 0;
		ko.utils.arrayForEach(self.lineas(), function(linea) {
			var subtotal = parseFloat(linea.subtotal());
			salida += subtotal;
		});
		return Math.round(salida * 100) / 100;
	});

	self.presentable.subscribe(function() {
		if (!self.presentable()) {
			self.mercaderiaFiltrada(self.mercaderia);
			return;
		}
		var salida	= [];
		self.mercaderiaFiltrada(self.mercaderia);
		var id		= self.presentable().id();
		ko.utils.arrayForEach(self.mercaderiaFiltrada(), function(presentacion) {
			if (presentacion.elemento.id() === id) {
				salida.push(presentacion);
			}
		});
		self.mercaderiaFiltrada(salida);
	});

	self.agregarLinea = function(presentacion) {
		var linea = new koLinea({
			presentacion	: presentacion,
			precio			: presentacion.costoVigente,
			focus			: true
		});
		self.lineas.push(linea);
		self.mercaderiaFiltrada.remove(presentacion);
		self.handleFocusCantidad();
	};

	self.agregarVarios = function() {
		var linea = new koLinea({
			presentacion	 : null,
			precio			 : ko.observable(null),
			focusNombre		 : true
		});
		self.lineas.push(linea);
		self.handleFocusDescripcion();
	};

	self.removerLinea = function(linea, event) {
		var target	 = event.target;
		var $lineaDOM = $(target).closest("tr");
		$lineaDOM.removeClass("fadeInUp").addClass('zoomOutLeft');
		$lineaDOM.on("animationend", function(){
			self.lineas.remove(linea);
			if (linea.presentacion !== null) {
				// Si no es una línea de tipo "varíos"
				self.mercaderiaFiltrada.push(linea.presentacion);
				self.ordenarPresentaciones();
			}
		});
		self.handleFocusBuscador(null, {charCode: 13});
	};

	self.ordenarPresentaciones = function() {
		self.mercaderiaFiltrada.sort(function (l, r) {
			return l.nombreLargo().toLowerCase() > r.nombreLargo().toLowerCase() ? 1 : -1;
		});
	};

	self.handleFocusPrecio  = function(data, e) {
		var tecla = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
		if (tecla === 13) {
			$(".mercaderia-ingreso-resumen-cantidad:focus").closest("tr").find(".mercaderia-ingreso-resumen-precio").focus().select().addClass("selected");
		} else {
			self.handleRemoverLinea(data, e);
		}
	};

	self.handleRemoverLinea = function(data, e) {
		var tecla = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
		if (tecla === 27) {
			self.removerLinea(data, e);
		}
	};

	self.handleFocusCantidad = function() {
		ko.tasks.runEarly();
		$(".mercaderia-ingreso-resumen-cantidad").last().focus();
	};

	self.handleFocusDescripcion = function() {
		ko.tasks.runEarly();
		$(".mercaderia-ingreso-resumen-descripcion").last().focus();
	};

	self.handleFocusBuscador = function(data, e) {
		var tecla = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
		if (tecla === 13) {
			$(".mercaderia-ingreso-buscador").find(".mercaderia-ingreso-buscador-codigo").focus().select().addClass("selected");
		} else {
			self.handleRemoverLinea(data, e);
		}
		return true;
	};

	self.limpiarIngreso = function() {
		ko.utils.arrayForEach(self.lineas(), function(linea) {
			if (linea.presentacion !== null) {
				// Si no es una línea de tipo "varíos"
				self.mercaderiaFiltrada.push(linea.presentacion);
			}
		});
		self.ordenarPresentaciones();
		self.lineas([]);
		self.clienteProveedor(null);
		self.deposito(null);
		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
	};

	self.guardarInvalido = ko.computed(function() {
		if (self.lineas().length === 0) {
			return true;
		}
		if (!self.clienteProveedor()) {
			return true;
		}
		if (!self.deposito()) {
			return true;
		}
		if (self.total() === 0) {
			return true;
		}

		for (var i = 0; self.lineas().length > i; i++) {
			var linea		= self.lineas()[i];
			var precio		= parseFloat(linea.precio());
			var cantidad	= parseFloat(linea.cantidad());
			if (!precio || !cantidad) {
				return true;
			}
		}

		return false;
	});

	self.validarCantidadLineas = function() {
		var valido = true;
		ko.utils.arrayForEach(self.lineas(), function(linea) {
			if (!linea.cantidad()) {
				valido = false;
			}
		});
		return valido;
	};

	self.guardar = function() {
		var url		= self.urls.guardarIngreso();
		var data	= {
			lineas:			  self.lineas(),
			clienteProveedor: self.clienteProveedor(),
			deposito:		  self.deposito(),
			observaciones:	  self.observaciones(),
			total:			  self.total(),
			fecha:			  self.fecha()
		};
		if (!self.validarCantidadLineas()) {
			Notificacion('No se ha especificado la cantidad en todas las lineas', 'error');
			return;
		}
		data = { json: ko.mapping.toJSON(data) };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}
					Notificacion('Guardado exitoso', 'success');
					self.limpiarIngreso();
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Alta de depósito">
	self.$modalDepositosAlta	= $('#modal-depositos-alta');

	self.abrirDepositoAlta = function() {
		self.$modalDepositosAlta.modal('show');
	};

	self.depositoNuevo = function(formulario) {
		var $formulario = $(formulario);

		var url			= self.urls.guardarDeposito();
		var data		= $formulario.formSerialize();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			async	: false,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.exito === 'undefined' || typeof data.deposito === 'undefined' || !data.exito) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				var deposito = ko.mapping.fromJS(data.deposito, opcionesPantalla.depositos);
				self.depositos.push(deposito);
				self.deposito(deposito);
				Notificacion('Depósito creado exitosamente.', 'success');
				self.$modalDepositosAlta.modal('hide');
				ko.tasks.runEarly();
	            $('.selectpicker').selectpicker('refresh');
				formulario.reset();
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Alta de proveedor">
	self.$modalProveedorAlta = $('#modal-proveedores-alta');

	self.abrirProveedorAlta = function() {
		self.$modalProveedorAlta.modal('show');
	};

	self.proveedorNuevo = function(formulario) {
		var $formulario = $(formulario);

		var url			= self.urls.guardarProveedor();
		var data		= $formulario.formSerialize();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			async	: false,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.exito === 'undefined' || typeof data.cliente === 'undefined' || !data.exito) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				var proveedor = ko.mapping.fromJS(data.cliente, opcionesPantalla.proveedores);
				self.proveedores.push(proveedor);
				self.clienteProveedor(proveedor);
				Notificacion('Proveedor creado exitosamente.', 'success');
				self.$modalProveedorAlta.modal('hide');
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
			var mensaje = "Ha ocurrido un error, vuelva a intentar";
			if (typeof jqXHR.responseJSON !== "undefined") {
				var data = jqXHR.responseJSON;
				if (Array.isArray(data.errores)) {
					mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" : "";
					mensaje += data.errores.join("<br/>");
				} else if (typeof data.error !== "undefined") {
					mensaje = "Ha ocurrido el siguiente error: " + data.error;
				}
			}
			Notificacion(mensaje, 'error');
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
	var $seccion = $('#mercaderia-ingreso');
	ko.options.deferUpdates = true;
	koMercaderiaIngreso = new koPantalla(jsonMercaderiaIngreso, opcionesPantalla);
	ko.applyBindings(koMercaderiaIngreso, $seccion.get(0));
	koMercaderiaIngreso.inicializando = false;
	ko.tasks.runEarly();
	$('.selectpicker').selectpicker('refresh');

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});