var koReservar = null;

function koPantalla(json, opciones) {
    ko.mapping.fromJS(json, opciones, this);
    var self = this;

    self.servicio      = ko.observable(null);
    self.comedor       = ko.observable(null);
    self.calendario    = ko.observable(null);
    self.deshabilitado = ko.observable(false); // Para deshabilitar el calendario.
    self.fecha         = ko.observable(moment());
    self.platoModal    = ko.observable(null);
    self.urlTicket     = ko.observable(null);

    self.infoVisible = ko.observable(true);

    self.fechaDesde = moment();

    //<editor-fold defaultstate="collapsed" desc="Calendario">
    self.onClickDiaCalendario = function (turno) {
        var plato = null;
        var valor = null;

        ko.utils.arrayForEach(turno.asignaciones(), function (asignacion) {
            if (asignacion.tipoPlato.id() === self.comensal.preferenciaPlato.id()) {
                var tipoServicio  = self.getTipoServicio();
                var precioVigente = self.getPrecioVigenteTipoServicio(tipoServicio);
                if (precioVigente === null) {
                    Alerta({
                        title            : 'Sin precio asignado',
                        html             : '<p>No se puede realizar la reserva porque no se ha asignado precio, por favor comunicate con la administración de comedores.',
                        showCancelButton : false,
						onConfirmCallback: function() {}
                    });
                }
                valor = parseFloat(precioVigente.precio());
                plato = asignacion.plato;
            }
        });

        var saldo     = parseFloat(self.comensal.saldo());
        var resto     = saldo - valor;
        var template  = $("#comedor-reserva-confirmacion").html();
        var htmlDatos = {
            titulo : self.servicio().paraLlevar() ? 'Reserva para llevar' : 'Reserva de cupo',
            comedor: self.comedor().nombre(),
            fecha  : turno.fecha.fecha(),
            horario: ' de ' + self.servicio().horaInicio() + ' a ' + self.servicio().horaFin(),
            plato  : plato.nombre(),
            saldo  : '$ ' + saldo.format(2, 3, '.', ','),
            valor  : '$ ' + valor.format(2, 3, '.', ','),
            resto  : '$ ' + resto.format(2, 3, '.', ','),
            error  : false
        };

        var title             = '';
        var type              = 'question';
        var showCancelButton  = true;
		var onConfirmCallback = function() { self.reservarTurno(turno); };
        var error             = false;

        if (valor > saldo) {
            title             = 'No tenés saldo suficiente';
            type              = 'error';
			onConfirmCallback	= function() { return; };
            showCancelButton  = false;
            error             = true;
            htmlDatos.error   = error;
        }

        if (error === false) {
            var ahora      = moment();
            var fechaTurno = moment(turno.fecha.mysql());
            var horaFin    = moment(turno.servicio.horaFin.mysql());
            var limite     = self.servicio().getTiempoLimiteReservaMinutos();
            fechaTurno.hour(horaFin.hour());
            fechaTurno.minute(horaFin.minute());
            fechaTurno.subtract(limite, 'minute');
            if (ahora.isAfter(fechaTurno)) {
                title             = 'Este turno ha finalizado. No es posible reservar.';
                type              = 'error';
				onConfirmCallback = function() { return; };
                showCancelButton  = false;
                error             = true;
                htmlDatos.error   = error;
                htmlDatos.saldo   = null;
                htmlDatos.valor   = null;
            }
        }

        var html = Mustache.render(template, htmlDatos);

        Alerta({
            title            : title,
            html             : html,
            type             : type,
            showCancelButton : showCancelButton,
            onConfirmCallback: onConfirmCallback
        });
    };

    self.callbackAfterCreateCalendario = function () {
        var dias            = self.calendario().dias();
        var diasConServicio = self.servicio().getDiasConServicio();
        for (var d = 0; d < dias.length; d++) {
            var dia          = dias[d];
            var nroDiaSemana = dia.numeroDiaSemana();
            if (diasConServicio.indexOf(nroDiaSemana) > -1) {
                dia.sinServicio = ko.observable(false);
            } else {
                dia.sinServicio = ko.observable(true);
            }
        }
    };

    self.bajarMes = function () {
        self.calendario().bajarMes(function () {
            var fecha = self.fecha();
            fecha.subtract(1, 'month');
            self.buscarTurnosReservas(self.servicio(), fecha);
            window.scrollTo(0, 0);
        });
    };

    self.subirMes = function () {
        self.calendario().subirMes(function () {
            var fecha = self.fecha();
            fecha.add(1, 'month');
            self.buscarTurnosReservas(self.servicio(), fecha);
            window.scrollTo(0, 0);
        });
    };

    self.htmlMes = function (anterior) {
        let fecha = self.fecha().clone();
        let mes   = fecha.add(1, 'month');
        if (anterior) {
            mes = fecha.subtract(2, 'month');
        }
        let texto = mes.format('MMMM');
        return "Ver <span class='text-capitalize'>" + texto + '</span>';
    };
    //</editor-fold>

    self.toggleInformacion = function () {
        self.infoVisible(!self.infoVisible());
    };

    self.seleccionarComedor = function (comedor) {
        self.comedor(comedor);
    };

    self.deseleccionarComedor = function () {
        self.comedor(null);
    };

    self.seleccionarServicio = function (servicio) {
        var fecha = null;
        if (servicio.comprobarEsFutura()) {
            var fechaServicio = servicio.fechaVigenciaDesde.mysql();
            fecha             = moment(fechaServicio);
            self.fechaDesde   = moment(fechaServicio);
        } else {
            fecha           = moment();
            self.fechaDesde = moment();
        }
        self.buscarTurnosReservas(servicio, fecha);
    };

    self.deseleccionarServicio = function () {
        self.servicio(null);
    };

    self.abrirFichaPlato = function (turno) {
        var pref  = self.comensal.preferenciaPlato.id();
        var plato = turno.getPlato(pref);
        var url   = self.urls.detallePlato() + '/' + plato.id();

        $("#plato-modal").modal("show");

        var opciones = self.getAjaxOpciones({
            url    : url,
            success: function (data, textStatus, jqXHR) {
                if (data) {
                    var plato = ko.mapping.fromJS(data.plato, {});
                    self.platoModal(plato);
                } else {
                    Notificacion('Error', 'error');
                }
            }
        });
        $.ajax(opciones);
    };

    self.verTicket = function (turno) {
        var urlTicket = turno.reserva().ticketUrl();
        self.urlTicket(urlTicket);
        ko.tasks.runEarly();
        $("#reservar-ticket-iframe").load(function () {
            $(this).show();
        });
    };

    self.cerrarTicket = function () {
        self.urlTicket(null);
    };

    self.actualizarSaldoCabecera = function (turno, cancelacion) {
        var $saldoCabecera = $(".saldo-cabecera-monto");
        if ($saldoCabecera.length === 0) {
            return;
        }
        var valor       = null;
        var saldoActual = parseFloat(self.comensal.saldo());

        ko.utils.arrayForEach(turno.asignaciones(), function (asignacion) {
            if (asignacion.tipoPlato.id() === self.comensal.preferenciaPlato.id()) {
                var tipoServicio  = self.getTipoServicio();
                var precioVigente = self.getPrecioVigenteTipoServicio(tipoServicio);
                valor             = parseFloat(precioVigente.precio());
            }
        });

        if (valor === null) {
            return;
        }

        if (cancelacion) {
            var total = saldoActual + valor;
        } else {
            var total = saldoActual - valor;
        }
        $saldoCabecera.each(function () {
            $(this).text('$' + total.format(2, 3, '.', ','));
        });
        self.comensal.saldo(total);
    };

    //<editor-fold defaultstate="collapsed" desc="Alertas">
    self.mostrarReservaPendiente = function (reserva) {
        var tipo    = reserva.turno.servicio.tipo.nombre;
        var comedor = reserva.turno.servicio.comedor.nombre;
        var fecha   = reserva.turno.fecha.fecha;

        var html = '<h4>Ya tenes una reserva de ' + tipo.toLowerCase() + '</h4>';
        html += '<p>Para el ' + fecha + ' en el comedor ' + comedor + '</p>';

        Alerta({
            html             : html,
            showCancelButton : false,
			onConfirmCallback: function() {}
        });
    };

    self.mostrarSaldoInsuficiente = function (saldo) {
        var html = '<h4>No tenes saldo suficiente en tu cuenta</h4>';
        html += '<p>Tu saldo actual es: $' + saldo + '</p>';

        Alerta({
            html             : html,
            showCancelButton : false,
			onConfirmCallback: function() {}
        });
    };
    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Reservar turno">
    self.reservarTurno = function (turno) {
        const url      = self.urls.guardarReserva();
        const data     = {turno: turno.id()};
        const opciones = self.getAjaxOpciones({
            url    : url,
            data   : data,
            success: function (data, textStatus, jqXHR) {
                if (data) {
                    if (data.error) {
                        if (data.error.reservaPendiente) {
                            return self.mostrarReservaPendiente(data.error.reservaPendiente);
                        }
                        if (data.error.saldoInsuficiente) {
                            return self.mostrarSaldoInsuficiente(data.error.saldoInsuficiente);
                        }
                        return Notificacion(data.error, 'error');
                    }
                    if (data.success) {
                        Notificacion('Reserva exitosa', 'success');
                        self.actualizarSaldoCabecera(turno);
                        self.servicio(null);
                        self.urlTicket(data['rutaTicket']);
                        ko.tasks.runEarly();
                        $("#reservar-ticket-iframe").load(function () {
                            $(this).show();
                        });
                    }
                } else {
                    Notificacion('Error', 'error');
                }
            }
        });
        $.ajax(opciones);
    };
    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Cancelar reserva">
    self.comprobarCancelarReserva = function (turno) {
        const url      = self.urls.comprobarCancelarReserva();
        const data     = {reserva: turno.reserva().id()};
        const opciones = self.getAjaxOpciones({
            url    : url,
            data   : data,
            success: function (data, textStatus, jqXHR) {
                if (data.success) {
                    Alerta({
                        title            : '¿Estás seguro de que querés cancelar tu reserva?',
                        confirmButtonText: 'Si',
                        cancelButtonText : 'No',
                        onConfirmCallback: function () {
                            self.cancelarReserva(turno)
                        }
                    });
                } else {
                    Notificacion(data.error, 'error');
                }
            }
        });
        $.ajax(opciones);
    };

    self.cancelarReserva = function (turno) {
        const url      = self.urls.cancelarReserva();
        const data     = {reserva: turno.reserva().id()};
        const opciones = self.getAjaxOpciones({
            url    : url,
            data   : data,
            success: function (data, textStatus, jqXHR) {
                if (data.success) {
                    Notificacion('Reserva cancelada', 'success');
                    self.actualizarSaldoCabecera(turno, true);
                    self.servicio(null);
                } else {
                    Notificacion('Error', 'error');
                }
            }
        });
        $.ajax(opciones);
    }
    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Recuperar turnos y reservas">
    self.buscarTurnosReservas = function (servicio, fecha) {
        var url  = self.urls.buscarTurnosReservas();
        var data = {servicio: servicio, fecha: fecha.format('YYYY-MM-DD 00:00:00')};
        data     = {json: ko.mapping.toJSON(data)};
        self.deshabilitado(true);
        var opciones = self.getAjaxOpciones({
            url    : url,
            data   : data,
            success: function (data, textStatus, jqXHR) {
                if (data.turnos) {
                    var modelo         = ko.mapping.fromJS(data, opcionesPantalla);
                    var turnos         = modelo.turnos;
                    var turnosMapeados = ko.utils.arrayMap(turnos(), function (turno) {
                        if (ko.isObservable(turno.reserva)) {
                            return turno;
                        }
                        turno.reserva = ko.observable(turno.reserva);
                        return turno;
                    });
                    servicio.turnos    = ko.observableArray(turnosMapeados);
                    self.servicio(servicio);
                    self.fecha(fecha);
                    self.deshabilitado(false);
                } else {
                    Notificacion('Error', 'error');
                }
            }
        });
        $.ajax(opciones);
    };
    //</editor-fold>

    self.getTipoServicio = function () {
        return self.servicio().tipo;
    };

    self.getPrecioVigenteTipoServicio = function (tipo) {
        var salida          = null;
        var beneficioBecado = tipo.aplicaBeneficiosBecado();
        if (beneficioBecado && self.comensal.becado()) {
            return {
                precio: ko.observable(0)
            };
        }
        //Los precios del tipo ya son los vigentes por categoría de comensal
        var precios        = tipo.precios();
        var tipoComensalId = self.comensal.categoria.id();
        for (var i = 0; precios.length > i; i++) {
            var precio = precios[i];
            if (precio.categoriaComensal.id() === tipoComensalId) {
                salida = precio;
                break;
            }
        }
        return salida;
    };

    //<editor-fold defaultstate="collapsed" desc="Ajax">
    self.ajax            = ko.observable(false);
    self.ajaxOpciones    = {
        method    : 'POST',
        beforeSend: function (jqXHR, settings) {
            self.ajax(true);
        },
        error     : function (jqXHR, textStatus, errorThrown) {
            Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
        },
        complete  : function (jqXHR, settings) {
            self.ajax(false);
        }
    };
    self.getAjaxOpciones = function (opciones) {
        if (typeof opciones === 'undefined') {
            opciones = {};
        }
        return jQuery.extend(true, opciones, self.ajaxOpciones);
    };
    //</editor-fold>

}

$(document).ready(function () {
    var $seccion            = $('#reservar');
    ko.options.deferUpdates = true;
    koReservar              = new koPantalla(jsonReservar, opcionesPantalla);
    ko.applyBindings(koReservar, $seccion.get(0));
    koReservar.inicializando = false;
    ko.tasks.runEarly();

    $(window).load(function () {
        $(".preloader-container").fadeOut('slow', function () {
            $(this).remove();
        });
    });
});