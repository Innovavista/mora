$(document).ready(function() {

	var $form			   = $(".abm-formulario-factura");
	var $condicion		   = $form.find("select[name='condicion']");
	if ($condicion.length === 0) {
		$condicion = $form.find("input[name='condicion']");
	}
	var $selectMedioDePago = $form.find("select[name='medioDePago']");
	var $formMedioDePago   = $selectMedioDePago.closest('.form-group');
	
	if ($condicion.val() === 'cuenta-corriente') {
		ocultarVaciarMedioDePago();
	}

	$condicion.change(function() {
		var condicion = $(this).val();
		if (!condicion) {
			return;
		}
		if (condicion === 'cuenta-corriente') {
			ocultarVaciarMedioDePago();
		}
		if (condicion === 'contado') {
			$formMedioDePago.show();
		}
	});
	
	function ocultarVaciarMedioDePago() {
		$selectMedioDePago.val('');
		$formMedioDePago.find(".filter-option-inner-inner").remove();
		$formMedioDePago.find(".filter-option-inner").append('<div class="filter-option-inner-inner">--- Seleccionar ---</div>');
		$formMedioDePago.hide();
	}

});