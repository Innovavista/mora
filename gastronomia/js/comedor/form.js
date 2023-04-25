$(document).ready(function() {

	if ($("#form-comedor").length === 0) {
		return;
	}
	var $form				= $("#form-comedor");
	var $campoNombre		= $form.find(".form-comedor-nombre");
	var $campoNombreCorto	= $form.find(".form-comedor-nombre-corto");
	var $campoRestringir	= $form.find(".form-comedor-restringir");
	var $campoCategorias	= $form.find('[name="categoriasRestringidas"]');
	var $campoCategoriasEnv = $campoCategorias.closest('.form-group');
	var $radioRestringir	= $campoRestringir.filter('[value="restringir"]');
	var $radioNoRestringir	= $campoRestringir.filter('[value="no-restringir"]');
	var restringidas		= $form.find('[name="categoriasRestringidas[]"]:checked').length > 0;

	$campoNombre.on('change, focusout', function() {
		var valor = $(this).val();
		if (valor.length > 20) {
			valor = valor.substr(0, 20);
		}
		if ($campoNombreCorto.val() === '' || $campoNombreCorto.val() === null) {
			$campoNombreCorto.val(valor);
		}
	});

	if (restringidas) {
		$radioRestringir.prop('checked', true);
	} else {
		$campoCategoriasEnv.hide();
		$radioNoRestringir.prop('checked', true);
	}
	$campoRestringir.on('change', function() {
		//ui-sortable listaDoble-disponibles ps-container ps-theme-default
		var restringir = $campoRestringir.filter(':checked').val() === "restringir";
		if (restringir) {
			$radioRestringir.prop('checked', true);
			$campoCategoriasEnv.slideDown();
		} else {
			//Deseleccionamos todos los elementos
			var $seleccionadas = $campoCategoriasEnv.find('.listaDoble-seleccionadas > li');
			$seleccionadas.dblclick();
			$radioNoRestringir.prop('checked', true);
			$campoCategoriasEnv.slideUp();
		}
	});

});

