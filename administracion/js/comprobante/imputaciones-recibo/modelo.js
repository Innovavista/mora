//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'recibo' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koRecibo(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'imputaciones' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koImputacion(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'comprobantes' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koComprobante(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
};
//</editor-fold>

function koRecibo(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koImputacion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.ajaxDesimputar = ko.observable(false);
}

function koComprobante(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.montoImputar = ko.observable(0.00);

}
