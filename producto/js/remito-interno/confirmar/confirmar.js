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
//</editor-fold>

function koPantalla(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	self.ajax = ko.observable(false);

	/**
	 * Limpia la firma digital realizada.
	 *
	 * @returns {void}
	 */
	self.limpiarFirma = function() {
		self.remito.limpiarFirma();
	};

	/**
	 * Devuelve los datos de la confirmación del remito.
	 *
	 * @returns {Object}
	 */
	self.getDatos = function() {
		const remito  = self.remito;
		const fecha   = remito.fechaConfirmacion();
        const lineas  = [];
		const firma   = remito.firma;
		let   dataURL = "";
		if (!firma.isEmpty()) {
			dataURL = firma.toDataURL("image/jpeg");
		}

        for (var i = 0; i < remito.lineas.length; i++) {
            const linea  = remito.lineas[i];
            const lineaD = linea.data();
            lineas.push(lineaD);
        }

		return {
			firma			  : dataURL,
            lineas            : lineas,
			fechaConfirmacion : fecha
		};
	};

	/**
	 * Abre el modal para confirmar la recepción del remito interno.
	 *
	 * @returns {void}
	 */
	self.confirmarPreguntar = function() {
		var remito = self.remito;
		var valido = remito.comprobarValidez(true);
		if (!valido) {
			return;
		}

		var nombre = remito.nombre;
		Alerta({
			type: 'question',
			title: `¿Está seguro de confirmar el ${nombre}?`,
			confirmButtonColor: '#d33',
			confirmButtonText: 'Confirmar',
			allowOutsideClick: false,
			onConfirmCallback: function() {
				self.confirmar();
			}
		});
	};

	/**
	 * Confirma el remito interno y lo guarda en estado recibido.
	 *
	 * @returns {void}
	 */
	self.confirmar = function() {
		var valido = self.remito.comprobarValidez(true);
		if (!valido) {
			return;
		}

		var url	   = self.urls.confirmar;
		var remito = self.getDatos();
		var data   = {
			remito : remito
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar el remito interno, vuelva a intentar.', 'error');
					return;
				}

				Notificacion('El remito interno se ha confirmado con éxito.', 'success');
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
		}
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
	var $seccion = $('#remito-interno-confirmar');
	ko.options.deferUpdates = true;
	koRemitoInterno = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koRemitoInterno, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});