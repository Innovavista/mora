//<editor-fold defaultstate="collapsed" desc="DataTable - Ordenamiento fecha">
function formatearFecha(string) {
	return moment(string, "DD/MM/YYYY");
}
$.fn.dataTableExt.oSort["date-custom-desc"] = function (x, y) {
	return formatearFecha(x) < formatearFecha(y) ? 1 : -1;
};
$.fn.dataTableExt.oSort["date-custom-asc"] = function (x, y) {
    return formatearFecha(x) > formatearFecha(y) ? 1 : -1;
};
//</editor-fold>

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

	//<editor-fold defaultstate="collapsed" desc="Carrusel">
	var $carrusel = $(".reservas-servicio-carrusel");
	if ($carrusel.length > 0) {
		$carrusel.owlCarousel({
			items: 1,
			center: true,
			dots: false,
			nav: true,
			navText: ["<i class='zmdi zmdi-chevron-left'></i>","<i class='zmdi zmdi-chevron-right'></i>"]
		});
		$carrusel.on('changed.owl.carousel', function(property) {
			var current = property.item.index;;
			console.log(current, "current");
			$carrusel.trigger('to.owl.carousel',current);
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="DataTable">
	var $tabla = $(".reservas-servicio-tabla");
	if ($tabla.length > 0) {
		$tabla.DataTable({
			paging: false,
			searching: false,
			select: false,
			info: false,
			columnDefs: [
				{ type: "date-custom", orderDataType: "date-custom", sortable: true, targets: [0] }
			]
		});
	}
	//</editor-fold>

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});

});
