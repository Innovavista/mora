var opcionesPantalla = {
	'movimientos': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koMovimiento(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};

function koMovimiento(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.monto(Math.abs(self.monto()));
}
