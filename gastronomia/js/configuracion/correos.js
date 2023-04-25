var koCorreos = null;

function koPantalla() {
	var self = this;

	self.form = $("#configuracion-correos");

	self.guardar = function() {
		var opciones = self.getAjaxOpciones({
			url		: URL_GUARDAR,
			success : function (data, textStatus, jqXHR) {
				if (!data.success) {
					Notificacion('Ha ocurrido un error', 'error');
				}
				Notificacion('Configuración guardada exitosamente', 'success');
				window.location.href = URL_INICIO;
			}
		});
		self.form.ajaxSubmit(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax			= ko.observable(false);
	self.ajaxOpciones	= {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
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
	var $seccion = $('#configuracion-comensal-correos');
	ko.options.deferUpdates = true;
	koCorreos = new koPantalla();
	ko.applyBindings(koCorreos, $seccion.get(0));
	koCorreos.inicializando = false;
	ko.tasks.runEarly();
});

