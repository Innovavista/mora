$(document).ready(function() {

	var $informe = $(".informe-evolucion-costos");

	var $selectMercaderia	= $informe.find("select[name='mercaderia']");
	var $selectMateriaPrima	= $informe.find("select[name='materiaPrima']");

	$selectMercaderia.change(function() {
		var id = $(this).val();
		if (isNaN(id)) {
			return;
		}
		$selectMateriaPrima.val("");
		$selectMateriaPrima.selectpicker('refresh');
	});
	
	$selectMateriaPrima.change(function() {
		var id = $(this).val();
		if (isNaN(id)) {
			return;
		}
		$selectMercaderia.val("");
		$selectMercaderia.selectpicker('refresh');
	});

});