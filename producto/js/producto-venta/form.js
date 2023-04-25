$(document).ready(function() {

	$(".container-fluid").on("click", ".producto-venta-popover", function() {
		var boton = $(this);
		boton.popover();
		boton.popover('show');
	});

});