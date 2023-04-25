$(document).ready(function() {
	var $filtrables	= $("select.select-categoria-filtrar");
	var $categorias	= $("select.select-categorias");

	if (typeof $filtrables.attr('multiple') !== 'undefined' && $filtrables.attr('multiple') !== false) {
		$filtrables.find('option').first().prop('selected', true);
		$filtrables.selectpicker('refresh');
	}

	$categorias.change(function() {
		var id = parseInt($(this).val());
		filtrarElementos(id);
	});

	filtrarElementos(parseInt($categorias.val()));

	function filtrarElementos(id) {
		if ((isNaN(id) || id <= 0)) {
			$filtrables.find('option').show();
			$filtrables.selectpicker('refresh');
			return;
		}
		$filtrables.find('option').hide();
		$filtrables.find('option').each(function() {
			var $filtrable	 = $(this);
			var seleccionada = $filtrable.prop('selected');
			var ids			 = $filtrable.data("categoria");
			var esOpcTodos	 = $filtrable.data("todos");
			if (esOpcTodos === true) {
				$filtrable.show();
				return;
			}
			if (ids) {
				var splitted = ids.toString().split(';');
				for (var i = 0; i < splitted.length; i++) {
					if (id == splitted[i]) {
						$filtrable.show();
						continue;
					}
					if (seleccionada) {
						$filtrable.prop('selected', false);
					}
				}
			}
		});
		$filtrables.selectpicker('refresh');
	}
});

