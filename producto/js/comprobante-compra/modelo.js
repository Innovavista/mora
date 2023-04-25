/* global ko, koComprobanteCompra, SUBTIPO_NOTA_CREDITO, TIPO_NOTA_CREDITO_COMPRA, TIPO_FACTURA_COMPRA, SUBTIPO_FACTURA_OTROS, IVA_DEFECTO, ERROR_COMPROBANTE_PUNTO_DE_VENTA_AFIP, ERROR_COMPROBANTE_NUMERO, clave, LETRA_A, CANTIDAD_UNIDAD, CONDICION_CONTADO */

//<editor-fold defaultstate="collapsed" desc="Configuración">

ko.bindingHandlers['valueAfterChildren'] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.applyBindingsToDescendants(bindingContext, element);
        ko.bindingHandlers['value'].init(element, valueAccessor, allBindings, viewModel, bindingContext);
        return {controlsDescendantBindings: true};
    },
    value: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.bindingHandlers['value'].update(element, valueAccessor, allBindings, viewModel, bindingContext);
    }
}

//Objeto caché con los depósitos
const cache = {
    depositos: [],
    impuestos: [],
    proveedores: []
};

const configProveedor = {
    key: function (data) {
        return ko.utils.unwrapObservable(data.id);
    },
    create: function (options) {
        //En la creación del objeto verificamos si ya existe en caché con el id
        const id = options.data.id;
        if (cache.proveedores[id] === undefined) {
            cache.proveedores[id] = new koProveedor(options.data, opcionesPantalla);
        }
        return cache.proveedores[id];
    },
    update: function (options) {
        ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
        return options.target;
    }
};

const configDeposito = {
    key: function (data) {
        return ko.utils.unwrapObservable(data.id);
    },
    create: function (options) {
        //En la creación del objeto verificamos si ya existe en caché con el id
        const id = options.data.id;
        if (cache.depositos[id] === undefined) {
            cache.depositos[id] = new koDeposito(options.data, opcionesPantalla);
        }
        return cache.depositos[id];
    }
};

const configOrden = {
    key: function (data) {
        return ko.utils.unwrapObservable(data.id);
    },
    create: function (options) {
        opcionesPantalla["observe"] = ["seleccionada"];
        return new koOrden(options.data, opcionesPantalla);
    },
    update: function (options) {
        ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
        return options.target;
    }
};

const configImpuesto = {
    key: function (data) {
        return ko.utils.unwrapObservable(data.id);
    },
    create: function (options) {
        const id = options.data.id;
        opcionesPantalla["observe"] = observeImpuestos;
        if (options.data.impuesto !== undefined) {
            //Es una aplicación de impuesto, no un impuesto en si
            return new koImpuesto(options.data, options.parent, opcionesPantalla);
        }
        if (cache.impuestos[id] === undefined) {
            cache.impuestos[id] = new koImpuesto(options.data, options.parent, opcionesPantalla);
        }
        return cache.impuestos[id];
    },
    update: function (options) {
        ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
        return options.target;
    }
};

const observeComprobante = [
    "tipo",
    "fecha",
    "letra",
    "lineas",
    "numero",
    "detalle",
    "subtipo",
    "descuento",
    "proveedor",
    "impuestos",
    "totalGeneral",
    "puntoDeVentaAfip"
];

const observeLineas = [
    "precio",
    "cantidad",
    "deposito",
    "descuento"
];

const observeImpuestos = [
    "impuesto",
    "total",
    "observaciones"
];

const opcionesPantalla = {
    'observe': ["ordenes", "proveedores", "presentaciones", "remitos", "desvinculados"],
    'orden': configOrden,
    'ordenes': configOrden,
    'comprobante': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = observeComprobante;
            return new koComprobante(options.data, opcionesPantalla);
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'lineas': {
        key: function (data) {
            return data.idPropio ?? data.id;
        },
        create: function (options) {
            opcionesPantalla["observe"] = observeLineas;
            return new koLinea(options.data, options.parent, opcionesPantalla);
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'proveedor': configProveedor,
    'proveedores': configProveedor,
    'deposito': configDeposito,
    'depositos': configDeposito,
    'remito': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = ["numero"];
            return new koRemito(options.data, opcionesPantalla);
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'tipos': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = [""];
            return new koTipo(options.data, opcionesPantalla);
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'impuesto': configImpuesto,
    'impuestos': configImpuesto,
};

//</editor-fold>

function koOrden(js, opciones) {
    ko.mapping.fromJS(js, opciones, this);
    const self = this;

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
    self.seleccionar = function (orden, evento) {
        var link = $(evento.target).closest("a");
        var esLink = link.length > 0;
        var esCheckbox = evento.target.type === "checkbox";
        if (esLink || esCheckbox) {
            return true;
        }

        koComprobanteCompra.modificadas(true);
        var seleccionado = orden.seleccionada();
        orden.seleccionada(!seleccionado);
    };
}

function koComprobante(js, opciones) {
    ko.mapping.fromJS(js, opciones, this);
    const self = this;

    self.ivaGeneral = ko.observable(21);

    self.lineasPropias = [];
    self.lineasNoPropias = [];
    self.lineasOriginales = self.lineas;
    self.inicializarLineas = function (lineas, forzar = false) {
        self.lineasPropias = [];
        self.lineasNoPropias = [];
        for (var i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            linea.depositoPropio ? self.lineasPropias.push(linea) : self.lineasNoPropias.push(linea);
        }
        if (!forzar && (self.visualizar || self.condicion !== CONDICION_CONTADO)) {
            //No cambiamos las líneas si estamos visualizando o no es condición
            //contado
            return;
        }
        self.lineasOriginales(self.lineasPropias);
    };
    self.inicializarLineas(self.lineasOriginales());

    self.lineas = ko.pureComputed(function () {
        const salida = [];
        const subtipo = self.subtipo();
        const editar = self.editar;
        const visualizar = self.visualizar;
        const lineas = self.lineasOriginales();

        if (subtipo === SUBTIPO_NOTA_CREDITO || visualizar || editar) {
            return lineas;
        }

        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            if (linea.pendienteFacturacion > 0 || linea.id <= 0) {
                salida.push(linea);
            }
        }
        return salida;
    });
    self.incluirDeOtrosDepositos = function () {
        for (var i = 0; i < self.lineasNoPropias.length; i++) {
            const linea = self.lineasNoPropias[i];
            self.lineasOriginales.push(linea);
        }
    };
    self.quitarDeOtrosDepositos = function () {
        for (var i = 0; i < self.lineasNoPropias.length; i++) {
            const linea = self.lineasNoPropias[i];
            self.lineasOriginales.remove(linea);
        }
    };

    self.deposito = ko.observable('');
    self.deposito.subscribe(function (deposito) {
        if (deposito !== undefined) {
            self.inicializarDepositos(deposito);
        }
    });

    const mostrarTabla = self.tieneOrdenes && !self.sinLineas;
    self.mostrarTabla = ko.observable(mostrarTabla);

    /**
     * Calcula el monto correspondiente al IVA del comprobante.
     */
    self.ivaMonto = ko.pureComputed(function () {
        var total = 0;
        const detalle = self.mostrarTabla();
        const ivaGeneral = self.ivaGeneral();
        const totalGeneral = self.totalGeneral();
        const lineas = self.lineas();
        const discriminarIva = self.discriminarIva();

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            var iva = linea.ivaMonto();

            total += iva;
        }

        if (!detalle) {
            //Verificamos luego de iterar las líneas para que haya dependencia con las mismas
            total = totalGeneral * ivaGeneral / 100;
        }

        //Verificamos luego de iterar las líneas para que haya dependencia con las mismas
        if (!discriminarIva) {
            return 0;
        }

        //Si hay descuento general, debemos aplicarlo al iva
        var ivaDescontado = self.aplicarDescuento(total);
        return ivaDescontado;
    });

    /**
     * Calcula el total de impuestos del comprobante.
     */
    self.totalImpuestos = ko.pureComputed(function () {
        var tipoNC = self.comprobarTipoNotaCredito();
        if (tipoNC) {
            return 0;
        }

        var total = 0;
        var impuestos = self.impuestos();
        impuestos.forEach((impuesto) => {
            total += impuesto.getTotal();
        });
        return total;
    });

    self.totalGeneralTexto = ko.pureComputed(function () {
        const discrimina = self.discriminarIva();
        return discrimina ? 'Subtotal *' : 'Total *';
    });

    /**
     * Calcula el total sin impuestos, es decir el subtotal + iva
     */
    self.totalSinImpuestos = ko.pureComputed(function () {
        const iva = self.ivaMonto();
        const total = self.total();
        const final = total + iva;
        return final;
    });

    /**
     * Calcula el total más impuestos.
     */
    self.totalFinal = ko.pureComputed(function () {
        const total = self.totalSinImpuestos();
        const impuestos = self.totalImpuestos();
        const final = total + impuestos;
        return final;
    });

    //<editor-fold defaultstate="collapsed" desc="Descuentos">
    /**
     * Devuelve el monto dado descontado el porcentaje correspondiente.
     *
     * @param {float} monto
     * @returns {float}
     */
    self.aplicarDescuento = function (monto) {
        var descuento = self.getDescuento(monto);
        return monto - descuento;
    };

    /**
     * Devuelve la cantidad que debe ser descontada del subtotal.
     *
     * @param {float} subtotal
     * @returns {float}
     */
    self.getDescuento = function (subtotal) {
        var tipoNC = self.comprobarTipoNotaCredito();
        var porcentaje = self.descuento();
        if (tipoNC || porcentaje < 0 || porcentaje > 100) {
            return 0;
        }
        return self.calcularDescuento(subtotal, porcentaje);
    };

    /**
     * Calcula el descuento.
     *
     * @param {float} subtotal
     * @param {float} porcentaje
     * @returns {float}
     */
    self.calcularDescuento = function (subtotal, porcentaje) {
        if (porcentaje === 0) {
            return 0.0;
        }
        var calculado = subtotal / 100 * porcentaje;
        var redondeado = calculado.toFixed(2);
        var descontado = parseFloat(redondeado);
        return descontado;
    };
    //</editor-fold>

    /**
     * Selecciona los depósitos de las líneas con el depósito seleccionado
     * en el select superior.
     *
     * @param {koDeposito} deposito
     * @returns {void}
     */
    self.inicializarDepositos = function (deposito) {
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            linea.deposito(deposito);
        }
    };

    /**
     * Vuelve atrás todos los cambios realizados sobre las líneas.
     *
     * @returns {void}
     */
    self.reestablecerLineas = function () {
        const lineas = ko.mapping.fromJS(js.lineas, opcionesPantalla.lineas)();
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            linea.comprobante = self;
        }
        self.inicializarLineas(lineas, true);
    };

    /**
     * Devuelve los datos del comprobante de compra necesarios para persistirlo.
     *
     * @returns {Object}
     */
    self.getDatos = function () {
        const iva = self.ivaMonto();
        const fecha = self.fecha();
        const letra = self.letra();
        const total = self.totalSinImpuestos();
        const numero = self.numero();
        const detalle = self.detalle();
        const subtipo = self.subtipo();
        const subtotal = self.subtotal();
        const descuento = self.descuento();
        const impuestos = self.getDatosImpuestos();
        const descontado = self.descontado();
        const puntoDeVentaAfip = self.puntoDeVentaAfip();

        //Evitamos que se envíen líneas si se cargaron y luego se desmarcó
        //"Detalle de artículos".
        const tieneLineas = self.mostrarTabla();
        const lineas = tieneLineas ? self.getDatosLineas() : [{
            iva: IVA_DEFECTO,
            precio: total,
            cantidad: 1,
            descuento: 0,
            descripcion: detalle
        }];


        var proveedor = self.proveedor();
        var idProveedor = proveedor !== undefined ? proveedor.id : 0;
        return {
            fecha: fecha,
            letra: letra,
            total: total,
            lineas: lineas,
            numero: numero,
            subtipo: subtipo,
            subtotal: subtotal,
            descuento: descuento,
            impuestos: impuestos,
            proveedor: idProveedor,
            condicion: self.condicion,
            descontado: descontado,
            observaciones: detalle,
            puntoDeVentaAfip: puntoDeVentaAfip
        };
    };

    /**
     * Devuelve los datos de las líneas necesarios para la persistencia del
     * comprobante de compra.
     *
     * @returns {Array}
     */
    self.getDatosLineas = function () {
        var datos = [];
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            var datoLinea = linea.getDatos();
            datos.push(datoLinea);
        }
        return datos;
    };

    /**
     * Devuelve los datos de los impuestos necesarios para la persistencia del
     * comprobante de compra.
     *
     * @returns {Array}
     */
    self.getDatosImpuestos = function () {
        var tipoNC = self.comprobarTipoNotaCredito();
        if (tipoNC) {
            return [];
        }

        var datos = [];
        var impuestos = self.impuestos();
        for (var i = 0; i < impuestos.length; i++) {
            var impuesto = impuestos[i];
            var dato = impuesto.getDatos();
            datos.push(dato);
        }
        return datos;
    };

    //<editor-fold defaultstate="collapsed" desc="Inputs comprobante">

    self.focusNumero = ko.observable(false);
    self.focusPuntoDeVenta = ko.observable(false);

    if (!ko.isObservable(self.proveedor)) {
        self.proveedor = ko.observable(self.proveedor);
    }

    /**
     * Devuelve el número rellenándolo con ceros al inicio dependiendo de la
     * cantidad de ceros que se desee.
     *
     * @param {Number} numero
     * @param {Number} ceros
     * @returns {void}
     */
    self.getNumeroConCeros = function (numero, ceros) {
        var numeroSinCeros = numero.replace(/^0+/, '');
        var cantidad = numeroSinCeros.toString().length;
        if (cantidad === ceros) {
            return numeroSinCeros;
        }

        var formateado = numeroSinCeros.padStart(ceros, '0');
        return formateado;
    };

    //<editor-fold defaultstate="collapsed" desc="Suscripciones">

    /**
     * Calcula el tipo de comprobante según el subtipo.
     */
    self.tipo = ko.pureComputed(function () {
        var subtipo = self.subtipo();
        if (subtipo === SUBTIPO_NOTA_CREDITO) {
            return TIPO_NOTA_CREDITO_COMPRA;
        }
        return TIPO_FACTURA_COMPRA;
    });

    self.letraCalcular = function (proveedor) {
        var iva = proveedor.iva;
        var ivas = self.ivas;
        var datosIva = ivas.find(x => x.iva === iva);
        if (datosIva !== undefined && datosIva.letra !== undefined) {
            var letra = datosIva.letra;
            return letra;
        }
        return "";
    };

    self.comprobarLetraAutomatica = ko.pureComputed(function () {
        const subtipo = self.subtipo();
        const proveedor = self.proveedor();

        return proveedor !== undefined && subtipo !== SUBTIPO_FACTURA_OTROS;
    });
    self.letraManual = ko.observable(js.letra);
    self.letra = ko.pureComputed(function () {
        const manual = self.letraManual();
        const automatica = self.comprobarLetraAutomatica();
        const proveedor = self.proveedor();

        if (!automatica) {
            return manual;
        }

        return self.letraCalcular(proveedor);
    });

    self.discriminarIva = ko.pureComputed(function () {
        const letra = self.letra();
        const subtipo = self.subtipo();
        return letra === LETRA_A && subtipo !== SUBTIPO_FACTURA_OTROS;
    });

    /**
     * Subscriber que corta el punto de venta afip una vez que se ingresan más
     * de 4 números.
     *
     * @param {koPuntoVenta} puntoDeVenta
     */
    self.puntoDeVentaAfip.subscribe(function (puntoDeVenta) {
        var salida = puntoDeVenta;
        var longitud = puntoDeVenta.toString().length;
        if (longitud > 4) {
            salida = puntoDeVenta.substr(0, 4);
            self.puntoDeVentaAfip(salida);
        }
    });

    /**
     * Subscriber que corta el número una vez que se ingresan más de 8 números.
     *
     * @param {int} numero
     */
    self.numero.subscribe(function (numero) {
        var salida = numero;
        var longitud = numero.toString().length;
        if (longitud > 8) {
            salida = numero.substr(0, 8);
            self.numero(salida);
        }
    });

    /**
     * Subscriber del foco del punto de venta afip, al perder el foco lo rellena
     * con ceros.
     *
     * @param {bool} foco
     */
    self.focusPuntoDeVenta.subscribe(function (foco) {
        if (!foco) {
            var puntoDeVentaAfip = self.puntoDeVentaAfip();
            if (puntoDeVentaAfip === '' || parseInt(puntoDeVentaAfip) < 0) {
                return;
            }

            let nuevo = self.getNumeroConCeros(puntoDeVentaAfip, 4);
            self.puntoDeVentaAfip(nuevo);
        }
    });

    /**
     * Subscriber del foco del número, al perder el foco lo rellena con ceros.
     *
     * @param {bool} foco
     */
    self.focusNumero.subscribe(function (foco) {
        if (!foco) {
            var numero = self.numero();
            if (numero === '' || parseInt(numero) < 0) {
                return;
            }

            let nuevo = self.getNumeroConCeros(numero, 8);
            self.numero(nuevo);
        }
    });
    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Labels">
    self.labelLetra = ko.pureComputed(function () {
        var subtipo = self.subtipo();
        var label = "Letra";
        if (subtipo !== SUBTIPO_FACTURA_OTROS) {
            label += " *";
        }
        return label;
    });

    self.labelPuntoDeVenta = ko.pureComputed(function () {
        var subtipo = self.subtipo();
        var label = "Punto de venta";
        if (subtipo !== SUBTIPO_FACTURA_OTROS) {
            label += " *";
        }
        return label;
    });

    self.labelNumero = ko.pureComputed(function () {
        var subtipo = self.subtipo();
        var label = "Número";
        if (subtipo !== SUBTIPO_FACTURA_OTROS) {
            label += " *";
        }
        return label;
    });
    //</editor-fold>

    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Alta/baja de líneas">
    /**
     * Agrega una nueva línea al comprobante de compra a partir de la
     * presentación.
     *
     * @param {Object} presentacion
     * @returns {void}
     */
    self.agregarLinea = function (presentacion) {
        var linea = self.nuevaLinea(presentacion);
        var deposito = self.deposito();
        if (deposito !== undefined) {
            linea.deposito(deposito);
        }
        self.lineasOriginales.push(linea);
    };

    /**
     * Devuelve una nueva koLinea con los datos por defecto.
     *
     * @param {koPresentacion} presentacion
     * @returns {koLinea}
     */
    self.nuevaLinea = function (presentacion) {
        var nombre = presentacion.nombreLargo;
        var nueva = {
            id: 0,
            iva: IVA_DEFECTO,
            numero: "",
            precio: "",
            deposito: "",
            cantidad: "",
            descuento: "",
            operaciones: [],
            orden: {
                numero: ""
            },
            presentacion: {
                id: presentacion.id,
                unidad: presentacion.unidad,
                nombre: nombre,
                nombreLargo: nombre
            },
            pendienteEntrega: "",
            pendienteFacturacion: ""
        };

        opcionesPantalla["observe"] = observeLineas;
        var linea = new koLinea(nueva, self, opcionesPantalla);
        return linea;
    };

    /**
     * Quita la línea del comprobante de compra.
     *
     * @param {koLinea} linea
     * @returns {void}
     */
    self.quitarLinea = function (linea) {
        self.lineasOriginales.remove(linea);
    };
    //</editor-fold>

    /**
     * Devuelve el total del comprobante de compra, si tiene líneas devuelve la
     * sumatoria del total de las líneas, sino devuelve lo ingresado en el input
     * total.
     */
    self.subtotal = ko.pureComputed(function () {
        var tieneLineas = self.mostrarTabla();
        if (!tieneLineas) {
            var total = self.totalGeneral();
            var totalFloat = parseFloat(total);
            var totalValido = !isNaN(totalFloat);
            return totalValido ? totalFloat : 0;
        }

        var lineas = self.lineas();
        if (tieneLineas && lineas.length === 0) {
            return 0;
        }

        var subtotal = 0;
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            var total = linea.total();
            subtotal += total;
        }
        return subtotal;
    });

    self.descontado = ko.observable("");

    /**
     * Devuelve el total del comprobante de compra luego de aplicar el descuento
     * general.
     */
    self.total = ko.computed(function () {
        var tipoNC = self.comprobarTipoNotaCredito();
        var subtotal = self.subtotal();
        var descuento = self.descuento();
        var descuentoFloat = parseFloat(descuento);
        var descuentoValido = !isNaN(descuentoFloat) && descuento !== "";
        if (tipoNC || (!tipoNC && !descuentoValido)) {
            self.descontado("");
            return subtotal;
        }

        var total = self.aplicarDescuento(subtotal);
        var descontado = subtotal - total;
        self.descontado(descontado);
        return total;
    });

    //<editor-fold defaultstate="collapsed" desc="Impuestos">
    /**
     * Crea un nuevo impuesto con sus datos por defecto.
     *
     * @returns {koImpuesto}
     */
    self.nuevoImpuesto = function () {
        const nuevo = {
            id: 0,
            total: "",
            impuesto: {},
            observaciones: ""
        };

        opcionesPantalla["observe"] = observeImpuestos;
        return new koImpuesto(nuevo, self, opcionesPantalla);
    };

    /**
     * Crea y agrega un impuesto al comprobante con sus datos por defecto.
     *
     * @returns {void}
     */
    self.agregarImpuesto = function () {
        const impuesto = self.nuevoImpuesto();
        self.impuestos.push(impuesto);
    };

    /**
     * Quita un impuesto de los impuestos del comprobante.
     *
     * @param {koImpuesto} impuesto
     * @returns {void}
     */
    self.quitarImpuesto = function (impuesto) {
        self.impuestos.remove(impuesto);
    };
    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Comprobaciones">
    /**
     * Devuelve true si los datos a guardar del comprobante de compra son
     * válidos.
     *
     * @param {Boolean} mostrar Si es true muestra los mensajes de error.
     * @returns {Boolean}
     */
    self.comprobarValidez = function (mostrar) {
        var errores = [];
        var validarLineas = self.mostrarTabla();

        var fecha = moment(self.fecha());
        if (!fecha.isValid()) {
            errores.push("La fecha es inválida.");
        }

        var proveedor = self.proveedor();
        if (!proveedor || isNaN(proveedor.id)) {
            errores.push("Debe seleccionar un proveedor.");
        }

        var subtipo = self.subtipo();
        if (subtipo === "") {
            errores.push(`Debe elegir el tipo de comprobante de compra.`);
        }

        var numeroValido = true;
        if (subtipo !== SUBTIPO_FACTURA_OTROS) {
            numeroValido = self.comprobarNumeroComprobanteValido(mostrar);
        }

        var detalle = self.detalle();
        if (!validarLineas && detalle === '') {
            errores.push(`Debe indicar un detalle del comprobante de compra.`);
        }

        var descuento = self.descuento();
        var descuentoFloat = parseFloat(descuento);
        var descuentoNegativo = !isNaN(descuentoFloat) && descuentoFloat < 0.00;
        if (descuentoNegativo) {
            errores.push(`La bonificación del comprobante de compra no puede ser negativa.`);
        }

        var descuentoInvalido = !isNaN(descuentoFloat) && descuentoFloat > 100.00;
        if (descuentoInvalido) {
            errores.push(`La bonificación del comprobante de compra no puede ser mayor a 100.`);
        }

        var totalGeneral = self.totalGeneral();
        var totalGeneralFloat = parseFloat(totalGeneral);
        if (!validarLineas && isNaN(totalGeneralFloat)) {
            errores.push("El total del comprobante de compra no puede estar vacío.");
        }

        var lineas = self.lineas();
        var lineasValidas = true;
        if (validarLineas && lineas.length === 0) {
            errores.push("Debe agregar al menos un artículo.");
        }

        var total = self.total();
        var totalFloat = parseFloat(total);
        if (!isNaN(totalFloat) && totalFloat <= 0) {
            errores.push("El total del comprobante de compra debe ser mayor a cero.");
        }

        if (validarLineas) {
            for (var i = 0; i < lineas.length; i++) {
                var linea = lineas[i];
                var valida = linea.comprobarValidez(mostrar);
                if (!valida) {
                    lineasValidas = false;
                }
            }
        }

        var totalesValidos = true;
        var impuestosValidos = true;
        var decimalesTotalesValidos = true;

        var tipoNC = self.comprobarTipoNotaCredito();
        var impuestos = tipoNC ? [] : self.impuestos();
        var idImpuestos = new Set();
        for (var i = 0; i < impuestos.length; i++) {
            var impuesto = impuestos[i];
            var impuestoValido = impuesto.comprobarImpuestoValido();
            if (!impuestoValido) {
                impuestosValidos = false;
            }

            var idImpuesto = impuesto.getIdImpuesto();
            if (!isNaN(idImpuesto)) {
                idImpuestos.add(idImpuesto);
            }

            var totalValido = impuesto.comprobarTotalValido();
            if (!totalValido) {
                totalesValidos = false;
            }

            var decimalesTotalValido = impuesto.comprobarDecimalesTotalValido();
            if (!decimalesTotalValido) {
                decimalesTotalesValidos = false;
            }
        }

        var impuestosUnicos = idImpuestos.size;
        var cantidadImpuestos = impuestos.length;
        if (!tipoNC && cantidadImpuestos > impuestosUnicos) {
            errores.push("Los impuestos a aplicar no pueden repetirse.");
        }

        if (!tipoNC && !impuestosValidos) {
            errores.push("Debe seleccionar el impuesto para todos los impuestos agregados.");
        }

        if (!tipoNC && !totalesValidos) {
            errores.push("El total de cada impuesto agregado debe ser mayor a cero.");
        }

        if (!tipoNC && !decimalesTotalesValidos) {
            errores.push("El total de los impuestos no puede tener más de dos decimales.");
        }

        if (mostrar) {
            errores.forEach(error => Notificacion(error, "error"));
        }

        return numeroValido && lineasValidas && errores.length === 0;
    };

    /**
     * Devuelve true si la letra, el número y el punto de venta tiene valores
     * válidos.
     *
     * @param {Boolean} mostrar Si es true muestra los mensajes de error.
     * @returns {Boolean}
     */
    self.comprobarNumeroComprobanteValido = function (mostrar) {
        var errores = [];

        var letra = self.letra();
        if (letra === '') {
            errores.push(`La letra del comprobante de compra no puede estar vacía.`);
        }

        var puntoDeVentaAfip = self.puntoDeVentaAfip();
        if (isNaN(puntoDeVentaAfip) || puntoDeVentaAfip === '') {
            errores.push(`El punto de venta del comprobante de compra es requerido.`);
        }

        var puntoDecimalValido = self.comprobarDecimalesValidos(puntoDeVentaAfip, 0);
        if (!puntoDecimalValido) {
            errores.push(`El punto de venta del comprobante de compra no puede tener decimales.`);
        }

        var afip = parseInt(puntoDeVentaAfip);
        if (!isNaN(puntoDeVentaAfip) && afip <= 0) {
            errores.push(ERROR_COMPROBANTE_PUNTO_DE_VENTA_AFIP);
        }

        var numero = self.numero();
        if (isNaN(numero) || numero === '') {
            errores.push(`El número del comprobante de compra es requerido.`);
        }

        var numeroFloat = parseFloat(numero);
        if (!isNaN(numero) && numeroFloat <= 0.00) {
            errores.push(ERROR_COMPROBANTE_NUMERO);
        }

        var numeroDecimalValido = self.comprobarDecimalesValidos(numero, 0);
        if (!numeroDecimalValido) {
            errores.push(`El número del comprobante de compra no puede tener decimales.`);
        }

        if (mostrar) {
            errores.forEach(error => Notificacion(error, "error"));
        }

        return errores.length === 0;
    };

    /**
     * Devuelve true si la cantidad de decimales del número no excede la
     * cantidad definida en el parámetro 'decimales'.
     *
     * @param {Number} numero
     * @param {Number} decimales Cantidad de decimales a comprobar.
     * @returns {Boolean}
     */
    self.comprobarDecimalesValidos = function (numero, decimales = 2) {
        var parteDecimal = numero.toString().split(".")[1];
        var cantidad = parteDecimal !== undefined ? parteDecimal.length : 0;
        return cantidad <= decimales;
    };

    /**
     * Devuelve true si el comprobante de compra es una nota de crédito de
     * compra.
     */
    self.comprobarTipoNotaCredito = ko.pureComputed(function () {
        var tipo = self.tipo();
        return tipo === TIPO_NOTA_CREDITO_COMPRA;
    });

    self.comprobarOtrosIncluidos = ko.pureComputed(function () {
        const lineas = self.lineasOriginales();
        for (var i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            if (linea.depositoNoPropio) {
                return true;
            }
        }
        return false;
    });

    self.comprobarOtrosNoIncluidos = ko.pureComputed(function () {
        return !self.comprobarOtrosIncluidos();
    });

    self.comprobarMostrarAgregarQuitarOtros = self.tieneOrdenes && self.lineasNoPropias.length > 0 && !self.editar;

    self.comprobarMostrarReestablecer = self.tieneOrdenes && !self.visualizar && !self.editar;
    //</editor-fold>

}

function koLinea(js, comprobante, opciones) {
    this.reestablecer = function () {
        ko.mapping.fromJS(js, opciones, this);
    };
    this.reestablecer();
    const self = this;

    self.ivaPorcentaje = ko.observable(self.iva);

    self.comprobante = comprobante;

    //Es importante declarar self.depositoNoPropio primero porque depende de
    //self.depositoPropio. Además una línea puede ser false en ambas si es
    //agregada manualmente.
    self.depositoNoPropio = self.depositoPropio !== undefined && !self.depositoPropio;
    self.depositoPropio = self.depositoPropio !== undefined && self.depositoPropio;

    self.cantidadStep = self.presentacion.unidad === CANTIDAD_UNIDAD ? "1" : "0.01";

    /**
     * Devuelve el total de la línea, multiplica la cantidad por el precio y
     * luego le aplica el descuento.
     */
    self.total = ko.pureComputed(function () {
        var precio = self.precio();
        var precioFloat = parseFloat(precio);
        var precioValido = !isNaN(precio) && precio !== "";

        var cantidad = self.cantidad();
        var cantidadFloat = parseFloat(cantidad);
        var cantidadValida = !isNaN(cantidad) && cantidad !== "";

        if (!precioValido || !cantidadValida) {
            return 0;
        }

        var total = precioFloat * cantidadFloat;
        var tipoNC = self.comprobarTipoNotaCredito();
        var descuento = self.descuento();
        var descuentoFloat = parseFloat(descuento);
        var descuentoValido = !isNaN(descuento) && descuento !== "";
        if (!descuentoValido || tipoNC) {
            return total;
        }

        var porcentaje = descuentoFloat / 100;
        var descontado = total * porcentaje;
        return total - descontado;
    });

    self.precioIvaIncluido = ko.pureComputed(function () {
        //El precio es sin iva si es comprobante "A" o iva incluido en otros casos
        const cantidad = self.cantidad();
        const letra = self.comprobante.letra();
        const precio = parseFloat(self.precio());
        const porcentaje = self.ivaPorcentaje();
        const iva = self.ivaCalcular(precio, porcentaje);

        return letra === LETRA_A ? precio + iva : precio;
    });

    if (!ko.isObservable(self.deposito)) {
        self.deposito = ko.observable(self.deposito);
    }

    self.ivaCalcular = function (total, porcentaje) {
        const ivaMonto = total * porcentaje / 100;
        return Math.round((ivaMonto + Number.EPSILON) * 100) / 100;
    };

    /**
     * Calcula el monto correspondiente al IVA de la línea a partir del total.
     */
    self.ivaMonto = ko.computed(function () {
        const total = self.total();
        const porcentaje = self.ivaPorcentaje();
        return self.ivaCalcular(total, porcentaje);
    });

    /**
     * Clase de la fila de la línea que alerta al usuario que existe un
     * excedente mediante el color table-danger de boostrap.
     */
    self.clase = ko.pureComputed(function () {
        var entrega = self.comprobarExcedePendienteEntrega();
        var facturacion = self.comprobarExcedePendienteFacturacion();
        var excede = entrega || facturacion;
        return excede ? "table-danger" : "";
    });

    /**
     * Devuelve los datos de la línea necesarios para su persistencia.
     *
     * @returns {Object}
     */
    self.getDatos = function () {
        const iva = self.ivaPorcentaje();
        const total = self.total();
        const precio = self.precioIvaIncluido();
        const tipoNC = self.comprobarTipoNotaCredito();
        const idLinea = self.id;
        const idOrden = self.orden.id;
        const cantidad = self.cantidad();
        const descuento = self.descuento();
        const numeroOrden = self.orden.numero;
        const presentacion = self.presentacion;
        const deposito = self.deposito();
        const idDeposito = !tipoNC && deposito !== undefined ? deposito.id : 0;

        return {
            'iva': iva,
            'total': total,
            'precio': precio,
            'idLinea': idLinea,
            'idOrden': idOrden !== undefined ? idOrden : 0,
            'cantidad': cantidad,
            'deposito': idDeposito,
            'descuento': descuento,
            'numeroOrden': numeroOrden,
            'descripcion': presentacion.nombre,
            'presentacion': presentacion
        };
    };

    /**
     * Devuelve true si la línea es válida, para ello debe tener cantidad y
     * precio mayor a cero y un descuento entre 0 y 100.
     *
     * @param {Boolean} mostrar Si es true muestra los mensajes de error.
     * @returns {Boolean}
     */
    self.comprobarValidez = function (mostrar) {
        var errores = [];

        var presentacion = self.presentacion;
        var nombre = presentacion.nombre;

        var cantidad = self.cantidad();
        var cantidadFloat = parseFloat(cantidad);
        if (isNaN(cantidadFloat) || cantidadFloat <= 0.00) {
            errores.push(`La cantidad del artículo ${nombre} debe ser mayor a cero.`);
        }

        var comprobante = self.comprobante;
        var cantidadDecimalValida = comprobante.comprobarDecimalesValidos(cantidad);
        if (!cantidadDecimalValida) {
            errores.push(`La cantidad del artículo ${nombre} no puede tener más de dos decimales.`);
        }

        var precio = self.precio();
        var precioFloat = parseFloat(precio);
        if (isNaN(precioFloat) || precioFloat <= 0.00) {
            errores.push(`El precio del artículo ${nombre} debe ser mayor a cero.`);
        }

        var precioDecimalValido = comprobante.comprobarDecimalesValidos(precio);
        if (!precioDecimalValido) {
            errores.push(`El precio del artículo ${nombre} no puede tener más de dos decimales.`);
        }

        var descuento = self.descuento();
        var descuentoFloat = parseFloat(descuento);
        var descuentoNegativo = !isNaN(descuentoFloat) && descuentoFloat < 0.00;
        if (descuentoNegativo) {
            errores.push(`El descuento del artículo ${nombre} no puede ser negativo.`);
        }

        var descuentoDecimalValido = comprobante.comprobarDecimalesValidos(descuento);
        if (!descuentoDecimalValido) {
            errores.push(`El descuento del artículo ${nombre} no puede tener más de dos decimales.`);
        }

        var descuentoInvalido = !isNaN(descuentoFloat) && descuentoFloat > 100.00;
        if (descuentoInvalido) {
            errores.push(`El descuento del artículo ${nombre} no puede ser mayor a 100.`);
        }

        if (koComprobanteCompra.entregaMercaderiaObligatoria
            && (self.deposito() === null || self.deposito() === undefined)
        ) {
            errores.push(`Debe especificar el depósito del artículo ${nombre}.`);
        }

        if (mostrar) {
            errores.forEach(error => Notificacion(error, "error"));
        }

        return errores.length === 0;
    };

    /**
     * Devuelve true si la cantidad a facturar de la línea excede la cantidad
     * pendiente de facturación.
     */
    self.comprobarExcedePendienteFacturacion = ko.pureComputed(function () {
        const tipoNC = self.comprobarTipoNotaCredito();
        if (tipoNC) {
            return false;
        }
        const pendiente = self.pendienteFacturacion;
        return self.comprobarCantidadExcedePendiente(pendiente);
    });

    /**
     * Devuelve true si la cantidad a facturar de la línea excede la cantidad
     * pendiente de entrega y existe un depósito seleccionado.
     */
    self.comprobarExcedePendienteEntrega = ko.pureComputed(function () {
        const pendiente = self.pendienteEntrega;
        const deposito = self.deposito();
        const tieneDeposito = deposito !== undefined;
        if (!tieneDeposito) {
            return false;
        }

        return self.comprobarCantidadExcedePendiente(pendiente);
    });

    /**
     * Devuelve true si la cantidad excede el parámetro 'pendiente'.
     *
     * @param {Number} pendiente
     * @returns {Boolean}
     */
    self.comprobarCantidadExcedePendiente = function (pendiente) {
        const cantidad = self.cantidad();
        const cantidadFloat = !isNaN(cantidad) ? parseFloat(cantidad) : 0;
        const pendienteFloat = !isNaN(pendiente) ? parseFloat(pendiente) : 0;
        return cantidadFloat > 0.00 && cantidadFloat > pendienteFloat;
    };

    /**
     * Devuelve true si el comprobante de la línea es una nota de crédito.
     */
    self.comprobarTipoNotaCredito = ko.pureComputed(function () {
        var tipo = typeof (koComprobanteCompra);
        if (tipo === "undefined") {
            return false;
        }

        var tipo = koComprobanteCompra.comprobante.tipo();
        return tipo === TIPO_NOTA_CREDITO_COMPRA;
    });

    self.idTooltip = self.id + "-tooltip";

    /**
     * Devuelve el título que indica que existe un excedente de cantidad según el pendiente
     * de entrega o facturación.
     *
     * Además al cambiar el título actualiza el tooltipster.
     */
    self.titleExcedente = ko.pureComputed(function () {
        var excedeEntrega = self.comprobarExcedePendienteEntrega();
        var excedeFacturacion = self.comprobarExcedePendienteFacturacion();
        if (!excedeEntrega && !excedeFacturacion) {
            return "";
        }

        var texto = "";
        if (excedeEntrega && excedeFacturacion) {
            texto = "la cantidad pendiente de facturación y de entrega.";
        } else if (excedeEntrega) {
            texto = "la cantidad pendiente de entrega.";
        } else if (excedeFacturacion) {
            texto = "la cantidad pendiente de facturación.";
        }

        var tipoNC = self.comprobarTipoNotaCredito();
        var verbo = tipoNC ? "reembolsar" : "facturar";
        var title = `La cantidad a ${verbo} excede ` + texto;
        var id = self.idTooltip;
        var busqueda = "#" + id;
        var $tooltip = $(busqueda);
        $tooltip.tooltipster('content', title);
        return title;
    });

}

function koImpuesto(js, comprobante, opciones) {
    ko.mapping.fromJS(js, opciones, this);
    const self = this;

    if (typeof self.impuesto === "object") {
        self.impuesto = ko.observable(self.impuesto);
    }

    /**
     * Quita el impuesto del comprobante.
     *
     * @param {koImpuesto} impuesto
     * @returns {void}
     */
    self.quitarImpuesto = function (impuesto) {
        comprobante.quitarImpuesto(impuesto);
    };

    /**
     * Devuelve el total en formato float. Si está vacío devuelve cero.
     *
     * @returns {float}
     */
    self.getTotal = function () {
        var total = self.total();
        if (isNaN(total) || total === "") {
            return 0;
        }

        var redondear = parseFloat(total);
        var redondeado = redondear.toFixed(2);
        var totalFloat = parseFloat(redondeado);
        return totalFloat;
    };

    /**
     * Devuelve los datos del impuesto necesarios para su persistencia.
     *
     * @returns {Object}
     */
    self.getDatos = function () {
        var total = self.total();
        var impuesto = self.getIdImpuesto();
        var observaciones = self.observaciones();
        return {
            'total': total,
            'impuesto': impuesto,
            'observaciones': observaciones
        };
    };

    /**
     * Devuelve el id del impuesto seleccionado.
     *
     * @returns {int}
     */
    self.getIdImpuesto = function () {
        var valido = self.comprobarImpuestoValido();
        if (valido) {
            var impuesto = self.impuesto();
            var id = impuesto.id;
            return parseInt(id);
        }
        return 0;
    };

    //<editor-fold defaultstate="collapsed" desc="Comprobaciones">
    /**
     * Devuelve true si el impuesto tiene seleccionado un impuesto.
     *
     * @returns {Boolean}
     */
    self.comprobarImpuestoValido = function () {
        const impuesto = self.impuesto();
        if (impuesto === undefined || isNaN(impuesto.id) || impuesto.id <= 0) {
            return false;
        }
        return true;
    };

    /**
     * Devuelve true si el total tiene un valor numérico mayor a cero.
     *
     * @returns {Boolean}
     */
    self.comprobarTotalValido = function () {
        var total = self.total();
        return total !== undefined && total !== "" && !isNaN(total) && total > 0.00;
    };

    /**
     * Devuelve true si el total tiene dos decimales o menos.
     *
     * @returns {Boolean}
     */
    self.comprobarDecimalesTotalValido = function () {
        var total = self.total();
        var totalValido = self.comprobarTotalValido();
        var decimalesValidos = totalValido ? comprobante.comprobarDecimalesValidos(total) : true;
        return decimalesValidos;
    };
    //</editor-fold>

}

function koTipo(js, opciones) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

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

}
