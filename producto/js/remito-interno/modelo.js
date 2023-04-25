//<editor-fold defaultstate="collapsed" desc="Configuración">
//Objeto caché con los depósitos, productos y presentaciones.
var cache = {
  depositos		 : [],
  productos		 : [],
  presentaciones : []
};

var configDeposito = {
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

var configProducto  = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		//En la creación del objeto verificamos si ya existe en caché con el id
		var id = options.data.id;
		if (cache.productos[id] === undefined) {
			cache.productos[id] = new koProducto(options.data, opcionesPantalla);
		}
		return cache.productos[id];
	}
};

var configPresentacion  = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		//En la creación del objeto verificamos si ya existe en caché con el id
		var id = options.data.id;
		if (cache.presentaciones[id] === undefined) {
			cache.presentaciones[id] = new koPresentacion(options.data, opcionesPantalla);
		}
		return cache.presentaciones[id];
	}
};

var observeRemito = [
	"fecha",
	"lineas",
	"origen",
	"destino"
];

var observeLinea = [
	"cantidad",
	"observaciones"
];

var opcionesPantalla = {
	'observe' : ["tipoItem"],
	'remito'  : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = observeRemito;
			var objeto = new koRemito(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'lineas' : {
		key: function (data) {
			var id = `${data.id}-${data.tipo}`;
			return ko.utils.unwrapObservable(id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = observeLinea;
			var objeto = new koLinea(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'deposito'		 : configDeposito,
	'destinos'		 : configDeposito,
	'origenes'		 : configDeposito,
	'producto'		 : configProducto,
	'productos'		 : configProducto,
	'presentacion'   : configPresentacion,
	'presentaciones' : configPresentacion
};
//</editor-fold>

function koRemito(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	/**
	 * Agrea una línea al remito interno actual con los datos del producto o 
	 * presentación.
	 * 
	 * @param {Object} despachable
	 * @returns {void}
	 */
	self.agregarLinea = function(despachable) {
		var id	  = despachable.id;
		var tipo  = despachable.tipo;
		var datos = {
			'id'			: `${id}-${tipo}`,
			'cantidad'	    : '',
			'despachable'   : despachable,
			'observaciones' : ''
		};
		
		opcionesPantalla["observe"] = observeLinea;
		var linea = new koLinea(datos, opcionesPantalla);
		self.lineas.push(linea);
	};
	
	/**
	 * Quita la línea de las líneas del remito interno.
	 * 
	 * @param {koLinea} linea
	 * @returns {void}
	 */
	self.quitarLinea = function(linea) {
		self.lineas.remove(linea);
	};
	
	/**
	 * Devuelve true si el remito interno posee los datos suficientes para ser
	 * guardado.
	 * 
	 * @param {Boolean} mostrar
	 * @returns {Boolean}
	 */
	self.comprobarValidez = function(mostrar) {
		var errores = [];
		
		var origen = self.origen();
		if (origen === undefined) {
			errores.push(`Debe seleccionar un depósito de origen para el
				remito interno.`);
		}
		
		var destino = self.destino();
		if (destino === undefined) {
			errores.push(`Debe seleccionar un depósito de destino para el
				remito interno.`);
		}
		
		if (origen !== undefined && destino !== undefined && origen.id === destino.id) {
			errores.push(`El depósito de origen no puede ser el mismo depósito
				que el de destino.`);
		}
		
		var fecha   = self.fecha();
		var momento = moment(fecha);		
		var valida  = momento.isValid();
		if (!valida) {
			errores.push("Debe seleccionar una fecha válida.");
		}
		
		var lineas = self.lineas();
		if (lineas.length === 0) {
			errores.push("Debe seleccionar al menos una presentación o producto.");
		}
		
		for (var i = 0; i < lineas.length; i++) {
			var linea		 = lineas[i];
			var erroresLinea = linea.getErroresLinea();
			if (erroresLinea.length > 0) {
				errores = [...errores, ...erroresLinea]
			}
		}
		
		if (mostrar) {
			errores.forEach(error => Notificacion(error, 'error'));
		}
		
		return errores.length === 0;
	};
	
	/**
	 * Devuelve los datos del remito interno para su persistencia.
	 * 
	 * @returns {Object}
	 */
	self.getDatos = function() {
		var id	   = self.id;
		var fecha  = self.fecha();
		var lineas = self.getDatosLineas();
		
		var origen   = self.origen();
		var idOrigen = origen && !isNaN(origen.id) ? parseInt(origen.id) : 0;
		
		var destino   = self.destino();
		var idDestino = destino && !isNaN(destino.id) ? parseInt(destino.id) : 0;
		
		return {
			id		: id,
			fecha	: fecha,
			lineas	: lineas,
			origen	: idOrigen,
			destino : idDestino
		};
	};
	
	/**
	 * Devuelve los datos de las líneas necesarios para la persistencia del
	 * remito interno.
	 * 
	 * @returns {Array}
	 */
	self.getDatosLineas = function() {
		var datos  = [];
		var lineas = self.lineas();
		for (var i = 0; i < lineas.length; i++) {
			var linea	  = lineas[i];
			var datoLinea = linea.getDatos();
			datos.push(datoLinea);
		}
		return datos;
	};
	
}

function koLinea(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	var despachable = self.despachable ? self.despachable : null;
	var tipo		= despachable ? despachable.tipo : '';
	
	/**
	 * Devuelve true si la línea se originó de un producto.
	 */
	self.tipoProducto = tipo === TIPO_PRODUCTO;
	
	/**
	 * Devuelve true si la línea se originó de una presentación.
	 */
	self.tipoPresentacion = tipo === TIPO_PRESENTACION;
	
	/**
	 * Devuelve el concepto por el cuál se creó la línea, puede ser un producto
	 * o una presentación.
	 */
	self.concepto = self.tipoProducto ? 'producto' : 'artículo';
	
	/**
	 * Devuelve true si la línea del remito interno posee los datos suficientes
	 * para ser guardada.
	 * 
	 * @param {Boolean} mostrar
	 * @returns {Boolean}
	 */
	self.getErroresLinea = function() {
		var errores  = [];
		var concepto = self.concepto;
		
		var despachable	  = self.despachable;
		var nombre		  = despachable.nombre;
		var cantidad	  = self.cantidad();
		var cantidadFloat = parseFloat(cantidad);
		if (isNaN(cantidadFloat) || cantidadFloat <= 0.00) {
			errores.push(`La cantidad del ${concepto} ${nombre} debe ser mayor a cero.`);
		}
		
		return errores;
	};
	
	/**
	 * Devuelve los datos de la línea del remito interno para su persistencia.
	 * 
	 * @returns {Object}
	 */
	self.getDatos = function() {
		var id			  = self.id;
		var item		  = self.despachable;
		var cantidad	  = self.cantidad();
		var observaciones = self.observaciones();
		return {
			id			: id,
			cantidad	: cantidad,
			descripcion : item.nombre,
			despachable : {
				id   : item.id,
				tipo : item.tipo
			},
			observaciones : observaciones
		};
	};
	
}

function koPresentacion(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	self.tipo   = TIPO_PRESENTACION;
	self.nombre = self.nombreLargo;
	self.codigo = self.codigoBarras;
	
}

function koProducto(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	self.tipo = TIPO_PRODUCTO;
	
}

function koDeposito(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
}