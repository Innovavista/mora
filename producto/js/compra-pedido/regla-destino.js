$(document).ready(function() {

	var $form	 = $(".abm-formulario-regla-deposito-destino");
	var $selects = $form.find("[data-excluyente='regla-excluir-otros']" );

	$selects.change(function() {
		var id = $(this).val();
		if (isNaN(id)) {
			return;
		}
		var actual = $(this).attr('name');
		$selects.each(function(valor, select) {
			var $elemento = $(select);
			var nombre    = $elemento.attr('name');
			if (nombre !== actual) {
				$elemento.val("");
				$elemento.selectpicker('refresh');
			}
		});
	});

});