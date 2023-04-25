//<editor-fold defaultstate="collapsed" desc="Configuración">
var configPrecio = {
    key: function (data) {
        return ko.utils.unwrapObservable(data.id);
    },
    create: function (options) {
        opcionesPantalla["observe"] = [];
        var objeto = new koPrecio(options.data, opcionesPantalla);
        return objeto;
    },
    update: function (options) {
        ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
        return options.target;
    }
};

var opcionesPantalla = {
    'observe': ["productos", "opcion"],
    'productos': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = ["precios", "precioVigente"];
            var objeto = new koProducto(options.data, opcionesPantalla);
            return objeto;
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'precios': configPrecio,
    'precioVigente': configPrecio,
    'categorias': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = [""];
            var objeto = new koCategoria(options.data, opcionesPantalla);
            return objeto;
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    },
    'lista': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            opcionesPantalla["observe"] = [""];
            var objeto = new koLista(options.data, opcionesPantalla);
            return objeto;
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
            return options.target;
        }
    }
};

//</editor-fold>

function koProducto(json, opciones) {
    ko.mapping.fromJS(json, opciones, this);
    var self = this;

    if (!ko.isObservable(self.precioVigente)) {
        self.precioVigente = ko.observable(self.precioVigente);
    }

    var fecha = self.precioVigente().fecha();
    var stringFecha = moment(fecha, "YYYY-MM-DD").format("DD/MM/YYYY");
    self.fechaPrecioVigente = ko.observable(stringFecha);
    self.seleccionado = ko.observable(false);
    self.ajaxCrearPrecio = ko.observable(false);
    self.ajaxQuitarPrecio = ko.observable(false);

    /**
     * Crea y devuelve un nuevo koPrecio sin agregarlo a la colección de precios.
     *
     * @param {Number} precio
     * @param {String} fecha
     * @param {Boolean} vigente
     * @param {Number} margen
     * @param {Number} margenMonto
     * @returns {koPrecio}
     */
    self.nuevoPrecio = function (precio, fecha, vigente, margen, margenMonto) {
        const dummy = {
            fecha: fecha,
            precio: precio,
            margen: margen,
            margenMonto: margenMonto,
            vigente: vigente
        };
        opcionesPantalla["observe"] = [];
        return new koPrecio(dummy, opcionesPantalla);
    };

    /**
     * Actualiza el precio vigente del producto, en caso que sea un precio
     * futuro lo agrega a la colección de precios.
     *
     * @param {Number} precio
     * @param {String} fecha
     * @param {Boolean} vigente
     * @param {Number} margen
     * @param {Number} margenMonto
     * @returns {void}
     */
    self.actualizarPrecioVigente = function (precio, fecha, vigente, margen, margenMonto) {
        const fechaMoment = moment(fecha, 'YYYY-MM-DD');
        const buscado = self.precios().find(actual => {
            const fechaActual = actual.fecha();
            const actualMoment = moment(fechaActual);
            return actualMoment.isSame(fechaMoment, 'day');
        });

        const encontrado = buscado !== undefined;
        if (encontrado && vigente) {
            self.precioVigente(buscado);
        }

        if (vigente) {
            self.precios().forEach(p => p.vigente(false));
        }

        //Si lo encontró entonces no hace falta crear un precio nuevo.
        if (encontrado) {
            buscado.precio(precio);
            buscado.fecha(fecha);
            buscado.vigente(vigente);
            buscado.margen(margen);
            buscado.margenMonto(margenMonto);
            return;
        }

        const nuevo = self.nuevoPrecio(precio, fecha, vigente, margen, margenMonto);
        self.precios.push(nuevo);
        self.precios.sort(function (a, b) {
            const fecha1 = a.fecha();
            const fechaMoment1 = moment(fecha1, 'YYYY/MM/DD');
            const timestamp1 = fechaMoment1.unix();

            const fecha2 = b.fecha();
            const fechaMoment2 = moment(fecha2, 'YYYY/MM/DD');
            const timestamp2 = fechaMoment2.unix();

            return timestamp2 - timestamp1;
        });
        if (vigente) {
            self.precioVigente(nuevo);
        }
    };

    /**
     * Devuelve la fecha del precio vigente en formato html con texto gris
     * formateada de la siguiente manera:
     *        - Año actual : "mar. 16/11"
     *        - Otro año   : "sab. 16/11/19"
     */
    self.fechaPrecioVigenteHtml = ko.pureComputed(function () {
        var fecha = self.precioVigente().fecha();
        return self.getFechaPrecioHtml(fecha);
    });

    /**
     * Devuelve la fecha del próximo precio vigente en formato html con texto
     * gris formateada de la siguiente manera:
     *        - Año actual : "mar. 16/11"
     *        - Otro año   : "sab. 16/11/19"
     */
    self.fechaProximoPrecioHtml = ko.pureComputed(function () {
        var proximo = self.proximoPrecio();
        var fecha = proximo.fecha();
        if (fecha === "") {
            return "";
        }

        return self.getFechaPrecioHtml(fecha);
    });

    /**
     * Devuelve la fecha en formato html con texto gris formateada de la
     * siguiente manera:
     *        - Año actual : "mar. 16/11"
     *        - Otro año   : "sab. 16/11/19"
     *
     * @param {String} fecha
     * @returns {String}
     */
    self.getFechaPrecioHtml = function (fecha, formato = 'YYYY-MM-DD') {
        var fechaMoment = moment(fecha, formato);
        if (!fechaMoment.isValid()) {
            return "Fecha inválida";
        }

        var actual = moment().format('YYYY-MM-DD');
        var anioActual = fechaMoment.isSameOrBefore(actual, 'year');

        var formato = "DD/MM";
        if (!anioActual) {
            formato = "DD/MM/YY";
        }

        var fechaTexto = fechaMoment.format(formato);
        var diaTexto = fechaMoment.format('ddd');
        return `<span class="text-muted">${diaTexto} ${fechaTexto}</span>`;
    };

    /**
     * Próximo precio vigente
     *
     * @return koPrecio
     */
    self.proximoPrecio = ko.computed(function () {
        const precios = self.precios();
        for (let i = 0; i < precios.length; i++) {
            const precio = precios[i];
            const vigente = precio.vigente();
            if (vigente) {
                const siguiente = precios[i - 1];
                if (siguiente === undefined) {
                    break;
                }

                return siguiente;
            }
        }

        //Creo un precio dummy con valores vacíos así no se muestra en la tabla.
        return self.nuevoPrecio(0, '', false, 0, 0);
    });

    /**
     * Devuelve los precios que futuros del producto ordenados en forma
     * descendente por fecha.
     *
     * @returns {Array|koPrecio}
     */
    self.getPreciosFuturos = function () {
        //Los precios ya vienen ordenados por fecha en forma descendente.
        var precios = self.precios().filter((p) => {
            var hoy = moment();
            var vigente = p.vigente();
            var actual = moment(p.fecha(), 'YYYY-MM-DD');
            var esFuturo = actual.isAfter(hoy, 'day');
            return !vigente && esFuturo;
        });
        precios.sort(function (a, b) {
            var fecha1 = a.fecha();
            var fechaMoment1 = moment(fecha1, 'YYYY/MM/DD');
            var timestamp1 = fechaMoment1.unix();

            var fecha2 = b.fecha();
            var fechaMoment2 = moment(fecha2, 'YYYY/MM/DD');
            var timestamp2 = fechaMoment2.unix();

            return timestamp1 - timestamp2;
        });
        return precios;
    };

    /**
     * Subscriber del checkbox de cada producto.
     *
     * Necesario para abrir el modal de crear precio en caso que sea
     * seleccionado. Además en caso sea seleccionado y que exista una lista
     * seleccionada en el select de la sección "Añadir productos" con label
     * "Inicializar desde" le asigna la lista al producto
     *
     */
    self.seleccionado.subscribe(function (seleccionado) {
        if (typeof koGestionarLista === "undefined") {
            return;
        }
        let comprobarNuevo = self.comprobarEsNuevo;
        let listaSeleccionada = koGestionarLista.comprobarListaSeleccionada();
        if (comprobarNuevo && seleccionado && !listaSeleccionada) {
            koGestionarLista.modalCrearPrecio(self);
        }
        if (comprobarNuevo && seleccionado && listaSeleccionada) {
            self.lista = koGestionarLista.opcion().id;
        }
    });

    /**
     * Representa el margen de ganancia del producto.
     */
    self.margen = ko.pureComputed(function () {
        const vigente = self.precioVigente();
        return vigente.margen();
    });

    /**
     * Representa el monto del margen de ganancia del producto.
     */
    self.margenMonto = ko.pureComputed(function () {
        const vigente = self.precioVigente();
        return vigente.margenMonto();
    });

    /**
     * Indica si debe mostrarse el valor del margen. Devuelve true si el
     * producto tiene costo..
     */
    self.mostrarMargen = ko.pureComputed(function () {
        const costo = self.costo;
        return !isNaN(costo) && costo > 0;
    });
}

function koCategoria(json, opciones) {
    ko.mapping.fromJS(json, opciones, this);
    const self = this;

}

function koLista(json, opciones) {
    ko.mapping.fromJS(json, opciones, this);
    const self = this;

}

function koPrecio(json, opciones) {
    if (json.margenMonto === 0.0) {
        json.margen = "";
        json.margenMonto = "";
    }
    ko.mapping.fromJS(json, opciones, this);
    const self = this;

    /**
     * Fecha en formato legible.
     */
    self.fechaTexto = ko.pureComputed(function () {
        const fecha = self.fecha();
        const fechaMoment = moment(fecha, 'YYYY-MM-DD');
        return fechaMoment.format('DD/MM/YYYY');
    });

    /**
     * Devuelve el precio con formato de moneda.
     */
    self.precioFormateado = ko.pureComputed(function () {
        const precio = self.precio();
        return formatearMoneda(precio);
    });

}