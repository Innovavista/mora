//<editor-fold defaultstate="collapsed" desc="Configuración">
var factura = {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koFactura(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
};
var opcionesPantalla = {
	'factura' : factura,
	'facturas' : factura
};
//</editor-fold>

function koFactura(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	let condicion		= ko.isObservable(self.condicion) ? self.condicion() : "";
	self.condicionTexto = "";
	switch (condicion) {
		case CONDICION_CONTADO:
			self.condicionTexto = "Contado";
			break;

		case CONDICION_CUENTA_CORRIENTE:
			self.condicionTexto = "Cuenta corriente";
			break;
	}
	
	let anulado		= ko.isObservable(self.anulado) ? self.anulado() : "";
	self.estadoHtml = "Activo";
	if (anulado) {
		self.estadoHtml = '<span class="text-danger">Anulado</span>';
	}

}