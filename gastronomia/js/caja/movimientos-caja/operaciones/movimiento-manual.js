/* global ko, koMovimientosCaja, OPERACION_MOVIMIENTOS_CAJA */

function koMovimientoManual(params) {
	var self = this;

	self.urls				= params.urls;
	self.caja				= params.caja;
	self.tiposMovimientos	= params.tiposMovimientos ? params.tiposMovimientos : ko.observableArray([]);
	self.operacion			= params.operacion;
	self.callbackSuccess	= params.callbackSuccess;
	self.tipoMovimiento		= ko.observable(null);
	self.monto				= ko.observable(null);
	self.concepto			= ko.observable("ingreso");
	self.comentarios		= ko.observable("");

	self.movimientoInvalido = ko.computed(function() {
		if (self.tipoMovimiento() && self.monto() > 0) {
			return false;
		}
		return true;
	});

	self.limpiarMovimiento = function() {
		self.monto(0);
		self.concepto("ingreso");
		self.tipoMovimiento(null);
		self.comentarios("");
	};

	self.moverPrev = function() {
		return Alerta({
			title: 'Confirmar el ' + self.concepto() +' manual de $' + self.monto(),
			onConfirmCallback: function() {
				self.mover();
			}
		});
	};

	self.mover = function() {
 		var url		= self.urls.movimientoManual();
		var data	= {
			caja			: self.caja,
			tipoMovimiento	: self.tipoMovimiento().id(),
			monto			: self.monto(),
			concepto		: self.concepto(),
			comentarios		: self.comentarios()
		};
		data		 = {json: ko.mapping.toJSON(data)};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						if (self.caja.central()) {
							var $saldoActual = $("#caja-saldo-actual-contenedor");
							if (self.concepto() === 'ingreso') {
								self.caja.sumarSaldo(self.monto(), $saldoActual);
							} else {
								var saldo = self.monto();
								saldo = parseFloat(saldo) * -1;
								self.caja.sumarSaldo(saldo, $saldoActual);
							}
						}
						koMovimientosCaja.seleccionarOperacion(OPERACION_MOVIMIENTOS_CAJA);
						koMovimientosCaja.inicializarPantalla();
						self.limpiarMovimiento();
						self.callbackSuccess();
						return Notificacion('Movimiento manual exitoso', 'success');
					}
					if (data.error) {
						return Notificacion(data.error, 'error');
					}
					Notificacion('Ha ocurrido un error', 'error');
				} else {
					Notificacion('Ha ocurrido un error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax			= ko.observable(false);
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

