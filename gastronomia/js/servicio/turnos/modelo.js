//<editor-fold defaultstate="collapsed" desc="Configuración">
var configTurno = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koTurno(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var opcionesPantalla = {
	'turno': configTurno,
	'turnos': configTurno,
	'servicio': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koServicio(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'composiciones': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koComposicion(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'productos': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koProducto(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>
function koServicio(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

}

function koTurno(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	/**
	 * Ver si se usa
	 */
	self.guardar = ko.observable(false);

	//<editor-fold defaultstate="collapsed" desc="Comprobaciones">
	/**
	 * Comprueba que el turno tenga productos cargados
	 *
	 * @returns {Boolean}
	 */
	self.comprobarTieneProductos = function() {
		let tiene = false;
		ko.utils.arrayForEach(self.composiciones(), function(composicion) {
			let productos = composicion.productos();
			if (productos.length > 0) {
				tiene = true;
			}
		});
		return tiene;
	};

	/**
	 * Valida que el turno sea válido
	 *
	 * @returns {Boolean}
	 */
	self.comprobarValido = function() {
		let valido = true;
		ko.utils.arrayForEach(self.composiciones(), function(composicion) {
			let compServicio = composicion.composicion;
			if (compServicio.elegible() && composicion.productos().length === 0) {
				valido = false;
			}
		});
		return valido;
	};

	/**
	 * Valida que el turno no haya sido modificado
	 *
	 * @returns {Boolean}
	 */
	self.comprobarModificado = function() {
		let composiciones = self.composiciones();
		for (var i = 0; i < composiciones.length; i++) {
			var composicion = composiciones[i];
			let modificada = composicion.modificada();
			if (modificada) {
				return true;
			}
		}
		return false;
	};
	//</editor-fold>

	/**
	 * Marca las composiciones del turno como modificadas o no modificadas.
	 * Este método se utiliza principalmente para que una vez que hemos hecho
	 * modificaciones en las composiciones de los turnos y estas se guardaron
	 * con éxito las marcamos como no modificadas para que nos permita salir
	 * de la pantalla. El campo modificado de las composiciones se utiliza para
	 * verificar si el sistema tiene que preguntar al usuario si quiere salir
	 * sin guardar los cambios.
	 *
	 * @param {Boolean} valor
	 * @returns {koTurno}
	 */
	self.setTurnoModificado = function(valor) {
		let composiciones = self.composiciones();
		for (var i = 0; i < composiciones.length; i++) {
			var composicion = composiciones[i];
			composicion.modificada(valor);
		}
		return this;
	};

	/**
	 * Cambia la fecha del turno según el día seleccionado
	 *
	 * @param {int} dia
	 * @returns {undefined}
	 */
	self.actualizarFecha = function(dia) {
		if (self.id() !== null) {
			return;
		}
		let fechaMysql = self.fecha.fechaMysql();
		let mysql	   = fechaMysql.slice(0,8) + dia;
		self.fecha.fechaMysql(mysql);
	};
}

function koComposicion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.productosDummy			  = ko.observableArray([]);
	self.productosDummyOriginales = ko.observable(null);

	/**
	 * Indica que una composicion fue modificada, sin importar si luego volvió
	 * a su estado original
	 */
	self.modificada = ko.observable(false);

	/**
	 * Indica que la composición fue seleccionada en el modal para la carga
	 * de productos de la misma
	 */
	self.seleccionada = ko.observable(false);

	/**
	 * Texto que representa la composición del servicio
	 */
	self.textoDescripcion = ko.pureComputed(function() {
		let descripcion = self.composicion.descripcion();
		if (descripcion.length === 0) {
			descripcion = self.composicion.categoria.nombre();
		}
		return descripcion;
	});

	/**
	 * Inicializa los productos dummy de una composición del turno
	 *
	 * @returns {void}
	 */
    self.cargarProductosDummy = function() {
	   let actual = self.composicion.categoria;
	   if (!koGestionTurnosServicio) {
		   return;
	   }
	   ko.utils.arrayForEach(koGestionTurnosServicio.categoriasComposicion(), function(categoria) {
		   if (actual.id() === categoria.id()) {
			   let productosDummy = self.getProductosDummy(categoria);
			   let clonados		  = ko.mapping.fromJS(ko.mapping.toJS(productosDummy), opcionesPantalla.productos);
			   self.productosDummy(productosDummy);
			   if (self.productosDummyOriginales() === null) {
				   self.productosDummyOriginales(clonados());
			   }
		   }
	   });
    };

	/**
	 * Obtiene los productos que el usuario puede elegir para cargarle a la
	 * composición
	 *
	 * @param {Object} categoria
	 * @returns {Array}
	 */
	self.getProductosDummy = function(categoria) {
		let dummy			  = [];
		let productos		  = categoria.productos() ? categoria.productos() : [];
		let productosCargados = self.productos() ? self.productos() : [];
		ko.utils.arrayForEach(productos, function(producto) {
			let encontrado = ko.utils.arrayFirst(productosCargados, function(prod) {
				return prod.id() === producto.id();
			});
			if (!encontrado) {
				dummy.push(producto);
			}
		});
		return dummy;
	};

	self.reiniciarProductosOriginales = function() {
		let originales		= ko.mapping.fromJS(json.productos, opcionesPantalla.productos);
		let originalesDummy = self.productosDummyOriginales();
		self.productos(originales());
		self.productosDummy(originalesDummy);
		self.modificada(false);
	};

	/**
	 * Ordena los productos seleccionados de la composición por nombre
	 *
	 * @returns {void}
	 */
	self.ordenarProductos = function() {
		self.productos.sort(function (a, b) {
			return a.nombre().toLowerCase() > b.nombre().toLowerCase() ? 1 : -1;
		});
	};
}

function koProducto(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

}
