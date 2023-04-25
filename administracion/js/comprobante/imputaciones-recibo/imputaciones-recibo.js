var koImputacionesRecibo = null;

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

	self.placeholder = ko.observable('El cliente no presenta comprobantes pendientes de pago');

	//<editor-fold defaultstate="collapsed" desc="Títulos">
	self.tituloPantalla = ko.observable("Imputaciones");

	self.tituloRecibo = ko.computed(function () {
		return "Recibo " + self.recibo.letra() + "-venta-" + self.recibo.id();
	});

	self.tituloMonto = ko.computed(function () {
		return "Monto: $" + self.recibo.total();
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cálculos">
	self.pendiente = ko.pureComputed(function(){
		var pendiente  = parseFloat(self.recibo.pendiente());
		return Math.round((pendiente + Number.EPSILON) * 100) / 100;
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
	 * Calcula el monto pendiente del recibo que falta ser imputado
	 * en el momento que se creó la imputación que viene por parámetro,
	 * Aclaración: Las imputaciones vienen ordenadas por fecha ASC
	 *
	 * @param {koImputacion} imputacion
	 * @returns {String}
	 */
	self.calcularPendienteImputacion = function(imputacion) {
		var pendiente = parseFloat(self.recibo.total());
		var index = self.imputaciones.indexOf(imputacion);
		ko.utils.arrayForEach(self.imputaciones(), function(imp) {
			var indexActual = self.imputaciones.indexOf(imp);
			var resta = index - indexActual;
			if (resta >= 0) {
				pendiente -= parseFloat(imp.monto());
			}
		});
		return parseFloat(pendiente);
	};

	/**
	 * Calcula el total pendiente de los comprobantes del cliente
	 *
	 * @returns {Number}
	 */
	self.calcularPendienteComprobantes = function() {
		var pendienteTotal = 0.00;
		ko.utils.arrayForEach(self.comprobantes(), function (comprobante) {
			var pendiente = comprobante.pendiente();
			pendienteTotal += parseFloat(pendiente);
		});
		var salida = Math.round((pendienteTotal + Number.EPSILON) * 100) / 100;
		return salida;
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Validaciones">
	/**
	 * Valida que el monto a imputar de cada comprobante no sea mayor que el
	 * total del comprobante y también que el total a imputar no supere el
	 * monto del recibo
	 *
	 * @returns {bool}
	 */
	self.validarImputacion = function() {
		var bandera			= true;
		var imputacion		= 0.00;
		var pendienteRecibo = parseFloat(self.recibo.pendiente());
		if (pendienteRecibo === 0) {
			Notificacion("El recibo no posee saldo pendiente", "error");
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
				Notificacion("El monto a imputar del comprobante no puede ser mayor que el saldo pendiente del mismo", "error");
				bandera = false;
			}
		});
		var pendienteTotal = self.calcularPendienteComprobantes();
		if (pendienteTotal === 0.0) {
			Notificacion("No hay comprobantes con saldos pendientes", "error");
			bandera = false;
		}
		if (imputacion > pendienteRecibo) {
			Notificacion("El monto a imputar no puede ser mayor que el pendiente del recibo", "error");
			bandera = false;
		}
		if (imputacion === 0) {
			Notificacion("El monto a imputar no puede ser cero", "error");
			bandera = false;
		}
		return bandera;
	};

	/**
	 * Valida que el recibo tenga saldo pendiente y haya comprobantes para saldar
	 *
	 * @returns {bool}
	 */
	self.validarAutoImputacion = function() {
		var bandera = true;
		var pendienteTotal = self.calcularPendienteComprobantes();
		if (pendienteTotal === 0) {
			Notificacion("No hay comprobantes con saldos pendientes", "error");
			bandera = false;
		}
		if (self.pendiente() === 0.0) {
			Notificacion("El recibo no tiene saldo pendiente para imputar", "error");
			bandera = false;
		}
		return bandera;
	};

	/**
	 * Comprueba que se pueda imputar el recibo
	 *
	 * @returns {Boolean}
	 */
	self.comprobarReciboImputar = function() {
		if (self.ajax() || self.pendiente() === 0.0 || !self.comprobarComprobantesPendientes()) {
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
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Acciones de imputación/desimputación">

	/**
	 * Normaliza los comprobantes para enviar los datos necesarios
	 * de los mismos
	 *
	 * @returns {ko.observableArray}
	 */
	self.normalizarComprobantes = function() {
		var salida = ko.observableArray();
		ko.utils.arrayForEach(self.comprobantes(), function (comp) {
			var pendiente = parseFloat(comp.pendiente());
			var obj = {};
			obj.id = comp.id();
			obj.tipo = comp.tipo();
			obj.pendiente = pendiente;
			obj.total = comp.total();
			obj.montoImputar = parseFloat(comp.montoImputar());
			if (pendiente > 0 && parseFloat(comp.montoImputar()) > 0) {
				salida.push(obj);
			}
		});
		return salida;
	};

	/**
	 * Inicializa los montos a imputar de los comprobantes en cero
	 *
	 * @returns {undefined}
	 */
	self.inicializarComprobantes = function() {
		ko.utils.arrayForEach(self.comprobantes(), function(comprobante){
			comprobante.montoImputar(0);
		});
	};

	/**
	 * Imputar recibo para pagar uno o varios comprobantes
	 *
	 * @returns {Boolean}
	 */
	self.imputacionManual = function() {
		if (!self.validarImputacion()) {
			return false;
		}
		var url = self.urls.imputarRecibo();
		var data = {
			id: self.recibo.id(),
			comprobantes: self.normalizarComprobantes()
		};
		var opciones = self.getAjaxOpciones({
			url: url,
			data: {json: ko.mapping.toJSON(data)},
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					ko.mapping.fromJS(data, opciones, self);
					Notificacion('La imputación manual ha sido exitosa', 'success');
					self.inicializarComprobantes();
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajax(true);
			},
			complete: function (jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
		return true;
	};

	self.autoImputar = function() {
		if (!self.validarAutoImputacion()) {
			return false;
		}
		var pendiente = parseFloat(self.recibo.pendiente());
		var restante  = pendiente;
		let comprobantes = self.comprobantes();
		comprobantes.forEach(factura => {
			var pendienteFactura = parseFloat(factura.pendiente());
			var montoImputar	 = pendienteFactura;
			if (pendienteFactura > restante) {
				montoImputar = restante;
			}
			var resta = restante - montoImputar;
			restante  = resta > 0 ? resta : 0;
			factura.montoImputar(montoImputar);
		});
	};

	/**
	 * Realiza imputaciones en forma automática utilizando el monto pendiente
	 * del recibo para imputar todos los comprobantes posibles
	 *
	 * @returns {Boolean}
	 */
	self.imputacionAutomatica = function() {
		if (!self.validarAutoImputacion()) {
			return false;
		}
		var url = self.urls.autoImputarRecibo();
		var data = {
			id: self.recibo.id()
		};
		var opciones = self.getAjaxOpciones({
			url: url,
			data: {json: ko.mapping.toJSON(data)},
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					ko.mapping.fromJS(data, opciones, self);
					Notificacion('La auto-imputación ha sido exitosa', 'success');
					self.inicializarComprobantes();
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajax(true);
			},
			complete: function (jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
		return true;
	};

	/**
	 * Modal que solicita confiramción para la desimputación
	 *
	 * @param {koImputacion} imputacion
	 * @returns {void}
	 */
	self.modalDesImputar = function(imputacion) {
		swal({
			title: 'Confirmar la desimputación con id: ' + imputacion.id(),
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#F44336',
			cancelButtonColor: '#bfbfbf',
			showLoaderOnConfirm: false,
			preConfirm: function() {
				self.desImputar(imputacion);
			}
		});
	};

	/**
	 * Desimputa una imputación realizada con anterioridad devolviendo la
	 * información con los registros actualizados y calculados en el servidor
	 *
	 * @param {koImputacion} imputacion
	 * @returns {Boolean}
	 */
	self.desImputar = function(imputacion) {
		var url = self.urls.desimputar();
		var data = {
			id: self.recibo.id(),
			idImputacion: imputacion.id()
		};
		var opciones = self.getAjaxOpciones({
			url: url,
			data: {json: ko.mapping.toJSON(data)},
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					ko.mapping.fromJS(data, opciones, self);
					Notificacion('La desimputación ha sido exitosa', 'success');
					self.inicializarComprobantes();
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajax(true);
				imputacion.ajaxDesimputar(true);
			},
			complete: function (jqXHR, settings) {
				self.ajax(false);
				imputacion.ajaxDesimputar(false);
			}
		});
		$.ajax(opciones);
		return true;
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax = ko.observable(false);
	self.ajaxOpciones = {
		method: 'POST',
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
	var $seccion = $('#imputaciones-recibo');
	ko.options.deferUpdates = true;
	koImputacionesRecibo = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koImputacionesRecibo, $seccion.get(0));
	koImputacionesRecibo.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});

