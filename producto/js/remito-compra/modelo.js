/* global koRemitoCompra, ko */

//<editor-fold defaultstate="collapsed" desc="Configuración">
//Objeto caché con los depósitos
var cache = {
  depositos   : []
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

var configProveedor = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		var objeto = new koProveedor(options.data, opcionesPantalla);
		return objeto;
	},
	update: function (options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var configOrden  = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		opcionesPantalla["observe"] = ["seleccionada"];
		var objeto = new koOrden(options.data, opcionesPantalla);
		return objeto;
	},
	update: function (options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var observeRemito = [
	"fecha",
	"lineas",
	"numero",
	"proveedor",
	"numeroProveedor"
];

var observeLineas = [
	"cantidad",
	"deposito"
];

var opcionesPantalla = {
	'observe' : ["ordenes", "proveedores", "filtroDepositos"],
	'orden'	  : configOrden,
	'ordenes' : configOrden,
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
	'lineas': {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = observeLineas;
			var objeto = new koLinea(options.data, options.parent, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'proveedor'   : configProveedor,
	'proveedores' : configProveedor,
	'deposito'	  : configDeposito,
	'depositos'	  : configDeposito
};
//</editor-fold>

function koOrden(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	/**
	 * Selecciona o deselecciona la orden de compra dependiendo de su valor
	 * anterior y según el elemento seleccionado.
	 *
	 * Si se seleccionó un link entonces no la selecciona.
	 *
	 * Si se seleccionó el checkbox entonces va a haber dos eventos click (del
	 * checkbox y la fila td que contiene la orden) por lo que ignoramos el
	 * evento del checkbox.
	 *
	 * @param {koOrden} orden
	 * @param {jQuery.Event} evento
	 * @returns {Boolean}
	 */
	self.seleccionar = function(orden, evento) {
		var link	   = $(evento.target).closest("a");
		var esLink     = link.length > 0;
		var esCheckbox = evento.target.type === "checkbox";
		if (esLink || esCheckbox) {
			return true;
		}

		koRemitoCompra.modificadas(true);
		var seleccionado = orden.seleccionada();
		orden.seleccionada(!seleccionado);
	};
}

function koProveedor(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

}

function koDeposito(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

}

function koRemito(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

    //Separamos las líneas propias de las que no son propias antes de mapear.
    self.lineasPropias = [];
    self.lineasNoPropias = [];
    self.inicializarLineas = function(lineas) {
        self.lineasPropias = [];
        self.lineasNoPropias = [];
        for (var i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            linea.depositoPropio ? self.lineasPropias.push(linea) : self.lineasNoPropias.push(linea);
        }
        if (self.visualizar) {
            //No cambiamos las líneas
            return;
        }
        self.lineas(self.lineasPropias);
    };
    self.inicializarLineas(self.lineas());

	var visualizar		= self.visualizar;
	self.labelFecha		= visualizar ? "Fecha" : "Fecha *";
	self.labelProveedor = visualizar ? "Proveedor" : "Proveedor *";

	var anulado	= self.anulado;
	var estado	= anulado ? "Anulado" : "Activo";
	self.clase  = anulado ? 'text-danger' : 'text-success';
	self.estado = estado;

	self.deposito = ko.observable('');
	self.deposito.subscribe(function(deposito) {
		if (deposito !== undefined) {
			self.inicializarDepositos(deposito);
		}
	});

	if (!ko.isObservable(self.proveedor)) {
		self.proveedor = ko.observable(self.proveedor);
	}

	/**
	 * Selecciona los depósitos de las líneas con el depósito seleccionado
	 * en el select superior.
	 *
	 * @param {koDeposito} deposito
	 * @returns {void}
	 */
	self.inicializarDepositos = function(deposito) {
		var lineas = self.lineas();
		for (var i = 0; i < lineas.length; i++) {
			var linea = lineas[i];
			linea.deposito(deposito);
		}
	};

    self.incluirDeOtrosDepositos = function() {
        for (var i = 0; i < self.lineasNoPropias.length; i++) {
            const linea = self.lineasNoPropias[i];
            self.lineas.push(linea);
        }
    };

    self.quitarDeOtrosDepositos = function() {
        for (var i = 0; i < self.lineasNoPropias.length; i++) {
            const linea = self.lineasNoPropias[i];
            self.lineas.remove(linea);
        }
    };

	/**
	 * Vuelve atrás todos los cambios realizados sobre las líneas.
	 *
	 * @returns {void}
	 */
	self.reestablecerLineas = function() {
		var lineas = ko.mapping.fromJS(js.lineas, opcionesPantalla.lineas)();
		for (var i = 0; i < lineas.length; i++) {
			var linea = lineas[i];
			linea.remito = self;
		}
        self.inicializarLineas(lineas);
	};

	//<editor-fold defaultstate="collapsed" desc="Alta/baja de líneas">
	/**
	 * Agrega una nueva línea al remito de compra a partir de la
	 * presentación.
	 *
	 * @param {Object} presentacion
	 * @returns {void}
	 */
	self.agregarLinea = function(presentacion) {
		var linea	 = self.nuevaLinea(presentacion);
		var deposito = self.deposito();
		if (deposito !== undefined) {
			linea.deposito(deposito);
		}
		self.lineas.push(linea);
	};

	/**
	 * Devuelve una nueva koLinea con los datos por defecto.
	 *
	 * @param {koPresentacion} presentacion
	 * @returns {koLinea}
	 */
	self.nuevaLinea = function(presentacion) {
		var nombre = presentacion.nombreLargo;
		var nueva = {
			id			 : 0,
			deposito     : "",
			cantidad     : "",
			operaciones  : [],
			orden		 : {
				numero : ""
			},
			numero: "",
			presentacion		 : {
				id			: presentacion.id,
				nombre		: nombre,
				nombreLargo : nombre
			},
			pendienteEntrega	 : "",
			pendienteFacturacion : ""
		};

		opcionesPantalla["observe"] = observeLineas;
		var linea					= new koLinea(nueva, self, opcionesPantalla);
		return linea;
	};

	/**
	 * Quita la línea del remito de compra.
	 *
	 * @param {koLinea} linea
	 * @returns {void}
	 */
	self.quitarLinea = function(linea) {
		self.lineas.remove(linea);
	};
	//</editor-fold>

	/**
	 * Devuelve los datos del remito de compra necesarios para persistirlo.
	 *
	 * @returns {Object}
	 */
	self.getDatos = function() {
		var fecha			 = self.fecha();
		var lineas			 = self.getDatosLineas();
		var numero			 = self.numeroProveedor();

		var proveedor   = self.proveedor();
		var idProveedor = proveedor !== undefined ? proveedor.id : 0;
		return {
			fecha	  : fecha,
			lineas	  : lineas,
			numero	  : numero,
			proveedor : idProveedor
		};
	};

	/**
	 * Devuelve los datos de las líneas necesarios para la persistencia del
	 * remito de compra.
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

	//<editor-fold defaultstate="collapsed" desc="Comprobaciones">
	/**
	 * Devuelve true si la cantidad de decimales del número no excede la
	 * cantidad definida en el parámetro 'decimales'.
	 *
	 * @param {Number} numero
	 * @param {Number} decimales Cantidad de decimales a comprobar.
	 * @returns {Boolean}
	 */
	self.comprobarDecimalesValidos = function(numero, decimales = 2) {
		var parteDecimal = numero.toString().split(".")[1];
		var cantidad	 = parteDecimal !== undefined ? parteDecimal.length : 0;
		return cantidad <= decimales;
	};

	/**
	 * Devuelve true si los datos a guardar del remito de compra son válidos.
	 *
	 * @param {Boolean} mostrar Si es true muestra los mensajes de error.
	 * @returns {Boolean}
	 */
	self.comprobarValidez = function(mostrar) {
		var errores = [];

		var fecha = moment(self.fecha());
		if (!fecha.isValid()) {
			errores.push("La fecha es inválida.");
		}

		var proveedor = self.proveedor();
		if (!proveedor || isNaN(proveedor.id)) {
			errores.push("Debe seleccionar un proveedor.");
		}

		var lineas = self.lineas();
		if (lineas.length === 0) {
			errores.push("Debe agregar al menos un artículo.");
		}

		var lineasValidas = true;
		for (var i = 0; i < lineas.length; i++) {
			var linea  = lineas[i];
			var valida = linea.comprobarValidez(mostrar);
			if (!valida) {
				lineasValidas = false;
			}
		}

		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}

		return lineasValidas && errores.length === 0;
	};

    self.comprobarOtrosIncluidos = ko.pureComputed(function() {
        const lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            if (linea.depositoNoPropio) {
                return true;
            }
        }
        return false;
    });

    self.comprobarOtrosNoIncluidos = ko.pureComputed(function() {
        return !self.comprobarOtrosIncluidos();
    });

    self.mostrarAgregarQuitarOtros = self.tieneOrdenes && self.lineasNoPropias.length > 0;
	//</editor-fold>

}

function koLinea(js, remito, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	self.remito = remito;

    //Es importante declarar self.depositoNoPropio primero porque depende de
    //self.depositoPropio. Además una línea puede ser false en ambas si es
    //agregada manualmente.
    self.depositoNoPropio = self.depositoPropio !== undefined && !self.depositoPropio;
    self.depositoPropio   = self.depositoPropio !== undefined && self.depositoPropio;

	if (!ko.isObservable(self.deposito)) {
		self.deposito = ko.observable(self.deposito);
	}

	/**
	 * Clase de la fila de la línea que alerta al usuario que existe un
	 * excedente mediante el color table-danger de boostrap.
	 */
	self.clase = ko.pureComputed(function() {
		var entrega	   = self.comprobarExcedePendienteEntrega();
		var excede	   = entrega;
		var visualizar = self.remito.visualizar;
		return excede && !visualizar ? "table-danger" : "";
	});

	/**
	 * Devuelve el título que indica que existe un excedente de cantidad según el pendiente
	 * de entrega o facturación.
	 *
	 * Además al cambiar el título actualiza el tooltipster.
	 */
	self.titleExcedente = ko.pureComputed(function() {
		var excedeEntrega = self.comprobarExcedePendienteEntrega();
		if (!excedeEntrega) {
			return "";
		}

		var title = "La cantidad a entregar excede la cantidad pendiente de entrega.";
		return title;
	});

	/**
	 * Devuelve los datos de la línea necesarios para su persistencia.
	 *
	 * @returns {Object}
	 */
	self.getDatos = function() {
		var idLinea      = self.id;
		var idOrden		 = self.orden.id;
		var cantidad     = self.cantidad();
		var numeroOrden	 = self.orden.numero;
		var presentacion = self.presentacion;

		var deposito   = self.deposito();
		var idDeposito = deposito !== undefined ? deposito.id : 0;
		return {
			'idLinea'      : idLinea,
			'idOrden'	   : idOrden !== undefined ? idOrden : 0,
			'cantidad'     : cantidad,
			'deposito'     : idDeposito,
			'numeroOrden'  : numeroOrden,
			'descripcion'  : presentacion.nombre,
			'presentacion' : presentacion
		};
	};

	//<editor-fold defaultstate="collapsed" desc="Comprobaciones">
	/**
	 * Devuelve true si la cantidad a entregar de la línea excede la cantidad
	 * pendiente de entrega.
	 */
	self.comprobarExcedePendienteEntrega = ko.pureComputed(function() {
		var pendiente	  = self.pendienteEntrega;
		var excede  = self.comprobarCantidadExcedePendiente(pendiente);
		return excede;
	});

	/**
	 * Devuelve true si la cantidad excede el parámetro 'pendiente'.
	 *
	 * @param {Number} pendiente
	 * @returns {Boolean}
	 */
	self.comprobarCantidadExcedePendiente = function(pendiente) {
		var cantidad	   = self.cantidad();
		var cantidadFloat  = !isNaN(cantidad) ? parseFloat(cantidad) : 0;
		var pendienteFloat = !isNaN(pendiente) ? parseFloat(pendiente) : 0;
		return cantidadFloat > 0.00 && cantidadFloat > pendienteFloat;
	};

	/**
	 * Devuelve true si la línea es válida, para ello debe tener una cantidad
	 * válida y un depósito seleccionado.
	 *
	 * @param {Boolean} mostrar Si es true muestra los mensajes de error.
	 * @returns {Boolean}
	 */
	self.comprobarValidez = function(mostrar) {
		var errores = [];

		var presentacion = self.presentacion;
		var nombre		 = presentacion.nombre;

		var cantidad	  = self.cantidad();
		var cantidadFloat = parseFloat(cantidad);
		if (isNaN(cantidadFloat) || cantidadFloat <= 0.00) {
			errores.push(`La cantidad del artículo ${nombre} debe ser mayor a cero.`);
		}

		var remito				  = self.remito;
		var cantidadDecimalValida = remito.comprobarDecimalesValidos(cantidad);
		if (!cantidadDecimalValida) {
			errores.push(`La cantidad del artículo ${nombre} no puede tener más de dos decimales.`);
		}

		var deposito = self.deposito();
		if (!deposito || isNaN(deposito.id)) {
			errores.push(`Debe seleccionar un depósito para el artículo ${nombre}.`);
		}

		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}

		return errores.length === 0;
	};
	//</editor-fold>


}