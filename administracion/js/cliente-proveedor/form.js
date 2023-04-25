$(document).ready(function() {

	var $form			  = $(".abm-formulario-cliente-proveedor-cliente, .abm-formulario-cliente-proveedor-proveedor");
	var $inputNombre	  = $form.find("input[name='nombre']");
	var $inputNombreCorto = $form.find("input[name='nombreCorto']");
	
	$inputNombre.focusout(function() {
		let truncar = 15;
		var nombre  = $inputNombre.val();
		let nombreCorto = nombre.slice(0, truncar);
		$inputNombreCorto.val(nombreCorto);
	});

});