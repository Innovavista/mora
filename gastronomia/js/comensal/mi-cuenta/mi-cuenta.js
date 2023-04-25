var koMiCuenta = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.fecha = ko.observable(self.fechaMysql());

	self.limpiarMovimientosEnAjax = ko.observable(true);

	self.buscarMovimientos = function() {
		var url			= self.urls.buscarMovimientos();
		var data		= { fecha: self.fechaMysql() };
		if (self.comensalId && self.comensalId()) {
			data.comensal = self.comensalId();
		}
		data			= { json: ko.mapping.toJSON(data) };
		self.movimientos([]);
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					var movimientos = ko.mapping.fromJS(data.success.movimientos, opcionesPantalla.movimientos);
					self.movimientos(movimientos());

					var saldoActual = parseFloat(data.success.saldoActual);
					self.saldoActual(saldoActual);
					self.fecha(self.fechaMysql());
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajuste manual">
	self.ajusteModal	= $("#comensal-cc-ajuste-modal");
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
		var $saldo	= $(".cc-saldo-actual-valor");
		var saldo	= parseFloat(self.saldoParaMostrar());
		var total	= saldo + parseFloat(monto);
		self.saldoParaMostrar(total);
		var totalFormateado = "$ " + total.format(2, 3, '.', ',');
		$saldo.html(totalFormateado);
		self.setClaseColorSaldo($saldo, total);
	};
	
	/**
	 * Deduce el color del saldo en base a si es negativo, positivo o cero
	 * devolviendo rojo, verde o negro respectivamente
	 * 
	 * @param {int} numero
	 * @returns {String}
	 */
	self.setClaseColorSaldo = function($html, numero) {
		$html.removeClass('text-success text-danger text-body');
		if (numero > 0) {
			return $html.addClass("text-success");
		}
		if (numero < 0) {
			return $html.addClass("text-danger");
		}
		return $html.addClass("text-body");
	};

	self.guardarAjusteManual = function() {
		Alerta({
			title: 'Confirmar el ' + self.concepto() +' manual de $' + self.monto(),
			cancelButtonColor: '#a5a5a5',
			onConfirmCallback: function() {
				var url			= self.urls.guardarAjusteManual();
				var monto		= self.concepto() === 'egreso' ? Math.abs(self.monto()) * -1 : self.monto();
				var data		= {
					comensal	: self.comensalId(),
					monto		: monto,
					comentarios	: self.comentarios()
				};
				data			= { json: ko.mapping.toJSON(data) };
				var opciones	= self.getAjaxOpciones({
					url		: url,
					data	: data,
					success : function (data, textStatus, jqXHR) {
						if (data.success) {
							var ajuste = ko.mapping.fromJS(data.ajuste, opcionesPantalla.movimientos);
							self.movimientos.unshift(ajuste);
							self.toggleAjusteManual();
							self.sumarSaldo(monto);
							Notificacion('Ajuste manual exitoso', 'success');
						}
						if (data.error) {
							Notificacion(data.error, 'error');
						}
					}
				});
				$.ajax(opciones);
			}
		});
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cargar crédito">
	self.minimoTexto		  = "Monto mínimo $ " + self.minimo();
	self.cargarCreditoModal	  = $("#comensal-cargar-credito-modal");
	self.cargarCreditoCredito = ko.observable(self.minimo());
	self.cargarCredito = function() {
		var url	 = self.urls.cargarCredito();
		var data = {
			credito: self.cargarCreditoCredito(),
			medio  : MERCADO_PAGO
		};
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					Notificacion('Redireccionando al sistema de pagos', 'success');
					window.location.href = data.url;
				} else {
					var error = typeof data.error !== 'undefined' ? data.error : 'Ha ocurrido un error, vuelva a intentar.';
					Notificacion(error, 'error');
				}
			}
		});
		$.ajax(opciones);
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
	var $seccion = $('#mi-cuenta');
	ko.options.deferUpdates = true;
	koMiCuenta = new koPantalla(jsonMiCuenta, opcionesPantalla);
	ko.applyBindings(koMiCuenta, $seccion.get(0));
	koMiCuenta.inicializando = false;
	ko.tasks.runEarly();
	
	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});