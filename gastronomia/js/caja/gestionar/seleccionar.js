var koCajasSeleccionar = null;

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'cajas' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koCaja(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.seleccionarCaja = function(caja) {
		var url = caja.url();
		if (url !== '') {
			window.location.href = url;
			return;
		}
		self.filtrarOperaciones(caja);
		self.cajaGestionando(caja);
	};
}

$(document).ready(function () {
	var $seccion = $('#cajas-gestion');
	ko.options.deferUpdates = true;
	koCajasSeleccionar = new koPantalla(jsonSeleccionar, opcionesPantalla);
	ko.applyBindings(koCajasSeleccionar, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});
