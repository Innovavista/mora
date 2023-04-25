/* global ko, OPERACION_MOVIMIENTOS_CAJA, moment, OPERACION_MOVIMIENTO_MANUAL, OPERACION_TRANSFERENCIA, MOVIMIENTO_TIPO_COBRO_CC, MOVIMIENTO_TIPO_VENTA_PUNTO_VENTA, jsonMovimientosCaja, Intl */

var koMovimientosCaja = null;

//<editor-fold defaultstate="collapsed" desc="Binding moneda">
var formateadorMoneda = new Intl.NumberFormat(undefined, {
	style: 'currency',
	currency: 'ARS'
});

var formatearMoneda = function (valor) {
	var salida = formateadorMoneda.format(valor);
	var partes = salida.split(',');
	if (partes.length === 1) {
		salida += ',00';
	} else if (partes.length > 1) {
		var decimales = partes[partes.length - 1];
		if (decimales.length === 1) {
			salida += '0';
		}
	}
	return salida;
};

ko.bindingHandlers.moneda = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var valor = ko.utils.unwrapObservable(valueAccessor());
		var tipo = typeof valor;
		if ((tipo !== 'number' && isNaN(valor))
			|| valor === null
		) {
			$(element).html('');
			return;
		}
		var negativo = valor < 0;
		var final = formatearMoneda(valor);
		if (negativo) {
			final = '<span class="text-danger">' + final + '</span>';
		}
		$(element).html(final);
	}
};
//</editor-fold>

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

	self.tipo	   = ko.observable(OPERACION_MOVIMIENTOS_CAJA);
	self.operacion = ko.observable(true);

	var fecha  = moment().subtract(30, 'days');
	self.fecha = ko.observable(fecha.format("YYYY-MM-DD"));

	let saldoPrevio			= !isNaN(json.saldoPrevio) ? json.saldoPrevio : null;
	self.fechaPasada		= ko.observable(null);
	self.saldoActual		= ko.observable(null);
	self.saldoActualMostrar = ko.observable(null);
	self.saldoPrevio		= ko.observable(saldoPrevio);
	self.saldoPrevioMostrar	= ko.observable(null);
	self.anular				= ko.observable(false);

	self.saldoActual.subscribe(function() {
		var saldo = parseFloat(self.saldoActual());
		if (saldo === Number.NaN) {
			return;
		}
		self.saldoActualMostrar(saldo.format(2, 3, '.', ','));
	});

	self.volverPantalla = function() {
		if (self.comprobarEsTransferenciaCajas() || self.comprobarEsMovimientoManual()) {
			self.buscarMovimientos();
			self.seleccionarOperacion(OPERACION_MOVIMIENTOS_CAJA);
			return;
		}
		window.location.href = self.volverA();
	};

	self.seleccionarOperacion = function(tipo) {
		self.tipo(tipo);
		switch(tipo) {
			case OPERACION_MOVIMIENTOS_CAJA:
			  self.tituloPantalla(json.tituloPantalla);
			  break;

			case OPERACION_MOVIMIENTO_MANUAL:
			  self.tituloPantalla("Movimiento manual");
			  break;

			case OPERACION_TRANSFERENCIA:
			  self.tituloPantalla("Transferencia entre cajas");
			  break;

		}
	};

	//<editor-fold defaultstate="collapsed" desc="Comprobaciones">
	self.comprobarEsMovimientosCaja = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_MOVIMIENTOS_CAJA;
	});

	self.comprobarEsTransferenciaCajas = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_TRANSFERENCIA;
	});

	self.comprobarEsMovimientoManual = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_MOVIMIENTO_MANUAL;
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Operaciones">
	self.transferenciaCajas = new koTransferenciaCajas({
		urls			: self.urls,
		caja			: self.caja,
		cajas			: self.cajas,
		operacion		: self.operacion,
		callbackSuccess	: function(){}
	});

	self.movimientoManual = new koMovimientoManual({
		urls				: self.urls,
		caja				: self.caja,
		operacion			: self.operacion,
		tiposMovimientos	: self.tiposMovimientos,
		callbackSuccess		: function(){}
	});
	//</editor-fold>

	/**
	 * Valida que la búsqueda sea válida.
	 *
	 * @param {bool} mostrar
	 * @returns {Boolean}
	 */
	self.comprobarBusquedaValida = function(mostrar) {
		var fecha  = moment(self.fecha());
		var valida = fecha.isValid();
		var errores = [];
		if (!valida) {
			errores.push("Ingrese una fecha válida.");
		}
		var hoy = moment();
		if (fecha.isAfter(hoy)) {
			errores.push("La fecha no puede ser futura.");
		}
		if (mostrar) {
			errores.forEach(error => {
				Notificacion(error, 'error');
			});
		}
		return errores.length === 0;
	};

	self.buscarMovimientos = function() {
		var valido = self.comprobarBusquedaValida(true);
		if (!valido) {
			return;
		}
		self.movimientos([]);
		var central = self.caja.central();
		var url		= '';
		var data	= {};
		if (central) {
			url = self.urls.buscarMovimientosCaja();
			data = {
				caja: self.caja.id(),
				fecha: self.fecha()
			};
		} else {
			url = self.urls.buscarMovimientosTurno();
			data = { caja: self.caja.id() };
		}
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				var mensaje = 'Ha ocurrido un error al buscar los movimientos manuales.';
				if (data) {
					if (data.success) {
						var movimientos       = ko.mapping.fromJS(data.success.movimientos);
						var invertidos        = movimientos.reverse();
						var invertidosA       = invertidos();
						self.movimientos(invertidosA);

						ko.mapping.fromJS(data.success.saldosAdicionales, {}, self.saldosAdicionales);

						if (central) {
							var fecha		= self.fecha();
							var fechaPasada = moment(fecha).subtract(1, 'day').format("DD/MM/YYYY");
							self.fechaPasada(fechaPasada);

							var saldoPrevio = parseFloat(data.success.saldoPrevio);
							self.saldoPrevio(saldoPrevio);
							self.saldoPrevioMostrar(saldoPrevio.format(2, 3, '.', ','));

							var saldo = saldoPrevio;
							for (var i = 0; i < invertidosA.length; i++) {
								const movimiento = invertidosA[i];
								saldo += parseFloat(movimiento.monto());
							}
							self.caja.saldo(saldo);
						}
						return;
					}
					if (Array.isArray(data.errores)) {
						data.errores.forEach(error => {
							Notificacion(error, 'error');
						});
						return;
					}
					Notificacion(mensaje, 'error');
					return;
				}
				Notificacion(mensaje, 'error');
			}
		});
		$.ajax(opciones);
	};

	self.movimientoOperacionClick = function(movimiento, accion) {
		var tipo = movimiento.tipo.nombreInterno();
		switch (accion) {
			case "anular":
				return tipo === MOVIMIENTO_TIPO_COBRO_CC && !movimiento.anulado() && self.anularCobro(movimiento);
			case "ticket":
				return tipo === MOVIMIENTO_TIPO_VENTA_PUNTO_VENTA && self.ventaTicket(movimiento);
			case "anulacion-reembolso":
				return tipo ===  MOVIMIENTO_TIPO_VENTA_PUNTO_VENTA && self.reembolsoVenta(movimiento);
		}
	};

	self.movimientoOperacionCondicion = function(movimiento, accion) {
		var tipo = movimiento.tipo.nombreInterno();
		switch (accion) {
			case "anular":
				return tipo === MOVIMIENTO_TIPO_COBRO_CC && !movimiento.anulado();
			case "ticket":
				return tipo === MOVIMIENTO_TIPO_VENTA_PUNTO_VENTA;
			case "anulacion-reembolso":
				return tipo === MOVIMIENTO_TIPO_VENTA_PUNTO_VENTA;
		}
	};

	self.movimientoClase = function(movimiento) {
		if (movimiento.anulado()) {
			return 'cc-movimiento-anulado text-muted';
		}
		return '';
	};

	self.ventaTicket = function(movimiento) {
		var id			= movimiento.venta.id();
		var opciones	= self.getAjaxOpciones({
			url		: self.urls.puntoDeVentaTicketUrl(),
			data	: { id: id },
			success : function (data, textStatus, jqXHR) {
				if (!data.url) {
					return;
				}
				return Alerta({
					type: 'success',
					title: 'Ticket de venta',
					html: '<iframe src="' + data.url + '" id="punto-de-venta-ticket-iframe" class="ticket-iframe punto-de-venta-ticket-iframe"></iframe>',
					confirmButtonText: 'Cerrar',
					cancelButtonText: 'Enviar',
					cancelButtonColor: "#7B97FA",
					onConfirmCallback: function() {
						return;
					},
					onCancelCallback: function() {
						return;
					}
				});
			}
		});
		$.ajax(opciones);
	};

	self.reembolsoVenta = function(movimiento) {
		if (movimiento.urls) {
			window.location.href = movimiento.urls.anularComprobante();
			return;
		}
	};

	self.anularCobro = function(movimiento) {
		return Alerta({
			title: 'Confirmar la anulación del cobro',
			onConfirmCallback: function() {
				if (!movimiento.recibo) {
					return;
				}
				var id  = movimiento.recibo.id();
				var url = self.urls.cobroCCAnular() + '/' + id;
				var opciones	= self.getAjaxOpciones({
					url		: url,
					success : function (data, textStatus, jqXHR) {
						if (data.success) {
							movimiento.anulado(true);
							return Notificacion('Anulación exitosa', 'success');
						}
					}
				});
				self.anular(true);
				$.ajax(opciones);
			}
		});
	};

	self.inicializarPantalla = function() {
		var fecha = moment().subtract(30, 'days');
		self.fecha(fecha.format("YYYY-MM-DD"));

		self.tituloPantalla(json.tituloPantalla);
		self.fechaPasada(null);
		self.saldoPrevio(null);
		self.saldoPrevioMostrar(null);
		self.saldoActual(null);
		self.saldoActualMostrar(null);
		self.buscarMovimientos();
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax			= ko.observable(false);
	self.ajaxOpciones	= {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			var mensaje = "Ha ocurrido un error, vuelva a intentar";
			if (typeof jqXHR.responseJSON !== "undefined") {
				var data = jqXHR.responseJSON;
				if (Array.isArray(data.errores)) {
					mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
					mensaje += data.errores.join("<br/>");
				} else if (typeof data.error !== "undefined") {
					mensaje = "Ha ocurrido el siguiente error: " + data.error;
				}
			}
			Notificacion(mensaje, 'error');
		},
		complete   : function(jqXHR, settings) {
			self.ajax(false);
			self.anular(false);
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
	var $seccion = $('#movimientos-caja');
	ko.options.deferUpdates = true;
	koMovimientosCaja = new koPantalla(jsonMovimientosCaja, opcionesPantalla);
	ko.applyBindings(koMovimientosCaja, $seccion.get(0));
	koMovimientosCaja.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});
