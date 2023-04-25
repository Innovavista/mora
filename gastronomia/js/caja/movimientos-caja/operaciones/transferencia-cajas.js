/* global ko */

function koTransferenciaCajas(params) {
	var self = this;

	self.urls				= params.urls;
	self.operacion			= params.operacion;
	self.caja				= params.caja;
	self.callbackSuccess	= params.callbackSuccess;
	self.cajas				= params.cajas.filter(function(caja) {
		if (self.caja === null) {
			return true;
		}
		if (caja.central()) {
			return false;
		}
		return caja.id() !== self.caja.id();
	});

	self.cajaOrigen		= ko.observable(null);
	self.monto			= ko.observable("");
	self.motivo			= ko.observable("");
	self.focusMonto		= ko.observable(false);

	self.inicializarPantalla = function() {
		self.limpiarTransferencia();
	};

	self.transferenciaInvalida = ko.computed(function() {
		if (self.monto() <= 0 || self.monto() === "") {
			return true;
		}
		if (self.cajaOrigen() === null) {
			return true;
		}
		return false;
	});

	self.seleccionarCajaOrigen = function(caja) {
		self.cajaOrigen(caja);
		$("#caja-transferencia-monto").focus();
	};

	self.limpiarTransferencia = function() {
		self.cajaOrigen(null);
		self.monto("");
		self.motivo("");
	};

	self.transferirPrev = function() {
		swal({
			title: 'Confirmar la transferencia de $' + self.monto() +' a la caja "' + self.cajaOrigen().nombre() + '"',
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			showLoaderOnConfirm: true,
			preConfirm: function() {
				self.transferir();
			}
		});
	};

	self.transferir = function() {
		var url		= self.urls.transferir();
		var data	= {
			cajaDestino: self.caja,
			caja: self.cajaOrigen(),
			monto: self.monto(),
			motivo: self.motivo()
		};
		data		 = {json: ko.mapping.toJSON(data)};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}
					self.limpiarTransferencia();
					koMovimientosCaja.inicializarPantalla();
					koMovimientosCaja.seleccionarOperacion(OPERACION_MOVIMIENTOS_CAJA);
					self.callbackSuccess();
					Notificacion('Transferencia exitosa', 'success');
				} else {
					Notificacion('Error', 'error');
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

