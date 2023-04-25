$(document).ready(function() {
	//Levantamos el modal de visualización
	var $botones = $('.producible-visualizar');

	$botones.click(function(e) {
		e.preventDefault();
		var $boton = $(this);
		var $icono = $boton.find('i');
		const src  = $boton.attr('href');

		$.ajax({
			url: src,
			async: false,
			beforeSend : function(jqXHR, settings) {
				$icono.attr('class', 'fa fa-spin fa-spinner');
			},
			success : function (data, textStatus, jqXHR) {
				Swal.fire({
					title: '',
					html: data,
					customClass: 'semielaborado-modal',
					confirmButtonText: 'Cerrar',
				});
			},
			error : function(jqXHR, textStatus, errorThrown) {
				Swal.fire(
					'Error',
					'Ha ocurrido un error y no se ha podido recuperar el detalle',
					'error'
				  );
			},
			complete : function(jqXHR, textStatus) {
				$icono.attr('class', 'fa fa-search');
			}
		});


	});

});

