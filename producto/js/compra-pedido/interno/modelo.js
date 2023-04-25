//<editor-fold defaultstate="collapsed" desc="Configuración">
//Objeto caché con los depósitos
var cache = {
  depositos : []
};

var configDepositos = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		//En la creación del objeto verificamos si ya existe en caché con el id
		var id = options.data.id;
		if (cache.depositos[id] === undefined) {
			cache.depositos[id] = new koDeposito(options.data, opcionesPantalla);
		}
		return cache.depositos[id];
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
	'deposito': configDepositos,
	'depositos': configDepositos
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
	
	self.longitudObservacionesRestante = ko.pureComputed(function() {
		var cantidadActual  = self.descripcion().length;
		var longitudObservacionesRestante = LONGITUD_OBSERVACIONES - cantidadActual;
		return longitudObservacionesRestante;
	});
	
	self.comprable		  = {};
	self.comprable.nombre = ko.observable('');
	
	if (ko.isObservable(data.fecha) && !ko.isObservable(self.fechaEntrega)) {		
		self.fechaEntrega = ko.observable(data.fecha());
	}
	
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
		
		if (self.comprable.tipoComprable() === TIPO_PRESENTACION) {
			self.unidades(unidadesUnidad);
		}
		
		let comprable = self.comprable;
		let unidad	  = ko.isObservable(comprable.tipoUnidad) ? comprable.tipoUnidad() : comprable.tipoUnidad;
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
		
		var buscar = self.unidad();
		self.seleccionarUnidad(buscar, comprable);
	};
	
	/**
	 * Selecciona la unidad de la línea en caso que ya tenga una unidad cargada
	 * o no haya otras unidadas a seleccionar.
	 * 
	 * @param {Object} unidadABuscar
	 * @returns {void}
	 */
	self.seleccionarUnidad = function(unidadABuscar, comprable) {
		if (unidadABuscar === "") {
			unidadABuscar = comprable.unidad.unidadMedida();
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
		if (self.comprable.tipoComprable() !== TIPO_PRESENTACION) {
			return "Genérico";
		}
		return "Artículo";
	});
	
	/**
	 * Devuelve la cantidad de la línea redondeada por dos decimales, si la 
	 * cantidad es una cadena vacía devuelve cero. La cantidad de decimales a 
	 * redondear por defecto son 2 pero se puede modificar mediante el parámetro
	 * decimales.
	 * como 
	 * 
	 * @param {Number} decimales
	 * @returns {Number}
	 */
	self.getCantidadRedondeada = function(decimales = 2) {
		var valor = self.cantidad();
		if (valor === "") {
			return 0;
		}
		var cantidad = parseFloat(valor).toFixed(decimales);
		return parseFloat(cantidad);
	};
}

function koDeposito(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
}