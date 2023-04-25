//<editor-fold defaultstate="collapsed" desc="Configuración">
var configDeposito = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		var objeto = new koDeposito(options.data, opcionesPantalla);
		return objeto;
	},
	update: function (options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionesPantalla = {
	'pedido': {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koPedido(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'lineas': {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koLinea(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'deposito'  : configDeposito,
	'depositos' : configDeposito
};
//</editor-fold>

function koPedido(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

}

function koLinea(data) {
	var self = this;
	
	self.unidad			  = ko.observable('');
	self.cantidad		  = ko.observable(1);
	self.unidades		  = ko.observableArray();
	self.descripcion	  = ko.observable('');
	
	self.deshabilitar = ko.observable(false);
	
	self.cantidadRestante = ko.pureComputed(function() {
		var cantidadActual  = self.descripcion().length;
		var cantidadRestate = LONGITUD_OBSERVACIONES - cantidadActual;
		return cantidadRestate;
	});
	
	self.comprable		  = {};
	self.comprable.nombre = ko.observable('');
	
	if (!ko.isObservable(self.fechaEntrega)) {
		self.fechaEntrega = ko.observable(moment().format('YYYY-MM-DD'));
	}
	
	/**
	 * Convierte la cantidad a un valor entero.
	 */
	self.cantidad.subscribe(function (valor) {
		let cantidad = parseInt(valor);
		self.cantidad(cantidad);
	});
	
	self.seleccionarUnidad = function() {
		let unidad = self.buscarUnidad();
		self.unidad(unidad);
	};
	
	self.buscarUnidad = function() {
		var unidad  = self.unidad();
		var buscada = ko.utils.arrayFirst(self.unidades(), function(item) {
			return item === unidad;
		});
		return buscada;
	};
	
	/**
	 * Agregar las opciones al select de unidades de la línea.
	 * 
	 * @param {Object} unidades
	 * @returns {void}
	 */
	self.agregarOpcionesUnidades = function(unidades) {
		if (unidades === undefined) {
			unidades = koPedidoAlta.unidades;
		}
		let unidadesMasa	 = unidades.masa();
		let unidadesUnidad	 = unidades.cantidad();
		let unidadesVolumen  = unidades.volumen();
		let unidadesLongitud = unidades.longitud();
		
		if (self.comprable.tipoGenerico() === TIPO_PRESENTACION) {
			self.unidades(unidadesUnidad);
		}
		
		let comprable = self.comprable;
		let unidad	  = ko.isObservable(comprable.unidadSimple) ? comprable.unidadSimple() : comprable.unidadSimple;
		switch (unidad) {
			case UNIDAD_MASA:
				self.unidades(unidadesMasa);
				break;
			case UNIDAD_VOLUMEN:
				self.unidades(unidadesVolumen);
				break;
			case UNIDAD_CANTIDAD:
				self.unidades(unidadesUnidad);
												
				let unidad = unidades.cantidad()[0].clave();
				self.seleccionarUnidad(unidad);
				self.deshabilitar(true);
				break;
			case UNIDAD_LONGITUD:
				self.unidades(unidadesLongitud);
				break;
			default:
				break;
		}
		
		self.seleccionarUnidad();
	};
	
	/**
	 * Selecciona la unidad de la línea en caso que ya tenga una unidad cargada
	 * o no haya otras unidadas a seleccionar.
	 * 
	 * @param {Object} unidadABuscar
	 * @returns {void}
	 */
	self.seleccionarUnidad = function(unidadABuscar) {
		if (unidadABuscar === undefined) {
			unidadABuscar = self.unidad();
		}
		if (ko.isObservable(unidadABuscar.unidadMedida)) {
			unidadABuscar = unidadABuscar.unidadMedida();
		}
		var unidad = ko.utils.arrayFirst(self.unidades(), function(unidad) {
			let buscar = unidad.clave();
			return buscar === unidadABuscar;
		});

		if (unidad !== undefined) {
			self.unidad = ko.observable(unidad);
		}
	};
	
	self.textoComprable = ko.pureComputed(function() {
		if (self.comprable.tipoGenerico() !== TIPO_PRESENTACION) {
			return "Genérico";
		}
		return "Artículo";
	});
}


function koDeposito(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

}