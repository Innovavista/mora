//<editor-fold defaultstate="collapsed" desc="Config">
var configCargaCredito = {
	'cargas' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koCarga(options.data, configVentaMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, configVentaMostrador, options.target);
			return options.target;
		}
	},
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Formatear números">
var formatearNumero = function(valor) {
	var final = Inputmask.format(valor, {
		groupSeparator: ".",
		radixPoint: ',',
		alias: "numeric",
		placeholder: "0",
		autoGroup: !0,
		digits: 2,
		digitsOptional: !1,
		clearMaskOnLostFocus: !1
	});
	var partes = final.split(',');
	if (partes.length === 1) {
		final += ',00';
	} else if (partes.length > 1) {
		var decimales = partes[partes.length - 1];
		if (decimales.length === 1) {
			final += '0';
		}
	}
	return final;
};
//</editor-fold>

function koCargaCredito(params) {
	var self = this;

	self.urls				= params.urls;
	self.caja				= params.caja;
	self.callbackSuccess	= params.callbackSuccess;

	self.urlTicket	= ko.observable(null);
	self.carga		= ko.observable(false);
	self.listado	= ko.observable(false);

	self.comprobarMostrarOperaciones = ko.computed(function() {
		if (self.caja()
			&& self.caja().comprobarTieneTurnoAbierto()
			&& self.carga() === false
			&& self.listado() === false
		) {
			return true;
		}
		return false;
	});

	self.seleccionarCarga = function() {
		self.carga(true);
		self.listado(false);
	};

	self.seleccionarListado = function() {
		self.listado(true);
		self.carga(false);
		self.buscarCargas();
	};

	//<editor-fold defaultstate="collapsed" desc="Carga de crédito">
	self.monto					= ko.observable("");
	self.comensal				= ko.observable(null);
	self.comensalNoEncontrado	= ko.observable(false);
	self.buscando				= ko.observable(false);

	self.cargaInvalida = ko.computed(function() {
		if (self.monto() === 0 || self.monto() === '') {
			return true;
		}
		return false;
	});

	self.limpiarComensalActual = function() {
		self.comensal(null);
	};

	self.mostrarComensal = function(comensal) {
		self.comensalNoEncontrado(false);
		self.comensal(comensal);
	};

	//<editor-fold defaultstate="collapsed" desc="Guardar">
	self.cargarCreditoPrev = function() {
		swal({
			title: 'Confirmar la carga de crédito de $' + formatearNumero(self.monto()) +' a ' + self.comensal().apellido() + ', ' + self.comensal().nombre(),
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
			showLoaderOnConfirm: true,
			preConfirm: function() {
				self.cargarCredito();
			}
		});
	};

	self.cargarCredito = function() {
		var url		= self.urls.cargarCredito();
		var data	= {
			caja: self.caja(),
			comensal: self.comensal(),
			monto: self.monto()
		};
		data = {json: ko.mapping.toJSON(data)};
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					self.monto(null);
					self.limpiarComensalActual();
					Notificacion('Carga exitosa', 'success');
					self.callbackSuccess();
					return Alerta({
						type: 'success',
						title: 'Crédito cargado correctamente',
						confirmButtonText: 'Volver',
						cancelButtonText: 'Ticket',
						cancelButtonColor: "#7B97FA",
						onConfirmCallback: function() {
							return;
						},
						onCancelCallback: function() {
							if (data['rutaTicket']) {
								self.verTicket(data['rutaTicket']);
							}
						}
					});
					return;
				}
				if (data.error) {
					Notificacion(data.error, 'error');
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Buscar comensal">
	self.buscarComensal = function(params) {
		if (params.busqueda === '') {
			return;
		}
		self.limpiarComensalActual();
		self.comensalNoEncontrado(false);
		var url		= self.urls.buscarComensal();
		var data	= { dni: params.busqueda };
		self.buscando(true);
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				self.buscando(false);
				if (data.success) {
					self.mostrarComensal(ko.mapping.fromJS(data.success.comensal, {}));
					$("#carga-credito-monto").focus();
					return;
				}
				if (data.error) {
					self.comensalNoEncontrado(true);
					Notificacion('No se ha encontrado el comensal', 'error');
					return;
				}
				return Notificacion('Ha ocurrido un error.', 'error');
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Listado">
	self.cargasCredito	= ko.observableArray([]);
	self.paginaActual	= ko.observable(1);
	self.cantidadPorPag	= 10;
	self.totalPaginas	= ko.computed(function() {
		var cargas = self.cargasCredito();
		if (cargas.length === 0) {
			return 1;
		}
		return Math.ceil(cargas.length / self.cantidadPorPag);
	});
	self.cargasPaginadas = ko.computed(function() {
		var paginaActual = self.paginaActual();
		var cargas		 = self.cargasCredito();

		var primera	= self.cantidadPorPag * (paginaActual - 1);
		var ultima	= primera + self.cantidadPorPag;

		return cargas.slice(primera, ultima);
	});

	//<editor-fold defaultstate="collapsed" desc="Buscar cargas de crédito">
	self.buscarCargas = function() {
		var url			= self.urls.buscarCargasCredito();
		var data		= { caja: self.caja().id() };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					var cargas = ko.mapping.fromJS(data.success.cargas, configCargaCredito.cargas);
					self.cargasCredito(cargas());
					return;
				}
				if (data.error) {
					Notificacion(data.error, 'error');
					return;
				}
				return Notificacion('Ha ocurrido un error.', 'error');
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cancelación">
	self.cancelarCarga = function(carga) {
		Alerta({
			title: '¿Estás seguro de cancelar la carga de crédito?',
			confirmButtonText: 'Si',
			cancelButtonText: 'No',
			onConfirmCallback: function() {
				var url			= self.urls.cancelarCargaCredito();
				var data		= { cargaCredito: carga.id() };
				var opciones	= self.getAjaxOpciones({
					url		: url,
					data	: data,
					success : function (data, textStatus, jqXHR) {
						if (data.success) {
							Notificacion('Cancelación de carga de crédito exitosa', 'success');
							carga.cancelada(true);
							return;
						}
						if (data.error) {
							self.mostrarErrorCancelarCargar(data.error);
							return;
						}
						return Notificacion('Ha ocurrido un error.', 'error');
					}
				});
				$.ajax(opciones);
			}
		});
	}

	self.mostrarErrorCancelarCargar = function(datos) {
		var template  = $("#caja-carga-credito-cancelar-error").html();
		var html = Mustache.render(template, datos);
		Alerta({
			title: 'No es posible cancelar esta transacción.',
			html: html,
			type: 'error',
			showCancelButton: false,
			onConfirmCallback: function() { return; }
		});
	};
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

	//</editor-fold>

	self.verTicket = function(urlTicket) {
		self.urlTicket(urlTicket);
		ko.tasks.runEarly();
		$("#carga-credito-ticket-iframe").load(function() {
			$(this).show();
			var iFrameID = document.getElementById('carga-credito-ticket-iframe');
			if (iFrameID) {
				iFrameID.height = "";
				iFrameID.height = iFrameID.contentWindow.document.body.scrollHeight + "px";
			}
		});
	};

	self.cerrarTicket = function() {
		self.urlTicket(null);
	};

	self.inicializarPantalla = function() {
		self.carga(false);
		self.listado(false);
		if (!self.caja().comprobarTieneTurnoAbierto()) {
			self.seleccionarCarga();
		}
		self.cargasCredito([]);
		self.paginaActual(1);
		self.comensal(null);
		self.urlTicket(null);
		self.monto("");
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

function koCarga(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	var hora = moment(self.auditoriaCreado.hora(), "HH:mm:ii");
	self.hora = hora.format("HH:mm");

	var monto = parseFloat(self.monto());
	self.monto = '$' + monto.format(2, 3, '.', ',');
}
