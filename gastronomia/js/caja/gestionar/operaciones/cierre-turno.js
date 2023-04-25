/* global ko, ALERTA_DE_DESCUADRE_DEFECTO */

function koCierreTurno(params) {
    const self = this;

    self.urls = params.urls;
    self.caja = params.caja;
    self.operacion = params.operacion;
    self.aperturaManual = self.caja().aperturaManual();
    self.movimientos = ko.observableArray([]);
    self.denominaciones = ko.observableArray([]);
    self.saldoFinal = ko.observable(0);
    self.comentarios = ko.observable();

    self.arqueoObligatorio = self.caja().arqueoObligatorio();

    //Si el arqueo no es obligatorio, entonces el saldo y lo que se deja serán
    //observables que se pueden ingresar a mano
    self.deja = ko.observable(0);
    self.saldo = ko.observable(0);

    self.hayComprobantesX = ko.observable(false);

    self.saldoRealFocus = ko.observable(false);

    self.ajax = ko.observable(false);
    self.ajaxBuscarMovimientos = ko.observable(false);
    self.ajaxBuscarDenominaciones = ko.observable(false);
    self.ajaxCierreTurno = ko.computed(function () {
        let ajax = self.ajax();
        let ajaxMovimientos = self.ajaxBuscarDenominaciones();
        let ajaxDenominaciones = self.ajaxBuscarMovimientos();
        return ajax || ajaxMovimientos || ajaxDenominaciones;
    });

    self.columnaTipo = self.aperturaManual ? 'col-2' : 'col-3';
    self.columnaDenominacion = self.aperturaManual ? 'col-2' : 'col-3';
    self.columnaCantidad = self.aperturaManual ? 'col-4' : 'col-5';
    self.columnaDeja = 'col-4';

    /**
     * Devuelve un número mostrable
     *
     * @param {ko.computed} numero
     * @returns {string}
     */
    self.getNumeroMostrable = function (numero) {
        const monto = numero();
        if (isNaN(monto)) {
            return '0';
        }
        return monto.format(2, 3, '.', ',');
    };

    /**
     * Deduce el color del número en base a si es negativo, positivo o cero
     * devolviendo rojo, verde o negro respectivamente
     *
     * @param {ko.observable} numero
     * @returns {String}
     */
    self.getColorNumero = function (numero) {
        let num = numero();
        if (num > 0) {
            return "#35cd84";
        }
        if (num < 0) {
            return "#dc3545";
        }
        return "#333";
    };

    self.saldoReal = ko.computed(function () {
        if (!self.arqueoObligatorio) {
            //Si el arqueo no es obligatorio entonces directamente devolvemos
            //el saldo ingresado.
            return self.saldo();
        }

        let total = 0.00;
        ko.utils.arrayForEach(self.denominaciones(), function (denominacion) {
            const monto = parseFloat(denominacion.denominacion());
            const cantidad = parseInt(denominacion.cantidad());
            if (!isNaN(cantidad)) {
                total += (monto * cantidad);
            }
        });
        return total;
    });

    self.saldoDeja = ko.pureComputed(function () {
        if (!self.arqueoObligatorio) {
            //Si el arqueo no es obligatario entonces directamente devolvemos
            //el saldo que deja ingresado.
            return self.deja();
        }

        let total = 0.00;
        ko.utils.arrayForEach(self.denominaciones(), function (denominacion) {
            const monto = parseFloat(denominacion.denominacion());
            const cantidad = parseInt(denominacion.deja());
            if (!isNaN(cantidad)) {
                total += (monto * cantidad);
            }
        });
        return total;
    });

    self.saldoAEntregar = ko.pureComputed(() => {
        const saldo = self.saldoReal();
        const deja = self.saldoDeja();

        return saldo - deja;
    });

    self.descuadre = ko.computed(function () {
        const saldoTeorico = parseFloat(self.saldoFinal());
        const saldoReal = parseFloat(self.saldoReal());
        return saldoReal - saldoTeorico;
    });

    self.inicializarPantalla = function () {
        self.movimientos([]);
        self.denominaciones([]);
        self.saldoFinal(0);
        self.comentarios('');
        self.saldoRealFocus(false);
        self.buscarMovimientos();
        self.buscarDenominaciones();
    };

    self.buscarMovimientos = function () {
        self.movimientos([]);
        var url = self.urls.buscarMovimientosTurno();
        var data = {caja: self.caja().id()};
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (data) {
                    if (data.success) {
                        var movimientos = ko.mapping.fromJS(data.success.movimientos);
                        var invertidos = movimientos.reverse();
                        self.movimientos(invertidos());
                        self.saldoRealFocus(true);
                        self.comprobarHayComprobantesX();
                        return;
                    }
                    if (data.error) {
                        return Notificacion(data.error, 'error');
                    }
                    Notificacion('Ha ocurrido un error', 'error');
                } else {
                    Notificacion('Ha ocurrido un error', 'error');
                }
            },
            beforeSend: function (jqXHR, settings) {
                self.ajax(true);
                self.ajaxBuscarMovimientos(true);
            },
            complete: function (jqXHR, settings) {
                self.ajax(false);
                self.ajaxBuscarMovimientos(false);
            }
        });
        $.ajax(opciones);
    };

    self.buscarDenominaciones = function () {
        self.denominaciones([]);
        var url = self.urls.buscarDenominaciones();
        var data = {caja: self.caja().id()};
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (data) {
                    if (data.success) {
                        var denominaciones = [];
                        for (var i = 0; i < data.success.denominaciones.length; i++) {
                            var denominacion = data.success.denominaciones[i];
                            var objeto = new koDenominacion(denominacion);
                            denominaciones.push(objeto);
                        }
                        self.denominaciones(denominaciones);
                        return;
                    }
                    if (data.error) {
                        return Notificacion(data.error, 'error');
                    }
                    Notificacion('Ha ocurrido un error', 'error');
                } else {
                    Notificacion('Ha ocurrido un error', 'error');
                }
            },
            beforeSend: function (jqXHR, settings) {
                self.ajax(true);
                self.ajaxBuscarDenominaciones(true);
            },
            complete: function (jqXHR, settings) {
                self.ajax(false);
                self.ajaxBuscarDenominaciones(false);
            }
        });
        $.ajax(opciones);
    };

    /**
     * Verifica que existan comprobantes X
     *
     * @returns {void}
     */
    self.comprobarHayComprobantesX = function () {
        //Lo establecemos por defecto en false porque puede pasar que había
        //comprobantes X, en otra pestaña se genero su CAE, se volvió atrás y
        //se ingresó de vuelta al cierre de turno haciendo que su valor siga
        //siendo true dado que el ida y vuelta no recarga la página y por tanto
        //conservaba su valor anterior.
        self.hayComprobantesX(false);
        let movimientos = self.movimientos();
        for (var i = 0; i < movimientos.length; i++) {
            let movimiento = movimientos[i];
            let anulado = movimiento.anulado();
            if (typeof movimiento.tipo.letra === 'undefined') {
                continue;
            }
            let funcion = typeof movimiento.tipo.letra === 'function';
            let letra = funcion ? movimiento.tipo.letra() : movimiento.tipo.letra;
            if (!anulado && letra === 'X') {
                self.hayComprobantesX(true);
                return;
            }
        }
    };

    /**
     * Comprueba el descuadre es mayor a la cantidad máxima en pesos de descuadre
     * de la caja
     *
     * @returns {Boolean}
     */
    self.comprobarAlertaDeDescuadre = function () {
        var caja = ko.isObservable(self.caja) ? self.caja() : null;
        var alerta = caja.alertaDeDescuadre !== undefined ? caja.alertaDeDescuadre() : ALERTA_DE_DESCUADRE_DEFECTO;
        var descuadre = Math.abs(self.descuadre());
        var alertaAbs = Math.abs(alerta);
        return descuadre > alertaAbs;
    };

    /**
     * Valida que las cantidades de las denominaciones del arqueo sean válidas.
     *
     * @param {bool} mostrar
     * @returns {Boolean}
     */
    self.comprobarCierreTurnoValido = function (mostrar) {
        var errores = [];
        self.denominaciones().forEach(denominacion => {
            var cantidad = denominacion.cantidad();
            if (cantidad === "") {
                cantidad = 0;
            }
            if (cantidad < 0) {
                var nombre = denominacion.nombre;
                errores.push(`La cantidad de la denominación ${nombre} no puede ser menor a cero.`);
            }
        });
        if (mostrar) {
            errores.forEach(error => {
                Notificacion(error, 'error');
            });
        }
        return errores.length === 0;
    };

    /**
     * Comprueba que los campos que indican cantidad y cuánto se deja en la caja
     * sean válidos.
     *
     * @returns bool
     */
    self.comprobarCantidadesValidas = function () {
        let errores = "";
        const saldoDeja = parseFloat(self.saldoDeja());
        const saldo = parseFloat(self.saldoReal());

        if (self.arqueoObligatorio) {
            var denominaciones = self.denominaciones();
            for (var i = 0; i < denominaciones.length; i++) {
                var denominacion = denominaciones[i];
                var cantidad = parseInt(denominacion.cantidad());
                var nombre = denominacion.nombre;
                var deja = parseInt(denominacion.deja());

                if (self.aperturaManual && deja > cantidad) {
                    errores += nombre + ": no puede dejar " + deja + " unidades cuando solo hay " + cantidad + ".<br/>";
                }
                if (self.aperturaManual && deja < 0) {
                    errores += nombre + ": no puede dejar una cantidad negativa.<br/>";
                }
                if (cantidad < 0) {
                    errores += nombre + ": la cantidad debe ser mayor o igual a cero.<br/>";
                }
            }
        } else {
            if (self.saldo() === "") {
                errores += "Debe especificar el saldo.<br/>";
            }
            if (self.saldoDeja() === "") {
                errores += "Debe especificar el monto que deja.<br/>";
            }
            if (saldo < 0) {
                errores += "El saldo ingresado no puede ser negativo.<br/>";
            }
            if (saldoDeja < 0) {
                errores += "El monto que se deja en caja no puede ser negativo.<br/>";
            }
        }

        if (saldoDeja > saldo) {
            errores += "No se puede dejar un monto mayor al saldo.<br/>";
        }

        if (errores !== "") {
            var background = '#f8d7da';
            var colorBotonConfirmar = '#f44336';
            Alerta({
                title: 'Verificar cantidades que se dejan en caja',
                html: errores + "<br/><br/><strong>Atención</strong>: no se ha cerrado el turno.",
                showCancelButton: false,
                background: background,
                confirmButtonColor: colorBotonConfirmar
            });
            return false;
        }

        return true;
    };

    self.cerrarTurno = function () {
        var valido = self.comprobarCierreTurnoValido(true);
        if (!valido) {
            return;
        }

        var html = "";
        var background = null;
        var textoBotonCancelar = "Cancelar";
        var colorBotonCancelar = null;
        var colorBotonConfirmar = null;
        let comprobarDescuadreAlto = self.comprobarAlertaDeDescuadre();
        let comprobarHayComprobantesX = self.hayComprobantesX();
        let comprobarCantidadesValidas = self.comprobarCantidadesValidas();

        if (!comprobarCantidadesValidas) {
            return;
        }

        if (comprobarDescuadreAlto || comprobarHayComprobantesX) {
            background = '#f8d7da';
            colorBotonCancelar = '#f8f9fa';
            colorBotonConfirmar = '#f44336';
            textoBotonCancelar = '<span style="color: black;">Cancelar</span>';
        }
        if (comprobarDescuadreAlto) {
            var cantidadDeAlerta = self.caja().alertaDeDescuadre();
            html = "<p style=\"color:red;\">El descuadre actual supera el descuadre de alerta de la caja ($ " + cantidadDeAlerta + ").</p>";
        }
        if (comprobarHayComprobantesX) {
            let texto = "<p style=\"color:red;\">Tiene comprobantes X en su turno.</p>";
            html += texto;
        }
        if (html !== "") {
            html += "<p style=\"color:red;\">¿Está seguro de continuar?</p>";
        }

        Alerta({
            title: 'Confirmar el cierre de turno',
            html: html,
            background: background,
            confirmButtonColor: colorBotonConfirmar,
            cancelButtonColor: colorBotonCancelar,
            cancelButtonText: textoBotonCancelar,
            onConfirmCallback: function () {
                var url = self.urls.cerrarTurno();
                var data = {
                    caja: self.caja().id(),
                    comentarios: self.comentarios(),
                    saldo: parseFloat(self.saldoReal()),
                    saldoTeorico: parseFloat(self.saldoFinal()),
                    saldoDeja: parseFloat(self.saldoDeja()),
                    descuadre: parseFloat(self.descuadre()),
                    arqueo: self.normalizarArqueo()
                };
                var opciones = self.getAjaxOpciones({
                    url: url,
                    data: data,
                    success: function (data, textStatus, jqXHR) {
                        if (data) {
                            if (data.exito) {
                                var title = 'Cierre de turno confirmado';
                                verTicket(data.rutaTicket, data.rutaEnvio, title, true, true);
                                $("#punto-de-venta-cierre-ticket-iframe").load(function () {
                                    $(this).show();
                                });
                                Notificacion("Turno cerrado éxitosamente", 'success');
                                return true;
                            }
                            if (Array.isArray(data.errores)) {
                                data.errores.forEach(error => {
                                    Notificacion(error, 'error');
                                });
                                return;
                            }
                        }
                        Notificacion('Ha ocurrido un error al cerrar el turno.', 'error');
                    },
                    beforeSend: function (jqXHR, settings) {
                        self.ajax(true);
                        Notificacion("Cerrando turno...", 'info');
                    },

                    complete: function (jqXHR, settings) {
                        self.ajax(false);
                    }
                });
                $.ajax(opciones);
            }
        });
    };

    /**
     * Toma las denominaciones y sus cantidades y arma el arqueo del turno
     *
     * @returns {object}
     */
    self.normalizarArqueo = function () {
        var arqueo = {};
        arqueo.total = self.saldoReal();
        arqueo.lineas = ko.observableArray();
        ko.utils.arrayForEach(self.denominaciones(), function (denominacion) {
            var linea = {};
            let cantidad = denominacion.cantidad();
            if (cantidad === "") {
                cantidad = 0;
            }
            linea.cantidad = cantidad;
            linea.denominacion = denominacion.id();
            arqueo.lineas.push(linea);
        });
        return ko.mapping.toJSON(arqueo);
    };

    //<editor-fold defaultstate="collapsed" desc="Ajax">
    self.ajaxOpciones = {
        method: 'POST',
        error: function (jqXHR, textStatus, errorThrown) {
            Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
        }
    };
    self.getAjaxOpciones = function (opciones) {
        if (typeof opciones === 'undefined') {
            opciones = {};
        }
        return jQuery.extend(true, opciones, self.ajaxOpciones);
    };
    //</editor-fold>

};

function koDenominacion(js) {
    ko.mapping.fromJS(js, {}, this);
    var self = this;
    self.ucFirst = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    self.deja = ko.observable();
    self.nombre = self.ucFirst(self.tipo()) + " de $ " + self.denominacion();
};
