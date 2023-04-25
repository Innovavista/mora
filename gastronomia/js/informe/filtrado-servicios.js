$(document).ready(function() {

	var $comedores	= $("select.select-comedor");
	var $tipos		= $("select.select-tipo");
	var $servicios	= $("select.select-servicio");

	function filtrarServicios() {
		var opciones	= $servicios.find("option");
		var comedores	= $comedores.val();
		var tipos		= $tipos.val();
		if (comedores === null && tipos === null) {
			opciones.removeClass("hidden");
			$servicios.selectpicker("refresh");
			return;
		}
		opciones.addClass("hidden");
		for (var i = 0; opciones.length > i ; i++) {
			agregar				= true;
			var $opcion			= $(opciones[i]);
			var opcionComedor	= $opcion.attr("data-comedor");
			var opcionTipo		= $opcion.attr("data-tipo");
			if (comedores !== null) {
				agregar = agregar && comedores.indexOf(opcionComedor) > -1;
			}
			if (tipos !== null) {
				agregar = agregar && tipos.indexOf(opcionTipo) > -1;
			}
			if (agregar) {
				$opcion.removeClass("hidden");
			} else {
				$opcion.prop("selected", false);
			}
		}
		$servicios.selectpicker("refresh");
	}

	filtrarServicios();
	$comedores.change(function() {
		filtrarServicios();
	});
	$tipos.change(function() {
		filtrarServicios();
	});
	
});

