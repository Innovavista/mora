var koMiCuenta = null;

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
	
	self.fecha = ko.observable(self.fechaMysql());

	self.limpiarMovimientosEnAjax = ko.observable(true);

	self.buscarMovimientos = function() {
		var url			= self.urls.buscarMovimientos();
		var fecha		= self.fechaMysql();
		var fechaMoment = moment(fecha);
		if (!fechaMoment.isValid()) {
			Notificacion("La fecha de filtrado es inválida", "error");
			return;
		}
		var data		= { fecha: fecha };
		if (self.clienteId && self.clienteId()) {
			data.cliente = self.clienteId();
		}
		data			= { json: ko.mapping.toJSON(data) };
		self.movimientos([]);
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					var movimientos = ko.mapping.fromJS(data.movimientos, opcionesPantalla.movimientos);
					self.movimientos(movimientos());

					var saldo	   = parseFloat(data.saldo);
					var saldoHasta = parseFloat(data.saldoHasta);
					self.saldo(saldo);
					self.saldoHasta(saldoHasta);
					self.fecha(self.fechaMysql());
					return;
				}
				if (data.errores && Array.isArray(data.errores)) {
					data.errores.forEach(error => {
						Notificacion(error, "error");
					});
					return;
				}
				return Notificacion('Ha ocurrido un error al buscar los movimientos', 'error');
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajuste manual">
	self.ajusteModal	= $("#cliente-cc-ajuste-modal");
	self.ajusteVisible	= ko.observable(false);
	self.monto			= ko.observable(null);
	self.concepto		= ko.observable("ingreso");
	self.comentarios	= ko.observable("");

	self.toggleAjusteManual = function() {
		if (!self.ajusteVisible()) {
			self.ajusteModal.modal('show');
			self.ajusteVisible(true);
		} else {
			self.ajusteModal.modal('hide');
			self.monto(null);
			self.comentarios(null);
			self.ajusteVisible(false);
		}
	};

	self.ajusteInvalido = ko.computed(function() {
		if (self.monto() > 0) {
			return false;
		}
		return true;
	});

	self.sumarSaldo = function(monto) {
		var saldo	= parseFloat(self.saldo());
		var total	= saldo + parseFloat(monto);
		self.saldo(total);
	};
	
	self.claseSaldo = ko.computed(function() {
		let saldo  = self.saldo();
		let numero = parseFloat(saldo);
		return numero > 0 ? 'text-success' : (numero < 0 ? 'text-danger' : '');
	});

	self.guardarAjusteManual = function() {
		Alerta({
			title: 'Confirmar el ' + self.concepto() +' manual de $' + self.monto(),
			onConfirmCallback: function() {
				var url			= self.urls.guardarAjusteManual();
				var monto		= self.concepto() === 'egreso' ? Math.abs(self.monto()) * -1 : self.monto();
				var data		= {
					cliente	    : self.clienteId(),
					monto		: monto,
					comentarios	: self.comentarios()
				};
				data			= { json: ko.mapping.toJSON(data) };
				var opciones	= self.getAjaxOpciones({
					url		: url,
					data	: data,
					success : function (data, textStatus, jqXHR) {
						if (data.success) {
							var movimiento = ko.mapping.fromJS(data.movimiento, opcionesPantalla.movimientos);
							self.movimientos.unshift(movimiento);
							self.toggleAjusteManual();
							self.sumarSaldo(monto);
							Notificacion('Ajuste manual exitoso', 'success');
							return;
						}
						if (data.errores && data.errores.length > 0 && Array.isArray(data.errores)) {
							ko.utils.arrayForEach(data.errores, function (error) {
								Notificacion(error, 'error');
							});
							return;
						}
						return Notificacion('Ha ocurrido un error al guardar el ajuste manual', 'error');
					}
				});
				$.ajax(opciones);
			}
		});
	};
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
	var $seccion = $('#mi-cuenta-cliente');
	ko.options.deferUpdates = true;
	koMiCuenta = new koPantalla(jsonMiCuenta, opcionesPantalla);
	ko.applyBindings(koMiCuenta, $seccion.get(0));
	koMiCuenta.inicializando = false;
	ko.tasks.runEarly();
	
	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});