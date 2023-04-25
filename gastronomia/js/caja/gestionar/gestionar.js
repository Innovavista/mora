var koCajasGestion = null;

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesCaja = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koCaja(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};
var opcionesPantalla = {
	'caja'  : opcionesCaja,
	'cajas' : opcionesCaja,
	'operaciones' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koOperacion(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Tooltipster">
ko.bindingHandlers['tooltipster'] = {
    init: function(element, valueAccessor){
        $(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay:	200,
			side: 'top',
			contentCloning: true
		});
    }
};
//</editor-fold>

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

//<editor-fold defaultstate="collapsed" desc="Extensiones">
var formatoNumero = {
	groupSeparator: ".",
	radixPoint	  : ',',
	alias: "numeric",
	placeholder: "0",
	autoGroup: !0,
	digits: 2,
	digitsOptional: !1,
	clearMaskOnLostFocus: !1
};
ko.bindingHandlers.moneda = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var valor = ko.utils.unwrapObservable(valueAccessor());
		var tipo  = typeof valor;
		if ((tipo !== 'number' && isNaN(valor))
			|| valor === null
		) {
			$(element).html('');
			return;
		}
		var final = Inputmask.format(valor, formatoNumero);
		var partes = final.split(',');
		if (partes.length === 1) {
			final += ',00';
		} else if (partes.length > 1) {
			var decimales = partes[partes.length - 1];
			if (decimales.length === 1) {
				final += '0';
			}
		}
		$(element).html('$ ' + final);
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.caja	   = ko.observable(self.caja);
	self.operacion = ko.observable(null);
	self.cajaUnica = ko.observable(false);

	if (self.cajas().length === 1) {
		self.cajaUnica(true);
	}

	//<editor-fold defaultstate="collapsed" desc="Operaciones">
	self.cargaCredito = new koCargaCredito({
		urls			: self.urls,
		caja			: self.caja,
		callbackSuccess	: function(){}
	});

	self.cierreTurno = new koCierreTurno({
		urls		: self.urls,
		caja		: self.caja,
		operacion	: self.operacion
	});

	self.depositoTurno = new koDepositoTurno({
		urls		: self.urls,
		caja		: self.caja,
		operacion	: self.operacion
	});

	self.ventaMostrador = new koVentaMostrador({
		urls			: self.urls,
		caja			: self.caja,
		operacion		: self.operacion,
		callbackSuccess	: function(){}
	});

	self.puntoDeVenta = new koPuntoDeVenta({
		urls			: self.urls,
		caja			: self.caja,
		operacion		: self.operacion,
		callbackSuccess	: function(){}
	});

	self.comprobantesTurno = new koComprobantesTurno({
		urls			: self.urls,
		caja			: self.caja,
		operacion		: self.operacion
	});

	self.pagoProveedor = new koPagoProveedor({
		urls			: self.urls,
		caja			: self.caja,
		operacion		: self.operacion,
		callbackSuccess	: function(){}
	});
	//</editor-fold>

	self.tituloPantalla  = ko.computed(function() {
		var salida = '';
		if (self.operacion() !== null) {
			if (self.operacion().comprobarEsCargaCredito()
				&& self.cargaCredito.listado()
			) {
				salida = "Listado de carga de créditos";
			} else {
				salida = self.operacion().nombre();
			}
			if (self.operacion().comprobarEsVentaMostrador()) {
				var ventaMostrador = self.ventaMostrador;
				if (ventaMostrador.listado()) {
					salida = 'Listado de ventas de menú a invitados';
				} else {
					salida = 'Seleccionar una operación';
				}
			}
			return salida;
		}

		var nombre	= self.caja().nombre();
		var comedor	= ko.isObservable(self.caja().comedor) ? self.caja().comedor() : self.caja().comedor;
		if (comedor) {
			salida = "Gestionando " + nombre + ' del comedor ' + comedor.nombre();
		} else {
			salida = "Gestionando " + nombre;
		}
		return salida;
	});

	self.seleccionarOperacion = function(operacion, tipo) {
		if (typeof operacion === "string") {
			var seleccionada = ko.utils.arrayFirst(self.operaciones(), function(op) {
				return op.tipo() === operacion;
			});
			if (seleccionada === undefined) {
				self.operacion(null);
				return;
			}
			self.operacion(seleccionada);
			return;
		}
		if (operacion.comprobarEsCierreTurno()) {
			self.cierreTurno.inicializarPantalla();
		}
		if (operacion.comprobarEsDepositoTurno()) {
			self.depositoTurno.inicializarPantalla();
		}
		if (operacion.comprobarEsVentaMostrador()) {
			self.ventaMostrador.inicializarPantalla();
		}
		if (operacion.comprobarEsPuntoDeVenta()) {
			window.location.href = self.puntoDeVenta.urls.vender();
			return;
		}
		if (operacion.comprobarEsCargaCredito()) {
			self.cargaCredito.inicializarPantalla();
		}
		if (operacion.comprobarEsMovimientosCaja()) {
			window.location.href = self.urls.movimientosCaja();
			return;
		}
		if (operacion.comprobarEsCobroEnCC()) {
			window.location.href = self.ventaMostrador.urls.cobroCC();
			return;
		}
		if (operacion.comprobarEsComprobantesTurno()) {
			window.location.href = self.ventaMostrador.urls.comprobantesTurno();
			return;
		}
		if (operacion.comprobarEsDepositoBancario()) {
			window.location.href = self.urls.listadoDepositosBancarios();
			return;
		}
		if (operacion.comprobarEsPagoProveedor()) {
			window.location.href = self.urls.listadoPagoProveedor();
			return;
		}
		if (operacion.comprobarEsApertura()) {
			window.location.href = operacion.url();
			return;
		}
		self.operacion(operacion);
	};

	self.volverPantalla = function() {
		if (self.operacion() !== null) {
			self.operacion(null);
			return;
		}
		//Volvemos a pantalla de selección de caja
		window.location.href = self.urls.seleccionar();
	};

	self.comprobarTienePermiso = function(tipoOperacion) {
		var operacion = ko.utils.arrayFirst(self.operaciones(), function(op) {
			return op.tipo() === tipoOperacion;
		});
		return operacion !== undefined;
	};

}

$(document).ready(function () {
	var $seccion = $('#cajas-gestion');
	ko.options.deferUpdates = true;
	koCajasGestion = new koPantalla(jsonCajasGestion, opcionesPantalla);
	ko.applyBindings(koCajasGestion, $seccion.get(0));
	koCajasGestion.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});
