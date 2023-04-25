//<editor-fold defaultstate="collapsed" desc="Config">
var configVentaMostrador = {
	'servicios' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koServicio(options.data, configVentaMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, configVentaMostrador, options.target);
			return options.target;
		}
	},
	'ventas' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koVenta(options.data, configVentaMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, configVentaMostrador, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koVentaMostrador(params) {
	var self = this;

	self.urls			 = params.urls;
	self.caja			 = params.caja;
	self.operacion		 = params.operacion;
	self.callbackSuccess = params.callbackSuccess;

	//<editor-fold defaultstate="collapsed" desc="Venta">
	self.venta		= ko.observable(false);
	self.listado	= ko.observable(false);

	self.servicios			= ko.observableArray([]);
	self.urlTicket			= ko.observable(null);
	self.removerOperacion	= ko.observable(false);

	self.comedor = ko.computed(function() {
		if (self.caja() === null) {
			return null;
		}
		return self.caja().comedor;
	});

	self.comprobarMostrarOperaciones = ko.computed(function() {
		if (self.caja()
			&& self.caja().comprobarTieneTurnoAbierto()
			&& self.venta() === false
			&& self.listado() === false
		) {
			return true;
		}
		return false;
	});

	self.seleccionarVenta = function() {
		self.venta(true);
		self.listado(false);
		self.buscarServicios();
	};

	self.seleccionarListado = function() {
		self.listado(true);
		self.venta(false);
		self.buscarVentas();
	};

	//<editor-fold defaultstate="collapsed" desc="Buscar servicios">
	self.buscarServicios = function() {
		var url		= self.urls.buscarServiciosVenta();
		var data	= { comedor: self.comedor().id() };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						var servicios = ko.mapping.fromJS(data.success.servicios, configVentaMostrador.servicios);
						self.servicios(servicios());
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
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Confirmar venta">
	self.confirmarVenta = function(asignacion, turno, servicio) {
		var valor	  = servicio.precioInvitado;
		var template  = $("#comedor-reserva-confirmacion").html();
		var htmlDatos = {
			titulo	: servicio.paraLlevar() ? 'Venta para llevar' : 'Venta de cupo',
			comedor	: self.comedor().nombre(),
			fecha	: turno.fecha.fecha(),
			horario	: ' de ' + servicio.horaInicioMostrar() + ' a ' + servicio.horaFinMostrar(),
			plato	: asignacion.plato.nombre(),
			valor	: '$ ' + valor.format(2, 3, '.', ',')
		};

		var html = Mustache.render(template, htmlDatos);

		Alerta({
			title: '',
			html: html,
			type: 'question',
			onConfirmCallback: function() { self.guardarVenta(asignacion, turno); }
		});
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Guardar venta">
	self.guardarVenta = function(asignacion, turno) {
		var url		= self.urls.guardarVentaMostrador();
		var data	= {
			turno		: turno.id(),
			asignacion	: asignacion.id(),
			caja		: self.caja().id()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						self.urlTicket(data['rutaTicket']);
						self.removerOperacion(true);
						ko.tasks.runEarly();
						$("#reservar-ticket-iframe").load(function() {
							$(this).show();
						});
						self.callbackSuccess();
						return Notificacion('Venta exitosa', 'success');
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
	//</editor-fold>

	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Listado">
	self.filtroHoraDesde	= ko.observable(null);
	self.filtroHoraHasta	= ko.observable(null);
	self.estados			= [
		{
			nombre: 'Todos',
			valor: 'todos'
		},
		{
			nombre: 'Pendientes',
			valor: 'pendiente'
		}
	];
	self.filtroEstado		= ko.observable(null);

	self.comprobarFiltroAplicado = ko.computed(function() {
		if (self.filtroHoraDesde() || self.filtroHoraHasta() || self.filtroEstado() === 'pendiente') {
			return true;
		}
		return false;
	});

	self.ventas				= ko.observableArray([]);
	self.ventasTodas		= ko.observableArray([]);
	self.cantidadPorPag		= 8;
	self.paginaActual		= ko.observable(1);
	self.totalPaginas		= ko.computed(function() {
		if (self.ventas().length === 0) {
			return 1;
		}
		return Math.ceil(self.ventas().length / self.cantidadPorPag);
	});
	self.ventasFiltradas	= ko.computed(function() {
		var paginaActual	= self.paginaActual();
		var ventas			= self.ventas();

		var primera		 = self.cantidadPorPag * (paginaActual - 1);
		var ultima		 = primera + self.cantidadPorPag;

		var ventasFiltradas = ventas.slice(primera, ultima);
		return ventasFiltradas;
	});

	//<editor-fold defaultstate="collapsed" desc="Filtro">
	self.filtrarReservas = function() {
		var filtradas = [];
		var ventas	  = self.ventasTodas();
		var horaDesde = moment(self.filtroHoraDesde(), 'HH:mm');
		var horaHasta = moment(self.filtroHoraHasta(), 'HH:mm');
		var estado	  = self.filtroEstado();

		if (!horaDesde.isValid() && !horaHasta.isValid() && estado === 'todos') {
			self.ventas(ventas);
			return;
		}

		for (var i = 0; i < ventas.length; i++) {
			var agregar			= true;
			var dobleFecha		= false;
			var venta			= ventas[i];
			var fecha			= moment(venta.fecha.mysql());
			var fechaMinutos	= fecha.minutes() + fecha.hours() * 60;

			if (horaDesde.isValid() && horaHasta.isValid()) {
				var horaDesdeMinutos = horaDesde.minutes() + horaDesde.hours() * 60;
				var horaHastaMinutos = horaHasta.minutes() + horaHasta.hours() * 60;
				agregar = horaDesdeMinutos <= fechaMinutos && horaHastaMinutos >= fechaMinutos;
				dobleFecha	= true;
			}
			if (!dobleFecha && horaDesde.isValid()) {
				var horaDesdeMinutos = horaDesde.minutes() + horaDesde.hours() * 60;
				agregar = horaDesdeMinutos <= fechaMinutos;
			}
			if (!dobleFecha && horaHasta.isValid()) {
				var horaHastaMinutos = horaHasta.minutes() + horaHasta.hours() * 60;
				agregar = horaHastaMinutos >= fechaMinutos;
			}
			if (estado === 'pendiente') {
				agregar = venta.reserva.comprobarEstadoPendiente();
			}

			if (agregar) {
				filtradas.push(venta);
			}
		}

		if (filtradas.length <= self.cantidadPorPag) {
			self.paginaActual(1);
		}

		self.ventas(filtradas);
	};

	self.removerFiltros = function() {
		self.filtroEstado('todos');
		self.filtroHoraDesde(null);
		self.filtroHoraHasta(null);
		self.filtrarReservas();
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Buscar ventas">
	self.buscarVentas = function() {
		var url		= self.urls.buscarVentasMostrador();
		var data	= { caja: self.caja().id() };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						var ventas = ko.mapping.fromJS(data.success.ventas, configVentaMostrador.ventas);
						self.ventas(ventas());
						self.ventasTodas(ventas());
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
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cancelar venta">
	self.cancelarVentaMostrador = function(venta) {
		Alerta({
			title: '¿Estás seguro de cancelar la reserva?',
			confirmButtonText: 'Si',
			cancelButtonText: 'No',
			onConfirmCallback: function() {
				var url			= self.urls.cancelarVentaMostrador();
				var data		= { venta: venta.id() };
				var opciones	= self.getAjaxOpciones({
					url		: url,
					data	: data,
					success : function (data, textStatus, jqXHR) {
						if (data.success) {
							Notificacion('Reserva cancelada', 'success');
							venta.reserva.comprobarEstadoCancelada(true);
							venta.reserva.comprobarEstadoPendiente(false);
							return;
						}
						if (data.error) {
							return Notificacion(data.error, 'error');
						}
						Notificacion('Ha ocurrido un error', 'error');
					}
				});
				$.ajax(opciones);
			}
		});
	}
	//</editor-fold>

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

	self.cerrarTicket = function() {
		if (self.removerOperacion()) {
			self.removerOperacion(false);
			self.operacion(null);
		}
		self.urlTicket(null);
	};

	self.abrirTicket = function(reserva) {
		var urlTicket = reserva.ticketUrl();
		self.urlTicket(urlTicket);
		ko.tasks.runEarly();
		$("#reservar-ticket-iframe").load(function() {
			$(this).show();
		});
	};
	//</editor-fold>

	self.inicializarPantalla = function() {
		self.venta(false);
		self.listado(false);
		if (!self.caja().comprobarTieneTurnoAbierto()) {
			self.seleccionarVenta();
		}
		self.servicios([]);
		self.ventas([]);
		self.ventasTodas([]);
		self.removerOperacion(false);
		self.urlTicket(null);
		self.paginaActual(1);
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

function koServicio(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	var ahora		= moment();
	var horaInicio	= moment(self.horaInicio.hora(), 'HH:mm:ss');
	var horaFin		= moment(self.horaFin.hora(), 'HH:mm:ss');

	self.turno				= new koTurno(self.turnos()[0]);
	self.horaInicioMostrar	= ko.observable(horaInicio.format('HH:mm'));
	self.horaFinMostrar		= ko.observable(horaFin.format('HH:mm'));

	self.comprobarEsActual = ko.computed(function() {
		if (ahora.isSameOrAfter(horaInicio) && ahora.isSameOrBefore(horaFin)) {
			return true;
		}
		return false;
	});

	/**
	 * Devuelve el precio del tipo de comensal ('invitado', 'alumno' o
	 * 'comunidad-universitaria')
	 *
	 * @param string tipoCategoria
	 * @returns float
	 */
	self.precioCalcular = function(tipoCategoria) {
		var salida	= null;
		var tipo	= self.tipo;
		var precios	= tipo.precios();
		for (var i = 0; i < precios.length; i++) {
			var precio = precios[i];
			var categoria = precio.categoriaComensal.nombreInterno();
			//Los precios del tipo ya son los vigentes por categoría de comensal
			if (categoria === tipoCategoria) {
				salida = precio.precio();
				break;
			}
		}
		return salida !== null ? parseFloat(salida) : null;
	};

	self.precioInvitado = self.precioCalcular(COMENSAL_INVITADO);

};

function koVenta(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	var hora = moment(self.fecha.hora(), 'HH:mm:ss');
	self.hora = hora.format('HH:mm');

	var fecha = moment(self.fecha.mysql());
	self.fechaMes = fecha.format('DD/MM');

	self.reserva = new koReserva(self.reserva);
}

function koTurno(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.cuposDisponiblesOriginal = self.cuposDisponibles();

	self.comprobarPuedeReservar = ko.pureComputed(function() {
		var cupos	    = self.cupos();
		var sinControl  = self.comprobarSinControlCupos();
		var disponibles = self.cuposDisponibles();
		if (cupos === null || sinControl) {
			return true;
		}

		return disponibles > 0;

	});

}