(function() {
	
	$(document).ready(function() {
		var $componentes  = $('[data-c="star-rating"]');
		if ($componentes.length === 0) {
			return;
		}
		
		$componentes.each(function (_, e) {
			var $componente = $(e);
			var opciones = $componente.data('c-options');
			$componente.rating(opciones);
		});
		
	});
	
})()



