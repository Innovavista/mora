var koVisualizarPP = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.volverPantalla = function() {
		window.location.href = self.volverA();
	};
}

$(document).ready(function () {
	var $seccion = $('#visualizar-factura-compra');
	ko.options.deferUpdates = true;
	koVisualizarPP = new koPantalla(jsonVisualizarPP, opcionesPantalla);
	ko.applyBindings(koVisualizarPP, $seccion.get(0));
	koVisualizarPP.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});
