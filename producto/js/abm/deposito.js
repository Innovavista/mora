$(document).ready(function() {

	var $form			= $("#form-deposito");
	var $comedor		= $form.find(".deposito-comedor");

	var $inputLocalidad	= $form.find("select[name='localidad']");
	var $inputCalle		= $form.find("input[name='direccionCalle']");
	var $inputNumero	= $form.find("input[name='direccionNumero']");
	var $inputLatitud	= $form.find("input[name='latitud']");
	var $inputLongitud	= $form.find("input[name='longitud']");
	var $botonEnviar	= $form.find("button[name='botones[botonEnviar]']");

	$comedor.change(function() {
		var id = $(this).val();
		if (!id) {
			return;
		}
		var opciones = getAjaxOpciones({
			url		: '/comedor/ubicacionJson/' + id,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					var localidad		= data.localidad.id;
					var direccion		= data.direccionCalle;
					var numero			= data.direccionNumero;
					var latitud			= data.latitud;
					var longitud		= data.longitud;

					$inputLocalidad.val(localidad);
					$inputLocalidad.selectpicker('refresh');
					$inputCalle.val(direccion);
					$inputNumero.val(numero);
					$inputLatitud.val(latitud);
					$inputLongitud.val(longitud);
				}
			}
		});
		$.ajax(opciones);
	});

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	var ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			$inputLocalidad.prop('disabled', true);
			$inputLocalidad.selectpicker('refresh');
			$inputCalle.prop('disabled', true);
			$inputNumero.prop('disabled', true);
			$inputLatitud.prop('disabled', true);
			$inputLongitud.prop('disabled', true);
			$botonEnviar.prop('disabled', true);
			$comedor.append("<i class='select-ajax-icono zmdi zmdi-spinner zmdi-hc-spin'></i>");
			$comedor.prop('disabled', true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {

		},
		complete   : function(jqXHR, settings) {
			$inputLocalidad.prop('disabled', false);
			$inputLocalidad.selectpicker('refresh');
			$inputCalle.prop('disabled', false);
			$inputNumero.prop('disabled', false);
			$inputLatitud.prop('disabled', false);
			$inputLongitud.prop('disabled', false);
			$botonEnviar.prop('disabled', false);
			$comedor.prop('disabled', false);
			$comedor.find(".select-ajax-icono").remove();
		}
	};
	var getAjaxOpciones = function(opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, ajaxOpciones);
	};
	//</editor-fold>

});