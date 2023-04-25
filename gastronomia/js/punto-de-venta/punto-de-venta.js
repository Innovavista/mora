/* global ko, configVentaMostrador, CONDICION_CONTADO, MEDIO_PAGO_EFECTIVO, moment, IVA_CONSUMIDOR_FINAL, COMPROBANTE_TIPO_INTERNO, CONDICION_CUENTA_CORRIENTE, MEDIO_PAGO_DEBITO, MEDIO_PAGO_CREDITO, MEDIO_PAGO_QR, MEDIO_PAGO_TRANSFERENCIA, PERMISO_CAJA_CARGA_CREDITO, PERMISO_CAJA_COMPROBANTE_INTERNO, PERMISO_CAJA_DESCUENTOS_POR_LINEA, PERMISO_CAJA_DESCUENTOS_GENERALES, swal, PRECIO_MANUAL, PRECIO_LISTA, PRECIO_MENU, IVA_DEFECTO, TIPO_MENU_INVITADOS, TIPO_CARGA_CREDITO, TIPO_VARIOS, COMPROBANTE_TIPO_FACTURA, PEDIDO_TIPO_ENVIO, PEDIDO_TIPO_RETIRO, jsonPuntoDeVenta, PERMISO_PUNTO_VENTA_DESCUENTO_MANUAL, PERMISO_PUNTO_VENTA_PRECIO_MANUAL, Intl, clave, IVA_RESPONSABLE_INSCRIPTO, LETRA_A, TIPO_LINEA_REMITO, REMITO_VALORIZADO, autosize */

//Se requiere $this->inlineScript()->appendFile($basePath . '/modules/base/lib/jquery-input-mask/3.3.1/jquery.inputmask.bundle.js');

const selector                          = "input[tabindex != '-1']:visible:enabled:not([readonly], .teclado-ignorar),select[tabindex != '-1']:visible:enabled:not([readonly], .teclado-ignorar)";
let koPuntoDeVenta                      = null;
const TIEMPO_COMPROBACION_ACTUALIZACION = 60000;
const BONIFICACION_FIJAR_MONTO          = 'monto';
const BONIFICACION_FIJAR_PORCENTAJE     = 'porcentaje';

String.prototype.ucFirst = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function ticketTitle(id) {
    const iframe                 = document.getElementById(id);
    window.parent.document.title = iframe.contentDocument.title;
}

const cache = {
    listas: [],
    productos: []
};

//<editor-fold desc="Configuración">
const configTurno = {
    key: function (data) {
        return ko.utils.unwrapObservable(data.id);
    },
    create: function (options) {
        return new koTurno(options.data, config);
    },
    update: function (options) {
        ko.mapping.fromJS(options.data, config, options.target);
        return options.target;
    }
};

const config = {
    'observe': {},
    'turnos': configTurno,
    'turno': configTurno,
    'servicios': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            //koServicio y configVentaMostrador se define en js/caja/gestionar/operaciones/venta-mostrador.js
            return new koServicio(options.data, configVentaMostrador.servicios);
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, configVentaMostrador.servicios, options.target);
            return options.target;
        }
    },
    'descuentos': {
        observe: ["porcentaje"],
        create: function (options) {
            return new koDescuento(options.data, options.parent, config.descuentos);
        }
    },
    'dummy': {
        key: function (data) {
            return ko.utils.unwrapObservable(data.id);
        },
        create: function (options) {
            return new koPedido(options.data);
        },
        update: function (options) {
            ko.mapping.fromJS(options.data, config, options.target);
            return options.target;
        }
    }
};
//</editor-fold>

//<editor-fold desc="Extensiones">
const formatoNumero = {
    groupSeparator: ".",
    radixPoint: ',',
    alias: "numeric",
    placeholder: "0",
    autoGroup: !0,
    digits: 2,
    digitsOptional: !1,
    clearMaskOnLostFocus: !1
};

const formateadorMoneda = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'ARS'
});

const formatearMoneda = function (valor) {
    var salida = formateadorMoneda.format(valor);
    var partes = salida.split(',');
    if (partes.length === 1) {
        salida += ',00';
    } else if (partes.length > 1) {
        var decimales = partes[partes.length - 1];
        if (decimales.length === 1) {
            salida += '0';
        }
    }
    return salida;
};

ko.bindingHandlers.porcentaje = {
    update: function (element, valueAccessor) {
        const valor = ko.utils.unwrapObservable(valueAccessor());
        $(element).html(valor + ' %');
    }
};

ko.bindingHandlers.moneda = {
    update: function (element, valueAccessor) {
        const valor = ko.utils.unwrapObservable(valueAccessor());
        const tipo  = typeof valor;
        if ((tipo !== 'number' && isNaN(valor))
            || valor === null
        ) {
            $(element).html('');
            return;
        }
        const final = formatearMoneda(valor);
        $(element).html(final);
    }
};

//</editor-fold>

function koPantalla(js, opciones) {
    const self  = this;
    self.mapear = function (js, opciones, objeto) {
        opciones.observe = {};
        //Se encarga de mapear la pantalla al crearla o actualizarla
        //evitando que el plugin de mapeado recorra todos los clientes y
        //productos para mejorar el rendimiento

        //Los clientes se pueden copiar directamente
        objeto.clientes = ko.observableArray(js.clientes);
        delete js.clientes;

        self.mapearProductos(js, objeto);
        self.mapearListas(js, objeto);
        self.mapearProductosDefecto(js, objeto);
        self.mapearRemitos(js, objeto);

        ko.mapping.fromJS(js, opciones, objeto);
    };

    self.mapearProductos = function (js, objeto) {
        const productos = [];

        for (let i = 0; i < js.productos.length; i++) {
            const id       = js.productos[i].id;
            const producto = new koProducto(js.productos[i]);

            cache.productos[id] = producto;
            productos.push(producto);
        }

        objeto.productos = ko.observableArray(productos);
        delete js.productos;
    }

    self.mapearListas = function (js, objeto) {
        const listas    = [];
        const defectoId = js.listaDefecto.id;

        for (let i = 0; i < js.listas.length; i++) {
            const data  = js.listas[i];
            const id    = data.id;
            const lista = new koLista(data);

            cache.listas[id] = lista;
            listas.push(lista);
        }

        objeto.listas       = ko.observableArray(listas);
        objeto.listaDefecto = cache.listas[defectoId];

        delete js.listas;
        delete js.listaDefecto;
    };

    self.mapearProductosDefecto = function (js, objeto) {
        const productosDefecto = [];
        for (let i = 0; i < js.productosDefecto.length; i++) {
            const defecto  = js.productosDefecto[i];
            const producto = cache.productos[defecto.productoId];
            const lista    = defecto.listaId === 0 ? null : cache.listas[defecto.listaId];

            if (producto === undefined || lista === undefined) {
                continue;
            }

            const productoDefecto = new koProductoDefecto(producto, lista);
            productosDefecto.push(productoDefecto);
        }

        objeto.productosDefecto = ko.observableArray(productosDefecto);

        delete js.productosDefecto;
    };

    self.mapearRemitos = function (js, objeto) {
        const remitos = [];

        for (let i = 0; i < js.remitos.length; i++) {
            const remito = new koRemito(self, js.remitos[i]);
            remitos.push(remito);
        }

        objeto.remitos = ko.observableArray(remitos);
        delete js.remitos;
    };

    self.mapear(js, opciones, this);

    const hoy = moment().format("YYYY-MM-DD");

    //<editor-fold desc="jQuery">
    //self.$tablaEnfocado se establece con un evento jQuery
    self.$tabla         = $('#punto-de-venta-tabla');
    self.$tablaEnfocado = null;

    self.$modalRemitos      = $('#modal-remitos');
    self.$modalClientes     = $('#modal-clientes');
    self.$modalComensal     = $('#modal-comensal');
    self.$modalProductos    = $('#modal-productos');
    self.$modalServicios    = $('#modal-servicios');
    self.$modalLocalidades  = $('#modal-localidades');
    self.$modalClientesAlta = $('#modal-clientes-alta');
    self.$modalFocoAnterior = self.$modalComensal;

    self.$getLineaActual         = function () {
        if (self.$tablaEnfocado === null) {
            return null;
        }
        return self.$tablaEnfocado.closest('.punto-de-venta-tabla-linea');
    };
    self.$getCampoCodigoActual   = function () {
        var $linea = self.$getLineaActual();
        if ($linea === null) {
            return null;
        }
        return $linea.find('.punto-de-venta-codigo');
    };
    self.$getCampoCantidadActual = function () {
        var $linea = self.$getLineaActual();
        if ($linea === null) {
            return null;
        }
        return $linea.find('.punto-de-venta-cantidad');
    };
    //</editor-fold>

    self.fecha                         = ko.observable(hoy);
    self.pedido                        = ko.observable(null);
    self.cobros                        = ko.observableArray();
    self.lineas                        = ko.observableArray();
    self.tarjeta                       = ko.observable("");
    self.recibido                      = ko.observable(0);
    self.busqueda                      = ko.observable("");
    self.descuento                     = ko.observable(null);
    self.descuentoManual               = ko.observable(0);
    self.descuentoManualPorcentaje     = ko.observable(0);
    self.descuentoManualPorcentajeReal = 0;
    self.servicios                     = ko.observableArray(self.servicios);
    self.condicion                     = ko.observable(CONDICION_CONTADO);
    self.descuentos                    = ko.observableArray(self.descuentos);
    self.vencimiento                   = ko.observable(hoy);
    self.observaciones                 = ko.observable("");
    self.listaSeleccionada             = ko.observable(self.listaDefecto);
    self.serviciosActualizado          = ko.observable(moment());

    //Cliente es el cliente seleccionado, el encontrado es el que fue
    //encontrado en la búsqueda, que puede o no coincidir con el seleccionado
    self.cliente           = ko.observable(null);
    self.clientesBusqueda  = ko.observable("");
    self.clienteSaldoAjax  = ko.observable(false);
    self.clienteSaldoError = ko.observable(false);
    self.clienteSaldo      = ko.observable(null);

    self.remitosCliente       = ko.observable(null);
    self.remitosBusqueda      = ko.observable("");
    self.remitosSeleccionados = ko.observableArray();

    self.lineasRemito = ko.pureComputed(function () {
        const lineas = self.lineas();
        return lineas.filter(linea => linea.comprobarTipoLineaRemito());
    });

    self.lineasAutomaticas = ko.pureComputed(function () {
        const lineas = self.lineas();
        return lineas.filter(linea => linea.automatica());
    });

    self.observacionesPie = ko.pureComputed(function () {
        const lineas = self.lineasRemito();
        if (lineas.length === 0) {
            return "";
        }

        const grupos    = {};
        let total       = 0.0;
        let salida      = "";
        let gruposTotal = 0;

        for (let i = 0; i < lineas.length; i++) {
            const linea       = lineas[i];
            const remitoLinea = linea.remitoLinea();
            const categoria   = remitoLinea.categoria;
            const cantidad    = parseInt(remitoLinea.cantidad);
            const clave       = categoria !== null ? categoria.nombre : "Varios";

            if (typeof grupos[clave] === "undefined") {
                gruposTotal++;
                grupos[clave] = 0;
            }
            total += cantidad;
            grupos[clave] += cantidad;
        }

        salida += "Facturación remitos:";
        for (let clave in grupos) {
            const tipo     = clave.toLowerCase();
            const cantidad = grupos[clave];

            salida += " " + cantidad + " " + tipo + " +"
        }

        let final = salida.slice(0, -1);
        if (gruposTotal > 1) {
            const unidades = total > 1 ? 'unidades' : 'unidad';
            final += " = " + total + " " + unidades;
        }

        return final;
    });

    //<editor-fold desc="Selección de comprobante">
    self.comprobantesDisponibles = ko.pureComputed(function () {
        var salida       = [];
        var cliente      = self.cliente();
        var comprobantes = self.comprobantes;
        var iva          = cliente !== null ? cliente.iva : IVA_CONSUMIDOR_FINAL;

        for (var i = 0; i < comprobantes.length; i++) {
            var comprobante = comprobantes[i];
            var tipo        = comprobante.tipo;
            var receptor    = comprobante.receptor;

            if (receptor === iva || tipo === COMPROBANTE_TIPO_INTERNO) {
                salida.push(comprobante);
            }
        }

        return salida;
    });

    self.comprobanteDefecto = ko.pureComputed(function () {
        var disponibles = self.comprobantesDisponibles();
        for (var i = 0; i < disponibles.length; i++) {
            var disponible = disponibles[i];
            if (self.caja.facturaDefecto === disponible.tipo) {
                return disponible;
            }
        }
        //Si llegamos acá es porque no encontró ninguno entonces devolvemos el
        //primero
        return disponibles[0];
    });

    self.comprobante = ko.observable(null);
    //</editor-fold>


    //<editor-fold desc="Lista de precios">
    /**
     * En la lectura devuelve la lista de precio a utilizar a partir de la
     * siguiente prioridad:
     * 1. Si hay remito seleccionado de servicio se usa su lista de precios.
     * 2. Si hay cliente seleccionado se usa su lista si es que tiene.
     * 3. La lista seleccionada que si no se cambio es la lista por defecto.
     */
    self.lista = ko.pureComputed({
        read: function () {
            const remitos = self.remitosSeleccionados();
            const cliente = self.cliente();
            const lista   = self.listaSeleccionada();

            if (remitos.length > 0) {
                const id = remitos[0].lista;
                if (id > 0) {
                    return self.getLista(id);
                }
            }

            if (cliente !== null && !self.comprobarPermisoNoRestringirListaPrecioCliente) {
                const id = cliente.lista;
                if (id > 0) {
                    return self.getLista(id);
                }
            }

            return lista;

        },
        write: function (lista) {
            self.listaSeleccionada(lista);
        }
    });

    /**
     * Indica si debe desactivarse o no la lista de precios dependiendo de:
     * 1. Hay al menos un remito de un servicio con lista de precios.
     */
    self.listaDesactivar = ko.pureComputed(function () {
        const remitos            = self.remitosSeleccionados();
        const cliente            = self.cliente();
        const restringidoCliente = !self.comprobarPermisoNoRestringirListaPrecioCliente;

        return (remitos.length > 0 && remitos[0].lista !== 0)
            || (cliente !== null && cliente.lista !== 0 && restringidoCliente);
    });
    //</editor-fold>


    //<editor-fold desc="Actualización de precios de productos al cambiar la lista">
    self.productosActualizarPrecios = function (lista) {
        const productos = self.productos();
        for (let i = 0; i < productos.length; i++) {
            const producto = productos[i];
            const precio   = lista.getPrecio(producto);
            let precioT    = '';
            if (precio !== null) {
                precioT = formatearMoneda(precio.precio);
            } else if (producto.comprobarDebeTenerPrecio) {
                precioT = '<span class="text-muted">Sin precio para lista \'' + lista.nombre + '\'</span>';
            }
            producto.precio(precioT);
        }
    };
    self.lista.subscribe(function (lista) {
        self.productosActualizarPrecios(lista);
    });
    self.productosActualizarPrecios(self.lista());
    //</editor-fold>

    //Comensal es el comensal seleccionado, el encontrado es el que fue
    //encontrado en la búsqueda, que puede o no coincidir con el seleccionado
    self.comensal             = ko.observable(null);
    self.comensalBuscando     = ko.observable(false);
    self.comensalHabilitado   = self.urls.buscarComensal !== null;
    self.comensalEncontrado   = ko.observable(null);
    self.comensalNoEncontrado = ko.observable(false);

    //<editor-fold desc="Localidades">
    self.localidadesBusqueda = ko.observable("");
    self.getLocalidad        = function (id) {
        for (var i = 0; i < self.localidades.length; i++) {
            var localidad = self.localidades[i];
            if (id === localidad.id) {
                return localidad;
            }
        }
        return null;
    };
    /**
     * Abre el modal de búsqueda y selección de cliente.
     */
    self.localidadAbrirModal = function () {
        var $enfocado = $(document).find(':focus');
        if ($enfocado.length === 1) {
            self.$modalFocoAnterior = $enfocado;
        }
        self.$modalLocalidades.on('shown.bs.modal', function (e) {
            $('.componente-tabla-filtro').focus();
        });
        self.$modalLocalidades.modal('show');
    };

    /**
     * Hace efectiva la selección del cliente encontrado con la búsqueda.
     */
    self.localidadSeleccionar = function (localidad) {
        var pedido = self.pedido();
        if (pedido === null) {
            return;
        }
        pedido.localidad(localidad);

        self.$modalLocalidades.modal('hide');
        if (self.$modalFocoAnterior !== null) {
            self.$modalFocoAnterior.focus();
        } else {
            self.teclado('actual');
        }
        self.$modalFocoAnterior = null;
    };
    //</editor-fold>

    /**
     * Crea y agrega una nueva línea.
     *
     * @returns {koLinea}
     */
    self.nuevaLinea = function () {
        const linea = new koLinea(self);
        self.lineas.push(linea);
        return linea;
    };

    self.nuevaLineaOActualSiEstaVacia = function () {
        const linea = self.primerLineaVacia();
        return linea !== null ? linea : self.nuevaLinea();
    }

    self.primerLineaVacia = function () {
        const lineas = self.lineas();
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            if (linea.comprobarVacia()) {
                return linea;
            }
        }
        return null;
    }

    /**
     * Devuelve un array con todas las líneas que no son creadas a partir de
     * remitos.
     */
    self.lineasNoRemitos = ko.pureComputed(function () {
        const lineas = self.lineas();
        return lineas.filter(linea => !linea.comprobarTipoLineaRemito());
    });

    self.comprobarDiscriminaIva = ko.pureComputed(function () {
        /*
		 * Si bien el responsable inscripto siempre discrimina IVA por simplicidad
		 * al usuario se muestra solamente cuando se hace factura A.
		 */
        if (self.emisor.iva !== IVA_RESPONSABLE_INSCRIPTO) {
            return false;
        }
        const comprobante = self.comprobante();
        if (comprobante === null) {
            return false;
        }
        return comprobante.letra === LETRA_A;
    });
    /**
     * Devuelve true si el punto de venta tiene al menos una línea de menú
     * invitados.
     *
     * @returns {Boolean}
     */
    self.comprobarTieneMenuInvitados = function () {
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (linea.comprobarTipoMenuInvitados()) {
                return true;
            }
        }
        return false;
    };

    self.descuentosPorLinea = ko.pureComputed(function () {
        var salida     = [];
        var descuentos = self.descuentos();
        for (var i = 0; i < descuentos.length; i++) {
            var descuento = descuentos[i];
            if (!descuento.general) {
                salida.push(descuento);
            }
        }

        return salida;
    });

    self.descuentosGenerales = ko.pureComputed(function () {
        var salida     = [];
        var descuentos = self.descuentos();
        for (var i = 0; i < descuentos.length; i++) {
            var descuento = descuentos[i];
            if (descuento.general) {
                salida.push(descuento);
            }
        }

        return salida;
    });

    //<editor-fold desc="Cobros">
    self.cobroNuevo                 = function (enfocar = true) {
        const cobro = new koCobro(self, self.cobro);
        self.cobros.push(cobro);

        if (enfocar) {
            ko.tasks.runEarly();
            $('#cobros tr:last input[type="radio"]:first').focus();
        }
    };
    self.cobroQuitar                = function (cobro) {
        self.cobros.remove(cobro);
    };
    self.cobrosDeshabilitarEfectivo = function () {
        let i;
        const cobros   = self.cobros();
        let encontrado = null;

        for (i = 0; i < cobros.length; i++) {
            const cobro = cobros[i];
            if (cobro.medioDePago() === MEDIO_PAGO_EFECTIVO) {
                encontrado = cobro;
                break;
            }
        }

        for (i = 0; i < cobros.length; i++) {
            const cobro = cobros[i];
            if (encontrado !== null && encontrado !== cobro) {
                //Si estamos acá es porque en otro cobro ya está el efectivo
                //seleccionado
                cobro.medioDePagoDeshabilitarEfectivo();
            } else {
                cobro.medioDePagoHabilitarEfectivo();
            }
        }
    };
    self.cobros.subscribe(function (nuevo) {
        self.cobrosDeshabilitarEfectivo();
    });
    //</editor-fold>

    //<editor-fold desc="Inicialización">
    self.crearPrimerLinea = function () {
        const primerLinea   = self.nuevaLinea();
        self.lineaActual    = null;
        self.setLineaActual = function (linea) {
            const lineas = self.lineas();
            for (let i = 0; i < lineas.length; i++) {
                lineas[i].actual(false);
            }
            linea.actual(true);
            self.lineaActual = linea;
        };
        self.setLineaActual(primerLinea);
    };

    self.inicializar = function () {
        let i;
        const menu       = self.comprobarTieneMenuInvitados();
        const lineas     = self.lineas();
        const descuentos = self.descuentos();
        let descuento    = null;

        //Aplicamos el descuento general si hay alguno automático
        const descuentosG = self.descuentosGenerales();
        for (i = 0; i < descuentosG.length; i++) {
            if (descuentosG[i].aplicarAutomaticamente) {
                descuento = descuentosG[i];
                break;
            }
        }

        self.fecha(hoy);
        self.pedido(null);
        self.lineas([]);
        self.cliente(null);
        self.tarjeta("");
        self.recibido(0);
        self.busqueda("");
        self.descuento(descuento);
        self.descuentoManual(0);
        self.descuentoManualPorcentaje(0);
        self.descuentoManualPorcentajeReal = 0;
        self.comensal(null);
        self.condicion(CONDICION_CONTADO);
        self.comprobante(self.comprobanteDefecto());
        self.vencimiento(hoy);
        self.observaciones("");
        self.clientesBusqueda("");
        self.comensalEncontrado(null);

        self.clienteSaldo(null);
        self.clienteSaldoAjax(false);
        self.clienteSaldoError(false);

        self.listaSeleccionada(self.listaDefecto);

        self.remitosSeleccionados([]);
        self.remitosCliente(null);
        self.remitosBusqueda("");

        self.cobros([]);
        self.cobroNuevo(false);

        self.crearPrimerLinea();
        //Limpiamos las líneas anteriores
        for (i = 0; i < lineas.length; i++) {
            lineas[i].limpiar();
        }

        //Limpiamos los descuentos editables
        for (i = 0; i < descuentos.length; i++) {
            descuentos[i].limpiar();
        }
        ko.tasks.runEarly();

        //Si no es la primer inicialización entonces puede haber llegado a tener
        //menú de invitados, en cuyo caso debemo actualizar para tener el último
        //cupo disponible. Además lo corremos luego del forzado de ejecución de
        //tareas para asegurarnos que no queden líneas.
        if (menu) {
            self.serviciosActualizar();
        }

        $(".punto-de-venta-codigo").focus();
    };
    self.inicializar();
    //</editor-fold>

    //<editor-fold desc="Ajax">
    self.ajax            = ko.observable(false);
    self.ajaxGetErrores  = function (data) {
        //Devolvemos el array de errores si es que tiene
        if (typeof data.errores !== "undefined") {
            return data.errores;
        }
        if (typeof data.resultado !== "undefined" && typeof data.resultado.errores !== "undefined") {
            return data.resultado.errores;
        }
        return null;
    };
    self.ajaxOpciones    = {
        method: 'POST',
        beforeSend: function (jqXHR, settings) {
            self.ajax(true);
            ko.tasks.runEarly();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var mensaje = "Ha ocurrido un error, vuelva a intentar";
            if (typeof jqXHR.responseJSON !== "undefined") {
                var data    = jqXHR.responseJSON;
                var errores = self.ajaxGetErrores(data);
                if (Array.isArray(errores)) {
                    mensaje = errores.length > 1 ? "Han ocurrido los siguientes errores:<br/><br/>" : "";
                    mensaje += errores.join("<br/><br/>");
                } else if (typeof data.error !== "undefined") {
                    mensaje = "Ha ocurrido el siguiente error: " + data.error;
                }
            }
            Notificacion(mensaje, 'error');
        },
        complete: function (jqXHR, settings) {
            self.ajax(false);
        }
    };
    self.getAjaxOpciones = function (opciones) {
        if (typeof opciones === 'undefined') {
            opciones = {};
        }
        return $.extend({}, self.ajaxOpciones, opciones);
    };
    //</editor-fold>

    //<editor-fold desc="Buscar lista de precios">
    self.getLista = function (id) {
        var listas = self.listas();
        for (var i = 0, max = listas.length; i < max; i++) {
            var lista = listas[i];
            if (lista.id === id) {
                return lista;
            }
        }
        return null;
    };
    //</editor-fold>

    //<editor-fold desc="Buscar productos">
    self.limpiarAcentos = function (texto) {
        var acentos  = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
        var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
        for (var i = 0; i < acentos.length; i++) {
            texto = texto.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
        }
        return texto.trim();
    };

    self.buscar = function (form, linea) {
        var codigo = linea.codigo();
        if (codigo.trim() === "") {
            self.buscarAbrirModal(linea);
            return false;
        }

        var productos = self.buscarProductos(codigo);
        var total     = productos.length;
        var linea     = self.lineaActual;

        if (total === 1) {
            self.seleccionar(productos[0], linea);
        } else {
            self.buscarAbrirModal(linea);
        }
        return false;
    };

    self.buscarAbrirModal = function (linea) {
        var codigo = linea.codigo();
        self.busqueda(codigo);
        self.$modalProductos.on('shown.bs.modal', function (e) {
            $('.componente-tabla-filtro').focus();
        });
        self.$modalProductos.modal('show');
        self.$modalProductos.on('hidden.bs.modal', function (e) {
            //Enfocamos la cantidad si tiene producto, caso contrario
            //volvemos al campo de código
            var producto = linea.producto();

            if (producto === null) {
                $enfocar = self.$getCampoCodigoActual();
                $enfocar.focus().select();
            }
        });
    };

    self.buscarProductos = function (busqueda) {
        var texto     = self.limpiarAcentos(busqueda).toLowerCase();
        var salida    = [];
        var productos = self.productos();

        for (var i = 0; i < productos.length; i++) {
            var producto = productos[i];
            var codigo   = self.limpiarAcentos(producto.codigo).toLowerCase();

            if (texto === codigo) {
                //Tenemos una coincidencia exacta de código, devolvemos un solo
                //producto
                return [producto];
            }

            var nombre = self.limpiarAcentos(producto.nombre).toLowerCase();

            if (codigo.indexOf(texto) !== -1
                || nombre.indexOf(texto) !== -1
            ) {
                salida.push(producto);
            }

        }
        return salida;
    };

    /**
     * Busca un producto según el id dado.
     *
     * @param {int|string} id
     * @returns {koProducto|null}
     */
    self.buscarProductoPorId = function (id) {
        const productos = self.productos();

        for (var i = 0; i < productos.length; i++) {
            const producto = productos[i];
            if (producto.id === id) {
                return producto;
            }
        }

        return null;
    };
    //</editor-fold>

    //<editor-fold desc="Seleccionar producto">
    self.seleccionar = function (producto, linea) {
        if (producto === linea.producto()) {
            if (producto.comprobarMenuInvitados) {
                self.servicioAbrirModal(linea);
                return;
            }
            self.teclado('siguiente');
            return;
        }
        //Verificamos si el producto permite repetir
        if (!producto.repetir) {
            var lineas = self.lineas();
            for (var i = 0; i < lineas.length; i++) {
                var comparar = lineas[i].producto();
                if (producto === comparar) {
                    //Limpiamos la línea actual y enfocamos el campo
                    //correspondiente a la cantidad o monto
                    self.quitarLineaActual(true);
                    var $lineaActual    = self.$tabla.find('.punto-de-venta-tabla-linea').eq(i);
                    self.$tablaEnfocado = $lineaActual.find('.punto-de-venta-codigo');
                    self.teclado('siguiente');
                    return;
                }
            }
        }

        var precioManual = 0;
        if (producto.comprobarCargaCredito) {
            precioManual = self.caja.minimoCargaCredito;
        }

        linea.producto(producto);
        linea.codigo(producto.codigo);
        linea.precioManual(precioManual);

        linea.precioManualMinimo(precioManual < 0 ? 0 : precioManual);

        if (producto.comprobarMenuInvitados) {
            //El menú de invitados requiere seleccionarlo de un modal, por lo
            //tanto no lo agregamos
            self.servicioAbrirModal(linea);
            return;
        }

        self.teclado('siguiente');
    };

    self.seleccionarModal = function (producto, evento) {
        linea = self.lineaActual;

        self.seleccionar(producto, linea);

        self.$modalProductos.modal('hide');
    };
    //</editor-fold>

    //<editor-fold desc="Seleccionar cliente">
    /**
     * Devuelve true si la venta requiere de la selección de un cliente.
     */
    self.comprobarRequiereCliente = ko.pureComputed(function () {
        var condicion = self.condicion();

        return condicion === CONDICION_CUENTA_CORRIENTE;
    });

    /**
     * Devuelve true si la venta requiere de la selección de un cliente y no se
     * ha hecho aún.
     */
    self.comprobarFaltaSeleccionarCliente = ko.pureComputed(function () {
        var cliente  = self.cliente();
        var requiere = self.comprobarRequiereCliente();

        return requiere && cliente === null;
    });

    /**
     * Solo se puede seleccionar cliente si no hay comensal seleccionado ni hay
     * líneas de remito (que obligan a que el cliente sea igual al de las líneas).
     */
    self.comprobarPuedeSeleccionarCliente = ko.pureComputed(function () {
        const comensal             = self.comensal();
        const remitosSeleccionados = self.comprobarHayRemitosSeleccionados();
        return comensal === null && !remitosSeleccionados;
    });

    /**
     * Devuelve los estilos para el botón de seleccionar cliente. Si es
     * requerido y no se ha seleccionado aún, entonces muestra un leve color
     * rojo en el botón.
     */
    self.cssClienteAbrirModal = ko.pureComputed(function () {
        var falta      = self.comprobarFaltaSeleccionarCliente();
        var cliente    = self.cliente();
        var habilitado = self.comprobarPuedeSeleccionarCliente();

        if (!habilitado) {
            return 'bg-gray-200 border-gray-200 opacity-50 cursor-not-allowed';
        }

        if (cliente !== null) {
            return 'bg-blue-200 border-blue-200';
        }

        return falta ? 'bg-red-200 border-red-600' : '';
    });

    /**
     * Devuelve el texto a mostrar en el botón de selección de cliente. Si no
     * hay cliente seleccionado pero no es obligatorio dirá "Seleccionar
     * cliente", si es obligatorio dirá "Cliente obligatorio". Si ya
     * tenemos seleciconado, entonces mostrará el nombre y apellido.
     */
    self.clienteTextoBoton = ko.pureComputed(function () {
        var cliente  = self.cliente();
        var faltaSel = self.comprobarFaltaSeleccionarCliente();

        if (cliente !== null) {
            return cliente.nombre;
        }

        return faltaSel ? 'Cliente obligatorio' : 'Cliente';
    });

    /**
     * Abre el modal de búsqueda y selección de cliente.
     */
    self.clienteAbrirModal = function () {
        var $enfocado = $(document).find(':focus');
        if ($enfocado.length === 1) {
            self.$modalFocoAnterior = $enfocado;
        }
        self.$modalClientes.on('shown.bs.modal', function (e) {
            $('.componente-tabla-filtro').focus();
        });
        self.$modalClientes.modal('show');
    };

    /**
     * Hace efectiva la selección del cliente encontrado con la búsqueda.
     *
     * @param {koCliente} cliente
     */
    self.clienteSeleccionar = function (cliente) {
        self.cliente(cliente);
        if (cliente.lista !== 0) {
            const lista = self.getLista(cliente.lista);
            if (lista !== null) {
                self.lista(lista);
            }
        }

        self.clienteSeleccionarAnadirComentarios(cliente);

        self.$modalClientes.modal('hide');
        self.$modalClientesAlta.modal('hide');
        self.$modalClientesAlta.find('form')[0].reset();
        if (self.$modalFocoAnterior !== null
            && self.$modalFocoAnterior.is(':not(button)')
        ) {
            self.$modalFocoAnterior.focus();
        } else {
            self.teclado('actual');
        }
        self.$modalFocoAnterior = null;
    };

    /**
     * Añade a las observaciones del pedido los comentarios del cliente.
     *
     * En el caso que haya observaciones escritas las añade con un separador
     * "--------".
     *
     * También verifica que no esté el comentario del cliente ya puesto.
     *
     */
    self.clienteSeleccionarAnadirComentarios = function (cliente) {
        const pedido = self.pedido();
        if (pedido === null) {
            return;
        }

        const comentario  = cliente.comentario.trim();
        let observaciones = pedido.observaciones().trim();

        if (comentario === "" || observaciones.indexOf(comentario) !== -1) {
            return;
        }

        if (observaciones !== "") {
            observaciones += "\n\n--------\n";
        }
        observaciones += comentario;
        pedido.observaciones(observaciones);

        //Ajustamos alto del campo
        ko.tasks.runEarly();
        const textarea = document.getElementById("pedido-observaciones");
        autosize.update(textarea);
    };

    self.clientesBuscar = function (busqueda) {
        var texto  = self.limpiarAcentos(busqueda);
        var salida = [];

        for (var i = 0; i < self.clientes.length; i++) {
            var cliente  = self.clientes[i];
            var cuit     = cliente.cuit;
            var correo   = cliente.correo;
            var nombre   = self.limpiarAcentos(cliente.nombre);
            var telefono = cliente.telefono;

            if (texto === nombre
                || texto === cuit
                || texto === correo
                || texto === telefono
            ) {
                //Tenemos una coincidencia exacta de código, devolvemos un solo
                //cliente
                return [cliente];
            }

            var nombre = self.limpiarAcentos(cliente.nombre);

            if (cuit.indexOf(texto) !== -1
                || correo.indexOf(texto) !== -1
                || nombre.indexOf(texto) !== -1
                || telefono.indexOf(texto) !== -1
            ) {
                salida.push(cliente);
            }

        }
        return salida;
    };

    /**
     * Quita el cliente seleccionado.
     *
     * En caso de haber remitos los limpia.
     */
    self.clienteQuitar = function () {
        if (self.comprobarHayRemitosSeleccionados()) {
            self.remitosLimpiar();
        }
        self.cliente(null);
    };

    /**
     * Devuelve un cliente según el id dado.
     *
     * @param int id
     * @returns koCliente
     */
    self.clienteBuscarPorId = function (id) {
        const clientes = self.clientes();
        for (var i = 0; i < clientes.length; i++) {
            const cliente = clientes[i];
            if (parseInt(cliente.id) === parseInt(id)) {
                return cliente;
            }
        }
        return null;
    };
    //</editor-fold>

    self.clienteAbrirModalNuevo = function () {
        var $formulario = self.$modalClientesAlta.find('form');
        var $localidad  = $formulario.find('select[name="localidad"]');
        var $categoria  = $formulario.find('select[name="categoria"]');
        var $nombre     = $formulario.find('input[name="nombre"]');
        var id          = self.caja.localidad.id;

        //Elegimos la localidad automáticamente a partir de la localidad del
        //centro de costos del punto de venta.
        $localidad.find('option[value="' + id + '"]').prop('selected', true);
        $localidad.selectpicker('refresh');

        self.$modalClientesAlta.on('shown.bs.modal', function (e) {
            if ($categoria.find('option:selected').length === 0) {
                $categoria.focus();
                return;
            }
            $nombre.focus();
        });

        self.$modalClientes.modal('hide');
        self.$modalClientesAlta.modal('show');
    };

    self.clienteNuevo = function (formulario) {
        var $formulario = $(formulario);
        var url         = self.urls.nuevoCliente;
        var data        = $formulario.formSerialize();
        var opciones    = self.getAjaxOpciones({
            url: url,
            data: data,
            async: false,
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito === 'undefined' || typeof data.cliente === 'undefined' || !data.exito) {
                    Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
                    return;
                }
                self.clientes.push(data.cliente);
                self.clienteSeleccionar(data.cliente);
                Notificacion('Cliente creado éxitosamente.', 'success');
            }
        });
        $.ajax(opciones);
    };

    //<editor-fold desc="Seleccionar servicio">
    self.servicioLinea = null;

    self.serviciosActualizar = function () {
        //Para poder actualizar no tenemos que tener ninguna línea con venta de menú
        if (!self.comprobarPuedeActualizarServicios()) {
            return Notificacion('No puede actualizar los servicios mientras tenga menúes de invitados cargados.', 'error');
        }

        var url      = self.urls.servicios;
        var opciones = self.getAjaxOpciones({
            url: url,
            method: 'GET',
            async: false,
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito === 'undefined' || !data.exito) {
                    return Notificacion('Ha ocurrido un error.', 'error');
                }
                var mapeado = ko.mapping.fromJS(data, config);
                self.servicios(mapeado.servicios);
                self.serviciosActualizado(moment());
                ko.tasks.runEarly();
                Notificacion('Servicios actualizados correctamente.', 'success');
            }
        });
        $.ajax(opciones);
    };

    self.comprobarPuedeActualizarServicios = function () {
        var lineas = self.lineas();
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (linea.comprobarTipoMenuInvitados() && linea.turno() !== null) {
                return false;
            }
        }
        return true;
    };

    /**
     * Abre el modal de búsqueda y selección de servicio.
     *
     * @param {koLinea} linea
     */
    self.servicioAbrirModal = function (linea) {
        var ahora       = moment();
        var actualizado = self.serviciosActualizado().clone();

        actualizado.add(5, 'minutes');
        if (actualizado.isBefore(ahora) && self.comprobarPuedeActualizarServicios()) {
            Notificacion('Actualizando servicios...', 'info');
            self.serviciosActualizar();
        }

        self.servicioLinea = linea;
        var $enfocado      = $(document).find(':focus');
        self.$modalServicios.on('hidden.bs.modal', function (e) {
            //Si elegimos menú entonces enfocamos el próximo campo
            $enfocado.focus();
            if (self.servicioLinea.turno() !== null) {
                self.teclado('siguiente');
            } else {
                $enfocado.val("");
                linea.producto(null);
            }
        });
        self.$modalServicios.on('shown.bs.modal', function (e) {
            var $enfocar   = self.$modalServicios.find('.modal-body button:first');
            var asignacion = linea.asignacion();
            if (asignacion !== null) {
                $enfocar = self.$modalServicios.find(".modal-body button[data-id='" + asignacion.id() + "']");
            }
            if ($enfocar.length === 0) {
                $enfocar = self.$modalServicios;
            }
            setTimeout(function () {
                $enfocar.focus();
            }, 200);
        });
        self.$modalServicios.modal('show');
    };

    /**
     * Hace efectiva la selección del servicio encontrado con la búsqueda.
     */
    self.servicioSeleccionar = function (asignacion, turno, servicio) {
        if (!turno.comprobarPuedeReservar()) {
            Notificacion('No hay cupos disponibles', 'error');
            return;
        }
        self.servicioLinea.setMenuInvitado(asignacion, turno, servicio);
        self.$modalServicios.modal('hide');
    };
    //</editor-fold>

    //<editor-fold desc="Seleccionar comensal">
    /**
     * Devuelve true si la venta requiere de la selección de un comensal.
     */
    self.comprobarRequiereComensal = ko.pureComputed(function () {
        var lineas = self.lineas();

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (linea.comprobarRequiereComensal()) {
                return true;
            }
        }
        return false;
    });

    /**
     * Devuelve true si la venta requiere de la selección de un comensal y no se
     * ha hecho aún.
     */
    self.comprobarFaltaSeleccionarComensal = ko.pureComputed(function () {
        var requiere = self.comprobarRequiereComensal();
        var comensal = self.comensal();

        return requiere && comensal === null;
    });

    /**
     * Solo se puede seleccionar comensal si no hay cliente seleccionado.
     */
    self.comprobarPuedeSeleccionarComensal = ko.pureComputed(function () {
        var cliente = self.cliente();
        return cliente === null;
    });

    /**
     * Devuelve los estilos para el botón de seleccionar comensal. Si es
     * requerido y no se ha seleccionado aún, entonces muestra un leve color
     * rojo en el botón.
     */
    self.cssComensalAbrirModal = ko.pureComputed(function () {
        var falta      = self.comprobarFaltaSeleccionarComensal();
        var comensal   = self.comensal();
        var habilitado = self.comprobarPuedeSeleccionarComensal();

        if (!habilitado) {
            return 'bg-gray-200 border-gray-200 opacity-50 cursor-not-allowed';
        }
        if (comensal !== null) {
            return 'bg-blue-200 border-blue-200';
        }

        return falta ? 'bg-red-200 border-red-600' : '';
    });

    /**
     * Devuelve el texto a mostrar en el botón de selección de comensal. Si no
     * hay comensal seleccionado pero no es obligatorio dirá "Seleccionar
     * comensal", si es obligatorio dirá "Comensal obligatorio". Si ya
     * tenemos seleciconado, entonces mostrará el nombre y apellido.
     */
    self.comensalTextoBoton = ko.pureComputed(function () {
        var comensal = self.comensal();
        var faltaSel = self.comprobarFaltaSeleccionarComensal();

        if (comensal !== null) {
            return comensal.nombre() + ' ' + comensal.apellido();
        }

        return faltaSel ? 'Comensal obligatorio' : 'Comensal';
    });

    /**
     * Abre el modal de búsqueda y selección de comensal.
     */
    self.comensalAbrirModal = function () {
        var $enfocado = $(document).find(':focus');
        if ($enfocado.length === 1) {
            self.$modalFocoAnterior = $enfocado;
        }
        self.$modalComensal.on('shown.bs.modal', function (e) {
            var $buscador = $('#comensal-buscador');
            $buscador.val("");
            $buscador.focus();
        });
        self.$modalComensal.modal('show');
    };

    /**
     * Hace efectiva la selección del comensal encontrado con la búsqueda.
     */
    self.comensalSeleccionar = function () {
        var encontrado = self.comensalEncontrado();
        self.comensal(encontrado);
        self.$modalComensal.modal('hide');
        if (self.$modalFocoAnterior !== null) {
            self.$modalFocoAnterior.focus();
        } else {
            self.teclado('actual');
        }
        self.$modalFocoAnterior = null;
    };

    /**
     * Muestra los detalles del comensal en el modal de búsqueda de comensal.
     *
     * @param {object} comensal
     */
    self.comensalMostrar = function (comensal) {
        self.comensalNoEncontrado(false);
        self.comensalEncontrado(comensal);
        ko.tasks.runEarly();
        setTimeout(function () {
            $('#componente-comensal-buscador-seleccionar').focus();
        }, 100);
    };

    /**
     * Reinicia la búsqueda del comensal.
     */
    self.comensalLimpiar = function () {
        self.comensalEncontrado(null);
    };

    /**
     * Realiza la llamada Ajax para buscar al comensal según el texto de
     * "params.busqueda".
     *
     * @param {object} params
     */
    self.comensalBuscar = function (params) {
        if (params.busqueda === '') {
            return;
        }
        self.comensalNoEncontrado(false);
        var url  = self.urls.buscarComensal;
        var data = {dni: params.busqueda};

        self.comensalBuscando(true);
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                self.comensalBuscando(false);
                if (data.success) {
                    self.comensalMostrar(ko.mapping.fromJS(data.success.comensal, {}));
                    return;
                }
                if (data.error) {
                    self.comensalNoEncontrado(true);
                    Notificacion('No se ha encontrado el comensal', 'error');
                    return;
                }
                return Notificacion('Ha ocurrido un error.', 'error');
            }
        });
        $.ajax(opciones);
    };

    /**
     * Quita el comensal seleccionado.
     */
    self.comensalQuitar = function () {
        self.comensal(null);
    };
    //</editor-fold>

    //<editor-fold desc="Quitar línea">
    self.quitarLinea = function (linea) {
        self.teclado('linea-anterior');
        const remito = linea.remito();
        linea.limpiar();
        self.lineas.remove(linea);

        //Si es de remito y el mismo no tiene más líneas lo quitamos
        if (remito !== null
            && remito.comprobarNoTieneLineasSeleccionadas()
        ) {
            self.remitosQuitar(remito);
        }

        //Si no hay más líneas entonces generamos una nueva vacía
        if (self.lineasNoRemitos().length === 0) {
            self.crearPrimerLinea();
        }
    };

    self.quitarLineaActual = function (forzar = false) {
        const dom   = self.$tablaEnfocado.get(0);
        const linea = ko.dataFor(dom);
        if (self.$tablaEnfocado === null
            || self.$tabla.find('.punto-de-venta-tabla-linea').length === 1
            || (linea.producto() !== null && !forzar)
        ) {
            //No hay campo enfocado, no tenemos de donde detectar la línea
            //actual o hay una sola línea o la línea tiene un código.
            return;
        }

        if (linea instanceof koLinea) {
            self.quitarLinea(linea);
        }
    };
    //</editor-fold>

    //<editor-fold desc="Comprobaciones">
    self.comprobarPermiso = function (comprobar) {
        const permisos = self.permisos;

        for (let i = 0; i < permisos.length; i++) {
            const permiso = permisos[i];
            if (permiso === comprobar) {
                return true;
            }
        }
        return false;
    };

    self.comprobarPermisoCargaCredito                   = self.comprobarPermiso(PERMISO_CAJA_CARGA_CREDITO);
    self.comprobarPermisoPrecioManual                   = self.comprobarPermiso(PERMISO_PUNTO_VENTA_PRECIO_MANUAL);
    self.comprobarPermisoDescuentoManual                = self.comprobarPermiso(PERMISO_PUNTO_VENTA_DESCUENTO_MANUAL);
    self.comprobarPermisoComprobanteInterno             = self.comprobarPermiso(PERMISO_CAJA_COMPROBANTE_INTERNO);
    self.comprobarPermisoDescuentosPorLinea             = self.comprobarPermiso(PERMISO_CAJA_DESCUENTOS_POR_LINEA);
    self.comprobarPermisoDescuentosGenerales            = self.comprobarPermiso(PERMISO_CAJA_DESCUENTOS_GENERALES);
    self.comprobarPermisoNoRestringirListaPrecioCliente = self.comprobarPermiso(PUNTO_VENTA_NO_RESTRINGIR_LISTA_PRECIO_CLIENTE);

    self.comprobarPuedeAplicarDescuentoPorLinea   = self.comprobarPermisoDescuentosPorLinea && self.descuentosPorLinea().length > 0;
    self.comprobarPuedeAplicarDescuentosGenerales = self.comprobarPermisoDescuentosGenerales && self.descuentosGenerales().length > 0;

    self.comprobarCondicionCuentaCorriente = ko.pureComputed(function () {
        var condicion = self.condicion();
        return condicion === CONDICION_CUENTA_CORRIENTE;
    });

    self.comprobarCondicionContado = ko.pureComputed(function () {
        var condicion = self.condicion();
        return condicion === CONDICION_CONTADO;
    });

    self.comprobarTieneDescuentoEditable = ko.pureComputed(function () {
        var descuento = self.descuento();
        return descuento !== null && descuento !== undefined && descuento.editable;
    });
    //</editor-fold>

    self.subtotal = ko.pureComputed(function () {
        var total  = 0;
        var lineas = self.lineas();

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            total += linea.subtotalConDescuentos();
        }
        return Math.round((total + Number.EPSILON) * 100) / 100;
    });

    //<editor-fold desc="Descuentos">
    /**
     * Calcula el monto a descontar según haya o no un descuento general.
     *
     * @param {float} monto
     * @param {koDescuento} descuento
     * @param {bool} redondear
     * @returns {float}
     */
    self.descuentoCalcular = function (monto, descuento, redondear = false) {
        if (monto === null || monto === 0.0 || descuento === null || descuento === undefined) {
            return 0;
        }

        const porcentaje = descuento.porcentaje();
        const montoFijo  = descuento.montoFijo;

        if (descuento.comprobarMontoFijo) {
            return montoFijo;
        }

        var salida = monto * porcentaje / 100;

        if (redondear) {
            salida = Math.round((salida + Number.EPSILON) * 100) / 100;
        }
        return salida;
    };

    /*
	 * El descuento manual se aplica cuando se tienen los permisos necesarios y
	 * permite cambiar el monto o porcentaje del descuento a aplicar.
	 *
	 * Se calcula automáticamente cuando se elige un descuento y en el caso que
	 * se modifique manualmente debe deseleccionar cualquier descuento elegido.
	 */
    self.descuentoCambiando = false;

    /**
     * Indica si al modificarse el subtotal dejamos fijo el monto y cambiamos
     * el porcentaje o viceversa.
     *
     * La idea es que si ingreso una bonificación por $100 cuando cambia el
     * subtotal me mantenga el 100 pero cambie el porcentaje, pero si asigné
     * 25% entonces que me mantenga el 25% y cambie el monto.
     *
     * Ver constantes BONIFICACION_FIJAR_* para los diferentes valores.
     */
    self.descuentoManualFijar = '';

    self.descuentoManual.subscribe(function (nuevo) {
        //No permitimos que sea un valor no numérico
        if (nuevo === "" || isNaN(nuevo)) {
            self.descuentoManual(0);
        }
    });
    self.descuentoManualPorcentaje.subscribe(function (nuevo) {
        //No permitimos que sea un valor no numérico
        if (nuevo === "" || isNaN(nuevo)) {
            self.descuentoManualPorcentaje(0);
        }
    });

    self.descuentoManualQuitar = function () {
        self.descuento(null);
    };

    self.descuentoManualCalcular = function (subtotal, descuento) {
        if (self.descuentoCambiando) {
            return;
        }
        var monto = self.descuentoCalcular(subtotal, descuento, true);

        self.descuentoCambiando = true;
        self.descuentoManual(monto);
        //Forzamos la ejecución de todas las tareas para que tome la bandera,
        //caso contrario cuando se ejecute el subscribe de descuento manual
        //la bandera tendrá valor false.
        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    };
    self.descuento.subscribe(function (descuento) {
        //Al cambiar un descuento debemos limpiar los editables
        var generales = self.descuentosGenerales();
        for (var i = 0; i < generales.length; i++) {
            generales[i].limpiar();
        }

        var subtotal = self.subtotal();
        self.descuentoManualCalcular(subtotal, descuento);
    });
    self.subtotal.subscribe(function (subtotal) {
        var descuento = self.descuento();
        self.descuentoManualCalcular(subtotal, descuento);
    });

    self.descuentoManual.subscribe(function (monto) {
        var actual   = self.descuento();
        var subtotal = self.subtotal();
        if (self.descuentoCambiando || actual === null || actual === undefined || subtotal === 0 || monto === "") {
            //Se está cambiando el descuento o no hay descuento actual por lo
            //tanto no debemos hacer nada
            return;
        }
        //Se cambió el descuento manualmente, actualizamos su porcentaje
        self.descuentoManualFijar = BONIFICACION_FIJAR_MONTO;
        self.descuentoCambiando   = true;

        var porcentaje = parseFloat(monto) * 100 / subtotal;
        var redondeado = Math.round((porcentaje + Number.EPSILON) * 100) / 100;

        actual.porcentaje(redondeado);
        actual.comprobarMontoFijo = true;
        actual.montoFijo          = monto;
        self.descuentoManualPorcentaje(redondeado);
        self.descuentoManualPorcentajeReal = porcentaje;

        //Forzamos la ejecución de todas las tareas para que tome la bandera,
        //caso contrario cuando se ejecute el subscribe de descuento manual
        //la bandera tendrá valor false.
        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    });

    self.descuentoManualPorcentaje.subscribe(function (porcentaje) {
        var actual = self.descuento();
        if (self.descuentoCambiando || actual === null || actual === undefined) {
            return;
        }
        //Se cambió manualmente el porcentaje, actualizamos el monto
        self.descuentoManualFijar          = BONIFICACION_FIJAR_PORCENTAJE;
        self.descuentoManualPorcentajeReal = porcentaje;
        self.descuentoCambiando            = true;
        var subtotal                       = self.subtotal();
        var monto                          = porcentaje * subtotal / 100;
        var redondeado                     = Math.round((monto + Number.EPSILON) * 100) / 100;
        self.descuentoManual(redondeado);
        actual.porcentaje(porcentaje);
        actual.comprobarMontoFijo = false;
        actual.montoFijo          = 0.0;

        //Forzamos la ejecución de todas las tareas para que tome la bandera,
        //caso contrario cuando se ejecute el subscribe de descuento manual
        //la bandera tendrá valor false.
        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    });

    self.descuentoCaption = ko.pureComputed(function () {
        var manual       = parseFloat(self.descuentoManual());
        var descuento    = self.descuento();
        var sinDescuento = descuento === null || descuento === undefined;

        return sinDescuento && manual > 0 ? 'Bonificación manual' : 'Sin bonificación';
    });

    self.descuentoMonto = ko.pureComputed(function () {
        var manual    = parseFloat(self.descuentoManual());
        var subtotal  = self.subtotal();
        var descuento = self.descuento();

        if (manual !== 0) {
            return manual;
        }

        return self.descuentoCalcular(subtotal, descuento);
    });

    self.descuentoPorcentaje = ko.pureComputed(function () {
        var manual    = parseFloat(self.descuentoManualPorcentaje());
        var descuento = self.descuento();

        if (descuento !== null && descuento !== undefined && !descuento.manual) {
            return descuento.porcentaje();
        }

        if (manual > 0.0) {
            return manual;
        }

        return 0;
    });

    self.descuento100PorCiento = ko.pureComputed(function () {
        var descuento = parseFloat(self.descuentoMonto());
        var subtotal  = parseFloat(self.subtotal());
        return descuento === subtotal && subtotal > 0;
    });
    //</editor-fold>

    //<editor-fold desc="Pedidos">
    //self.pedido está declarado arriba.
    self.pedidoCrear      = function () {
        const cliente = self.cliente();
        const dummy   = js.pedidos.dummy;
        const pedido  = new koPedido(dummy);
        pedido.setCliente(cliente, self.caja.localidad);
        self.pedido(pedido);
        if (cliente !== null) {
            self.clienteSeleccionarAnadirComentarios(cliente);
        }
    };
    self.pedidoAbrirModal = function () {
        const cliente = self.cliente();
        self.pedidoCrear();
        self.$modalClientes.on('hide.bs.modal', function (e) {
            //Nos aseguramos que se procese la selección del cliente
            ko.tasks.runEarly();
        });
        if (cliente === null) {
            self.clienteAbrirModal();
        }
    };
    self.cliente.subscribe(function (nuevo) {
        const pedido = self.pedido();
        if (nuevo === null) {
            //Si no hay cliente, entonces tampoco debe haber pedido
            self.pedidoQuitar();
            return;
        }
        if (pedido !== null) {
            pedido.setCliente(nuevo, self.caja.localidad);
        }
    });
    self.cliente.subscribe(function (viejo) {
        const pedido = self.pedido();
        if (viejo === null || pedido === null) {
            return;
        }
        //Quitamos cualquier observación del cliente
        const observaciones = pedido.observaciones().replace(viejo.comentario.trim(), '');
        pedido.observaciones(observaciones);

    }, null, "beforeChange");

    self.pedidoCssAbrirModal = ko.pureComputed(function () {
        const pedido = self.pedido();

        return pedido !== null ? 'bg-blue-200 border-blue-200' : '';
    });

    /**
     * Quita el pedido seleccionado.
     */
    self.pedidoQuitar = function () {
        self.pedido(null);
    };
    //</editor-fold>


    //<editor-fold desc="Productos defecto para envíos">
    self.productosDefectoVigentes = ko.pureComputed(() => {
        const pedido           = self.pedido();
        const tipoEnvio        = pedido !== null ? pedido.comprobarTipoEnvio() : false;
        const lista            = self.lista();
        const productosDefecto = self.productosDefecto();
        const vigentes         = [];

        if (!tipoEnvio) {
            return vigentes;
        }

        for (let i = 0; i < productosDefecto.length; i++) {
            const defecto = productosDefecto[i];
            if (defecto.comprobarAplica(lista)) {
                vigentes.push(defecto.producto);
            }
        }

        return vigentes;
    });

    self.productosDefectoVigentes.subscribe((vigentes) => {
        self.productosDefectoQuitar();
        self.productosDefectoAgregar(vigentes);
    });

    self.productosDefectoQuitar = () => {
        const lineas = self.lineasAutomaticas();
        lineas.forEach((linea) => {
            self.quitarLinea(linea);
        });
    }

    self.productosDefectoAgregar = (productos) => {
        const lineaVacia          = self.primerLineaVacia();
        const agregarLineaAlFinal = lineaVacia !== null;
        for (let i = 0; i < productos.length; i++) {
            const producto = productos[i];
            const linea    = self.nuevaLineaOActualSiEstaVacia();
            linea.automatica(true);
            linea.producto(producto);
            linea.codigo(producto.codigo);
        }
        if (agregarLineaAlFinal && productos.length > 0) {
            const nueva = self.nuevaLinea();
            nueva.codigoEnfocar(true);
            self.lineaActual = nueva;
        }
    }
    //</editor-fold>

    //<editor-fold desc="Remitos">
    self.cliente.subscribe(function (cliente) {
        self.remitosCliente(cliente);
    });
    self.remitosAjax               = ko.observable(false);
    self.remitosClienteSeleccionar = function (cliente) {
        //Si elegimos un cliente debemos limpiar cualquier otro remito que
        //hubiera seleccionado
        self.remitosLimpiar();
        self.remitosCliente(cliente);
    };
    self.remitosClientesOrdenar    = function (a, b) {
        return a.nombre.localeCompare(b.nombre);
    };

    /**
     * Devuelve la lista de clientes con remitos.
     */
    self.remitosClientes = ko.pureComputed(function () {
        let ids        = [];
        const remitos  = self.remitos();
        const clientes = [];

        for (var i = 0; i < remitos.length; i++) {
            const remito = remitos[i];
            const id     = remito.cliente.id;

            if (ids.indexOf(id) !== -1) {
                continue;
            }
            ids.push(id);

            const cliente = self.clienteBuscarPorId(id);
            if (cliente !== null) {
                clientes.push(cliente);
            }
        }

        delete ids;
        clientes.sort(self.remitosClientesOrdenar);
        return clientes;
    });
    self.remitosDelCliente  = ko.pureComputed(function () {
        const salida  = [];
        const cliente = self.remitosCliente();
        if (cliente === null) {
            return salida;
        }

        const remitos   = self.remitos();
        const clienteId = parseInt(cliente.id);
        for (var i = 0; i < remitos.length; i++) {
            const remito = remitos[i];
            if (remito.cliente.id === clienteId) {
                salida.push(remito);
            }
        }

        return salida;
    });
    self.remitosAbrirModal  = function () {
        self.$modalRemitos.modal('show');
    };
    self.remitosCerrarModal = function () {
        self.$modalRemitos.on('hidden.bs.modal', function (e) {
            self.teclado('actual');
        });
        self.$modalRemitos.modal('hide');
    };

    self.remitoCssAbrirModal = ko.pureComputed(function () {
        var seleccionados = self.remitosSeleccionados();

        return seleccionados.length > 0 ? 'bg-blue-200 border-blue-200' : '';
    });

    /**
     * Limpia cualquier selección asociada a remitos como el cliente de remitos,
     * los remitos seleccionados y las líneas con remitos.
     */
    self.remitosLimpiar = function () {
        const lineas  = self.lineas();
        const lineasT = lineas.length;

        self.remitosCliente(null);
        self.remitosSeleccionados([]);

        for (var i = 0; i < lineasT; i++) {
            //Tomamos siempre el índice cero porque a medida que se quitan
            //líneas el array "lineas" va cambiando.
            const linea = lineas[0];
            if (linea.comprobarTipoLineaRemito()) {
                self.quitarLinea(linea);
            }
        }
    };

    /**
     * Cancela la selección de remitos dejando todos deseleccionados.
     */
    self.remitosCancelar = function () {
        self.remitosLimpiar();
        self.remitosCerrarModal();
    };

    /**
     * Confirma la sección de remitos y por cada línea de cada seleccionado crea
     * una línea del punto de venta.
     */
    self.remitosSeleccionar = function () {
        //Lo primero que hacemos es verificamos si deseleccionamos algún remito
        //y por ende debemos quitar las líneas que le corresponden.

        self.remitosSeleccionarQuitarDeseleccionados();

        const remitos  = self.remitosSeleccionados();
        const cliente  = self.remitosCliente();
        const lineasNR = self.lineasNoRemitos();

        self.clienteSeleccionar(cliente);

        for (let i = 0; i < remitos.length; i++) {
            const remito = remitos[i];
            const lineas = remito.lineas;

            for (let j = 0; j < lineas.length; j++) {
                //La primer línea del punto de venta puede estar vacía por lo
                //que hay que utilizarla
                const linea = lineas[j];
                if (linea.comprobarFacturado
                    || self.remitosComprobarLineaEnVenta(linea)
                ) {
                    //Ya fue facturada o ya está incluida en la venta
                    continue;
                }

                const productoId = linea.producto?.id;
                let producto     = self.buscarProductoPorId(productoId);
                if (producto === null) {
                    //Las líneas de "varios" o composiciones no elegibles no tienen producto relacionado
                    producto        = self.buscarProductoPorId('lr');
                    producto.nombre = linea.descripcion;
                }

                const lineaPV = self.nuevaLinea();

                producto      = jQuery.extend(true, {}, producto);
                producto.tipo = TIPO_LINEA_REMITO;

                linea.numero = j + 1;

                if (self.comprobarPermisoPrecioManual) {
                    //Si tiene permiso para asignar precios manualmente entonces
                    //debemos asignarle el precio del remito como precio manual
                    lineaPV.precioManual(parseFloat(linea.precio));
                }

                lineaPV.remito(remito);
                lineaPV.producto(producto);
                lineaPV.remitoLinea(linea);
                lineaPV.codigo(producto.codigo);
                lineaPV.cantidad(parseFloat(linea.cantidad));

                lineaPVVacia = false;
            }
        }

        //Quitamos las líneas que no son de remitos para ponerlas luego al final
        //de manera que queden siempre agrupadas las líneas de remitos
        for (let i = 0; i < lineasNR.length; i++) {
            const lineaNR = lineasNR[i];
            self.lineas.remove(lineaNR);
            self.lineas.push(lineaNR);
        }

        self.remitosCerrarModal();
    };

    self.remitosSeleccionarQuitarDeseleccionados = function () {
        const seleccionados = self.remitosSeleccionados();
        const lineasVenta   = self.lineas();

        for (let i = 0; i < lineasVenta.length; i++) {
            const lineaVenta = lineasVenta[i];
            const remito     = lineaVenta.remito();

            if (remito === null) {
                continue;
            }

            //Tenemos remito y debemos verificar si está seleccionado
            let encontrado = false;
            for (let j = 0; j < seleccionados.length; j++) {
                const seleccionado = seleccionados[j];
                if (seleccionado === remito) {
                    encontrado = true;
                    break;
                }
            }

            if (!encontrado) {
                self.quitarLinea(lineaVenta);
                i--;
            }
        }
    };

    /**
     * Quita todas las líneas de remito del remito dado.
     *
     * @param remito{koRemito}
     */
    self.remitosQuitar = function (remito) {
        self.remitosSeleccionados.remove(remito);
        self.remitosSeleccionarQuitarDeseleccionados();
    }

    /**
     * Devuelve true si hay una línea de venta relacionada a la línea de remito
     * dada.
     *
     * @param {koLinea} linea
     * @returns {boolean}
     */
    self.remitosComprobarLineaEnVenta = function (lineaRemito) {
        const lineasVenta = self.lineas();
        for (var i = 0; i < lineasVenta.length; i++) {
            const lineaVenta = lineasVenta[i];
            if (lineaVenta.remitoLinea() === lineaRemito) {
                return true;
            }
        }
        return false;
    };

    /**
     * Actualiza mediante Ajax los remitos siempre que la venta haya incluido
     * al menos una línea de remito.
     *
     * Se llama justo antes de limpiar la pantalla luego de registrar
     * éxitosamente una venta y lo que hace
     * @returns {void}
     */
    self.remitosActualizar = function () {
        if (!self.comprobarHayRemitosSeleccionados()) {
            return;
        }
        const url      = self.urls.remitos;
        const opciones = self.getAjaxOpciones({
            url: url,
            beforeSend: function (jqXHR, settings) {
                self.remitosAjax(true);
            },
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito !== "undefined"
                    && typeof data.remitos !== "undefined"
                    && data.exito
                ) {
                    self.mapearRemitos(data, self);
                } else {
                    var mensaje = "Ha ocurrido un error al intentar recuperar los remitos pendientes de factuación. Recargue la pantalla.";
                    var errores = self.ajaxGetErrores(data);
                    if (Array.isArray(errores)) {
                        mensaje = errores.length > 1 ? "Han ocurrido los siguientes errores:<br/><br/>" : "";
                        mensaje += errores.join("<br/><br/>");
                    } else if (typeof data.error !== "undefined" && data.error) {
                        mensaje = "Ha ocurrido el siguiente error: " + data.error;
                    }
                    Notificacion(mensaje, 'error');
                }
            },
            complete: function (jqXHR, settings) {
                self.remitosAjax(false);
            }
        });
        $.ajax(opciones);
    };

    self.comprobarHayRemitosSeleccionados = ko.pureComputed(function () {
        const seleccionados = self.remitosSeleccionados();
        return seleccionados.length > 0;
    });
    //</editor-fold>

    //<editor-fold desc="Saldo cliente">
    self.saldoRecuperar  = function (cliente) {
        if (cliente === null) {
            self.clienteSaldo(null);
            self.clienteSaldoAjax(false);
            self.clienteSaldoError(false);
            return;
        }

        const url      = self.urls.saldoCliente.replace('/0', '/' + cliente.id);
        const opciones = self.getAjaxOpciones({
            url: url,
            beforeSend: function (jqXHR, settings) {
                self.clienteSaldo(null);
                self.clienteSaldoAjax(true);
                self.clienteSaldoError(false);
            },
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito !== "undefined" && data.exito) {
                    self.clienteSaldo(data.saldo);
                } else {
                    var mensaje = "Ha ocurrido un error al intentar recuperar el saldo del cliente. Vuelva a intentar";
                    var errores = self.ajaxGetErrores(data);
                    if (Array.isArray(errores)) {
                        mensaje = errores.length > 1 ? "Han ocurrido los siguientes errores:<br/><br/>" : "";
                        mensaje += errores.join("<br/><br/>");
                    } else if (typeof data.error !== "undefined" && data.error) {
                        mensaje = "Ha ocurrido el siguiente error: " + data.error;
                    }
                    Notificacion(mensaje, 'error');
                    self.clienteSaldoError(true);
                }
            },
            complete: function (jqXHR, settings) {
                self.clienteSaldoAjax(false);
            }
        });
        $.ajax(opciones);
    };
    self.saldoReintentar = function () {
        self.saldoRecuperar(self.cliente());
    };
    self.cliente.subscribe(function (cliente) {
        self.saldoRecuperar(cliente);
    });
    self.clienteSaldoTexto = ko.pureComputed(function () {
        const ajax  = self.clienteSaldoAjax();
        const error = self.clienteSaldoError();
        const saldo = self.clienteSaldo();

        if (ajax) {
            return '<i class="fa fa-spinner fa-spin"></i> recuperando...';
        }
        if (error) {
            return '<span class="text-warning"><i class="fa fa-exclamation-triangle"></i> no se ha podido recuperar. <a href="#" onclick="koPuntoDeVenta.saldoReintentar()">Reintentar</a></span>';
        }
        if (saldo === null) {
            return '';
        }

        let saldoClase = "text-muted";
        if (saldo < 0) {
            saldoClase = "text-danger";
        } else if (saldo > 0) {
            saldoClase = "text-success";
        }
        const formateado = formatearMoneda(saldo);

        return '<span class="' + saldoClase + '">' + formateado + '</span>';
    });
    //</editor-fold>

    self.iva = ko.pureComputed(function () {
        var iva        = 0;
        var lineas     = self.lineas();
        var descuento  = self.descuento();
        var manual     = parseFloat(self.descuentoManual());
        var porcentaje = self.descuentoPorcentaje();

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            iva += linea.iva();
        }
        var salida = iva;

        if (descuento !== null && descuento !== undefined) {
            var descontar = self.descuentoCalcular(iva, descuento);
            salida        = iva - descontar;
        } else if (manual > 0.0) {
            //Hay descuento manual, aplicamos el porcentaje
            var descontar = iva * porcentaje / 100;
            salida        = iva - descontar;
        }

        return Math.round((salida + Number.EPSILON) * 100) / 100;
    });

    self.total = ko.pureComputed(function () {
        var subtotal  = self.subtotal();
        var iva       = self.iva();
        var descuento = self.descuentoMonto();

        return subtotal + iva - descuento;
    });

    self.total.subscribe(function (total) {
        //Actualizamos el valor de recibido en el cobro si la pantalla cambió su
        //total y tenemos un solo cobro en efectivo
        const cobros = self.cobros();
        if (cobros.length !== 1) {
            return;
        }
        cobros[0].recibido(total);
    });

    self.errores = ko.pureComputed(function () {
        let j;
        let i;
        let errores;
        let error;
        //Debe haber al menos una línea con producto y sin error
        let salida          = [];
        const total         = self.total();
        const lineas        = self.lineas();
        const cobros        = self.cobros();
        const cliente       = self.cliente();
        const pedido        = self.pedido();
        const comensal      = self.comensal();
        const comprobante   = self.comprobante();
        const descuento100  = self.descuento100PorCiento();
        const descuentoM    = self.descuentoManual();
        const descuentoMP   = self.descuentoManualPorcentaje();
        const faltaCliente  = self.comprobarFaltaSeleccionarCliente();
        const faltaComensal = self.comprobarFaltaSeleccionarComensal();
        const factura       = comprobante !== null && comprobante.tipo === COMPROBANTE_TIPO_FACTURA;

        if (total < 0) {
            salida.push("El total no puede ser menor a $0.");
        }

        if (faltaCliente) {
            salida.push("Cliente no seleccionado");
        }

        if (faltaComensal) {
            salida.push("Comensal no seleccionado");
        }

        if (total >= 10000 && cliente === null && comensal === null && factura) {
            salida.push("Para facturas mayores a $ 10.000 debe seleccionar un cliente o comensal.");
        }

        if (descuento100 && factura) {
            salida.push("Para descuientos del 100% debe seleccionar comprobante interno.");
        }

        if (pedido !== null) {
            //Debe tener al menos dirección
            errores = pedido.errores();
            salida  = salida.concat(errores);
        }

        if (descuentoM < 0 || descuentoMP < 0) {
            salida.push("La bonificación manual no puede ser menor a cero.");
        }

        for (i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            if (linea.producto() !== null) {
                errores = linea.errores();
                for (j = 0; j < errores.length; j++) {
                    error = errores[j];
                    salida.push("Línea " + (i + 1) + ": " + error);
                }
            }
        }

        let cobrosTotal = 0;
        for (i = 0; i < cobros.length; i++) {
            const cobro   = cobros[i];
            const errores = cobro.errores();
            cobrosTotal += parseFloat(cobro.recibido());
            cobrosTotal -= parseFloat(cobro.vuelto());
            for (j = 0; j < errores.length; j++) {
                error = errores[j];
                salida.push("Cobro " + (i + 1) + ": " + error);
            }
        }
        if (cobrosTotal < total) {
            salida.push("El total cobrado " + formatearMoneda(cobrosTotal) + " no cubre el total de la venta.");
        } else if (cobrosTotal > total) {
            salida.push("El total cobrado " + formatearMoneda(cobrosTotal) + " es superior al total de la venta.");
        }

        return salida;
    });

    self.advertencias = ko.pureComputed(() => {
        const salida  = [];
        const remitos = self.remitosSeleccionados();

        for (let i = 0; i < remitos.length; i++) {
            const remito       = remitos[i];
            const advertencias = remito.advertencias();
            if (advertencias !== "") {
                const advertencia = "Remito " + remito.numero + ": " + advertencias
                salida.push(advertencia);
            }
        }

        return salida;
    });

    //<editor-fold desc="Registrar">
    self.comprobarPuedeRegistrar = ko.pureComputed(function () {
        //Debe haber al menos una línea con producto y sin error
        const ajax          = self.ajax();
        const lineas        = self.lineas();
        const total         = parseFloat(self.total());
        const errores       = self.errores();
        const faltaCliente  = self.comprobarFaltaSeleccionarCliente();
        const faltaComensal = self.comprobarFaltaSeleccionarComensal();
        const descuento100  = self.descuento100PorCiento();
        const actualizando  = self.actualizando();

        if (lineas.length === 0 || ajax || (total === 0.0 && !descuento100) || total < 0 || faltaCliente || faltaComensal || errores.length > 0 || actualizando) {
            return false;
        }

        //Verificamos que las líneas estén correctas y haya al menos un producto
        var producto = false;
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea.comprobarPuedeRegistrar()) {
                return false;
            }
            if (linea.producto() !== null) {
                producto = true;
            }
        }

        return producto;
    });

    self.registrar = function () {
        if (!self.comprobarPuedeRegistrar()) {
            //Esta función se llama al hacer click en el botón pero también
            //al apretar Ctrl + Enter por eso debemos verificar antes de
            //continuar.
            return;
        }

        const advertencias    = self.advertencias();
        const conAdvertencias = advertencias.length > 0;
        const tipo            = conAdvertencias ? 'warning' : 'question';
        const html            = conAdvertencias ? advertencias.join("<br/><br/>") + '<br/><br/>¿Confirmar?' : '¿Confirmar?';

        return Alerta({
            title: 'Total venta: ' + formatearMoneda(self.total()),
            html: html,
            type: tipo,
            confirmButtonText: '<i class="fa fa-check"></i> Si',
            cancelButtonText: '<i class="fa fa-times"></i> No',
            onConfirmCallback: function () {
                const url          = self.urls.registrar;
                const cliente      = self.cliente();
                const comensal     = self.comensal();
                const descuento    = self.descuento();
                const conDescuento = descuento !== null && descuento !== undefined;
                let descontado     = 0;

                if (conDescuento) {
                    descontado = descuento.manual ? self.descuentoManualPorcentajeReal : descuento.porcentaje();
                }

                const pedido = self.pedido();
                const data   = {
                    descontado: descontado,
                    descuento: conDescuento ? descuento.id : null,
                    comensal: comensal !== null ? comensal.id() : null,
                    cliente: cliente !== null ? cliente.id : null,
                    lineas: self.registrarDataLineas(),
                    cobros: self.registrarDataCobros(),
                    lista: self.lista().id,
                    total: self.total(),
                    fecha: self.fecha(),
                    condicion: self.condicion(),
                    vencimiento: self.vencimiento(),
                    comprobante: self.comprobante(),
                    observaciones: self.observaciones()
                };

                if (pedido !== null) {
                    data.pedido = pedido.data();
                }

                const opciones = self.getAjaxOpciones({
                    url: url,
                    data: data,
                    success: function (data, textStatus, jqXHR) {
                        if (typeof data.exito !== "undefined" && data.exito) {
                            //Es importante llamar a remitosActualizar()
                            //antes de limpiar la pantalla
                            self.remitosActualizar();
                            self.verTicket(data.ticketUrl, data.ticket, data.rutaEnvio, data.mensajes);
                        } else {
                            var mensaje = "Ha ocurrido un error, vuelva a intentar";
                            var errores = self.ajaxGetErrores(data);
                            if (Array.isArray(errores)) {
                                mensaje = errores.length > 1 ? "Han ocurrido los siguientes errores:<br/><br/>" : "";
                                mensaje += errores.join("<br/><br/>");
                            } else if (typeof data.error !== "undefined" && data.error) {
                                mensaje = "Ha ocurrido el siguiente error: " + data.error;
                            }
                            Notificacion(mensaje, 'error');
                        }
                    }
                });
                $.ajax(opciones);
            }
        });
    };

    self.registrarDataLineas = function () {
        var salida = [];
        var lineas = self.lineas();

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (linea.producto() === null) {
                continue;
            }
            salida.push(linea.data());
        }

        return salida;
    };

    self.registrarDataCobros = function () {
        const salida    = [];
        const cobros    = self.cobros();
        const condicion = self.condicion();

        if (condicion === CONDICION_CUENTA_CORRIENTE) {
            return salida;
        }

        for (var i = 0; i < cobros.length; i++) {
            const cobro = cobros[i];
            if (cobro.recibido() === 0.0) {
                //Ignoramos cobros en cero
                continue;
            }
            salida.push(cobro.data());
        }

        return salida;
    };
    //</editor-fold>

    self.tituloComensalCliente = self.comensalHabilitado ? 'Comensal / Cliente' : 'Cliente';

    self.textoComensalCliente = ko.pureComputed(function () {
        let salida     = "";
        let saldo      = self.clienteSaldoTexto();
        const cliente  = self.cliente();
        const comensal = self.comensal();

        const selComensal = self.comprobarPuedeSeleccionarComensal();
        const selCliente  = self.comprobarPuedeSeleccionarCliente();

        if (cliente !== null) {
            salida += cliente.nombre;
            if (selComensal) {
                //Solo si puede seleccionar del otro tipo mostramos que es
                //cliente, sino se asume
                salida += '<br/><span class="text-muted">Cliente</span>';
            }
        }

        if (comensal !== null) {
            if (salida !== "") {
                salida += "<br/>";
            }
            salida += comensal.nombre() + " " + comensal.apellido();
            if (selCliente) {
                salida += '<br/><span class="text-muted">Comensal</span>';
            }
        }

        if (saldo !== "") {
            saldo = '<br/><span class="text-muted">Saldo:</span> ' + saldo;
        }

        const defecto = self.comensalHabilitado ? "No seleccionado" : "Consumidor final";

        return salida !== "" ? salida + saldo : defecto;
    });

    self.cssColmnaInferior = self.pedidos.habilitado ? 'col-md-4' : 'col-md-6';
    self.cssColumnaAncha   = self.comprobarPuedeAplicarDescuentoPorLinea ? 'w-4/12' : 'w-6/12';
    self.cssColumnaAngosta = 'w-1/12';

    self.colSpanDescuento = 2;
    if (!self.comprobarPuedeAplicarDescuentoPorLinea && self.comprobarPuedeAplicarDescuentosGenerales) {
        self.colSpanDescuento = 1;
    }

    self.colSpanEspacio = ko.pureComputed(function () {
        let salida = self.comprobarPuedeAplicarDescuentoPorLinea ? 7 : 5;
        if (self.comprobarPuedeAplicarDescuentosGenerales) {
            salida -= 3;
        }
        if (!self.comprobarPuedeAplicarDescuentoPorLinea && self.comprobarPuedeAplicarDescuentosGenerales) {
            salida += 1;
        }
        if (self.comprobarDiscriminaIva()) {
            salida += 1;
        }
        return salida;
    });

    self.colSpanTotal = ko.pureComputed(function () {
        let salida = self.comprobarPuedeAplicarDescuentoPorLinea ? 8 : 6;
        if (self.comprobarDiscriminaIva()) {
            salida += 1;
        }
        return salida;
    });

    self.colSpanObservacionesPie = ko.pureComputed(function () {
        const colSpanTotal = self.colSpanTotal();
        return colSpanTotal - 1;
    });

    self.colSpanBonificacion = ko.pureComputed(function () {
        const total = self.colSpanTotal();
        return total - 3;
    });

    self.teclado = function (operacion) {
        if (self.$tablaEnfocado === null) {
            //No hay campo enfocado, no tenemos de donde partir o estamos en un
            //modal
            return;
        }

        switch (operacion) {
            case 'quitar':
                return self.quitarLineaActual();

            case 'quitar-forzar':
                return self.quitarLineaActual(true);

            case 'inicializar':
                return self.inicializar();

            case 'enviar':
                return self.registrar();

            case 'seleccionar-comensal':
                if (!self.comprobarPuedeSeleccionarComensal()) {
                    return;
                }
                if (self.comensal() === null) {
                    $('#seleccionar-comensal').click();
                } else {
                    $('#quitar-comensal').click();
                }
                return;

            case 'seleccionar-cliente':
                if (!self.comprobarPuedeSeleccionarCliente()) {
                    return;
                }
                if (self.cliente() === null) {
                    $('#seleccionar-cliente').click();
                } else {
                    $('#quitar-cliente').click();
                }
                return;

            case 'seleccionar-pedido':
                if (self.pedido() === null) {
                    $('#seleccionar-pedido').click();
                } else {
                    $('#quitar-pedido').click();
                }
                return;

            case 'comprobante-siguiente':
                var actual      = self.comprobante();
                var disponibles = self.comprobantesDisponibles();
                var siguiente   = self.getProximo(actual, disponibles);
                if (siguiente !== null) {
                    self.comprobante(siguiente);
                }
                return;

            case 'condicion-siguiente':
                if (self.condicion() === CONDICION_CONTADO) {
                    self.condicion(CONDICION_CUENTA_CORRIENTE);
                } else {
                    self.condicion(CONDICION_CONTADO);
                }
                return;
        }

        //Nos aseguramos que esté todo procesado
        ko.tasks.runEarly();

        var $lineaActual = self.$getLineaActual();
        var $tabables    = self.$tabla.find(selector);
        var indice       = $tabables.index(self.$tablaEnfocado);
        var proximo      = null;
        var $proximo     = null;
        var crearLinea   = false;

        switch (operacion) {
            case 'actual':
                proximo = indice;
                break;

            case 'anterior':
                proximo = indice - 1;
                break;

            case 'siguiente':
                proximo = indice + 1;
                if ($tabables.eq(proximo).length === 0) {
                    //No hay más campos a los que enfocar, por lo que agregamos
                    //una nueva línea
                    crearLinea = true;
                }
                break;

            case 'linea-anterior':
                var $lineaAnterior = $lineaActual.prev();
                if ($lineaAnterior.length === 0) {
                    return;
                }

                var lineaIndice           = $lineaActual.find(selector).index(self.$tablaEnfocado);
                var $lineaAnteriorProximo = $lineaAnterior.find(selector).eq(lineaIndice);
                proximo                   = $tabables.index($lineaAnteriorProximo);
                break;

            case 'linea-siguiente':
                var $lineaSiguiente = $lineaActual.next();
                if ($lineaSiguiente.length === 0) {
                    crearLinea = true;
                } else {
                    var lineaIndice            = $lineaActual.find(selector).index(self.$tablaEnfocado);
                    var $lineaSiguienteProximo = $lineaSiguiente.find(selector).eq(lineaIndice);
                    proximo                    = $tabables.index($lineaSiguienteProximo);
                }
                break;

            case 'agregar-quitar-comentario':
                const visible = self.lineaActual.comentarioMostrar();

                if (visible) {
                    //Escondemos el campo de comentario y lo borramos
                    self.lineaActual.comentarioMostrar(false);
                    self.lineaActual.comentario("");
                    self.lineaActual.codigoEnfocar(true);
                } else {
                    //Mostramos y enfocamos el campo de comentario
                    self.lineaActual.comentarioMostrar(true);
                    self.lineaActual.comentarioEnfocar(true);
                }
                return;

        }

        if (crearLinea) {
            if (self.lineaActual.producto() === null) {
                const $campoCodigo = self.$getCampoCodigoActual();
                //No tenemos producto seleccionado, enfocamos el campo de
                //código para seleccionar
                $campoCodigo.focus();
                return;
            }
            self.nuevaLinea();
            ko.tasks.runEarly();
            self.teclado(operacion);
            return;
        }

        $proximo = $tabables.eq(proximo);
        $proximo.focus().select();

        const dom   = $proximo.closest('.punto-de-venta-tabla-linea').get(0);
        const linea = ko.dataFor(dom);
        if (linea instanceof koLinea) {
            self.setLineaActual(linea);
        }
    };

    self.verTicket = function (url, htmlComprobante, urlEnvio, mensajes) {
        let title = 'Venta confirmada';
        let type  = 'success';
        //Desactivado el uso del atributo "srcdoc" porque en Esenio a partir de
        //Firefox 94 había un problema de impresión y salía el ticket vacío.
        //let html   = '<iframe srcdoc="' + htmlComprobante + '" src="' + url + '" id="punto-de-venta-ticket-iframe" class="ticket-iframe punto-de-venta-ticket-iframe"></iframe>';
        let html            = '<iframe onload="ticketTitle(\'punto-de-venta-ticket-iframe\')" src="' + url + '" id="punto-de-venta-ticket-iframe" class="ticket-iframe punto-de-venta-ticket-iframe"></iframe>';
        const documentTitle = document.title;
        const total         = mensajes.length;
        const pedido        = self.pedido();

        if (total > 0) {
            type  = 'warning';
            html  = mensajes.join("<br/>") + html;
            title = 'Venta confirmada sin CAE';
        }

        const agrandar = self.caja.tipoComprobante === TIPO_COMPROBANTE_A4;
        const opciones = {
            type: type,
            title: title,
            html: html,
            agrandar: agrandar,
            showDenyButton: true,
            confirmButtonText: '<i class="fa fa-print"></i> Imprimir',
            denyButtonText: '<i class="fa fa-envelope-o"></i> Enviar',
            denyButtonColor: '#39a1f4',
            cancelButtonText: '<i class="fa fa-times"></i> Cerrar',
            cancelButtonColor: "#a5a5a5",
            preConfirm: function () {
                const iframe    = document.getElementById("punto-de-venta-ticket-iframe");
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                if (iframeDoc.readyState !== 'complete') {
                    //El iframe no terminó de cargar, cancelamos la impresión
                    return false;
                }

                iframe.contentWindow.print();
                if (pedido !== null) {
                    //Si tenemos pedido debe imprimirse dos veces
                    iframe.contentWindow.print();
                }
                document.title = documentTitle;
                self.inicializar();

                return true;
            },
            onDenyCallback: function () {
                //Mostramos el alerta de envío de correo
                document.title = documentTitle;
                self.enviarTicketSolicitarCorreo(urlEnvio);
            },
            onCancelCallback: function () {
                document.title = documentTitle;
                self.inicializar();
            },
        };

        if (!urlEnvio) {
            //Si no hay url de envío entonces no mostramos la opción.
            //Puede suceder si un comprobante no tiene CAE
            opciones.showDenyButton = false;
        }

        return Alerta(opciones);
    };

    /**
     * Solicita la dirección de correo electrónico a la cual enviar el ticket.
     */
    self.enviarTicketSolicitarCorreo = function (url, enviado = "") {
        var cliente  = self.cliente();
        var comensal = self.comensal();
        var defecto  = "";

        if (enviado !== "") {
            defecto = enviado;
        } else if (cliente !== null && cliente.correo !== "") {
            defecto = cliente.correo;
        } else if (comensal !== null && comensal.correo() !== "") {
            defecto = comensal.correo();
        }

        return Alerta({
            title: "Enviar comprobante por correo",
            input: 'email',
            inputValue: defecto,
            inputPlaceholder: 'Ingrese correo destinatario',
            validationMessage: 'El correo ingresado no es correcto',
            confirmButtonText: '<i class="fa fa-envelope-o"></i> Enviar',
            confirmButtonColor: '#39a1f4',
            cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
            cancelButtonColor: "#a5a5a5",
            onConfirmCallback: function () {
                //Hacemos la petición mediante ajax
                var correo = swal.getInput().value;
                self.enviarTicket(url, correo);
                return;
            },
            onCancelCallback: function () {
                //Mostramos el alerta de envío de correo
                self.inicializar();
                return;
            }
        });
    };

    /**
     * Efectiviza el envío del ticket mediante correo electrónico.
     */
    self.enviarTicket = function (url, correo) {

        Notificacion('Enviando ticket a ' + correo + ".", 'info');

        var data     = {correo: correo};
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            async: false,
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito === 'undefined' || !data.exito) {
                    Notificacion('Ha ocurrido un error al intentar enviar el correo.', 'error');
                    self.enviarTicketSolicitarCorreo(url, correo);
                    return;
                }
                Notificacion('Correo enviado a ' + correo + ' éxitosamente.', 'success');
                self.inicializar();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                var mensaje = "Ha ocurrido un error, vuelva a intentar";
                if (typeof jqXHR.responseJSON !== "undefined") {
                    var data    = jqXHR.responseJSON;
                    var errores = self.ajaxGetErrores(data);
                    if (Array.isArray(errores)) {
                        mensaje = errores.length > 1 ? "Han ocurrido los siguientes errores:<br/><br/>" : "";
                        mensaje += errores.join("<br/><br/>");
                    } else if (typeof data.error !== "undefined") {
                        mensaje = "Ha ocurrido el siguiente error: " + data.error;
                    }
                }
                Notificacion(mensaje, 'error');
                self.enviarTicketSolicitarCorreo(url, correo);
            }
        });
        $.ajax(opciones);
    };

    //<editor-fold desc="Botones superiores">
    self.botonesSuperiores = [];

    if (self.caja.central) {
        var botonRemitos = new koOperacion(
            self.remitosAbrirModal,
            'Remitos',
            self.remitosCssAbrirModal,
            true,
            false,
            self.remitosLimpiar,
            'pedido',
            'fa fa-truck',
            'facturar uno o varios pedidos'
        );
        self.botonesSuperiores.push(botonRemitos);
    }

    if (self.pedidos.habilitado) {
        var botonPedido = new koOperacion(
            self.pedidoAbrirModal,
            'Pedido',
            self.pedidoCssAbrirModal,
            true,
            self.pedido,
            self.pedidoQuitar,
            'pedido',
            'fa fa-motorcycle',
            'activar/desactivar pedido'
        );
        self.botonesSuperiores.push(botonPedido);
    }

    if (self.comensalHabilitado) {
        var botonComensal = new koOperacion(
            self.comensalAbrirModal,
            self.comensalTextoBoton,
            self.cssComensalAbrirModal,
            self.comprobarPuedeSeleccionarComensal,
            self.comensal,
            self.comensalQuitar,
            'comensal',
            'fa fa-user-o'
        );
        self.botonesSuperiores.push(botonComensal);
    }

    var botonCliente = new koOperacion(
        self.clienteAbrirModal,
        self.clienteTextoBoton,
        self.cssClienteAbrirModal,
        self.comprobarPuedeSeleccionarCliente,
        self.cliente,
        self.clienteQuitar,
        'cliente',
        'fa fa-suitcase'
    );
    self.botonesSuperiores.push(botonCliente);
    //</editor-fold>

    /**
     * Devuelve el próximo elemento a partir del actual y los disponibles,
     * teniendo en cuenta que si se llega al último, entonces devuelve el
     * primero.
     *
     * @param {mixed} actual
     * @param {array} disponibles
     * @returns {mixed|null}
     */
    self.getProximo = function (actual, disponibles) {
        var indice = disponibles.indexOf(actual);
        if (indice === -1) {
            //El elemento no se encuentra y por tanto no hay próximo
            return null;
        }
        var proximo = indice + 1;
        if (typeof disponibles[proximo] !== 'undefined') {
            return disponibles[proximo];
        }
        return disponibles[0];
    };

    //<editor-fold desc="Comprobación para actualizar">
    self.actualizando                     = ko.observable(false);
    self.actualizacionDisponible          = ko.observable(false);
    self.comprobarActualizacionDisponible = function () {
        var url      = self.urls.comprobarActualizacionDisponible;
        var data     = {hash: self.hash};
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            beforeSend: function (jqXHR, settings) {
                //Agregado para que no establezca ajax en true y bloquee el
                //botón de registro
            },
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito === 'undefined' || typeof data.actualizar === 'undefined' || !data.exito) {
                    Notificacion('Ha ocurrido un error al intentar verificar si hay actualizaciones disponibles.', 'error');
                    return;
                }
                if (data.actualizar) {
                    self.actualizacionDisponible(true);
                }
            },
            complete: function (jqXHR, settings) {
                //Agregado para que no establezca el observable ajax
            }
        });
        $.ajax(opciones);
    };

    self.comprobarPuedeActualizar = ko.pureComputed(function () {
        return !self.comprobarPuedeRegistrar();
    });

    self.actualizarTitle = ko.pureComputed(function () {
        var puede      = self.comprobarPuedeActualizar();
        var disponible = self.actualizacionDisponible();

        if (!puede) {
            return "No se puede actualizar hasta que cancele o registre la venta actual.";
        }

        return disponible ? "Actualización disponible, haga click para actualizar el punto de venta" : "Actualizar punto de venta";
    });

    self.actualizarClass = ko.pureComputed(function () {
        var salida     = "";
        var disponible = self.actualizacionDisponible();
        var puede      = self.comprobarPuedeActualizar();

        if (disponible) {
            salida += " text-danger";
        }

        if (!puede) {
            salida += " opacity-50";
        }

        return salida.trim();
    });

    self.actualizar = function () {
        const url      = self.urls.actualizar;
        const opciones = self.getAjaxOpciones({
            url: url,
            async: false,
            beforeSend: function (jqXHR, settings) {
                self.ajax(true);
                self.actualizando(true);
                ko.tasks.runEarly();
            },
            success: function (data, textStatus, jqXHR) {
                if (typeof data.exito === 'undefined' || typeof data.vm === 'undefined' || !data.exito) {
                    Notificacion('Ha ocurrido un error al intentar actualizar el punto de venta, vuelva a intentar.', 'error');
                    return;
                }
                //Por un error de recursividad al actualizar solo actualizamos
                //propiedades y no todo el modelo
                //ko.mapping.fromJS(data.vm, {}, koPuntoDeVenta);
                //console.time("Actualización");

                //Invalidamos la caché de las listas porque sino no actualiza precios
                cache.listas = [];
                let nuevo    = {};

                self.mapear(data.vm, config, nuevo);
                self.hash = nuevo.hash;
                self.productos(nuevo.productos());
                self.clientes(nuevo.clientes());
                self.descuentos(nuevo.descuentos);
                self.servicios(nuevo.servicios);
                self.listas(nuevo.listas());
                self.listaDefecto = cache.listas[self.listaDefecto.id];
                self.productosDefecto(nuevo.productosDefecto());

                //Si no actualizamos antes no conserva la lista por defecto
                ko.tasks.runEarly();
                self.lista(self.listaDefecto);

                self.actualizacionDisponible(false);

                //Limpiamos la memoria y además asignamos al js su nuevo valor
                //para que la próxima vez compare con el último view model obtenido
                delete nuevo;
                js = data.vm;

                //Desactivamos el forzado de actualizar knockout porque en la
                //actualización no lo necesitamos y en Firefox bajó de entre 8 y
                //12 segundos a 4 la operación.
                //ko.tasks.runEarly();
                //console.timeEnd("Actualización");
                Notificacion("Punto de venta actualizado correctamente", "success");
            },
            complete: function (jqXHR, settings) {
                self.ajax(false);
                self.actualizando(false);
            }
        });
        $.ajax(opciones);
    };


    if (!self.mv) {
        setInterval(function () {
            self.comprobarActualizacionDisponible();
        }, TIEMPO_COMPROBACION_ACTUALIZACION);
    }
    //</editor-fold>

}

function koOperacion(click, texto, css, enable, seleccionado, quitar, concepto, icono, ayuda) {
    var self          = this;
    self.click        = click;
    self.enable       = enable;
    self.css          = css;
    self.icono        = icono;
    self.texto        = texto;
    self.texto        = texto;
    self.quitar       = quitar;
    self.seleccionado = seleccionado;

    self.id          = 'seleccionar-' + concepto;
    self.quitarId    = 'quitar-' + concepto;
    self.title       = 'Buscar y seleccionar ' + concepto;
    self.quitarTitle = 'Quitar ' + concepto + ' seleccionado';
    self.ayuda       = ayuda !== undefined ? ayuda : 'buscar o quitar ' + concepto;
}

function koLista(js) {
    const self = this;
    for (let clave in js) {
        self[clave] = js[clave];
    }

    self.getPrecio = function (producto) {
        const id      = producto.id;
        const precios = self.precios;
        for (let i = 0; i < precios.length; i++) {
            const precio = precios[i];
            if (precio.producto === id) {
                return precio;
            }
        }
        return null;
    };
}

function koLinea(pantalla) {
    const self = this;

    self.pantalla         = pantalla;
    self.automatica       = ko.observable(false);
    self.actual           = ko.observable(false);
    self.errores          = ko.observableArray([]);
    self.producto         = ko.observable(null);
    self.cupoTexto        = ko.observable("");
    self.cantidad         = ko.observable(1);
    self.cantidadMaxima   = ko.observable();
    self.cantidadAnterior = 1;

    self.codigo        = ko.observable("");
    self.codigoEnfocar = ko.observable(false);

    self.remito      = ko.observable(null);
    self.remitoLinea = ko.observable(null);

    //No permitimos ingresar cantidades inválidas
    self.cantidad.subscribe(function (valor) {
        if (valor === "" || valor === null) {
            return;
        }
        valor = parseFloat(valor);

        const producto = self.producto();
        if (producto !== null && producto.fraccionable) {
            //Si es fraccionable permitimos decimales
            return;
        }

        //No es fraccionable, no permitimos decimales
        const redondeado = Math.round(valor);
        if (valor !== redondeado) {
            self.cantidad(redondeado);
        }
    });

    //<editor-fold desc="Menú invitados">
    self.turno           = ko.observable(null);
    self.turnoSuscripto  = null;
    self.servicio        = ko.observable(null);
    self.asignacion      = ko.observable(null);
    self.setMenuInvitado = function (asignacion, turno, servicio) {
        var turnoAnterior = self.turno();

        self.turno(turno);
        self.servicio(servicio);
        self.asignacion(asignacion);

        if (turno.cupos() === null || turno.comprobarSinControlCupos()) {
            //No hay control de cupos para el turno elegido
            return;
        }

        var cantidad   = self.cantidad();
        var disponible = turno.cuposDisponibles();
        var nueva      = disponible - cantidad;

        if (turnoAnterior === turno) {
            //La línea ya tenía el turno indicado, por lo tanto no debemos
            //modificar sus cupos
            return;
        } else if (turnoAnterior !== null) {
            //Debemos devolver el cupo al turno
            var disponibleAnterior = turnoAnterior.cuposDisponibles();
            turnoAnterior.cuposDisponibles(disponibleAnterior + cantidad);
        }

        //Tenemos control de cupos, debemos asegurarnos de no solicitar lo
        //máximo disponible de cada turno y descontar la cantidad de la línea
        //al disponible del turno
        turno.cuposDisponibles(nueva);
        self.cambioCupoCalcular(nueva);

        if (self.turnoSuscripto !== null) {
            //Por las dudas se haya elegido otro turno, quitamos la suscripción
            self.turnoSuscripto.dispose();
        }

        //Nos suscribimos al cambio de cupos disponibles del turno por si otra
        //línea cambia la disponibilidad
        self.turnoSuscripto = turno.cuposDisponibles.subscribe(function (nuevaDisponibilidad) {
            self.cambioCupoCalcular(nuevaDisponibilidad);
        });
    };

    self.cambioCupoCalcular = function (nuevaDisponibilidad) {
        //La cantidad de una misma línea no debe afectar el máximo disponible
        //por eso a la cantidad máxima le asignamos el disponible que es igual
        //a la nueva disponibilidad del turno + la cantidad de la línea
        //Sino cada vez que aumentamos la cantidad en 1 disminuye el máximo en
        //1 y por tanto solo nos dejaría elegir un máximo de la mitad del
        //disponible
        var cantidad = self.cantidad();
        if (cantidad === "") {
            cantidad = 0;
        }

        var disponible = nuevaDisponibilidad + parseInt(cantidad);
        var texto      = disponible === 1 ? "1 disponible" : disponible + " disponibles";
        self.cantidadMaxima(disponible);
        self.cupoTexto(texto);
    };

    self.cantidad.subscribe(function (anterior) {
        self.cantidadAnterior = anterior;
    }, null, "beforeChange");

    self.cantidad.subscribe(function (cantidad) {
        if (!self.comprobarTieneCupo()) {
            return;
        }

        //Cambió la cantidad del menú, debemos actualizar el cupo del turno
        var turno          = self.turno();
        var diferencia     = cantidad - self.cantidadAnterior;
        var disponibilidad = turno.cuposDisponibles();
        var nueva          = disponibilidad - diferencia;
        turno.cuposDisponibles(nueva);
    });

    self.quitarMenuInvitado = function () {
        self.turno(null);
        self.servicio(null);
        self.asignacion(null);
    };

    self.producto.subscribe(function (producto) {
        if (producto !== null && !producto.comprobarMenuInvitados) {
            //Si elegimos un producto que no es menú de invitado, quitamos
            //cualquier valor anterior que pudiera haber quedado.
            self.quitarMenuInvitado();
        }
    });
    //</editor-fold>

    self.producto.subscribe(function (producto) {
        const remitoLinea = self.remitoLinea();
        if (remitoLinea !== null) {
            //Si tiene línea de remito relacionada no cambiamos
            //nada.
            return;
        }
        if (producto !== null && producto.cantidadFija !== false) {
            self.cantidad(producto.cantidadFija);
        }
        if (self.pantalla.comprobarPermisoPrecioManual) {
            var lista  = self.pantalla.lista();
            var precio = lista.getPrecio(producto);

            if (precio !== null) {
                self.precioManual(precio.precio);
            }
        }
    });

    self.cantidadStep   = ko.pureComputed(function () {
        const producto = self.producto();
        if (producto === null) {
            return 1;
        }
        return producto.fraccionable ? 0.01 : 1;
    });
    self.cantidadMinima = ko.pureComputed(function () {
        //La cantidad mínima está atada al step, si permito un step de 1,
        //entonces el mínimo es 1 y si es de 0.01 entonces el mínimo será 0.01
        //Lo dejamos en método separado para que en la vista no parezca extraño.
        return self.cantidadStep();
    });

    self.tipo = ko.pureComputed(function () {
        const producto = self.producto();
        if (producto === null) {
            return '';
        }
        return producto.tipo;
    });

    self.nombreProducto = function (producto) {
        let salida = producto.nombre;
        if (typeof producto.categoriaNombre !== "undefined") {
            salida += '<br/><span class="text-muted text-xs">' + producto.categoriaNombre + '</span>';
        }
        return salida;
    };
    self.nombreRemito   = function (remito, remitoLinea, producto) {
        let salida      = producto !== null ? self.nombreProducto(producto) : remitoLinea.descripcion;
        const categoria = remitoLinea.categoria;
        salida += '<br/><span class="text-info">línea '
            + remitoLinea.numero;
        if (categoria !== null) {
            salida += ' - ' + categoria.nombre;
        }
        return salida + '</span>';
    };

    self.nombreManual   = ko.observable("Varios");
    self.nombreEditable = ko.pureComputed(function () {
        const tipo = self.tipo();
        return tipo === TIPO_VARIOS;
    });

    self.nombre = ko.pureComputed(function () {
        const turno       = self.turno();
        const remito      = self.remito();
        const manual      = self.nombreManual();
        const editable    = self.nombreEditable();
        const producto    = self.producto();
        const servicio    = self.servicio();
        const asignacion  = self.asignacion();
        const remitoLinea = self.remitoLinea();

        if (producto === null) {
            return '';
        }

        if (editable) {
            return manual;
        }

        if (remito !== null) {
            return self.nombreRemito(remito, remitoLinea, producto);
        }

        if (!producto.comprobarMenuInvitados) {
            return self.nombreProducto(producto);
        }

        if (servicio === null) {
            return '';
        }

        const tipo    = asignacion.tipoPlato.nombre();
        const nombre  = asignacion.plato.nombre();
        const fecha   = turno.fecha.diaNombre().ucFirst()
            + ' ' + turno.fecha.fechaCorta() + ' de '
            + servicio.horaInicio.horaCorta() + ' a '
            + servicio.horaFin.horaCorta();
        const comedor = servicio.comedor.nombre();
        const llevar  = servicio.paraLlevar() ? ' - Para llevar' : '';

        return nombre + '<br/><span class="text-muted">' + tipo + ' - ' + fecha + '<br/>' + comedor + llevar + '</span>';
    });

    //<editor-fold desc="Precios">
    self.comprobarPrecioLista = ko.pureComputed(function () {
        var producto = self.producto();
        if (producto === null) {
            return true;
        }
        return producto.tipoPrecio === PRECIO_LISTA;
    });

    self.comprobarPrecioManual = ko.pureComputed(function () {
        if (self.pantalla.comprobarPermisoPrecioManual) {
            return true;
        }
        var producto = self.producto();
        if (producto === null) {
            return false;
        }
        return producto.tipoPrecio === PRECIO_MANUAL;
    });

    self.comprobarCantidadFija = ko.pureComputed(function () {
        const producto    = self.producto();
        const lineaRemito = self.remitoLinea();
        if (lineaRemito !== null) {
            return true;
        }
        if (producto === null) {
            return false;
        }
        return producto.cantidadFija !== false;
    });

    self.comprobarPrecioMenu = ko.pureComputed(function () {
        var producto = self.producto();
        if (producto === null) {
            return false;
        }
        return producto.tipoPrecio === PRECIO_MENU;
    });

    self.comprobarTieneCupo = ko.pureComputed(function () {
        var turno = self.turno();
        return turno !== null && turno.cupos() !== null;
    });

    /**
     * Devuelve el porcentaje de iva que aplica a la línea, sin importar si debe
     * o no mostrarse discriminado.
     *
     * @return float
     */
    self.ivaPorcentajeReal = ko.pureComputed(function () {
        if (self.pantalla.emisor.iva !== IVA_RESPONSABLE_INSCRIPTO) {
            return 0;
        }
        var producto   = self.producto();
        var porcentaje = IVA_DEFECTO;

        if (producto !== null) {
            porcentaje = producto.iva;
        }

        return parseFloat(porcentaje);
    });

    /**
     * Devuelve el porcentaje de IVA a aplicar en la línea.
     *
     * Si bien siempre hay iva por simplicidad solo se muestra discriminado
     * cuando se emite factura A y por tanto para el resto de comprobnates la
     * pantalla muestra precios como si no hubiera iva discriminado
     */
    self.ivaPorcentaje = ko.pureComputed(function () {
        const real = self.ivaPorcentajeReal();
        return self.pantalla.comprobarDiscriminaIva() ? real : 0;
    });

    self.ivaPorcentajeTexto = ko.pureComputed(function () {
        const porcentaje = self.ivaPorcentaje();
        return porcentaje.toString().replace('.', ',') + '%';
    });

    self.precioManual       = ko.observable(0);
    self.precioManualMinimo = ko.observable(0);

    /**
     * El precio con IVA incluído.
     */
    self.precioConIva = ko.pureComputed(function () {
        const manual     = self.precioManual();
        const remito     = self.remito();
        const remitoL    = self.remitoLinea();
        const producto   = self.producto();
        const servicio   = self.servicio();
        const tipoManual = self.comprobarPrecioManual();

        if (producto === null) {
            return null;
        }

        if (tipoManual) {
            return manual !== "" ? manual : null;
        }

        if (producto.comprobarMenuInvitados) {
            if (servicio === null) {
                //Todavía no se eligió el menú
                return null;
            }
            return servicio.precioInvitado;
        }

        if (self.comprobarTipoLineaRemito && remito !== null) {
            return parseFloat(remitoL.precio);
        }

        const lista  = self.pantalla.lista();
        const precio = lista.getPrecio(producto);

        if (precio === null) {
            //No hay precio del producto para la lista elegida.
            return null;
        }
        return precio.precio;
    });

    /**
     * El precio sin IVA en caso de ser el emisor un responsable inscripto.
     */
    self.precio = ko.pureComputed(function () {
        var precio = self.precioConIva();
        if (precio === null) {
            return null;
        }
        return self.precioQuitarIva(precio);
    });

    /**
     * Quita al precio dado el iva, teniendo en cuenta que los precios vienen
     * con "IVA incluído" y si el emisor discrimina IVA entonces hay que
     * quitarlo.
     *
     * @param float precio
     * @returns float
     */
    self.precioQuitarIva = function (precio) {
        var salida      = parseFloat(precio);
        var porcentaje  = self.ivaPorcentaje();
        var coeficiente = 1 + (porcentaje / 100);

        salida = salida / coeficiente;
        return salida;
    };

    /**
     * Devuelve el subtotal, o sea, el precio por la cantidad sin aplicar
     * descuentos.
     */
    self.subtotal = ko.pureComputed(function () {
        var cantidad = self.cantidad();
        var precio   = self.precio();

        if (precio === null) {
            return null;
        }
        return cantidad * precio;
    });

    self.descuento  = ko.observable(null);
    self.descuentos = ko.pureComputed(function () {
        //Los descuentos que aplican a la línea dependen del producto
        //seleccionado y de la lista de precios
        var salida     = new Array();
        var producto   = self.producto();
        var lista      = self.pantalla.lista();
        var descuentos = self.pantalla.descuentos();

        if (producto === null || producto.descuentos === false) {
            return salida;
        }
        for (var i = 0; i < descuentos.length; i++) {
            var descuento = descuentos[i];
            if (descuento.comprobarAplica(producto, lista)) {
                salida.push(descuento);
            }
        }
        return salida;
    });

    //Aplicamos descuentos automáticos
    self.descuentos.subscribe(function (descuentos) {
        for (var i = 0; i < descuentos.length; i++) {
            if (descuentos[i].aplicarAutomaticamente) {
                self.descuento(descuentos[i]);
                break;
            }
        }
    });

    self.comprobarAplicaDescuentos = ko.pureComputed(function () {
        const deRemito   = self.comprobarTipoLineaRemito();
        const descuentos = self.descuentos();

        if (deRemito) {
            return false;
        }
        return descuentos.length > 0;
    });

    self.descuentoCalcular = function (subtotal, descuento) {
        if (subtotal === null || descuento === null || descuento === undefined || subtotal === undefined) {
            return 0;
        }

        return subtotal * descuento.porcentaje() / 100;
    };

    /*
	 * El descuento manual se aplica cuando se tienen los permisos necesarios y
	 * permite cambiar el monto del descuento a aplicar.
	 *
	 * Se calcula automáticamente cuando se elige un descuento y en el caso que
	 * se modifique manualmente debe deseleccionar cualquier descuento elegido.
	 */
    self.descuentoCambiando            = false;
    self.descuentoManual               = ko.observable(0);
    self.descuentoManualPorcentaje     = ko.observable(0);
    self.descuentoManualPorcentajeReal = 0;

    self.descuentoManualQuitar = function () {
        self.descuento(null);
    };

    self.descuentoManual.subscribe(function (nuevo) {
        //No permitimos que sea un valor no numérico
        if (nuevo === "" || isNaN(nuevo)) {
            self.descuentoManual(0);
        }
    });
    self.descuentoManualPorcentaje.subscribe(function (nuevo) {
        //No permitimos que sea un valor no numérico
        if (nuevo === "" || isNaN(nuevo)) {
            self.descuentoManualPorcentaje(0);
        }
    });

    self.descuento.subscribe(function (descuento) {
        if (self.descuentoCambiando) {
            return;
        }

        //Al cambiar un descuento debemos limpiar los editables
        var descuentos = self.descuentos();
        for (var i = 0; i < descuentos.length; i++) {
            descuentos[i].limpiar();
        }

        var subtotal = self.subtotal();
        var monto    = self.descuentoCalcular(subtotal, descuento);

        self.descuentoCambiando = true;
        self.descuentoManual(monto);

        //Forzamos la ejecución de todas las tareas para que tome la bandera,
        //caso contrario cuando se ejecute el subscribe de descuento manual
        //la bandera tendrá valor false.
        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    });

    self.descuentoManual.subscribe(function (monto) {
        var actual = self.descuento();
        if (self.descuentoCambiando || actual === null || actual === undefined) {
            //Se está cambiando el descuento o no hay descuento actual por lo
            //tanto no debemos hacer nada
            return;
        }
        //Se cambió el descuento manualmente, actualizamos su porcentaje
        self.descuentoCambiando = true;
        var subtotal            = self.subtotal();
        var porcentaje          = monto * 100 / subtotal;
        var redondeado          = Math.round((porcentaje + Number.EPSILON) * 100) / 100;

        self.descuentoManualPorcentaje(redondeado);
        self.descuentoManualPorcentajeReal = porcentaje;

        //Forzamos la ejecución de todas las tareas para que tome la bandera,
        //caso contrario cuando se ejecute el subscribe de descuento manual
        //la bandera tendrá valor false.
        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    });

    self.subtotal.subscribe(function (subtotal) {
        //Si cambió la cantidad o el precio debemos actualizar el monto pero no
        //el porcentaje
        if (!self.comprobarTieneDescuento()) {
            //No hay descuento, nada que hacer
            return;
        }

        self.descuentoCambiando = true;
        var porcentaje          = self.descuentoManualPorcentaje();
        var monto               = subtotal * porcentaje / 100;
        var redondeado          = Math.round((monto + Number.EPSILON) * 100) / 100;

        self.descuentoManual(redondeado);

        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    });

    self.descuentoManualPorcentaje.subscribe(function (porcentaje) {
        var actual = self.descuento();
        if (self.descuentoCambiando || actual === null || actual === undefined) {
            //Se está cambiando el descuento o no hay descuento actual por lo
            //tanto no debemos hacer nada
            return;
        }

        //Se cambió el porcentaje manualmente, debemos actualizar el monto
        self.descuentoCambiando            = true;
        self.descuentoManualPorcentajeReal = porcentaje;

        var subtotal   = self.subtotal();
        var monto      = porcentaje * subtotal / 100;
        var redondeado = Math.round((monto + Number.EPSILON) * 100) / 100;
        self.descuentoManual(redondeado);

        //Forzamos la ejecución de todas las tareas para que tome la bandera,
        //caso contrario cuando se ejecute el subscribe de descuento manual
        //la bandera tendrá valor false.
        ko.tasks.runEarly();
        self.descuentoCambiando = false;
    });

    self.descuentoSelectClass = ko.pureComputed(function () {
        var editable = self.comprobarTieneDescuentoEditable();
        return editable ? ' w-1/2' : '';
    });

    self.comprobarTieneDescuento = ko.pureComputed(function () {
        var descuento = self.descuento();
        return descuento !== null && descuento !== undefined;
    });

    self.comprobarTieneDescuentoEditable = ko.pureComputed(function () {
        var descuento = self.descuento();
        return descuento !== null && descuento !== undefined && descuento.editable;
    });

    self.descuentoMonto = ko.pureComputed(function () {
        const aplica    = self.comprobarAplicaDescuentos();
        const subtotal  = self.subtotal();
        const descuento = self.descuento();
        const cantidad  = self.cantidad();
        const montoFijo = descuento && descuento.montoFijo ? descuento.montoFijo : 0.0;
        const manual    = parseFloat(self.descuentoManual());

        if (manual !== 0) {
            return manual;
        }

        if (aplica === false) {
            return 0;
        }

        if (montoFijo > 0.0) {
            const porUnidad = descuento.montoFijoPorUnidad;
            return porUnidad ? montoFijo * cantidad : montoFijo;
        }

        return self.descuentoCalcular(subtotal, descuento);
    });

    self.subtotalConDescuentos = ko.pureComputed(function () {
        var subtotal  = self.subtotal();
        var descuento = self.descuentoMonto();

        if (subtotal === null) {
            return null;
        }

        return subtotal - descuento;
    });

    self.iva = ko.pureComputed(function () {
        //Si hay discriminación de iva entonces el precio ya viene sin el iva
        var subtotal = self.subtotalConDescuentos();
        if (subtotal === null) {
            return null;
        }
        var porcentaje = self.ivaPorcentaje();
        return subtotal * (porcentaje / 100);
    });

    self.total = ko.pureComputed(function () {
        //Todos los precios son IVA incluído por lo que el IVA no modifica el
        //precio.
        var iva      = self.iva();
        var subtotal = self.subtotalConDescuentos();

        if (subtotal === null) {
            return null;
        }

        return subtotal + iva;
    });
    //</editor-fold>

    //<editor-fold desc="Comprobaciones">
    self.comprobarTipoVarios = ko.pureComputed(function () {
        const tipo = self.tipo();
        return tipo === TIPO_VARIOS;
    });

    self.comprobarTipoCargaCredito = ko.pureComputed(function () {
        const tipo = self.tipo();
        return tipo === TIPO_CARGA_CREDITO;
    });

    self.comprobarTipoMenuInvitados = ko.pureComputed(function () {
        const tipo = self.tipo();
        return tipo === TIPO_MENU_INVITADOS;
    });

    self.comprobarTipoLineaRemito = ko.pureComputed(function () {
        const tipo = self.tipo();
        return tipo === TIPO_LINEA_REMITO;
    });

    self.comprobarRequiereComensal = ko.pureComputed(function () {
        return self.comprobarTipoCargaCredito();
    });

    self.comprobarPuedeRegistrar = ko.pureComputed(function () {
        const cargaCredito = self.comprobarTipoCargaCredito();
        const precioManual = self.precioManual();

        return !(cargaCredito && precioManual <= 0.0);
    });

    self.comprobarMostrarDescuento = ko.pureComputed(function () {
        const producto = self.producto();
        const varios   = self.comprobarTipoVarios();

        return producto !== null && !varios;
    });

    /**
     * Devuelve true si la línea no tiene nada seleccionado.
     *
     * @returns {bool}
     */
    self.comprobarVacia = function () {
        const producto = self.producto();
        return producto === null;
    };

    /**
     * El campo código no debe habilitarse si la línea se creó a partir de una
     * línea de remito.
     */
    self.comprobarCampoCodigoHabilitado = ko.pureComputed(function () {
        const tipoLineaRemito = self.comprobarTipoLineaRemito();
        return !tipoLineaRemito;
    });

    self.comprobarPrecioCero = ko.pureComputed(function () {
        const precio = parseFloat(self.precio());
        return precio === 0.0;
    });
    //</editor-fold>

    //<editor-fold desc="Comentarios de línea">
    self.comentario                 = ko.observable("");
    self.comentarioEnfocar          = ko.observable(false);
    self.comentarioMostrar          = ko.observable(false);
    self.comentarioMostrarCalculado = ko.computed(function () {
        //Solo mostramos el campo de comentario si hay producto, no se trata del
        //"varios" y además se eligió mostrar el comentario.
        const mostrar  = self.comentarioMostrar();
        const varios   = self.comprobarTipoVarios();
        const producto = self.producto();

        const salida = mostrar && !varios && producto !== null;
        if (!salida) {
            //Si no se debe mostrar el comentario entonces lo borramos en caso
            //de existir
            self.comentario("");
        }

        return salida;
    });

    self.descripcion = ko.pureComputed(function () {
        const varios     = self.comprobarTipoVarios();
        const comentario = self.comentario();
        const nombre     = self.nombre();

        return varios ? nombre : comentario;
    });
    //</editor-fold>

    self.error = ko.pureComputed(function () {
        var tipoManual = self.comprobarPrecioManual();
        var producto   = self.producto();
        var precio     = self.precio();
        var cantidad   = self.cantidad();
        var minimo     = self.precioManualMinimo();
        var lista      = self.pantalla.lista();
        var dm         = self.descuentoManual();
        var dmp        = self.descuentoManualPorcentaje();
        var errores    = [];

        if (precio !== null && parseFloat(precio) < parseFloat(minimo)) {
            errores.push("El mínimo es de " + formatearMoneda(minimo));
        }

        if (producto !== null && !producto.comprobarMenuInvitados && precio === null) {
            //Tenemos producto pero no precio, seguramente porque no hay precio
            //en la lista elegida para el producto dado.
            var mensaje = tipoManual ? "Precio no especificado" : "Producto sin precio para la lista " + lista.nombre;
            errores.push(mensaje);
        }

        if (cantidad <= 0) {
            errores.push("La cantidad debe ser mayor a cero.");
        }

        if (dm < 0 || dmp < 0) {
            errores.push("El descuento manual no puede ser menor a cero.");
        }

        self.errores(errores);
        return errores.length > 0;
    });

    self.cssFila = ko.pureComputed(function () {
        const error = self.error();
        let clase   = error ? 'table-danger' : '';

        if (self.comprobarTipoVarios()) {
            clase += ' bg-orange-100';
        }

        if (self.comprobarTipoCargaCredito()) {
            clase += ' bg-blue-100';
        }

        if (self.comprobarTipoMenuInvitados()) {
            clase += ' bg-green-100';
        }

        if (self.comprobarTipoLineaRemito()) {
            clase += ' bg-gray-100';
        }

        return clase.trim();
    });

    self.data = function () {
        const iva            = self.ivaPorcentajeReal();
        const producto       = self.producto();
        const remito         = self.remito();
        const remitoId       = remito !== null ? remito.id : null;
        const remitoLinea    = self.remitoLinea();
        const remitoLineaId  = remitoLinea !== null ? remitoLinea.id : null;
        const productoId     = producto !== null ? producto.id : null;
        const asignacion     = self.asignacion();
        const asignacionId   = asignacion !== null ? asignacion.id() : null;
        const descuento      = self.descuento();
        const descuentoTiene = self.comprobarTieneDescuento();
        const descuentoId    = descuentoTiene ? descuento.id : null;
        const descripcion    = self.descripcion();

        var descontado = 0;
        if (descuentoTiene) {
            descontado = descuento.manual ? self.descuentoManualPorcentajeReal : descuento.porcentaje();
            //Puede pasar que el descuento esté vacío y por ende lo dejamos en cero.
            if (descontado === "") {
                descontado = 0;
            }
        }

        return {
            'lineaRemito': remitoLineaId,
            'asignacion': asignacionId,
            'descripcion': descripcion,
            'descontado': descontado,
            'descuento': descuentoId,
            'producto': productoId,
            'cantidad': self.cantidad(),
            'remito': remitoId,
            'precio': self.precioConIva(),
            'tipo': self.tipo(),
            'iva': iva
        };
    };

    /**
     * Esta función se encarga de limpiar la línea como por ejemplo reestablecer
     * el cupo de un turno si la línea tenía turno
     */
    self.limpiar = function () {
        const turno    = self.turno();
        const cantidad = self.cantidad();

        self.remito(null);
        self.remitoLinea(null);

        if (self.turnoSuscripto !== null) {
            self.turnoSuscripto.dispose();
        }

        if (turno !== null) {
            var disponibles = turno.cuposDisponibles();
            var nueva       = parseInt(disponibles) + parseInt(cantidad);
            turno.cuposDisponibles(nueva);
        }
    };

}

function koProducto(js) {
    const self = this;
    for (let clave in js) {
        self[clave] = js[clave];
    }
    self.precio = ko.observable();

    self.comprobarDebeTenerPrecio = self.tipo !== TIPO_MENU_INVITADOS && self.tipo !== TIPO_CARGA_CREDITO;
    self.comprobarCargaCredito    = self.tipo === TIPO_CARGA_CREDITO;
    self.comprobarMenuInvitados   = self.tipo === TIPO_MENU_INVITADOS;
}

/**
 *
 * @param {koProducto} producto
 * @param {koLista} lista
 */
function koProductoDefecto(producto, lista) {
    const self    = this;
    self.producto = producto;
    self.lista    = lista;

    /**
     * @param {koLista} lista
     * @return boolean
     */
    self.comprobarAplica = function (lista) {
        return self.lista === null || self.lista === lista;
    }
}

function koDescuento(js, vm, opciones) {
    ko.mapping.fromJS(js, opciones, this);
    const self     = this;
    self.vm        = vm;
    self.montoFijo = parseFloat(self.montoFijo);

    self.porcentaje.subscribe(function (nuevo) {
        if (nuevo === "" || isNaN(nuevo)) {
            self.porcentaje(0);
        }
    });

    self.nombre = "";
    if (!self.editable) {
        if (self.porcentaje() > 0.0) {
            self.nombre = self.porcentaje() + "%: ";
        } else {
            self.nombre = "$" + self.montoFijo + ": ";
        }
    }
    self.nombre += self.descripcion;

    self.comprobarAplica = function (producto, lista) {
        if (self.general) {
            return false;
        }
        if (self.lista !== null && self.lista !== lista.id) {
            return false;
        }
        if (self.categoria !== null && self.categoria !== producto.categoriaId) {
            return false;
        }
        if (self.producto !== null && self.producto !== producto.id) {
            return false;
        }
        return true;
    };

    self.limpiar = function () {
        if (self.editable) {
            self.porcentaje(0);
        }
    };
}

function koPedido(js) {
    ko.mapping.fromJS(js, {'copy': ["localidad"]}, this);
    var self = this;

    self.localidad = ko.observable(self.localidad);

    self.cliente    = ko.observable(null);
    self.setCliente = function (cliente, localidadCaja) {
        if (cliente === null) {
            return;
        }
        var direccionNumero = cliente.direccionNumero.trim();
        if (direccionNumero === "") {
            //El número "0" es un string porque si fuera numérico se evalúa como
            //false y no deja registrar la venta
            direccionNumero = "0";
        }
        var localidad = cliente.localidad;
        if (localidad === null || localidad.id === null) {
            //Asignamos la localidad del punto de venta
            localidad = localidadCaja;
        }

        self.cliente(cliente);
        self.nombre(cliente.nombre);
        self.correo(cliente.correo);
        self.telefono(cliente.telefono);
        self.localidad(localidad);
        self.direccionCalle(cliente.direccionCalle);
        self.direccionNumero(direccionNumero);
        self.direccionPiso(cliente.direccionPiso);
        self.direccionDepartamento(cliente.direccionDepartamento);
        self.direccionSufijo(cliente.direccionSufijo);
    };

    self.direccionCompleta = ko.pureComputed(function () {
        var direccion = self.direccionCalle() + ' ' + self.direccionNumero() + ' ' + self.localidad().nombre;
        return direccion;
    });

    //<editor-fold desc="Comprobaciones">
    self.comprobarTipoEnvio = ko.pureComputed(function () {
        var tipo = self.tipo();
        return tipo === PEDIDO_TIPO_ENVIO;
    });

    self.comprobarTipoRetiro = ko.pureComputed(function () {
        var tipo = self.tipo();
        return tipo === PEDIDO_TIPO_RETIRO;
    });
    //</editor-fold>

    self.data = function () {
        return {
            'tipo': self.tipo(),
            'correo': self.correo(),
            'nombre': self.nombre(),
            'telefono': self.telefono(),
            'observaciones': self.observaciones(),
            'direccion': {
                'calle': self.direccionCalle(),
                'numero': self.direccionNumero(),
                'piso': self.direccionPiso(),
                'departamento': self.direccionDepartamento(),
                'sufijo': self.direccionSufijo(),
                'latitud': self.latitud(),
                'longitud': self.longitud(),
                'localidad': self.localidad().id
            }
        };
    };

    self.errores = ko.pureComputed(function () {
        //Nombre, dirección y número es obligatorio
        var salida    = [];
        var nombre    = self.nombre();
        var calle     = self.direccionCalle();
        var numero    = self.direccionNumero();
        var envio     = self.comprobarTipoEnvio();
        var cliente   = self.cliente();
        var localidad = self.localidad();

        if (cliente === null) {
            salida.push("Debe seleccionar un cliente para el pedido.");
            return salida;
        }

        if (!nombre || nombre.trim().length === 0) {
            salida.push("Debe especificar el nombre en el pedido.");
        }

        if (envio && (!calle || !numero || calle.trim().length === 0 || numero.trim().length === 0)) {
            salida.push("Debe especificar la dirección del pedido con su número.");
        }

        var correo = self.correo();
        if (correo && correo.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            salida.push("El correo ingresado en el pedido no es válido.");
        }

        if (localidad === null || localidad.id === null) {
            salida.push("Debe seleccionar la localidad del pedido.");
        }

        return salida;
    });
}

function koLocalidad(js) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }
}

function koRemito(pantalla, js) {
    const self = this;
    for (let clave in js) {
        self[clave] = js[clave];
    }

    const lineas = self.lineas;
    for (let i = 0; i < lineas.length; i++) {
        const linea    = lineas[i];
        self.lineas[i] = new koRemitoLinea(self, linea);
    }

    self.expandido             = ko.observable(false);
    self.expandirContraer      = function () {
        self.expandido(!self.expandido());
    };
    self.expandirContraerIcono = ko.pureComputed(function () {
        const expandido = self.expandido();
        return expandido ? 'fa fa-minus-square-o' : 'fa fa-plus-square-o';
    });
    self.expandirContraerTitle = ko.pureComputed(function () {
        const expandido = self.expandido();
        return expandido ? 'Contraer líneas del remito' : 'Expandir líneas del remito';
    });

    self.lineasSeleccionadas = ko.pureComputed(function () {
        const salida = [];
        const lineas = pantalla.lineasRemito();

        for (let i = 0; i < lineas.length; i++) {
            const linea  = lineas[i];
            const remito = linea.remito();
            if (remito === self) {
                salida.push(linea);
            }
        }

        return salida;
    });

    self.lineasSeleccionadasConPrecioCero = ko.pureComputed(function () {
        const salida = [];
        const lineas = self.lineasSeleccionadas();

        for (let i = 0; i < lineas.length; i++) {
            const linea      = lineas[i];
            const precioCero = linea.comprobarPrecioCero();
            if (precioCero) {
                salida.push(linea);
            }
        }

        return salida;
    })

    self.advertencias        = ko.pureComputed(() => {
        const lineasConPrecioCero = self.lineasSeleccionadasConPrecioCero();
        let salida                = "";

        for (let i = 0; i < lineasConPrecioCero.length; i++) {
            const linea       = lineasConPrecioCero[i];
            const remitoLinea = linea.remitoLinea();
            const numero      = remitoLinea.numero;
            const categoria   = remitoLinea.categoria;
            const varios      = categoria === null;
            const clase       = varios ? "text-danger" : "text-warning";
            const texto       = varios
                ? "producto añadido manualmente. Debe indicar el precio unitario previo a facturar."
                : "producto configurados con precio '$0'.";
            salida += '<br/><span class="' + clase + '">Línea ' + numero + ': ' + texto + '</span>';
        }

        return salida.substring(5);
    });
    self.colspanAdvertencias = ko.pureComputed(() => {
        let salida = 6;
        if (pantalla.comprobarPuedeAplicarDescuentoPorLinea) {
            salida += 2;
        }
        if (pantalla.comprobarDiscriminaIva()) {
            salida += 1;
        }

        return salida;
    });

    self.comprobarTieneAdvertencias = ko.pureComputed(function () {
        return self.comprobarTieneLineasConPrecioCero();
    });

    //<editor-fold desc="Comprobaciones">
    self.comprobarTieneLineasConPrecioCero = ko.pureComputed(function () {
        const lineas = self.lineasSeleccionadasConPrecioCero();
        return lineas.length > 0;
    });

    self.comprobarTieneLineasSeleccionadas = ko.pureComputed(function () {
        const seleccionadas = self.lineasSeleccionadas();
        return seleccionadas.length > 0;
    });

    self.comprobarNoTieneLineasSeleccionadas = ko.pureComputed(function () {
        const tiene = self.comprobarTieneLineasSeleccionadas();
        return !tiene;
    });
    //</editor-fold>

    self.cssLinea = ko.pureComputed(() => {
        const advertencias = self.comprobarTieneAdvertencias();
        return advertencias ? 'con-advertencias' : '';
    });

    self.cantidad = ko.pureComputed(function () {
        const lineas = self.lineasSeleccionadas();
        let cantidad = 0.0;
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            cantidad += linea.cantidad();
        }
        return cantidad;
    });

    self.subtotal = ko.pureComputed(function () {
        const lineas = self.lineasSeleccionadas();
        let subtotal = 0.0;
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            subtotal += linea.subtotal();
        }
        return subtotal;
    });

    self.total = ko.pureComputed(function () {
        const lineas = self.lineasSeleccionadas();
        let total    = 0.0;
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            total += linea.total();
        }
        return total;
    });

    self.iva = ko.pureComputed(function () {
        const lineas = self.lineasSeleccionadas();
        let iva      = 0.0;
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            iva += linea.iva();
        }
        return iva;
    });

    self.nombreHtml = self.servicio + '<br/><span class="text-muted">' + self.tipo + '</span>';

    self.fechaEnvioTexto      = self.fechaEnvio.fechaCorta + '<br/><span class="text-muted">' + self.fechaEnvio.diaNombre + '</span>';
    self.fechaTurnoDesdeTexto = '';
    self.fechaTurnoHastaTexto = '';
    if (self.fechaTurnoDesde !== null) {
        self.fechaTurnoDesdeTexto = self.fechaTurnoDesde.fechaCorta + '<br/><span class="text-muted">' + self.fechaTurnoDesde.diaNombre + '</span>';
        self.fechaTurnoHastaTexto = self.fechaTurnoHasta.fechaCorta + '<br/><span class="text-muted">' + self.fechaTurnoHasta.diaNombre + '</span>';
    }

    self.comprobarPuedeSeleccionar = ko.pureComputed(function () {
        //Solo se pueden seleccionar remitos del mismo cliente y lista de
        //precios que además tengan al menos una línea con producto no facturada
        const cliente = self.cliente;
        const lista   = self.lista;
        const lineas  = self.lineas;
        const remitos = pantalla.remitosSeleccionados();

        for (let i = 0; i < remitos.length; i++) {
            const remito   = remitos[i];
            const bCliente = remito.cliente;
            const bLista   = remito.lista;

            if (bCliente.id !== cliente.id || bLista !== lista) {
                return false;
            }
        }

        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            if (!linea.comprobarFacturado) {
                return true;
            }
        }
        return false;
    });
}

function koRemitoLinea(remito, js) {
    const self = this;
    for (let clave in js) {
        self[clave] = js[clave];
    }
    self.remito = remito;
}

function koCobro(pantalla, js) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

    self.recibido    = ko.observable(self.recibido);
    self.adicional   = ko.observable(self.adicional);
    self.comprobante = ko.observable(self.comprobante);
    self.medioDePago = ko.observable(self.medioDePago);

    self.mediosDePago = [];
    for (var i = 0; i < pantalla.mediosPago.length; i++) {
        const medio = new koMedioPago(pantalla, self, pantalla.mediosPago[i]);
        self.mediosDePago.push(medio);
    }

    /**
     * Habilita el medio de pago efectivo.
     *
     * @returns {void}
     */
    self.medioDePagoHabilitarEfectivo = function () {
        self.mediosDePago[0].habilitado(true);
    };

    /**
     * Deshabilita el medio de pago efectivo y elige otro medio si estaba
     * seleccionado.
     *
     * @returns {void}
     */
    self.medioDePagoDeshabilitarEfectivo = function () {
        if (self.medioDePago() === MEDIO_PAGO_EFECTIVO) {
            self.medioDePago(MEDIO_PAGO_DEBITO);
        }
        self.mediosDePago[0].habilitado(false);
    };

    self.medioDePago.subscribe(function (nuevoValor) {
        pantalla.cobrosDeshabilitarEfectivo();
    });

    self.vuelto    = ko.pureComputed(function () {
        const total       = pantalla.total();
        const cobros      = pantalla.cobros();
        const medioDePago = self.medioDePago();

        if (medioDePago !== MEDIO_PAGO_EFECTIVO) {
            return 0.0;
        }

        var recibido = 0.0;
        for (var i = 0; i < cobros.length; i++) {
            const cobro  = cobros[i];
            const cobroR = parseFloat(cobro.recibido());

            if (!isNaN(cobroR)) {
                recibido += cobroR;
            }
        }

        return recibido - total;
    });
    self.vueltoCss = ko.pureComputed(function () {
        const vuelto = self.vuelto();
        return vuelto < 0 ? 'text-danger' : '';
    });

    self.tarjetas = ko.pureComputed(function () {
        const salida      = new Array();
        const medioDePago = self.medioDePago();
        if (medioDePago !== MEDIO_PAGO_CREDITO && medioDePago !== MEDIO_PAGO_DEBITO) {
            return salida;
        }
        for (var i = 0; i < pantalla.tarjetas.length; i++) {
            var tarjeta = pantalla.tarjetas[i];
            if (medioDePago === MEDIO_PAGO_CREDITO && tarjeta.credito) {
                salida.push(tarjeta);
            }
            if (medioDePago === MEDIO_PAGO_DEBITO && tarjeta.debito) {
                salida.push(tarjeta);
            }
        }
        return salida;
    });

    self.errores = ko.pureComputed(function () {
        const salida   = [];
        const recibido = self.recibido();
        const vuelto   = self.vuelto();
        const total    = pantalla.total();

        if (total === 0) {
            return salida;
        }

        if (recibido < 0) {
            salida.push("el monto recibido no puede ser menor a cero.");
        } else if (vuelto < 0) {
            //Solo controlamos el vuelto si el monto recibido es positivo
            salida.push("el vuelto no puede ser negativo.");
        }

        if (vuelto >= recibido) {
            salida.push("no se puede entregar vuelto mayor o igual a lo recibido.");
        }

        return salida;
    });

    self.data = function () {
        const recibido    = parseFloat(self.recibido());
        const adicional   = self.adicional();
        const vuelto      = parseFloat(self.vuelto());
        const medioDePago = self.medioDePago();
        const comprobante = self.comprobante();
        return {
            'vuelto': vuelto,
            'recibido': recibido,
            'adicional': adicional,
            'medioDePago': medioDePago,
            'comprobante': comprobante
        };
    };

    //<editor-fold desc="Comprobaciones">
    self.comprobarMedioPagoTarjeta = ko.pureComputed(function () {
        const medioPago = self.medioDePago();
        return medioPago === MEDIO_PAGO_CREDITO || medioPago === MEDIO_PAGO_DEBITO;
    });

    self.comprobarMedioPagoEfectivo = ko.pureComputed(function () {
        const medioPago = self.medioDePago();
        return medioPago === MEDIO_PAGO_EFECTIVO;
    });

    self.comprobarMedioPagoQr = ko.pureComputed(function () {
        const medioPago = self.medioDePago();
        return medioPago === MEDIO_PAGO_QR;
    });

    self.comprobarMedioPagoTransferenciaBancaria = ko.pureComputed(function () {
        const medioPago = self.medioDePago();
        return medioPago === MEDIO_PAGO_TRANSFERENCIA;
    });
    //</editor-fold>

}

function koMedioPago(pantalla, cobro, js) {
    var self = this;
    for (clave in js) {
        self[clave] = js[clave];
    }

    self.habilitado = ko.observable(true);
}

$(document).ready(function () {
    var $seccion            = $('#punto-de-venta');
    ko.options.deferUpdates = true;
    //console.time("koPantalla");
    koPuntoDeVenta          = new koPantalla(jsonPuntoDeVenta, config);
    //console.timeEnd("koPantalla");

    //console.time("bindings");
    ko.applyBindings(koPuntoDeVenta, $seccion.get(0));

    //Desactivamos el runEarly para disminuir el tiempo de respuesta de la
    //pantalla dado que no tenemos nada que necesite el forzado
    //ko.tasks.runEarly();
    //console.timeEnd("bindings");

    $('[data-toggle="popover"]').popover();
    $('.popover-dismiss').popover({
        trigger: 'focus'
    });

    $(window).load(function () {
        $(".preloader-container").fadeOut('slow', function () {
            $(this).remove();
            $(".punto-de-venta-codigo").focus();

            //Selección automática de remito
            /*ko.tasks.runEarly();
            const clientes = koPuntoDeVenta.remitosClientes();
            koPuntoDeVenta.remitosClienteSeleccionar(clientes[1]);

            ko.tasks.runEarly();
            const remitos = koPuntoDeVenta.remitosDelCliente();
            koPuntoDeVenta.remitosSeleccionados.push(remitos[3]);
            koPuntoDeVenta.remitosSeleccionar();*/
        });
    });

    //<editor-fold desc="Ajuste en formulario de alta de cliente">
    function ajustarFormularioAltaCliente() {
        const $formulario = $('#ClienteProveedor');
        const $fila1      = $formulario.find('.form-group:nth-child(1), .form-group:nth-child(2)');
        const $fila2      = $formulario.find('.form-group:nth-child(3), .form-group:nth-child(4)');
        const $fila3      = $formulario.find('.form-group:nth-child(5), .form-group:nth-child(6), .form-group:nth-child(7)');
        const $fila4      = $formulario.find('.form-group:nth-child(8), .form-group:nth-child(9)');
        const $fila5      = $formulario.find('.form-group:nth-child(10), .form-group:nth-child(11), .form-group:nth-child(12), .checkbox:nth-child(13)');

        $fila1.addClass('col-md-6');
        $fila1.wrapAll('<div class="row"/>');

        $fila2.addClass('col-md-6');
        $fila2.wrapAll('<div class="row"/>');

        $fila3.addClass('col-md-4');
        $fila3.wrapAll('<div class="row"/>');

        $fila4.removeClass('col-md-5');
        $fila4.removeClass('col-md-3');
        $fila4.addClass('col-md-6');
        $fila4.wrapAll('<div class="row"/>');

        $fila5.addClass('col-md-3');
        $fila5.wrapAll('<div class="row"/>');
    }

    ajustarFormularioAltaCliente();
    //</editor-fold>

    //<editor-fold desc="Detección de foco">
    koPuntoDeVenta.$tabla.focusin(function () {
        var $enfocado                 = $(this).find(':focus');
        koPuntoDeVenta.$tablaEnfocado = $enfocado;
    });
    //</editor-fold>

    //<editor-fold desc="Manejo de teclado">
    $(document).keydown(function (e) {
        var $focoActual       = $(document).find(':focus');
        var focoEnTablaActual = $.contains(koPuntoDeVenta.$tabla.get(0), $focoActual.get(0));

        var tecla     = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        var caracter  = e.charCode ? String.fromCharCode(tecla) : e.key;
        var operacion = '';

        //console.log('Tecla: ' + tecla);
        //console.log('Caracter: ' + caracter);

        if ($('body').is('.modal-open')) {
            //Si hay modal abierto, entonces las flechas enfocan los botones
            var $modal = $('.modal.in .modal-body');
            if ($modal.find('.componente-tabla-filtro').length === 0
                || (tecla !== 38 && tecla !== 40)
            ) {
                //No son las flechas ni tampoco el modal tiene la tabla de
                //filtrado que se usa en productos o clientes. Puede ser por
                //ejemplo el modal de nuevo cliente que no hay que intervenir
                return;
            }

            var selector = "input:visible, button:visible";

            var $elementos = $modal.find(selector);
            var $enfocado  = $modal.find(':focus');

            if ($enfocado.length === 0) {
                $enfocado = $elementos[0];
            }

            var indice = $elementos.index($enfocado);
            var prox   = indice + 1;
            if (tecla === 38) {
                prox = indice - 1;
                if (prox < 0) {
                    prox = $elementos.length - 1;
                }
            }
            if (typeof $elementos[prox] === 'undefined') {
                prox = 0;
            }

            var $proximo = $elementos[prox];

            $proximo.focus();

            return false;
        }

        if (koPuntoDeVenta.$tablaEnfocado !== null
            && koPuntoDeVenta.$tablaEnfocado.closest('#punto-de-venta').length === 0
        ) {
            //Está enfocado por fuera del punto de venta no intervenimos en el
            //evento
            return;
        }

        switch (tecla) {
            case 13: //Enter
                operacion = e.ctrlKey ? 'enviar' : 'siguiente';
                if (operacion === 'siguiente' && $focoActual.is('textarea')) {
                    //El enter en un textarea no debe ser intervenido
                    return;
                }
                if ($focoActual.closest('#punto-de-venta-tabla').length === 0) {
                    //Si estamos fuera de la tabla, entonces debemos registrar
                    //la venta (si es que está permitido)
                    if (koPuntoDeVenta.comprobarPuedeRegistrar()) {
                        e.preventDefault();
                        koPuntoDeVenta.registrar();
                    }
                    return;
                }

                break;

            case 27: //Escape
                operacion = 'quitar';
                break;

            case 38: //Flecha para arriba
                if ($focoActual.is('select')
                    || !focoEnTablaActual
                ) {
                    //Estamos en un select o fuera de la tabla, no intervenimos
                    return;
                }
                operacion = 'linea-anterior';
                break;

            case 40: //Flecha para abajo
                if ($focoActual.is('select')
                    || !focoEnTablaActual
                ) {
                    //Estamos en un select o fuera de la tabla, no intervenimos
                    return;
                }
                operacion = 'linea-siguiente';
                break;

            case 46: //Suprimir
                if (e.shiftKey) {
                    operacion = 'quitar-forzar';
                } else if (e.ctrlKey) {
                    operacion = 'inicializar';
                }
                break;

            case 49: //"1" superior
            case 97: //"1" teclado numérico
                if (e.ctrlKey) {
                    if (typeof koPuntoDeVenta.botonesSuperiores[0] === 'undefined') {
                        //No existe la operación, no intervenimos
                        return;
                    }
                    operacion = koPuntoDeVenta.botonesSuperiores[0].id;
                }
                if (e.altKey) {
                    operacion = 'comprobante-siguiente';
                }
                break;

            case 50: //"2" superior
            case 98: //"2" teclado numérico
                if (e.ctrlKey) {
                    if (typeof koPuntoDeVenta.botonesSuperiores[1] === 'undefined') {
                        //No existe la operación, no intervenimos
                        return;
                    }
                    operacion = koPuntoDeVenta.botonesSuperiores[1].id;
                }
                if (e.altKey) {
                    operacion = 'condicion-siguiente';
                }
                break;

            case 188: //","
            case 190: //"."
            case 110: //"." teclado numérico
                if (koPuntoDeVenta.$tablaEnfocado !== null
                    && koPuntoDeVenta.$tablaEnfocado.is('input[type="number"]')
                    && focoEnTablaActual
                ) {
                    //Si estamos en un campo de tipo número entonces intervenimos
                    //el punto y la coma
                    if (window.chrome) {
                        //En Chrome no se permite ingresar más de un separador
                        //decimal por lo que no tenemos que intervenir.
                        //Además el código que está abajo hace que al apretar
                        //el punto o la coma se borre el número ingresado
                        //anteriormente
                        return;
                    }
                    e.preventDefault();

                    var valor = koPuntoDeVenta.$tablaEnfocado.val();
                    var step  = koPuntoDeVenta.$tablaEnfocado.prop('step');

                    if (step === "1" || step === "" || valor.indexOf(",") !== -1 || valor.indexOf(".") !== -1) {
                        //No se permiten decimales, no hacemos nada
                        return;
                    }

                    valor += ",";
                    koPuntoDeVenta.$tablaEnfocado.val(valor);
                    return;
                }

                break;

            case 112: //"F1"
                $('#modal-ayuda').modal('show');
                e.preventDefault();
                break;

            case 65: //"A"
                if (e.ctrlKey) {
                    operacion = 'agregar-quitar-comentario';
                    e.preventDefault();
                    break;
                }
            //break ignorado a propósito para que tome el default

            default:
                if ($focoActual.is('input[type="number"]')
                    && caracter.length === 1
                    && (
                        /[a-z]/i.test(caracter)
                        || /\W|_/g.test(caracter)
                    )
                ) {
                    //Campo numérico y caracter alfabético
                    e.preventDefault();
                }
                return;
        }
        if (operacion === ''
            || (koPuntoDeVenta.$tablaEnfocado !== null && koPuntoDeVenta.$tablaEnfocado.is('input[type="number"]') && (operacion === 'linea-anterior' || operacion === 'linea-siguiente'))
            || (koPuntoDeVenta.$tablaEnfocado !== null && koPuntoDeVenta.$tablaEnfocado.is('.punto-de-venta-codigo') && operacion === 'siguiente' && tecla === 13)
        ) {
            //No avanzamos con el manejo del teclado si:
            //	1. No hay operación
            //	2. Estamos en un campo numérico y apretamos para arriba o abajo.
            //	3. Estamos en el campo de código y apretamos enter para avanzar,
            //	   dado que si encuentra más de un producto no debe avanzar.
            //console.log('no avanzar con manejo de teclado');
            return;
        }

        e.preventDefault();
        koPuntoDeVenta.teclado(operacion);
    });
    //</editor-fold>

    //<editor-fold desc="Selección de texto en enfoque de campos">
    let focusedElement;
    $(document).on('focus', '#punto-de-venta-tabla input', function () {
        if (focusedElement === this) return;
        focusedElement = this;
        setTimeout(function () {
            focusedElement.select();
        }, 50);
    });
    //</editor-fold>

    /*
	 * La siguiente funcionalidad se agrega para poder quitar el uso de base.js
	 * y muchos otros archivos que se levantan en el sitio.
	 */

    //<editor-fold desc="Bootstrap select">
    var configSelectPicker = {
        liveSearch: true,
        liveSearchNormalize: true,
        size: 7,
        actionsBox: true,
        showTick: true,
        selectOnTab: true
    };
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
        configSelectPicker.size   = false;
        configSelectPicker.mobile = true;
    }
    $('#modal-clientes-alta select').not('[data-arreglado="readonly"]').each(function () {
        var $this    = $(this);
        //Si es requerido y tiene solamente una opción la selecciono directamente.
        var $options = $this.find('option:not([value=""])');
        if ($this.prop("required") && $options.length === 1) {
            $options.attr('selected', 'selected');
        }
        $this.selectpicker(configSelectPicker);

        var $boton = $this.siblings('.bootstrap-select').find('.dropdown-toggle');
        $boton.blur(function () {
            setTimeout(function () {
                if (!$boton.parent().is('.open')) {
                    $this.valid();
                }
            }, 100);
        });

        $this.closest('form').on('reset', function () {
            setTimeout(function () {
                $this.selectpicker('refresh');
            });
        });
    });
    //</editor-fold>

    const $textarea = $('textarea').not('[data-tinymce]');
    $textarea.each(function () {
        const $this = $(this);
        if ($this.parents('[data-template="true"]').length > 0) {
            return true;
        }
        autosize($this);
    });

});
