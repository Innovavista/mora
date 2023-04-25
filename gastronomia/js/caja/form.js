$(document).ready(function() {

	if ($(".abm-formulario-caja").length > 0) {
		var $form		= $(".abm-formulario-caja");
		var $central	= $form.find(".campo-central");
		var $medioPago	= $form.find('[name="medioPago"]');
		var $comedor	= $form.find(".campo-comedor");
		var $label		= $comedor.parents().eq(1).find("label");

		chequearEstadoCampocheck($central, $medioPago);

		$central.change(function() {
			chequearEstadoCampocheck($central, $medioPago);
		});
		$medioPago.change(function() {
			chequearEstadoCampocheck($central, $medioPago);
		});

		function chequearEstadoCampocheck(campo, campo2) {
			if (campo.prop('checked') || campo2.val() !== '') {
				$comedor.prop('required', false);
				$label.text("Comedor");
			} else {
				$comedor.prop('required', true);
				$label.text("Comedor *");
			}
		}
	}

});

