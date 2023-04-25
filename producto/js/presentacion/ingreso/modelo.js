//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'presentaciones' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koPresentacion(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'depositos' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koDeposito(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'proveedores' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koProveedor(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
};
//</editor-fold>

function koPresentacion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koDeposito(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koProveedor(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koLinea(data) {
	var self	  = this;

	self.presentacion	= data.presentacion;
	self.nombre			= ko.observable("");
	if ((ko.isObservable(self.presentacion) && self.presentacion() !== null)
		||
		(!ko.isObservable(self.presentacion) && self.presentacion !== null))
	{
		self.nombre = ko.isObservable(self.presentacion) ? self.presentacion().nombreLargo() : self.presentacion.nombreLargo;
	}
	self.precio			= data.precio;
	self.cantidad		= data.cantidad ? ko.observable(data.cantidad) : ko.observable(null);
	self.focus			= data.focus;
	self.focusNombre	= data.focusNombre;

	self.handleCampoNombreEditable = ko.computed(function() {
		var presentacion = ko.isObservable(self.presentacion) ? self.presentacion() : self.presentacion;
		return (presentacion === null);
	});

	self.camposEditables = {
		nombre: self.handleCampoNombreEditable(),
		precio: true,
		cantidad: true
	};

	self.subtotal		= ko.computed(function() {
		var precio		= ko.isObservable(self.precio) ? parseFloat(self.precio()) : parseFloat(self.precio);
		var cantidad	= ko.isObservable(self.cantidad) ? parseFloat(self.cantidad()) : parseFloat(self.cantidad);
		if (Number.isNaN(cantidad)) {
			cantidad = 0;
		}
		if (Number.isNaN(precio)) {
			precio = 0;
		}
		var salida = precio * cantidad;
		return Math.round(salida * 100) / 100;
	});
}
