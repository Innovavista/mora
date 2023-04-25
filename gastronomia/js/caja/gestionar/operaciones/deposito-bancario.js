var koCajaDepositoBancario = null;

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'caja'  : {
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

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.operacion		= ko.observable(true);
	self.tituloPantalla = ko.observable('Nuevo depósito bancario');

	self.volverPantalla = function() {
		window.location.href = self.urls.listadoDeposito();
	};

	let saldo = parseFloat(self.caja.saldo());
	self.saldo = ko.observable(saldo);

	let hoy			   = moment().format('YYYY-MM-DD');
	self.fecha		   = ko.observable(hoy);
	self.monto		   = ko.observable('');
	self.cuenta		   = ko.observable('');
	self.numero		   = ko.observable('');
	self.observaciones = ko.observable('');

	self.inicializarPantalla = function() {
		self.fecha		   = ko.observable('');
		self.monto		   = ko.observable('');
		self.cuenta		   = ko.observable('');
		self.numero		   = ko.observable('');
		self.observaciones = ko.observable('');
	};

	/**
	 * Valida que el depósito bancario sea válido. Para ello debe tener un monto
	 * y número mayor a cero, debe haber seleccionado una cuenta y la fecha
	 * debe ser válida
	 *
	 * @returns {Boolean}
	 */
	self.validarDatosDepositoBancario = function() {
		let fecha  = moment(self.fecha());
		let monto  = self.monto();
		let numero = self.numero();
		let cuenta = self.cuenta();
		let valido = true;
		if (isNaN(monto) || monto === "") {
			monto = 0;
		}
		if (isNaN(numero) || numero === "") {
			numero = 0;
		}
		if (isNaN(cuenta)) {
			Notificacion("Debe seleccionar una cuenta", "error");
			valido = false;
		}
		if (!fecha.isValid()) {
			Notificacion("La fecha seleccionada es inválida", "error");
			valido = false;
		}
		if (parseFloat(numero) <= 0) {
			Notificacion("El número no puede ser menor o igual a cero", "error");
			valido = false;
		}
		if (parseFloat(monto) <= 0) {
			Notificacion("El monto a depositar no puede ser menor o igual a cero", "error");
			valido = false;
		}
		return valido;
	};

	/**
	 * Confirma el depósito bancario y lo persiste en base de datos. Si el saldo
	 * de la caja es insuficiente muestra cartel aclaratorio para preguntar si
	 * desea continuar
	 *
	 * @returns {void}
	 */
	self.guardarDepositoBancario = function() {
		let valido = self.validarDatosDepositoBancario();
		if (!valido) {
			return;
		}

		var opciones = {
			title: 'Confirmar el depósito bancario en caja',
			html: "",
			onConfirmCallback: function() {
				self.guardarDepositoBancarioAjax();
			}
		};

		var monto = self.monto();
		var saldo = self.saldo();
		var resta = saldo - monto;
		if (resta < 0.00) {
			opciones.background         = '#f8d7da';
			opciones.cancelButtonColor  = '#f8f9fa';
			opciones.confirmButtonColor = '#f44336';
			opciones.cancelButtonText   = '<span style="color: black;">Cancelar</span>';
			opciones.html               = "<p style=\"color:red;\">Está intentando registrar un depósito mayor al saldo actual disponible. ¿Desea continuar?</p>";
		}

		Alerta(opciones);
	};

	/**
	 * Persiste el depósito bancario en base de datos
	 *
	 * @returns {void}
	 */
	self.guardarDepositoBancarioAjax = function() {
		var url	 = self.urls.guardarDeposito();
		var data = {
			caja		  : self.caja,
			fecha		  : self.fecha(),
			monto		  : self.monto(),
			numero		  : self.numero(),
			cuenta		  : self.cuenta(),
			observaciones : self.observaciones()
		};
		data = {json: ko.mapping.toJSON(data)};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						Notificacion('El depósito bancario se ha realizado con éxito', 'success');
						self.inicializarPantalla();
						var caja = ko.mapping.fromJS(data.caja, opcionesPantalla.caja);
						self.caja.saldo(caja.saldo());
						window.location.href = self.urls.listadoDeposito();
						return;
					}
					if (data.error) {
						return Notificacion(data.error, 'error');
					}
					Notificacion('Ha ocurrido un error', 'error');
				} else {
					Notificacion('Ha ocurrido un error', 'error');
				}
			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax = ko.observable(false);
	self.ajaxOpciones	= {
		method	   : 'POST',
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
	self.getAjaxOpciones = function(opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#caja-deposito-bancario');
	ko.options.deferUpdates = true;
	koCajaDepositoBancario = new koPantalla(jsonCajaDepositoBancario, opcionesPantalla);
	ko.applyBindings(koCajaDepositoBancario, $seccion.get(0));
	koCajaDepositoBancario.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});
