/* global ko */

//<editor-fold defaultstate="collapsed" desc="Config">
var configTurno = {
	'turnos' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koTurnoADepositar(options.data, configTurno);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, configTurno, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koDepositoTurno(params) {
	var self = this;

	self.urls			= params.urls;
	self.caja			= params.caja;
	self.operacion		= params.operacion;
	self.buscando		= ko.observable(false);
	self.turnos			= ko.observableArray([]);

	self.inicializarPantalla = function() {
		self.turnos([]);
		self.buscarTurnos();
	};

	self.buscarTurnos = function() {
		self.buscando(true);
		var url			= self.urls.buscarTurnosCerrados();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						var turnos = ko.mapping.fromJS(data.success.turnos, configTurno.turnos);
						self.turnos(turnos());
						self.buscando(false);
						return;
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

	self.depositarTurno = function(turno) {
		var titulo = 'Confirme que desea transferir el saldo de $ ' + turno.saldoMostrar();
		titulo += ' de la ' + turno.caja.nombre() + ' del ' + turno.apertura.fecha();
		titulo += ' a la ' + self.caja().nombre();
		Alerta({
			title: titulo,
			onConfirmCallback: function() {
				var url		= self.urls.depositarTurno();
				var data	= {
					caja	: self.caja().id(),
					turno	: turno.id()
				};
				var opciones = self.getAjaxOpciones({
					url		: url,
					data	: data,
					success : function (data, textStatus, jqXHR) {
						if (data) {
							if (data.success) {
								turno.comprobarDepositado(true);
								var caja = self.caja();
								caja.sumarSaldo(turno.disponible(), $("#caja-saldo-actual-contenedor"));
								return Notificacion('Depósito de turno exitoso', 'success');;
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
			}
		});
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

function koTurnoADepositar(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.comprobarDepositado = ko.observable(false);

	var horaApertura = moment(self.apertura.hora(), "HH:mm:ss");
	var horaCierre	 = moment(self.cierre.hora(), "HH:mm:ss");
	self.apertura.hora(horaApertura.format("HH:mm"));
	self.cierre.hora(horaCierre.format("HH:mm"));

	var disponible = parseFloat(self.disponible());
	self.saldoMostrar = ko.observable(disponible.format(2, 3, '.', ','));
};



