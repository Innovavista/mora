//<editor-fold defaultstate="collapsed" desc="Configuración">
//Objeto caché con los depósitos
var cache = {
  depositos : []
};

var configPedido = {
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
};

var configDeposito = {
  key: function(data) {
    return ko.utils.unwrapObservable(data.id);
  },
  create : function(options) {
    //En la creación del objeto verificamos si ya existe en caché con el id
    var id = options.data.id;
    if (cache.depositos[id] === undefined) {
		cache.depositos[id] = new koDeposito(options.data, opcionesPantalla);
    }
    return cache.depositos[id];
  }
};

var opcionesPantalla = {
	'pedido'    : configPedido,
	'pedidos'   : configPedido,
	'depositos' : configDeposito,
	'deposito'  : configDeposito,
	'agrupamientos' : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koAgrupamiento(options.data, opcionesPantalla);
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
	}
};
//</editor-fold>

function koPedido(js, opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}

	self.fecha		  = ko.observable(js.fecha);
	self.estado		  = ko.observable(ESTADO_BORRADOR);
	self.seleccionado = ko.observable(false);

	self.comprobarTipoInterno	  = self.tipo === TIPO_INTERNO;
	self.comprobarTipoConsolidado = self.tipo === TIPO_CONSOLIDADO;

	if (self.comprobarTipoInterno) {
		self.fecha.fecha = js.fecha.fecha;
	}

	var consolidado = self.consolidado;
	if (self.comprobarTipoInterno && consolidado && !isNaN(consolidado.id) && parseInt(consolidado.id) > 0) {
		self.seleccionado(true);
	}

	self.seleccionar = function(pedido, evento) {
		var link	   = $(evento.target).closest("a");
		var esLink     = link.length > 0;
		var esCheckbox = evento.target.type === "checkbox";
		if (esCheckbox || !esLink) {
			koPedidoAlta.modificado(true);
			koPedidoAlta.deshabilitarTabs(true);
		}
		if (esLink || esCheckbox) {
			return true;
		}
		var seleccionado = pedido.seleccionado();
		pedido.seleccionado(!seleccionado);
	};

}

function koAgrupamiento(js , opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}

	var idComprable   = self.comprable.id;
	var tipoComprable = self.comprable.tipoComprable;
	self.id = `${tipoComprable}-${idComprable}`;

	/**
	 * Indica si las líneas del agrupamiento van a ser elegidas para la nota de
	 * pedido consolidada.
	 */
	self.elegible = ko.observable(js.elegible);

	self.clase = ko.computed(function() {
		var total	 = self.total();
		var valido   = total > 0.00;
		var elegible = self.elegible();

		self.elegible(valido);

		return elegible && valido ? "" : "fondo-gris";
	});

	/**
	 * Muestra el total del agrupamiento conviertiendo el total de cada línea
	 * a la unidad común.
	 */
	self.total = ko.pureComputed(function() {
		var total = self.calcularTotal();
		return total;
	});

	/**
	 * Devuelve el total del agrupamiento conviertiendo el total de cada línea
	 * a la unidad común.
	 *
	 * @returns {Number}
	 */
	self.calcularTotal = function() {
		var total  = 0.00;
		var lineas = self.lineas;
		var unidad = self.unidad;
		for (var i = 0; i < lineas.length; i++) {
			var linea       = lineas[i];
			var cantidad    = parseFloat(linea.cantidad());
			var convertida  = cantidad;
			var unidadLinea = linea.unidadClave;
			if (unidad !== linea.unidad) {
				convertida = self.convertirCantidad(unidadLinea, cantidad);
			}

			if (!isNaN(convertida)) {
				total += convertida;
			}
		}

		// Primero redondeo el total a dos decimales y después lo convierto a
		// float
		var totalRedondeado = parseFloat(total).toFixed(2);
		return parseFloat(totalRedondeado);
	};

	/**
	 * Convierte una cantidad en una determinada unidad a la cantidad de la
	 * unidad común del agrupamiento.
	 *
	 * @param {string} unidad
	 * @param {float} cantidad
	 * @returns {Number}
	 */
	self.convertirCantidad = function(unidad, cantidad) {
		var ratio  = self.ratios.find(ratio => ratio.unidad() === unidad);
		var factor = ratio.factor();
		return factor * cantidad;
	};

	/**
	 * Cambia la variable booleana elegible utilizada en el checkbox de cada
	 * agrupamiento. Si es true inicializa la cantidad de las líneas en cero,
	 * sino la cantidad a elegir pasa a completarse con la cantidad inicial
	 * de cada línea.
	 *
	 * @returns {void}
	 */
	self.cambiarElegir = function(accionVisualizar) {
		if (accionVisualizar) {
			return;
		}
		var elegible = !self.elegible();
		var lineas = self.lineas;
		for (var i = 0; i < lineas.length; i++) {
			var linea		  = lineas[i];
			var cantidadFloat = parseFloat(linea.cantidadInterna);

			var cantidad = elegible ? cantidadFloat : 0;
			linea.cantidad(cantidad);
			linea.elegible(elegible);
		}
		self.elegible(elegible);
	};

	/**
	 * Devuelve los datos mínimos de un agrupamiento para poder realizar el
	 * guardado del pedido consolidado.
	 *
	 * @returns {Object}
	 */
	self.getDatosPost = function() {
		var total     = parseFloat(self.total());
		var lineas    = self.lineas;
		var items	  = self.getDatosLineasPost(lineas);
		var elegible  = self.elegible();
		var comprable = self.comprable;
		var dato = {
			total	      : total,
			lineas        : items,
			elegible	  : elegible,
			comprable	  : comprable
		};
		return dato;
	};

	/**
	 * Devuelve los datos mínimos de las líneas de un agrupamiento para poder
	 * guardar el pedido consolidado.
	 *
	 * @param {Array} lineas
	 * @returns {Array}
	 */
	self.getDatosLineasPost = function(lineas) {
		var datos = [];
		for (var i = 0; i < lineas.length; i++) {
			var linea = lineas[i];

			var dato = linea.getDatosPost();
			datos.push(dato);
		}
		return datos;
	};

	/**
	 * Define todas las líneas como no elegibles para que se deshabiliten sus
	 * inputs.
	 *
	 * @returns {undefined}
	 */
	self.deshabilitarLineas = function() {
		var lineas = self.lineas;
		lineas.forEach(linea => {
			linea.elegible(false);
		});
	};
}

function koLinea(js, opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}

	self.css = self.fechaEntrega !== self.fechaEntregaOriginal ? 'border border-danger': '';

	if (self.deposito !== undefined && !isNaN(self.deposito.id)) {
		self.destino = ko.mapping.fromJS(self.deposito, opciones.deposito);;
	}

	var cantidad  = parseFloat(self.cantidad);
	self.cantidad = ko.observable(cantidad);

	self.cantidadInvalida = ko.pureComputed(function() {
		var cantidad = self.cantidad();
		return isNaN(cantidad) || cantidad === "";
	});

	self.elegible = ko.observable(true);

	/**
	 * Devuelve los datos mínimos de la línea para poder guardar el pedido
	 * consolidado.
	 *
	 * @returns {Object}
	 */
	self.getDatosPost = function () {
		var id		 = self.id;
		var fecha	 = self.fechaEntrega;
		var cantidad = self.cantidad();

		var destino = {};
		if (!isNaN(cantidad) && cantidad !== "" && cantidad > 0.00) {
			destino.id	   = self.destino.id;
			destino.nombre = self.destino.id;
		}
		var dato = {
			id			 : id,
			origen		 : self.deposito.nombre,
			destino		 : destino,
			cantidad	 : cantidad,
			fechaEntrega : fecha
		};
		return dato;
	};

	self.deshabilitar = ko.pureComputed(function() {
		var elegible = self.elegible();
		var invalida = self.cantidadInvalida();
		return !elegible || invalida;
	});

	self.deshabilitarDeposito = ko.pureComputed(function() {
		var aplicada	 = self.regla.aplicada;
		var deshabilitar = self.deshabilitar();
		return deshabilitar || aplicada;
	});
}

function koDeposito(js, opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}

}