/* global ko */

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionPresentacion = {
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
};

var opcionMateriaPrima = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koMateriaPrima(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionEnvase = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koEnvase(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionMarca = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koMarca(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionUnidad = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koUnidad(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionRelacionPresentacion = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koRelacionPresentacion(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionRelacionMateriaPrima = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koRelacionMateriaPrima(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionesPantalla = {
	'presentaciones'	: opcionPresentacion,
	'presentacionDummy'	: opcionPresentacion
};
//</editor-fold>

function koPresentacion(data, opciones) {
	ko.mapping.fromJS(data, opciones, this);
	var self = this;

    if (!ko.isObservable(self.cantidad)) {
        self.cantidad = ko.observable(null);
    }

	if (!self.presentacionesQueCompone) {
		self.presentacionesQueCompone = ko.observableArray([]);
	}

	if (!self.elementos) {
		self.elementos = ko.observableArray([]);
	}

	if (self.envase && !ko.isObservable(self.envase)) {
		self.envase = ko.observable(self.envase);
	}

	if (self.unidad && !ko.isObservable(self.unidad)) {
		var unidadCorta	 = self.unidad.nombreCorto();
		self.unidad		 = ko.observable(self.unidad.clave());
		self.unidadCorta = ko.observable(unidadCorta);
	} else {
		self.unidad		 = ko.observable(null);
		self.unidadCorta = ko.observable(null);
	}

	if (self.marca && !ko.isObservable(self.marca)) {
		self.marca = ko.observable(self.marca);
	} else {
		self.marca = ko.observable(null);
	}

	self.esCompuesta = ko.computed(function() {
		if (self.relacionPresentaciones && self.relacionPresentaciones().length > 0) {
			return true;
		}
		return false;
	});

	self.componeAPresentaciones = ko.computed(function() {
		if (!self.presentacionesQueCompone) {
			return false;
		}
		return self.presentacionesQueCompone().length > 0;
	});

	/**
	 * Devuelve datos para construir el nombre de la presentación.
	 *
	 * @param {Boolean} nombreCorto
	 * @returns {Object}
	 */
	self.getNombreDatos = function(nombreCorto) {
		var envase		= self.envase() && self.envase().nombre();
		var unidad		= self.unidadCorta();
		var marca		= self.marca() ? self.marca().nombre() : '';
		var cantidad	= '';

		var presentaciones = '';
		if (self.relacionPresentaciones && self.relacionPresentaciones().length > 0) {
			var presentacion = self.relacionPresentaciones()[0].presentacionHijo;
			if (ko.isObservable(presentacion)) {
				if (nombreCorto) {
					presentaciones = presentacion().nombreCorto();
				} else {
					presentaciones = presentacion().nombre();
				}
			} else {
				if (nombreCorto) {
					presentaciones = presentacion.nombreCorto();
				} else {
					presentaciones = presentacion.nombre();
				}
			}
		}

		if (self.esCompuesta() && self.relacionPresentaciones().length > 0) {
			cantidad = self.relacionPresentaciones()[0].cantidad();
		} else if (!self.esCompuesta() && self.elementos().length > 0) {
			cantidad =  self.elementos()[0].cantidad();
		}

		return {
			envase: envase,
			unidad: unidad,
			marca: marca,
			cantidad: cantidad,
			presentaciones: presentaciones
		};
	};

	/**
	 * Busca el nombre de la marca de la presentación raiz.
	 *
	 * @param {Object|Observable} composicion
	 * @returns {String}
	 */
	self.getMarcaPresentacionPrincipal = function(composicion) {
		var salida = '';
		if (composicion.length === 0) {
			return salida;
		}
		var presentacion = composicion[0].presentacionHijo;
		if (!presentacion) {
			return salida;
		}
		presentacion = ko.isObservable(presentacion) ? presentacion() : presentacion;
		if (presentacion.presentaciones && presentacion.presentaciones().length > 0) {
			salida = self.getMarcaPresentacionPrincipal(presentacion.presentaciones());
		} else {
			var marca = ko.isObservable(presentacion.marca) ? presentacion.marca() : presentacion.marca;
			salida = marca !== null && marca !== undefined ? marca.nombre() : "";
		}
		return salida;
	};

	/**
	 * Devuelve un nombre con la siguiente estructura: [Composición] [Marca]
	 *
	 * Ej: [Botella x 1.00 litros] Patagonia
	 *
	 * @returns {String}
	 */
	self.nombre	= ko.computed(function() {
		var nombreDatos = self.getNombreDatos();

		var envase			= nombreDatos.envase;
		var unidad			= nombreDatos.unidad;
		var marca			= nombreDatos.marca;
		var presentaciones	= nombreDatos.presentaciones;
		var cantidad		= nombreDatos.cantidad;

		if (!envase) {
			envase = 'ELEGIR';
		}

		if (self.esCompuesta()) {
			return '[' + envase + ' de ' + cantidad + ']' + ' x ' + presentaciones;
		} else {
			return '[' + envase + ' x ' + cantidad + ' ' + unidad + ']' + ' ' + marca;
		}
	});

	/**
	 * Devuelve un nombre con tags HTML con la siguiente estructura: [Composición] [Marca]
	 *
	 * Ej: [Botella x 1.00 litros] Patagonia
	 *
	 * @returns {String}
	 */
	self.nombreHtml	= ko.computed(function() {
		var nombreDatos	= self.getNombreDatos();

		var envase			= nombreDatos.envase;
		var unidad			= nombreDatos.unidad;
		var marca			= nombreDatos.marca;
		var cantidad		= nombreDatos.cantidad;
		var presentaciones	= nombreDatos.presentaciones;

		if (self.esCompuesta()) {
			return '<span class="presentacion-nombre-envase">[' + envase + ' de '
					+ '<span class="presentacion-nombre-cantidad">' + cantidad + '</span>]</span>'
					+ '<span class="presentacion-nombre-presentacion">' + presentaciones + '</span>';
		} else {
			return '<span class="presentacion-nombre-envase">[' + envase + ' x '
					+ '<span class="presentacion-nombre-cantidad">' + cantidad + '</span>' + ' '
					+ '<span class="presentacion-nombre-unidad">' + unidad + '</span>]</span>' + ' '
					+ '<span class="presentacion-nombre-marca">' + marca + '</span>';
		}
	});

	/**
	 * Devuelve un nombre con la siguiente estructura: [MP] [Marca] - [Composición]
	 *
	 * Ej: Cerveza Patagonia - [Botella x 1.00 litros]
	 *
	 * @returns {String}
	 */
	self.nombreLargo = ko.computed(function() {
		var nombreDatos = self.getNombreDatos(true);

		var elemento		= self.elemento.nombre();
		var envase			= nombreDatos.envase;
		var unidad			= nombreDatos.unidad;
		var marca			= nombreDatos.marca;
		var cantidad		= nombreDatos.cantidad;
		var presentaciones	= nombreDatos.presentaciones;

		if (self.esCompuesta()) {
			var marca = self.getMarcaPresentacionPrincipal(self.relacionPresentaciones());
			return "<span>" + elemento + " " + marca + '</span> - <span>[' + envase + ' de ' + cantidad + ']' + ' x ' + presentaciones + "</span>";
		} else {
			return "<span>" + elemento + " " + marca + '</span> - <span>[' + envase + ' x ' + cantidad + ' ' + unidad + ']</span>';
		}
	});

	/**
	 * Devuelve un nombre con la siguiente estructura: [Composición]
	 *
	 * Ej: [Botella x 1.00 litros]
	 *
	 * @returns {String}
	 */
	self.nombreCorto = ko.computed(function() {
		var nombreDatos = self.getNombreDatos(true);

		var envase			= nombreDatos.envase;
		var unidad			= nombreDatos.unidad;
		var cantidad		= nombreDatos.cantidad;
		var presentaciones	= nombreDatos.presentaciones;

		if (self.esCompuesta()) {
			return '[' + envase + ' de ' + cantidad + ']' + ' x ' + presentaciones;
		} else {
			return '[' + envase + ' x ' + cantidad + ' ' + unidad + ']';
		}
	});

	self.addPresentaciones = function(presentaciones) {
		self.relacionPresentaciones.push(presentaciones);
	};
}

function koRelacionPresentacion(data) {
	var self = this;

	self.presentacionHijo = ko.observable(null); // presentación
	self.cantidad		  = ko.observable(null); // De la relación

	if (data) {
		var presentacionHijo = data.presentacionHijo ? data.presentacionHijo : null;
		var cantidad	 = data.cantidad;

		self.presentacionHijo(presentacionHijo);
		self.cantidad(cantidad);
	}
}

function koRelacionMateriaPrima() {
	var self = this;

	self.materiaPrima = ko.observable(null);
	self.cantidad	  = ko.observable(null);
	self.unidad 	  = ko.observable(null);

	self.setData = function(data) {
		self.materiaPrima(data.elemento);
		self.cantidad(data.cantidad);
		self.unidad(data.unidad);
	};
}

function koRelacionMercaderia() {
	var self = this;

	self.mercaderia	= ko.observable(null);
	self.cantidad	= ko.observable(null);
	self.unidad 	= ko.observable(null);

	self.setData = function(data) {
		self.mercaderia(data.elemento);
		self.cantidad(data.cantidad);
		self.unidad(data.unidad);
	};
}

function koEnvase(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koMarca(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koMateriaPrima(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koUnidad(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

