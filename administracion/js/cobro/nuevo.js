/* global ko, moment, MEDIO_PAGO_TRANSFERENCIA, TIPO_RECIBO, TIPO_PAGO, json, MEDIO_PAGO_EFECTIVO */

//<editor-fold defaultstate="collapsed" desc="Redondeo">
(function() {
    if (!Math.round2) {
        Math.round2 = function(value) {
            return Math.round((value + Number.EPSILON) * 100) / 100;
        };
    }
})();
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

//<editor-fold defaultstate="collapsed" desc="Modelo">

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'comprobantes' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koComprobante(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
};
//</editor-fold>

function koComprobante(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.montoImputar = ko.observable(0.00);

	self.errores = ko.pureComputed(() => {
		var errores = [];
		var imputar   = parseFloat(self.montoImputar());
		var pendiente = parseFloat(self.pendiente());

		if (imputar === 0.0) {
			return errores;
		}

		if (imputar < 0) {
			errores.push("No puede imputar un monto negativo");
		}
		if (pendiente < imputar) {
			errores.push("El monto a imputar no puede ser mayor al pendiente");
		}

		return errores;
	});

}

//</editor-fold>

function koPantalla(js, opciones) {
	var self = this;
	self.clientes = js.clientes;
	delete js.clientes;
	ko.mapping.fromJS(js, opciones, this);

	self.hoy			= moment().format('YYYY-MM-DD');
	if (self.fecha === undefined) {
		self.fecha = ko.observable('');
	}
	self.correo			= ko.observable('');
	self.urlTicket		= ko.observable(null);
	self.cliente		= ko.observable(null);
	self.monto			= ko.observable(0.00);
	self.observaciones	= ko.observable("");

	self.cliente.subscribe(function(cliente) {
		if (cliente !== undefined && cliente !== null) {
			let correo = cliente.correo;
			self.correo(correo);
			return self.buscarComprobantes(cliente.id);
		}
		self.comprobantes([]);
		self.placeholder(js.placeholder);
	});

	self.totalImputar = ko.pureComputed(function() {
		var total = 0;
		ko.utils.arrayForEach(self.comprobantes(), function(comprobante) {
			var monto = comprobante.montoImputar();
			if (monto !== "") {
				total += parseFloat(monto);
			}

		});
		return total;
	});

	self.totalPendiente = ko.pureComputed(function() {
		var total = 0;
		ko.utils.arrayForEach(self.comprobantes(), function(comprobante) {
			var monto = comprobante.pendiente();
			if (monto !== "") {
				total += parseFloat(monto);
			}

		});
		return total;
	});

	/**
	 * Busca los comprobantes del cliente con saldo pendiente de imputación
	 *
	 * @param {int} idCliente
	 * @returns {bool}
	 */
	self.buscarComprobantes = function(idCliente) {
		self.comprobantes([]);
		var url		= self.urls.buscarComprobantes();
		var data	= {
			cliente: idCliente
		};
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: { json: ko.mapping.toJSON(data) },
			success : function (data, textStatus, jqXHR) {
				if (data.success === false) {
					Notificacion(data.error, 'error');
					return false;
				}
				var comprobantes = ko.mapping.fromJS(data.comprobantes, opcionesPantalla.comprobantes);
				self.comprobantes(comprobantes());

				if (self.comprobantes().length === 0) {
					self.placeholder = ko.observable(self.placeholderSinComprobantes());
				}
				return true;
			}
		});
		$.ajax(opciones);
	};

	/**
	 * Comprueba que se pueda realizar una imputación sobre el nuevo recibo,
	 * basicamente comprobando que los comprobantes pendientes tengan saldo
	 * pendiente y no se esté realizando una petición al servidor
	 *
	 * @returns {Boolean}
	 */
	self.comprobarReciboImputar = function() {
		if (self.ajax() || !self.comprobarComprobantesPendientes()) {
			return false;
		}
		return true;
	};

	/**
	 * Comprueba que haya comprobantes pendientes de pago
	 *
	 * @returns {Boolean}
	 */
	self.comprobarComprobantesPendientes = function() {
		var bandera = false;
		ko.utils.arrayForEach(self.comprobantes(), function(comprobante){
			var pendiente = parseFloat(comprobante.pendiente());
			if (pendiente > 0) {
				bandera = true;
			}
		});
		return bandera;
	};

	self.comprobarMedioDePagoTransferencia = ko.computed(function() {
		var medioDePago = self.medioDePago();
		return medioDePago === MEDIO_PAGO_TRANSFERENCIA;
	});

	self.comprobarMostrarNumero = ko.computed(function() {
        const medioDePago        = self.medioDePago();
		const elegirMedioDePago  = self.elegirMedioDePago();
		const medioTransferencia = self.comprobarMedioDePagoTransferencia();

        //En MORA se elige automáticamente transferencia bancaria y debe
        //mostrarse el número de comprobante pero en HiFood lo dejamos como
        //opcional para cualquier medio que no sea efectivo
        let salida = medioTransferencia && !elegirMedioDePago;
        if (elegirMedioDePago && medioDePago !== MEDIO_PAGO_EFECTIVO) {
            salida = true;
        }

		return salida;
	});

	self.errores = ko.pureComputed(()=> {
		var salida       = [];
		var comprobantes = self.comprobantes();
		for (var i = 0; i < comprobantes.length; i++) {
			var comprobante = comprobantes[i];
			var errores = comprobante.errores();
			salida = salida.concat(errores);
		}

		return salida;
	});

	self.cobroValido = ko.computed(function() {
		var valido = true;
		valido = valido && self.cliente() !== null;
		valido = valido && self.monto() > 0;
		valido = valido && self.medioDePago() !== null;
		valido = valido && self.errores().length === 0;
		return valido;
	});

	self.reiniciarPantalla = function() {
		self.monto(0.0);
		self.medioDePago(null);
		self.observaciones("");
	};

	/**
	 * Normaliza los comprobantes para enviar los datos necesarios
	 * de los mismos
	 *
	 * @returns {ko.observableArray}
	 */
	self.normalizarComprobantes = function() {
		var salida = ko.observableArray();
		ko.utils.arrayForEach(self.comprobantes(), function (comp) {
			var monto     = parseFloat(comp.montoImputar());
			var pendiente = parseFloat(comp.pendiente());
			if (pendiente > 0 && monto > 0) {
				var obj = {};
				obj.id = comp.id();
				obj.tipo = comp.tipo();
				obj.pendiente = pendiente;
				obj.total = comp.total();
				obj.montoImputar = monto;
				salida.push(obj);
			}
		});
		return salida;
	};

	self.validarEstaImputando = ko.pureComputed(function() {
		var comprobantes = self.normalizarComprobantes();
		var imputaciones = comprobantes().length;
		return imputaciones > 0;
	});

	self.validarCobro = function() {
		var bandera			= true;
		var imputacion		= 0.00;
		var montoCobrar = parseFloat(self.monto());
		if (montoCobrar === 0) {
			Notificacion("El monto a cobrar no puede ser cero.", "error");
			bandera = false;
		}
		ko.utils.arrayForEach(self.comprobantes(), function(comprobante){
			var monto = parseFloat(comprobante.montoImputar());
			if (isNaN(monto)) {
				monto = 0;
			}
			var pendienteComprobante = parseFloat(comprobante.pendiente());
			imputacion += parseFloat(monto);
			if (monto > pendienteComprobante) {
				Notificacion("El monto a imputar del comprobante no puede ser mayor que el saldo pendiente del mismo.", "error");
				bandera = false;
			}
		});

		if (Math.round2(imputacion) > Math.round2(montoCobrar)) {
			Notificacion("El monto a imputar no puede ser mayor que el monto a cobrar.", "error");
			bandera = false;
		}
		let hoy			= moment();
		let fecha	    = self.fecha();
		let fechaMoment = moment(fecha, 'YYYY-MM-DD');
		let esTipoPago  = self.tipoPago();
		if (esTipoPago && fechaMoment.isAfter(hoy)) {
			Notificacion("La fecha del pago no puede ser futura.", "error");
			bandera = false;
		}
		if (esTipoPago && !fechaMoment.isValid()) {
			Notificacion("La fecha del pago no es válida.", "error");
			bandera = false;
		}
		var numero = self.numero();
        const mostrarNumero = self.comprobarMostrarNumero();
		if (esTipoPago && mostrarNumero && (numero === "" || numero === undefined) ) {
			Notificacion("El número de comprobante no puede estar vacío.", "error");
			bandera = false;
		}
		return bandera;
	};

	self.guardar = function() {
		if (!self.validarCobro()) {
			return false;
		}
		let tipoPago = self.tipoPago();
		if (!tipoPago) {
			return self.guardarAjax();
		}
		let correo = self.correo();
		let valido = $('#caja-cc-cobro-correo')[0].validity.valid;
		if (correo === "" || !valido) {
			let texto  = !valido ? "válido " : "";
			let titulo = `El proveedor no posee un correo ${texto}y no se le podrá notificar por email. ¿Desea continuar con el pago?`;
			Alerta({
				title: titulo,
				cancelButtonColor: '#BFBFBF',
				onConfirmCallback: function() {
					self.guardarAjax();
				}
			});
			return;
		}
		self.guardarAjax();
	};

	self.guardarAjax = function() {
		var url		= self.urls.guardar();
		var data	= {
			fecha			  : self.fecha(),
			correo			  : self.correo(),
			puntoDeVenta	  : self.puntoDeVenta,
			cliente			  : self.cliente(),
			monto			  : self.monto(),
			numero			  : self.numero(),
			medioDePago		  : self.medioDePago(),
			observaciones	  : self.observaciones(),
			comprobantes	  : self.normalizarComprobantes()
		};
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: { json: ko.mapping.toJSON(data) },
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					if (typeof data.rutaTicket === 'undefined') {
						return Notificacion('Ha ocurrido un error, vuelva a intentar', 'error');
					}
					var mensaje = data.mensajeExito;
					Notificacion(mensaje, 'success');
					if (data.tipo === TIPO_RECIBO) {
						self.verTicket(data.rutaTicket);
						self.reiniciarPantalla();
					}
					if (data.tipo === TIPO_PAGO) {
						window.location.href = data.listado;
					}
					return;
				}
				if (data.errores && data.errores.length > 0) {
					data.errores.forEach(error => {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			}
		});
		$.ajax(opciones);
	};

	self.verTicket = function(urlTicket) {
		self.urlTicket(urlTicket);
		ko.tasks.runEarly();
		$("#cobro-cc-ticket-iframe").load(function() {
			$(this).show();
			var iFrameID = document.getElementById('cobro-cc-ticket-iframe');
			if (iFrameID) {
				iFrameID.height = "";
				iFrameID.height = iFrameID.contentWindow.document.body.scrollHeight + "px";
			}
		});
	};

	self.cerrarTicket = function() {
		self.urlTicket(null);
		var query = getUrlVars();
		var destino = self.urls.listado();
		if (typeof query.volverA !== "undefined") {
			destino = decodeURIComponent(query.volverA);
		}
		window.location.href = destino;
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax = ko.observable(false);
	self.ajaxOpciones	= {
		method : 'POST',
		beforeSend: function(jqXHR, settings) {
			self.ajax(true);
		},
		error: function (jqXHR, textStatus, errorThrown) {
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
		complete: function(jqXHR, settings) {
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
	var $seccion = $('#nuevo-cobro-cc');
	ko.options.deferUpdates = true;
	koNuevoCobroCC = new koPantalla(json, {});
	ko.applyBindings(koNuevoCobroCC, $seccion.get(0));
	koNuevoCobroCC.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

