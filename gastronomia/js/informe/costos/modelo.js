var opcionesPantalla = {
	'lineas': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koLinea(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};


function koLinea(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.textoReferencia = ko.computed(function() {
		let referencia = self.presentacion.deReferencia();
		return referencia ? "Si" : "No";
	});
	
	self.unidad = ko.computed(function() {
		let unidad		 = "unidad";
		let presentacion = self.presentacion;
		let mercaderia   = ko.isObservable(presentacion.mercaderia) ? presentacion.mercaderia() : presentacion.mercaderia;
		let materiaPrima = ko.isObservable(presentacion.materiaPrima) ? presentacion.materiaPrima() : presentacion.materiaPrima;
		if (mercaderia) {
			unidad = mercaderia.unidad.getUnidad();
		}
		if (materiaPrima) {
			unidad = materiaPrima.unidad.getUnidad();
		}
		return unidad;
	});
}
