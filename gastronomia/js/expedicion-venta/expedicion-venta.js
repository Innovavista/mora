/* global ko, json, clave */

let koExpedicionVenta;

function koPantalla(json) {
    const self = this;
    const INTERVALO = 5000;

    self.ventas = ko.observableArray();
    self.turnoAbierto = ko.observable(json.turnoAbierto);
    self.pendientes = ko.observable(true);

    json.ventas.forEach(v => {
        const venta = new koVenta(v, self);
        self.ventas.push(venta);
    });

    self.ventasPendientes = ko.pureComputed(() => {
        const ventas = self.ventas();
        return ventas.filter(v => !v.comprobarExpedido());
    });

    self.ventasFiltered = ko.pureComputed(() => {
        const pendientes = self.ventasPendientes();
        const salida = self.ventas.sorted(function (izq, der) {
            const iE = izq.comprobarExpedido();
            const dE = der.comprobarExpedido();
            return iE === dE ? 0
                : iE < dE ? -1
                    : 1;
        });
        if (self.pendientes()) {
            return pendientes;
        }
        return salida;
    });

    //<editor-fold defaultstate="collapsed" desc="Ajax">
    self.ajax = ko.observable(false);
    self.ajaxGetErrores = function (data) {
        //Devolvemos el array de errores si es que tiene
        if (typeof data.errores !== "undefined") {
            return data.errores;
        }
        if (typeof data.resultado !== "undefined" && typeof data.resultado.errores !== "undefined") {
            return data.resultado.errores;
        }
        return null;
    };
    self.ajaxOpciones = {
        method: 'POST',
        beforeSend: function (jqXHR, settings) {
            self.ajax(true);
            ko.tasks.runEarly();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            let mensaje = "Ha ocurrido un error, vuelva a intentar";
            if (typeof jqXHR.responseJSON !== "undefined") {
                const data = jqXHR.responseJSON;
                const errores = self.ajaxGetErrores(data);
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

    self.getVenta = function (id) {
        const ventas = self.ventas();
        for (let i = 0; i < ventas.length; i++) {
            const venta = ventas[i];
            if (venta.id === id) {
                return venta;
            }
        }
        return null;
    }

    //<editor-fold desc="Comprobaciones">
    /**
     * Será true cuando haya al menos una venta ejecutando un ajax. Necesario para no actualizar mientras estamos
     * ejecutando un ajax de una venta.
     *
     * @type {KnockoutComputed<unknown>}
     */
    self.comprobarVentasAjax = ko.pureComputed(() => {
        const ventas = self.ventas();
        let salida = false;
        ventas.forEach(venta => {
            if (venta.ajax()) {
                salida = true;
            }
        });
        return salida;
    });

    /**
     * Devuelve true si no hay ningún pedido pendiente de expedir.
     *
     * @type {KnockoutComputed<boolean>}
     */
    self.comprobarSinPedidosPendientes = ko.pureComputed(() => {
        const pendientes = self.ventasPendientes();
        return pendientes.length === 0;
    });

    /**
     * Devuelve true si no hay todavía ninguna venta en el turno.
     *
     * @type {KnockoutComputed<boolean>}
     */
    self.comprobarSinVentas = ko.pureComputed(() => {
        const ventas = self.ventas();
        return ventas.length === 0;
    });
    //</editor-fold>

    const opciones = self.getAjaxOpciones({
        url: json.urls.actualizar,
        success: function (data, textStatus, jqXHR) {
            if (typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
                Notificacion('Ha ocurrido un error al intentar actualizar los pedidos.', 'error');
                return;
            }
            //Puede suceder cuando volvemos que se lanzó un ajax de alguna venta y por ende
            //descartamos la actualización
            const ventasAjax = self.comprobarVentasAjax();
            if (ventasAjax) {
                return;
            }

            self.ventas([]);
            data.ventas.forEach(v => {
                const actual = self.getVenta(v.id);
                if (actual === null) {
                    const venta = new koVenta(v, self);
                    self.ventas.push(venta);
                } else {
                    actual.actualizar(v);
                }
            });

            self.turnoAbierto(data.turnoAbierto);
        }
    });

    self.actualizar = () => {
        //Verificamos primero que no haya ninguna llamada ajax pendiente
        let ventasAjax = self.comprobarVentasAjax();
        if (ventasAjax) {
            return;
        }
        $.ajax(opciones);
    };

    self.actualizarIcono = ko.pureComputed(() => {
        const ajax = self.ajax();
        return ajax ? 'fa fa-spin fa-refresh' : 'fa fa-refresh';
    });

    let intervalo = setInterval(() => {
        self.actualizar();
    }, INTERVALO);


    self.pendientesTextos = ko.pureComputed(() => {
        const pendientes = self.pendientes();

        return pendientes ?
            {
                title: 'Mostrando solo pendientes, click para mostrar todos',
                label: 'Pendientes'
            }
            :
            {
                title: 'Mostrando todos, click para mostrar solo pendientes',
                label: 'Todos'
            };
    });

    self.sinPedidosClase = ko.pureComputed(() => {
        const sinVentas = self.comprobarSinVentas();
        const sinPendientes = self.comprobarSinPedidosPendientes();

        if (sinVentas) {
            return "alert-info";
        }

        if (sinPendientes) {
            return "alert-success";
        }

        return "";
    });
    self.sinPedidosTexto = ko.pureComputed(() => {
        const sinVentas = self.comprobarSinVentas();
        const sinPendientes = self.comprobarSinPedidosPendientes();

        if (sinVentas) {
            return "Todavía no se han realizado ventas en el turno.";
        }

        if (sinPendientes) {
            return "Todos los pedidos expedidos.";
        }

        return "";
    });

}

function koVenta(js, pantalla) {
    let self = this;
    for (let clave in js) {
        self[clave] = js[clave];
    }

    self.expedicion = ko.observable(self.expedicion);
    self.ultimoEstado = ko.observable(self.ultimoEstado);

    self.textoExpedicion = ko.pureComputed(function () {
        const expedicion = self.expedicion();
        if (expedicion === null) {
            return "";
        }
        return "Expedido " + expedicion.horaCorta;
    });

    //<editor-fold desc="Comprobaciones">
    self.comprobarExpedido = ko.pureComputed(() => {
        return self.expedicion() !== null;
    });

    self.comprobarEstadoVendido = ko.pureComputed(() => {
        const estado = self.ultimoEstado();
        return estado === ESTADO_VENDIDO;
    });

    self.comprobarEstadoEnPreparacion = ko.pureComputed(() => {
        const estado = self.ultimoEstado();
        return estado === ESTADO_EN_PREPARACION;
    });

    self.comprobarEstadoExpedido = ko.pureComputed(() => {
        const estado = self.ultimoEstado();
        return estado === ESTADO_EXPEDIDO;
    });

    self.comprobarDesactivado = ko.pureComputed(() => {
        const ajax = self.ajax();
        const abierto = pantalla.turnoAbierto();
        return ajax || !abierto;
    });
    //</editor-fold>

    self.clase = ko.pureComputed(() => {
        const expedido = self.comprobarExpedido();
        return expedido ? 'expedido' : 'no-expedido';
    });

    self.botonClase = ko.pureComputed(() => {
        const vendido = self.comprobarEstadoVendido();
        return vendido ? 'btn-primary' : 'btn-success';
    });

    self.botonIcono = ko.pureComputed(() => {
        const ajax = self.ajax();
        const vendido = self.comprobarEstadoVendido();

        if (ajax) {
            return "fa fa-spin fa-spinner";
        }

        return vendido ? "fa fa-fire" : "fa fa-bell-o";
    });

    self.botonTexto = ko.pureComputed(() => {
        const vendido = self.comprobarEstadoVendido();

        return vendido ? "Preparar" : "Expedir";
    });

    self.botonAclaracion = ko.pureComputed(() => {
        const vendido = self.comprobarEstadoVendido();

        return vendido ? "Click para marcar el pedido como 'en preparación'" : "Click para marcar el pedido como 'expedido'.";
    });

    self.accion = () => {
        const vendido = self.comprobarEstadoVendido();
        if (vendido) {
            self.preparar();
        } else {
            self.expedir();
        }
    };

    self.preparar = () => {
        const opciones = self.getAjaxOpciones({
            url: self.urls.preparar,
            success: function (data, textStatus, jqXHR) {
                if (typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
                    const mensaje = "Ha ocurrido un error al intentar marcar la venta #"
                        + self.numero + " como 'en preparación', vuelva a intentar";
                    Notificacion(mensaje, 'error');
                    return;
                }
                Notificacion("Venta #" + self.numero + " marcada como 'en preparación' correctamente.", 'info');
                self.actualizar(data.venta);
            }
        });
        $.ajax(opciones);
    };

    self.expedir = () => {
        const opciones = self.getAjaxOpciones({
            url: self.urls.expedir,
            success: function (data, textStatus, jqXHR) {
                if (typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
                    const mensaje = 'Ha ocurrido un error al intentar expedir la venta #'
                        + self.numero + ', vuelva a intentar.';
                    Notificacion(mensaje, 'error');
                    return;
                }
                Notificacion('Venta #' + self.numero + ' expedida éxitosamente.', 'success');
                self.actualizar(data.venta);
            }
        });
        $.ajax(opciones);
    };

    /**
     * Actualiza los datos de la venta a partir del js dado.
     *
     * @param js
     */
    self.actualizar = function (js) {
        self.expedicion(js.expedicion);
        self.ultimoEstado(js.ultimoEstado);
    }

    //<editor-fold defaultstate="collapsed" desc="Ajax">
    self.ajax = ko.observable(false);
    self.ajaxGetErrores = function (data) {
        //Devolvemos el array de errores si es que tiene
        if (typeof data.errores !== "undefined") {
            return data.errores;
        }
        if (typeof data.resultado !== "undefined" && typeof data.resultado.errores !== "undefined") {
            return data.resultado.errores;
        }
        return null;
    };
    self.ajaxOpciones = {
        method: 'POST',
        beforeSend: function (jqXHR, settings) {
            self.ajax(true);
            ko.tasks.runEarly();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            let mensaje = "Ha ocurrido un error, vuelva a intentar";
            if (typeof jqXHR.responseJSON !== "undefined") {
                const data = jqXHR.responseJSON;
                const errores = self.ajaxGetErrores(data);
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


}

$(document).ready(function () {
    const contenedor = document.getElementById('expedicion-venta');

    //Esta opción hace que no se actualice inmediatamente dando mejor
    //rendimiento. Por contra hay que tener en cuenta de ejecutar
    //ko.tasks.runEarly() si queremos manipular el DOM por fuera de
    //Knockout (con jQuery por ejemplo)
    ko.options.deferUpdates = true;

    koExpedicionVenta = new koPantalla(json);
    ko.applyBindings(koExpedicionVenta, contenedor);
});