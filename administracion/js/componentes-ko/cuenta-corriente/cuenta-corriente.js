/* global ko */

//<editor-fold defaultstate="collapsed" desc="Tooltipster">
ko.bindingHandlers['tooltipster'] = {
    init: function (element, valueAccessor) {
        $(element).tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 200,
            side: 'left',
            contentCloning: true
        });
    }
};
//</editor-fold>

ko.components.register('cuenta-corriente', {
    viewModel: function (params) {
        const self = this;

        self.movimientos      = params.movimientos;
        self.saldoInicial     = params.saldoInicial ? params.saldoInicial : 0;
        self.saldoFinal       = params.saldoFinal ? params.saldoFinal : ko.observable();
        self.placeholder      = typeof params.placeholder !== 'undefined' ? params.placeholder : true;
        self.limpiarEnAjax    = typeof params.limpiarEnAjax !== 'undefined' ? params.limpiarEnAjax : true;
        self.conComentarios   = typeof params.conComentarios !== 'undefined' ? params.conComentarios : false;
        self.conTipo          = typeof params.conTipo !== 'undefined' ? params.conTipo : false;
        self.conConcepto      = typeof params.conConcepto !== 'undefined' ? params.conConcepto : true;
        self.conNumero        = typeof params.conNumero !== 'undefined' ? params.conNumero : false;
        self.conPersona       = typeof params.conPersona !== 'undefined' ? params.conPersona : false;
        self.conOperaciones   = typeof params.conOperaciones !== 'undefined' ? params.conOperaciones : false;
        self.cabeceraTipo     = params.cabeceraTipo ? params.cabeceraTipo : 'Tipo';
        self.cabeceraConcepto = params.cabeceraConcepto ? params.cabeceraConcepto : 'Concepto';
        self.cabeceraNumero   = params.cabeceraNumero ? params.cabeceraNumero : 'Número';
        self.cabeceraPersona  = params.cabeceraPersona ? params.cabeceraPersona : 'Persona';
        self.clase            = params.clase ? params.clase : function () {
            return '';
        };
        self.fechaSaldo       = params.fechaSaldo ? params.fechaSaldo : ko.observable("");
        self.operaciones      = params.operaciones ? params.operaciones : [];
        self.ajax             = params.ajax;
        self.alturaMaxima     = params.alturaMaxima ? params.alturaMaxima : 450;

        self.columnas = ko.pureComputed(function () {
            let count = 3;
            if (self.conPersona) {
                count++;
            }
            if (self.conConcepto) {
                count++;
            }
            if (self.conNumero) {
                count++;
            }
            if (self.conComentarios) {
                count++;
            }
            if (self.operaciones.length > 0) {
                count++;
            }
            return count;
        });

        self.saldoMostrable = ko.pureComputed(function () {
            if (self.fechaSaldo() !== "") {
                const index     = self.movimientos().length;
                const ultimo    = self.movimientos()[index - 1];
                const monto     = parseFloat(ultimo.monto());
                let ultimoSaldo = parseFloat(ultimo.saldo);
                if (ultimo.comprobarEsDebito()) {
                    ultimoSaldo += monto;
                }
                if (ultimo.comprobarEsCredito()) {
                    ultimoSaldo -= monto;
                }
                return "$ " + ultimoSaldo.format(2, 3, '.', ',');
            }
            return "";
        });

        self.textoFechaSaldo = ko.pureComputed(function () {
            if (self.fechaSaldo() !== "") {
                const fechaMysql = self.fechaSaldo();
                const fechaTexto = moment(fechaMysql).format('DD/MM/YYYY');
                return "Saldo al " + fechaTexto;
            }
            return "";
        });

        self.ajax.subscribe(function () {
            if (self.ajax() && self.limpiarEnAjax) {
                self.movimientos([]);
            }
        });

        self.movimientosCalculados = ko.computed(function () {
            const movimientos = self.movimientos();
            let saldoInicial  = ko.isObservable(self.saldoInicial) ? self.saldoInicial() : self.saldoInicial;

            movimientos.sort(function (l, r) {
                const fechaIzq = typeof l.fecha === "function" ? l.fecha() : l.fecha;
                const fechaDer = typeof r.fecha === "function" ? r.fecha() : r.fecha;
                return fechaDer.timestamp() - fechaIzq.timestamp();
            });

            movimientos.reverse();

            ko.utils.arrayForEach(movimientos, function (movimiento) {
                let saldo     = parseFloat(saldoInicial);
                let monto     = ko.isObservable(movimiento.monto) ? movimiento.monto() : movimiento.monto;
                const anulado = ko.isObservable(movimiento.anulado) ? movimiento.anulado() : movimiento.anulado;

                monto = Math.abs(monto);
                if (!anulado) {
                    if (movimiento.comprobarEsDebito()) {
                        saldo = parseFloat(saldoInicial) - parseFloat(monto);
                    } else {
                        saldo = parseFloat(saldoInicial) + parseFloat(monto);
                    }
                }
                saldo            = saldo.toFixed(2);
                saldo            = parseFloat(saldo);
                movimiento.saldo = saldo;

                movimiento.saldoMostrar = saldo.format(2, 3, '.', ',');
                movimiento.montoMostrar = monto.format(2, 3, '.', ',');

                saldoInicial = saldo;
            });

            movimientos.reverse();

            self.saldoFinal(saldoInicial);
            return movimientos;
        });

        self.setAlturaMaxima = function () {
            let altura = self.alturaMaxima;
            let $tabla = $('.cc-movimientos-tabla-contenedor');
            $tabla.css("max-height", altura);
        };
        self.setAlturaMaxima();

    },
    template: {element: 'componente-cuenta-corriente'}
});
