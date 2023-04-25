$(document).ready(function() {

	if ($("#form-comedor-servicio").length > 0) {
		var $cupos			= $(".servicio-cupos");
		var $controlCupos	= $(".servicio-sin-control-cupos");

		if ($controlCupos.prop("checked")) {
			$cupos.prop("disabled", true);
		}

		$controlCupos.change(function() {
			var checked = $(this).prop('checked');
			$cupos.prop("disabled", checked);
			if (checked === true) {
				$cupos.val("");
				$cupos.prop("required", false);
				$cupos.attr("min", 0);
			}
			if (checked === false) {
				$cupos.prop("required", true);
				$cupos.attr("min", 1);
			}
			$cupos.valid();
		});
	}

});

