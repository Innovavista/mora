$(document).ready(function() {

	var $formulario = $('#importarForm');
	var $archivo	= $('#archivo');
	var $boton		= $formulario.find('button[type="submit"]');
	$formulario.submit(function() {
		var $icono = $formulario.find('button[type="submit"] .fa');

		$boton.prop('disabled', true);
		$icono.toggleClass('fa-upload fa-spin fa-spinner');
		$boton.after('<div class="text-info">Este proceso puede durar varios minutos dependiendo de la cantidad de registros a importar.</div>')
	});

	$archivo.change(function () {
        var extension = ['xls', 'xlsx'];
        if ($.inArray($(this).val().split('.').pop().toLowerCase(), extension) == -1) {
			$archivo.parent().append('<ul class="help-block text-center text-danger"><li>Solo formato xls o xlsx</li></ul>');
			$boton.prop('disabled', true);
        } else {
			$archivo.parent().find('.help-block').remove();
			$boton.prop('disabled', false);
		}
    });

});