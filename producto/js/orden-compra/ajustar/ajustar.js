//<editor-fold defaultstate="collapsed" desc="Extensiones">
ko.bindingHandlers['tooltipster'] = {
	init: function (element, valueAccessor) {
		$(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay: 200,
			side: 'top',
			contentCloning: true
		});
	}
};

var formateadorNumero = new Intl.NumberFormat(undefined, {
	style: 'decimal'
});

var formatearNumero = function(valor) {
	var salida = formateadorNumero.format(valor);
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

ko.bindingHandlers.cantidad = {
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
	var valor = ko.utils.unwrapObservable(valueAccessor());
	var tipo  = typeof valor;
	if ((tipo !== 'number' && isNaN(valor))
		|| valor === null
	) {
	  $(element).html('');
		return;
	}
	var final = formatearNumero(valor);
	$(element).html(final);
  }
};
//</editor-fold>

function koPantalla(js, opciones) {
	var self = this;	
	ko.mapping.fromJS(js, opciones, this);
	
	self.ajax = ko.observable(false);
	
	self.titleListar  = "Volver al listado de órdenes de compra";
	self.titleGuardar = `Guardar ajuste de ${self.orden.nombre}`;
	
	/**
	 * Devuelve true si el ajuste de orden de compra posee los datos suficientes
	 * para ser guardado.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarAjusteValido = function(mostrar) {
		let ajuste = self.ajuste;
		let valido = ajuste.comprobarValidez(mostrar);
		return valido;
	};
	
	/**
	 * Realiza el guardado del ajuste manual de la orden de compra.
	 * 
	 * @returns {bool}
	 */
	self.guardar = function() {
		var valido = self.comprobarAjusteValido(true);
		if (!valido) {
			return false;
		}
		
		var url	 = self.urls.guardarAjuste;
		var data = {
			ajuste : self.ajuste.getDatos()
		};

		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar el ajuste de la orden de compra, vuelva a intentar.', 'error');
					return;
				}

				Notificacion('El ajuste de la orden de compra ha sido guardado con éxito', 'success');
				window.location.href = self.urls.listar;
			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);		
	};
		
	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajaxOpciones = {
		method: 'POST',
		error	   : function(jqXHR, textStatus, errorThrown) {
			var mensaje = "Ha ocurrido un error, vuelva a intentar";
			if (typeof jqXHR.responseJSON !== "undefined") {
				var data = jqXHR.responseJSON;
				if (Array.isArray(data.resultado.errores)) {
					mensaje = data.resultado.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
					mensaje += data.resultado.errores.join("<br/>");
				} else if (typeof data.error !== "undefined") {
					mensaje = "Ha ocurrido el siguiente error: " + data.error;
				}
			}
			Notificacion(mensaje, 'error');
		},
	};
	self.getAjaxOpciones = function (opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#orden-compra-ajustar');
	ko.options.deferUpdates = true;
	koOrdenCompra = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koOrdenCompra, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});