/**
 * Establece el orden de los inputs oculos del fielset contenedor
 * @param {Object} $contenedor
 * @returns {void}
 */
function establecerOrden($contenedor){
	var $inputs = $contenedor.find('input.orden-input');
	$inputs.each(function(idx) {
		$(this).val(idx);
	});
};

function inicializarOrdenable($contenedor) {
	$contenedor.sortable({
		items: '[data-orden="elemento"]',
		placeholder: "orden-placeholder",
		helper: 'original',
		create: function( event, ui ) {
			establecerOrden($(this));
		},
		sort: function(e, ui) {
			//Reemplazamos los "name" de cada input porque sino al arrastrar
			//puede generar conflicto con los radio button que se deseleccionan
			var html = $(ui.item).html();
			var final = html.replace(/name=\"/g, 'name="clon-').replace(/name=\'/g, "name='clon-");
			$(ui.placeholder).html(final);
			$(ui.placeholder).addClass($(ui.item).attr('class'));
		},
		stop: function( event, ui ) {
			establecerOrden($(this));
		}
	}).find('label').disableSelection();
}

$(document).ready(function() {
	inicializarOrdenable($('[data-orden="contenedor"]'));
});
