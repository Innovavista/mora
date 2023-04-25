var koMisReservas = null;

//<editor-fold defaultstate="collapsed" desc="Config">
var opcionesPantalla = {
	'reservas': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koReserva(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.reservasDeHoy		= ko.observableArray();
	self.reservasTodas		= ko.observableArray();
	self.buscando			= ko.observable(false);
	self.cancelando			= ko.observable(false);

	var fechaDesde			= moment().subtract(1, 'month');
	var fechaHasta			= moment();
	self.filtroFechaDesde	= ko.observable(fechaDesde.format('YYYY-MM-DD'));
	self.filtroFechaHasta	= ko.observable(fechaHasta.format('YYYY-MM-DD'));

	self.setearReservas = function() {
		var reservas		= self.reservas();
		var reservasHoy		= ko.utils.arrayFilter(reservas, function(reserva) {
			return reserva.comprobarEsDeHoy();
		});
		var reservasResto	= ko.utils.arrayFilter(reservas, function(reserva) {
			return !reserva.comprobarEsDeHoy();
		});
		self.reservasDeHoy(reservasHoy);
		self.reservasTodas(reservasResto);
		self.reservas(reservasResto);
	};
	self.setearReservas();

	//<editor-fold defaultstate="collapsed" desc="Sin resultados">
	self.comprobarSinResultados = ko.computed(function() {
		return self.reservasTodas().length === 0
				&& self.reservasDeHoy().length === 0
				&& self.buscando() === false;
	});

	//Como el mensaje de resultados depende de las fechas enviadas en la búsqueda
	//no podemos hacerlo como observable porque al cambiar cualquier fecha
	//cambiaría el mensaje del resultado, por lo tanto lo dejamos como un
	//observable que lo cambiamos con una función que se ejecuta solamente al
	//momento de recibir los resultados
	self.sinResultados = ko.observable("No realizaste ninguna reserva en los últimos días.");
	self.sinResultadosActualizar = function() {
		var salida = "No realizaste ninguna reserva ";
		var desde  = moment(self.filtroFechaDesde());
		var hasta  = moment(self.filtroFechaHasta());

		if (desde.isValid() && hasta.isValid()) {
			if (desde.isSame(hasta, 'day')) {
				salida += " el día " + desde.format("DD/MM/YYYY");
			} else {
				salida += "del " + desde.format("DD/MM/YYYY") + " al " + hasta.format("DD/MM/YYYY");
			}
		} else if (desde.isValid()) {
			salida += "a partir del " + desde.format("DD/MM/YYYY");
		} else if (hasta.isValid()) {
			salida += "hasta el " + hasta.format("DD/MM/YYYY");
		} else {
			salida += "en los últimos días";
		}

		self.sinResultados(salida + ".");
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ticket">
	self.urlTicket = ko.observable(null);

	self.verTicket = function(reserva) {
		var urlTicket = reserva.ticketUrl();
		self.urlTicket(urlTicket);
		ko.tasks.runEarly();
		$("#reservar-ticket-iframe").load(function() {
			$(this).show();
		});
	};

	self.cerrarTicket = function() {
		self.urlTicket(null);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Paginación">
	self.cantidadPorPag		= 8;
	self.paginaActual		= ko.observable(1);
	self.totalPaginas		= ko.computed(function() {
		if (self.reservas().length === 0) {
			return 1;
		}
		return Math.ceil(self.reservas().length / self.cantidadPorPag);
	});

	self.reservasPaginadas = ko.computed(function() {
		var paginaActual = self.paginaActual();
		var reservas	 = self.reservas();

		var primera		 = self.cantidadPorPag * (paginaActual - 1);
		var ultima		 = primera + self.cantidadPorPag;

		var reservasPaginadas = reservas.slice(primera, ultima);
		return reservasPaginadas;
	});

	self.paginaPrevia = function() {
		if (self.paginaActual() === 1) {
			return;
		}
		self.paginaActual(self.paginaActual() - 1);
	};

	self.paginaSiguiente = function() {
		if (self.totalPaginas() === self.paginaActual()) {
			return;
		}
		self.paginaActual(self.paginaActual() + 1);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Buscar reservas">
	self.buscarReservas = function() {
		var url			= self.urls.buscarReservasComensal();
		var fechaDesde	= moment(self.filtroFechaDesde());
		var fechaHasta	= moment(self.filtroFechaHasta());
		var data		= {
			fechaDesde: fechaDesde.isValid() ? fechaDesde.format("YYYY-MM-DD") : null,
			fechaHasta: fechaHasta.isValid() ? fechaHasta.format("YYYY-MM-DD") : null
		};
		self.buscando(true);
		self.reservas([]);
		self.reservasTodas([]);
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						var reservas = ko.mapping.fromJS(data.success.reservas, opcionesPantalla.reservas);
						self.reservas(reservas());
						self.setearReservas();
						self.sinResultadosActualizar();
						return;
					}
					if (data.error) {
						Notificacion(data.error, 'error');
					}
				} else {
					Notificacion('Ha ocurrido un error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cancelar reserva">
	self.comprobarCancelarReserva = function(reserva) {
		var url			= self.urls.comprobarCancelarReserva();
		var data		= { reserva: reserva };
		data			= { json: ko.mapping.toJSON(data) };
		self.cancelando(true);
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					Alerta({
						title: '¿Estás seguro de que querés cancelar tu reserva?',
						confirmButtonText: 'Si',
						cancelButtonText: 'No',
						onConfirmCallback: function() { self.cancelarReserva(reserva) }
					});
				} else {
					Notificacion(data.error, 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.cancelarReserva = function(reserva) {
		var url			= self.urls.cancelarReserva();
		var data		= { reserva: reserva };
		data			= { json: ko.mapping.toJSON(data) };
		self.cancelando(true);
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					reserva.comprobarEstadoCancelada(true);
					reserva.comprobarEstadoPendiente(false);
					return Notificacion('Reserva cancelada', 'success');
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	}
	//</editor-fold>

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
			self.buscando(false);
			self.cancelando(false);
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
	var $seccion = $('#mis-reservas');
	ko.options.deferUpdates = true;
	koMisReservas = new koPantalla(jsonMisReservas, opcionesPantalla);
	ko.applyBindings(koMisReservas, $seccion.get(0));
	koMisReservas.inicializando = false;
	ko.tasks.runEarly();
});