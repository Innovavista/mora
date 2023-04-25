var koPortada = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	if (!ko.isObservable(self.novedad)) {
		self.novedad = ko.observable(self.novedad);
	}

	self.verDetalle = function(noticia) {
		self.novedad(noticia);
	};

	self.cerrarDetalle = function() {
		self.novedad(null);
	};

}


$(document).ready(function () {
	var $seccion = $('#portada-novedades');
	ko.options.deferUpdates = true;
	koPortada = new koPantalla(jsonPortada, {});
	ko.applyBindings(koPortada, $seccion.get(0));
	koPortada.inicializando = false;
	ko.tasks.runEarly();

	$(window).on("load", function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

