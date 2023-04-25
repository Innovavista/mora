/* global ko, clave, parseFloat, moment */

//<editor-fold defaultstate="collapsed" desc="Configuración">
//Objeto caché con los depósitos
var cache = {
    depositos: [],
    proveedores: []
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
        //En la creación del objeto verificamos si ya existe en caché con el id
        var id = options.data.id;
        if (cache.proveedores[id] === undefined) {
            cache.proveedores[id] = new koProveedor(options.data, opcionesPantalla);
        }
        return cache.proveedores[id];
    }
};

var observeLinea     = ["cantidad", "precio", "logisticas"];
var observeLogistica = ["cantidadSolicitar", "depositoElegido", "fechaEntrega"];

var opcionesPantalla = {
    'observe': ["filtroFechaDesde", "cotizaciones", "presentaciones"],
    'depositos': configDeposito,
    'deposito': configDeposito,
    'cotizaciones': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            var objeto = new koCotizacion(options.data, opcionesPantalla);
            return objeto;
        }
    },
    'presentaciones': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            var objeto = new koPresentacion(options.data, opcionesPantalla);
            return objeto;
        }
    },
    'orden': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = ["lineas", "proveedor", "observaciones"];
            var objeto                  = new koOrden(options.data, opcionesPantalla);
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
            opcionesPantalla["observe"] = observeLinea;
            var objeto                  = new koLinea(options.data, options.parent, opcionesPantalla);
            return objeto;
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'logisticas': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = observeLogistica;
            var objeto                  = new koLogistica(options.data, options.parent, opcionesPantalla);
            return objeto;
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'proveedores': configProveedor,
    'proveedor': configProveedor
};

//</editor-fold>

function koCotizacion(js, opciones) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

}

function koOrden(js, opciones) {
    ko.mapping.fromJS(js, opciones, this);
    var self = this;

    if (!ko.isObservable(self.proveedor)) {
        var mapeado    = ko.mapping.fromJS(js.proveedor, opciones.proveedor);
        self.proveedor = ko.observable(mapeado);
    }

    /**
     * Devuelve el total de la orden de compra.
     */
    self.total = ko.pureComputed(function () {
        var total  = 0;
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea     = lineas[i];
            var convertir = linea.subtotal();
            var subtotal  = parseFloat(convertir);
            if (!isNaN(subtotal)) {
                total += subtotal;
            }
        }
        var redondeado = total.toFixed(2);
        return parseFloat(redondeado);
    });

    /**
     * Agrega una nueva línea a la orden de compra a partir de la presentación.
     *
     * @param {koPresentacion} presentacion
     * @returns {undefined}
     */
    self.agregarLinea = function (presentacion) {
        var linea = self.nuevaLinea(presentacion);
        self.lineas.push(linea);
    };

    /**
     * Devuelve una nueva koLinea con los datos por defecto.
     *
     * @param {koPresentacion} presentacion
     * @returns {koLinea}
     */
    self.nuevaLinea = function (presentacion) {
        const precio = presentacion.costoVigente !== null ? presentacion.costoVigente : "";
        const nueva  = {
            precio: precio,
            cantidad: "",
            logisticas: [],
            presentacion: presentacion
        };

        opcionesPantalla["observe"] = observeLinea;
        const linea                 = new koLinea(nueva, self, opcionesPantalla);
        linea.agregarLogistica();
        return linea;
    };

    /**
     * Quita la línea de la orden de compra.
     *
     * @param {koLinea} linea
     * @returns {void}
     */
    self.quitarLinea = function (linea) {
        self.lineas.remove(linea);
    };

    /**
     * Devuelve los datos para guardar la orden de compra.
     *
     * @returns {Array}
     */
    self.getDatosLineas = function () {
        var datos  = [];
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            var dato  = linea.getDatosPost();
            datos.push(dato);
        }
        return datos;
    };

    //<editor-fold defaultstate="collapsed" desc="Comprobaciones">
    /**
     * Devuelve true si los datos de la orden de compra son válidos para guardar
     * el procesamiento de sus artículos.
     *
     * @param {Boolean} mostrar Indica si muestra los errores.
     * @returns {Boolean}
     */
    self.comprobarValidez = function (mostrar) {
        var lineas  = self.lineas();
        var errores = [];
        if (lineas.length === 0) {
            errores.push("Debe solicitar al menos un artículo.");
        }

        var validas = true;
        for (var i = 0; i < lineas.length; i++) {
            var linea  = lineas[i];
            var valida = linea.comprobarValidez(mostrar);
            if (!valida) {
                validas = false;
            }
        }

        var valorizada = self.comprobarValorizada();
        var completos  = valorizada ? self.comprobarPreciosCompletos() : true;
        if (valorizada && !completos) {
            errores.push("Si desea una orden de compra valorizada debe " +
                "indicar todos los precios de los artículos.");
        }

        if (mostrar) {
            errores.forEach(error => Notificacion(error, "error"));
        }

        return validas && errores.length === 0;
    };

    /**
     * Comprueba si la orden de compra se encuentra valorizada. Para que sea
     * valorizada alguna de sus líneas tiene que tener un precio definido.
     *
     * En el caso que la orden de compra se encuentre valorizada entonces todas
     * sus líneas deben tener precio.
     *
     * @returns {Boolean}
     */
    self.comprobarValorizada = function () {
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea      = lineas[i];
            var valorizada = linea.comprobarTienePrecio();
            if (valorizada) {
                return true;
            }
        }
        return false;
    };

    /**
     * Comprueba que todas las líneas de la orden de compra tengan precios.
     *
     * @returns {Boolean}
     */
    self.comprobarPreciosCompletos = function () {
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            var tiene = linea.comprobarTienePrecio();
            if (!tiene) {
                return false;
            }
        }
        return true;
    };

    /**
     * Devuelve true si la orden de compra tiene un proveedor seleccionado.
     *
     * @param {Boolean} mostrar Si es true muestra los mensajes de error.
     * @returns {Boolean}
     */
    self.comprobarProveedorSeleccionado = function (mostrar) {
        var errores      = [];
        var proveedor    = self.proveedor();
        var idProveedor  = proveedor !== undefined ? parseInt(proveedor.id) : 0;
        var seleccionado = !isNaN(idProveedor) && idProveedor > 0;
        if (!seleccionado) {
            errores.push("Debe seleccionar un proveedor para la orden de compra");
        }

        if (mostrar) {
            errores.forEach(error => Notificacion(error, "error"));
        }

        return errores.length === 0;
    };
    //</editor-fold>

}

function koLinea(js, orden, opciones) {
    this.orden = orden;
    ko.mapping.fromJS(js, opciones, this);
    var self = this;

    // Uso un id aleatorio en vez de la presentación porque cuando agregamos una
    // nueva línea no tenemos presentación inicialmente.
    var idRandom    = parseFloat(Math.random() * 10000).toFixed(0);
    self.idPrecio   = `precio-${idRandom}`;
    self.idCantidad = `cantidad-${idRandom}`;
    self.idSubtotal = `subtotal-${idRandom}`;

    /**
     * Representa el subtotal de la línea de orden de compra.
     */
    self.subtotal = ko.pureComputed(function () {
        var precio        = self.precio();
        var cantidad      = self.cantidad();
        var precioFloat   = parseFloat(precio);
        var cantidadFloat = parseFloat(cantidad);

        var valido = !isNaN(precio) && !isNaN(cantidad);
        if (valido) {
            var subtotal = precioFloat * cantidadFloat;
            return subtotal.toFixed(2);
        }
        return 0;
    });

    /**
     * Devuelve los datos de la línea de la orden de compra.
     *
     * @returns {Array}
     */
    self.getDatosPost = function () {
        var conHtml = self.presentacion.nombreLargo;
        var nombre  = conHtml.replace(/(<([^>]+)>)/gi, "");

        var datos      = {
            id: self.id,
            precio: self.precio(),
            cantidad: self.cantidad(),
            logisticas: [],
            presentacion: {
                id: self.presentacion.id,
                nombre: nombre
            }
        };
        var logisticas = self.logisticas();
        for (var i = 0; i < logisticas.length; i++) {
            var logistica      = logisticas[i];
            var datosLogistica = logistica.getDatosPost();
            datos.logisticas.push(datosLogistica);
        }
        return datos;
    };

    /**
     * Crea un nuevo objeto logística con los datos mínimos listo para ser
     * mapeado.
     *
     * @returns {Object}
     */
    self.nuevaLogistica = function () {
        return {
            deposito: {
                id: "",
                adicional: {
                    nombre: ""
                }
            },
            depositoElegido: "",
            cantidadSolicitar: ""
        };
    };

    /**
     * Agrege una nueva línea de logística.
     *
     * @returns {void}
     */
    self.agregarLogistica = function () {
        var puede = self.comprobarPuedeAgregarLogistica();
        if (!puede) {
            var presentacion = self.presentacion;
            var nombre       = presentacion.nombreLargo;
            Notificacion(`No hay más depósitos para discriminar el envío del artículo ${nombre}`, "error");
            return;
        }

        var nueva                   = self.nuevaLogistica();
        opcionesPantalla["observe"] = observeLogistica;
        var logistica               = new koLogistica(nueva, self, opcionesPantalla);
        self.logisticas.push(logistica);
    };

    /**
     * Quita la logística de la línea actual.
     *
     * @param {koLogistica} logistica
     * @returns {void}
     */
    self.quitarLogistica = function (logistica) {
        self.logisticas.remove(logistica);
    };

    /**
     * Devuelve la cantidad convertida a float.
     *
     * @returns {Number}
     */
    self.getCantidadFloat = function () {
        var cantidad      = self.cantidad();
        var cantidadFloat = parseFloat(cantidad);
        if (isNaN(cantidadFloat)) {
            return 0;
        }

        var redondeado = cantidadFloat.toFixed(2);
        return parseFloat(redondeado);
    };

    self.getDepositos = function (actual) {
        const orden     = self.orden;
        const depositos = orden.depositos;
        if (!Array.isArray(depositos) || depositos.length === 0) {
            return [];
        }

        return depositos;
    };

    //<editor-fold defaultstate="collapsed" desc="Comprobaciones">
    /**
     * Devuelve true si la línea de la orden de compra posee los datos válidos
     * para ser guardada.
     *
     * @param {Boolean} mostrar Indica si muestra los errores.
     * @returns {Boolean}
     */
    self.comprobarValidez = function (mostrar) {
        var total   = 0;
        var validas = true;
        var errores = [];

        var conHtml = self.presentacion.nombreLargo;
        var nombre  = conHtml.replace(/(<([^>]+)>)/gi, "");

        var logisticas   = self.logisticas();
        var sinLogistica = logisticas.length === 0;
        if (sinLogistica) {
            errores.push(`Debe indicar al menos un detalle de logística para el artículo ${nombre}`);
        }

        var setIds                   = new Set();
        var validezFecha             = true;
        var validezCantidad          = true;
        var validezFechaPasada       = true;
        var validezSeleccionado      = true;
        var validezCantidadDecimales = true;
        for (var i = 0; i < logisticas.length; i++) {
            var logistica    = logisticas[i];
            var seleccionado = logistica.comprobarDepositoSeleccionado();
            if (!seleccionado) {
                validezSeleccionado = false;
            }

            var id = logistica.idDeposito();
            if (!isNaN(id)) {
                setIds.add(id);
            }

            var cantidadDecimalesValidos = logistica.comprobarCantidadDecimalesValidos();
            if (!cantidadDecimalesValidos) {
                validezCantidadDecimales = false;
            }

            var cantidadValida = logistica.comprobarCantidadValida();
            if (!cantidadValida) {
                validezCantidad = false;
            }

            var fechaValida = logistica.comprobarFechaValida();
            if (!fechaValida) {
                validezFecha = false;
            }

            var fechaPasada = logistica.comprobarFechaPasada();
            if (fechaPasada) {
                validezFechaPasada = false;
            }

            total += logistica.getCantidadFloat();
        }

        if (!validezCantidad) {
            errores.push(`La cantidad para cada depósito del artículo ${nombre}
				debe ser mayor a cero.`);
        }

        if (!validezCantidadDecimales) {
            errores.push(`La cantidad para cada depósito del artículo ${nombre}
				no pueden tener más de dos decimales.`);
        }

        if (!validezSeleccionado) {
            errores.push(`Debe seleccionar un depósito para cada cantidad
				discriminada del artículo ${nombre}.`);
        }

        if (!validezFecha) {
            errores.push(`Las fechas del detalle de logística del artículo
				${nombre} deben ser válidas.`);
        }

        if (!validezFechaPasada) {
            errores.push(`Las fechas del detalle de logística del artículo
				${nombre} no pueden ser pasadas.`);
        }

        var cantidad = self.getCantidadFloat();
        if (cantidad <= 0.00) {
            errores.push(`La cantidad total del artículo ${nombre} no puede ser menor o igual a cero.`);
        }

        var negativo = self.comprobarPrecioNegativo();
        if (negativo) {
            errores.push(`El precio del artículo ${nombre} no puede ser menor o igual a cero.`);
        }

        var original = self.cantidad();
        var validos  = self.comprobarCantidadDecimalesValidos(original);
        if (!validos) {
            errores.push(`La cantidad total a pedir del artículo ${nombre} no
				puede tener más de dos decimales.`);
        }

        var precio       = self.precio();
        var precioTexto  = !isNaN(precio) && precio > 0.00 ? precio : "";
        var precioValido = self.comprobarCantidadDecimalesValidos(precioTexto);
        if (!precioValido) {
            errores.push(`El precio del artículo ${nombre} no puede tener más
				de dos decimales.`);
        }

        if (total > 0.00 && cantidad > 0.00 && total !== cantidad) {
            errores.push(`La cantidad total a pedir del artículo ${nombre} debe
				coincidir con las cantidades discriminadas por depósito.`);
        }

        if (mostrar) {
            errores.forEach(error => Notificacion(error, "error"));
        }

        return validas && errores.length === 0;
    };

    /**
     * Comprueba si la línea de la orden de compra tiene precio.
     */
    self.comprobarTienePrecio = ko.pureComputed(function () {
        var precio = self.precio();
        return precio !== undefined && !isNaN(precio);
    });

    /**
     * Comprueba si la línea de la orden de compra tiene precio negativo.
     */
    self.comprobarPrecioNegativo = function () {
        var precio = self.precio();
        return precio !== undefined && !isNaN(precio) && parseFloat(precio) < 0.00;
    };

    /**
     * Devuelve true cuando se puede seguir agregando detalles de logística a
     * una línea.
     *
     * @returns {Boolean}
     */
    self.comprobarPuedeAgregarLogistica = function () {
        var orden      = self.orden;
        var depositos  = orden.depositos;
        var logisticas = self.logisticas();
        return depositos.length > logisticas.length;
    };

    /**
     * Devuelve true si el número tiene 2 o menos decimales.
     *
     * @param {String} numero
     * @returns {Boolean}
     */
    self.comprobarCantidadDecimalesValidos = function (numero) {
        var decimales = numero.toString().split(".")[1];
        var cantidad  = decimales !== undefined ? decimales.length : 0;
        return cantidad <= 2;
    };
    //</editor-fold>

}

function koLogistica(js, linea, opciones) {
    this.linea = linea;
    ko.mapping.fromJS(js, opciones, this);
    var self = this;

    if (js.fechaEntrega === undefined) {
        self.fechaEntrega = ko.observable(moment().format('YYYY-MM-DD'));
    }

    if (self.deposito !== undefined && !isNaN(self.deposito.id)) {
        var mapeado          = ko.mapping.fromJS(self.deposito, opciones.deposito);
        self.depositoElegido = ko.observable(mapeado);
    }

    /**
     * Devuelve los depósitos que no fueron seleccionados en logísticas
     * anteriores de la misma línea.
     */
    self.depositos = ko.computed(function () {
        const linea = self.linea;
        return linea.getDepositos(self);
    });

    /**
     * Indica el dato adicional relacionado al depósito.
     */
    self.adicional = ko.pureComputed(function () {
        var deposito  = self.depositoElegido();
        var adicional = deposito !== undefined && deposito.adicional !== undefined ? deposito.adicional : {};
        var nombre    = adicional !== undefined && adicional.nombre !== undefined ? adicional.nombre : "";
        return nombre;
    });

    /**
     * Devuelve el id del depósito seleccionado.
     */
    self.idDeposito = ko.pureComputed(function () {
        var deposito   = self.depositoElegido();
        var idDeposito = deposito !== undefined && deposito.id !== undefined ? deposito.id : 0;
        var idEntero   = parseInt(idDeposito);
        var idValido   = !isNaN(idEntero) && idEntero > 0;
        return idValido ? idEntero : 0;
    });

    /**
     * Devuelve la cantidad convertida a float.
     *
     * @returns {Number}
     */
    self.getCantidadFloat = function () {
        var cantidad      = self.cantidadSolicitar();
        var cantidadFloat = parseFloat(cantidad);
        if (isNaN(cantidadFloat) || cantidadFloat < 0.00) {
            return 0;
        }

        var redondeado = cantidadFloat.toFixed(2);
        return parseFloat(redondeado);
    };

    /**
     * Devuelve los datos de logística de un depósito.
     *
     * @returns {Array}
     */
    self.getDatosPost = function () {
        var datos = {
            id: self.id,
            fecha: self.fechaEntrega(),
            deposito: self.idDeposito(),
            cantidad: self.cantidadSolicitar(),
            lineaCotizacion: self.lineaCotizacion
        };
        return datos;
    };

    //<editor-fold defaultstate="collapsed" desc="Comprobaciones">
    /**
     * Comprueba que se haya seleccionado un depósito para la logística actual.
     *
     * @returns {Boolean}
     */
    self.comprobarDepositoSeleccionado = function () {
        var idDeposito = self.idDeposito();
        return idDeposito > 0;
    };

    /**
     * Comprueba que la cantidad solicitada por del depósito actual sea mayor a
     * cero.
     *
     * @returns {Boolean}
     */
    self.comprobarCantidadValida = function () {
        var cantidad = self.cantidadSolicitar();
        return !isNaN(cantidad) && cantidad > 0.00;
    };

    /**
     * Comprueba que la fecha del detalle de logística tenga un formato válido.
     *
     * @returns {Boolean}
     */
    self.comprobarFechaValida = function () {
        var fecha       = self.fechaEntrega();
        var fechaMoment = moment(fecha).startOf('day');
        var fechaValida = fechaMoment.isValid();
        return fechaValida;
    };

    /**
     * Comprueba que la fecha del detalle de logística sea pasada.
     *
     * @returns {Boolean}
     */
    self.comprobarFechaPasada = function () {
        var hoy         = moment().startOf('day');
        var fecha       = self.fechaEntrega();
        var fechaMoment = moment(fecha).startOf('day');
        return fechaMoment.isBefore(hoy);
    };

    /**
     * Comprueba si el detalle de logística actual proviene de una línea de
     * cotización.
     *
     * @returns {Boolean}
     */
    self.comprobarTieneLineaCotizacion = function () {
        var id       = self.lineaCotizacion;
        var idEntero = parseInt(id);
        return !isNaN(idEntero) && idEntero > 0;
    };

    /**
     * Devuelve true si la cantidad de decimales de la cantidad a solicitar es
     * menor o igual a 2.
     *
     * @returns {Boolean}
     */
    self.comprobarCantidadDecimalesValidos = function () {
        var linea    = self.linea;
        var cantidad = self.cantidadSolicitar();
        return linea.comprobarCantidadDecimalesValidos(cantidad);
    };
    //</editor-fold>

}

function koPresentacion(js, opciones) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

}

function koDeposito(js, opciones) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

}

function koProveedor(js, opciones) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

    self.telefonoTexto  = self.telefono !== "" ? self.telefono : "Sin teléfono";
    self.direccionTexto = self.direccion !== "" ? self.direccion : "Sin dirección";
}