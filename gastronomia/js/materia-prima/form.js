$(document).ready(function() {

	if ($(".abm-formulario-materia-prima").length > 0) {
		var $form				 = $(".abm-formulario-materia-prima");
		var $baseNutricional	 = $form.find(".fieldset-embebido-base");
		var $datosNutricionales  = $form.find(".fieldset-embebido-nutricional");
		var $camposNutricionales = $datosNutricionales.find('.form-group');
		var $selectUnidad		 = $datosNutricionales.find("select[name='unidadMedidaNutricionales[unidadMedida]']");
		var $campocheck			 = $form.find(".mp-sin-info-nutricional");
		var $cantidadBase	     = $datosNutricionales.find("input[name='nutricionalesCada']");
		
		chequearEstadoCampocheck($campocheck);

		$campocheck.change(function() {
			chequearEstadoCampocheck($(this));
		});

		function chequearEstadoCampocheck(campo) {
			let checked = campo.prop('checked');
			if (checked) {
				deshabilitarCampos();
			} else {
				habilitarCampos();
			}
		}

		function deshabilitarCampos() {
			$selectUnidad.removeProp('required');
			$selectUnidad.removeAttr('required');
			$cantidadBase.removeProp('required');
			$cantidadBase.removeAttr('required');
			$baseNutricional.hide();
			$camposNutricionales.hide();
		}

		function habilitarCampos() {
			$selectUnidad.prop('required', true);
			$selectUnidad.attr('required', 'required');
			$cantidadBase.prop('required', true);
			$cantidadBase.attr('required', 'required');
			$baseNutricional.show();
			$camposNutricionales.show();
		}
	}

});

