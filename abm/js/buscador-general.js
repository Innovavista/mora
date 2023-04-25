$(document).ready(function () {
	var $formulario = $("#additionalParams");
	var $tablas		= $("#buscador-general-tablas");
	var $cargador	= $("#loader");
	$(document).find(".zf-table-wrap .dataTables_empty").each(function (index) {
		$(this).closest(".zf-table-wrap").eq(0).html("No se encontraron resultados");
	});
	$(document).find(".zf-table-wrap:not(:has(tbody))").each(function (index) {
		$(this).closest(".zf-table-wrap").eq(0).html("No se encontraron resultados");
	});
	$formulario.unbind('submit');
	$formulario.submit(function(e) {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		if (!$formulario.valid()) {
			return false;
		}
		$formulario.ajaxSubmit({
			method: 'post',
			dataType: 'html',
			beforeSend: function() {
				$tablas.hide();
				$cargador.show();
			},
			success: function (data) {
				var $data = $(data);
				$data.find(".zf-table-wrap:not(:has(tbody))").each(function (index) {
					$(this).closest(".zf-table-wrap").eq(0).html("No se encontraron resultados");
				});
				$("[data-tablas-contenedor='tablas-contenedor']").html($data);
				prepararTablas(true);
				//Eliminamos de "params-wrap" el input de "zfTableQuickSearch"
				//porque pisa al que usamos arriba
				$data.find('input[name="zfTableQuickSearch"]').remove();
			},
			complete: function () {
				$tablas.show();
				$cargador.hide();
			}
		});
		return false;
	});

	$('.buscador-general-filtro-entidad-expandir').on('click', function (e) {
		var $boton = $(this);
		var $objetivo = $($boton.data('target'));
		if ($objetivo.is(':visible')) {
			$objetivo.slideUp();
			$boton.removeClass('fa-minus').addClass('fa-plus');
		} else {
			$objetivo.slideDown();
			$boton.removeClass('fa-plus').addClass('fa-minus');
		}
	});

});

