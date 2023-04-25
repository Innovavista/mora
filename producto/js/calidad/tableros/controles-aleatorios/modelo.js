//<editor-fold defaultstate="collapsed" desc="Configuración">
var configControl = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		var objeto = new koControl(options.data, opcionesPantalla);
		return objeto;
	},
	update: function (options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var configControlables = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		var objeto = new koControlable(options.data, opcionesPantalla);
		return objeto;
	},
	update: function (options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var configAtributos = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		var objeto = new koAtributo(options.data, opcionesPantalla);
		return objeto;
	},
	update: function (options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionesPantalla = {
	'controles': configControl,
	'controlables': configControlables,
	'atributos': configAtributos,
	'general': configAtributos
};
//</editor-fold>

function koControl(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.ajaxBorrarControl = ko.observable(false);
}

function koControlable(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koAtributo(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.color = ko.observable('');
	
	self.porcentaje = ko.computed(function() {
		if (parseInt(self.total()) === 0) {
			return "";
		}
		var porcentaje = parseInt(self.positivos()) * 100 / parseInt(self.total());
		return porcentaje.toFixed(0) + "%";
	});
}