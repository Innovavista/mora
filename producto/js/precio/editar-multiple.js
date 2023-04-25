//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'precios': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koPrecio(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'categorias': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koPantalla(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

var koPrecioEditar = null;

function koPantallaMultiple(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
};

$(document).ready(function () {
	var $seccion = $('#precio-editar-multiple');
	ko.options.deferUpdates = true;
	koPrecioEditar = new koPantallaMultiple(jsonPrecioEditar, opcionesPantalla);
	ko.applyBindings(koPrecioEditar, $seccion.get(0));
	koPrecioEditar.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});


