//<editor-fold defaultstate="collapsed" desc="Configuración">

var opcionesPantalla = {
	'atributos': {
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
	},
	'controlables': {
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
	},
	'evaluaciones': {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koEvaluacion(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'valores': {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koEvaluacionValor(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
};
//</editor-fold>

function koAtributo(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koControlable(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koEvaluacion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	if (json === undefined) {
		self.observaciones = ko.observable('');
		self.valores = ko.observableArray();
		self.itemControlable = {}; 
	}	
}

function koEvaluacionValor(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	if (json === undefined) {
		self.valor = ko.observable(null);
		self.atributo = {}; 
	}
	
}

