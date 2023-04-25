$(document).ready(function() {

	var $selects	= $("select.select-comedor, select.select-tipo, select.select-servicio");
	var $btnTodos	= $(".bs-select-all");
	var $comedores	= $("select.select-comedor");
	var $tipos		= $("select.select-tipo");
	var $servicios	= $("select.select-servicio");

	//<editor-fold defaultstate="collapsed" desc="Mensaje vacío">
	function selectMensajeVacio() {
		$selects.each(function() {
			var $select		= $(this);
			var $dropdown	= $select.parent();
			if ($select.val() === null) {
				if ($dropdown.find(".mensaje-vacio").length === 0) {
					$dropdown.find(".filter-option").append("<span class='mensaje-vacio'>--- Seleccionar ---</span>");
				}
			} else {
				$dropdown.find(".mensaje-vacio").remove();
			}
		});
	}
	selectMensajeVacio();
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Eventos select">
	$comedores.change(function() {
		selectMensajeVacio();
	});

	$tipos.change(function() {
		selectMensajeVacio();
	});

	$servicios.change(function() {
		selectMensajeVacio();
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Seleccionar todos">
	$btnTodos.click(function(e) {
		e.preventDefault();
		e.stopPropagation();
		$btn = $(this);
		$select = $btn.closest(".bootstrap-select").find("select");
		$select.find("option").each(function() {
			var $opcion = $(this);
			if ($opcion.hasClass('hidden')) {
				$opcion.prop("selected", false);
			} else {
				$opcion.prop("selected", true);
			}
		});
		$select.selectpicker('refresh');
		$select.trigger("change");
	});
	//</editor-fold>

});
