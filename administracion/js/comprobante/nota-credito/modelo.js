/* global ko */

//<editor-fold defaultstate="collapsed" desc="Configuración">
var notaCredito = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		opcionesPantalla['observe'] = [];
		var objeto = new koNotaCredito(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};
var opcionesPantalla = {
	'notaCredito' : notaCredito,
	'notasCredito' : notaCredito,
	'comensal': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			opcionesPantalla['observe'] = ["saldo"];
			var objeto = new koComensal(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koNotaCredito(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	ko.utils.arrayForEach(self.lineas(), function(linea) {
		if (linea.codigo() === "") {
			linea.codigo(linea.descripcion());
		}

		linea.cantidadInicial     = ko.observable(linea.cantidad());
		linea.cantidadAReembolsar = ko.observable(0);

		linea.subTotal = ko.pureComputed(function() {
			return linea.cantidad() * linea.precio();
		});

		linea.reembolsar = ko.pureComputed(function() {
			var cantidad = linea.cantidadAReembolsar();
			var precio	 = typeof linea.precioFinal !== 'undefined' ? linea.precioFinal() : linea.precio();
			return cantidad * precio;
		});

		linea.claseCss = ko.pureComputed(function() {
			var cantidadAReembolsar = linea.cantidadAReembolsar();
			return cantidadAReembolsar > 0 ? 'table-primary' : '';
		});

		if (typeof linea.reembolsoTotal === "function" && linea.reembolsoTotal()) {
			linea.cantidadStep = linea.cantidad();
		} else if (typeof linea.fraccionado !== 'undefined') {
			linea.cantidadStep = linea.fraccionado() ? "0.01" : "1";
		} else {
			linea.cantidadStep = "1";
		}

        if (typeof self.reembolsoTotal === "function" && self.reembolsoTotal()) {
            //Si solo se permite el reembolso total entonces por cada cantidad
            //línea modificada debemos actualizar todas las líneas
            linea.cantidadAReembolsar.subscribe(function(cantidad) {
                const cero   = parseFloat(cantidad) === 0.0;
                const lineas = self.lineas();
                for (var i = 0; i < lineas.length; i++) {
                    const linea = lineas[i];
                    const valor = cero ? "0" : linea.cantidad();
                    linea.cantidadAReembolsar(valor.replace(".00", ""));
                }
            });
        }

	});

	self.totalReembolso = ko.computed(function () {
		var total = 0;
		ko.utils.arrayForEach(self.lineas(), function (linea) {
			total += linea.reembolsar();
		});
		return total;
	});

}

function koComensal(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	var saldo		= parseFloat(self.saldo());
	self.saldoFloat = ko.pureComputed(() => parseFloat(self.saldo()));
	self.clase		= saldo > 0.00 ? "text-success" : saldo === 0.00 ? "" : "text-danger";

	self.saldoAnulacionCarga = 0.00;

	/**
	 * Devuelve el texto de alerta si el saldo de comensal fuera negativo.
	 *
	 * @returns {String}
	 */
	self.getTextoAlerta = function() {
		var nombre	   = self.nombreTexto;
		var saldo	   = self.saldoAnulacionCarga;
		var saldoTexto = formatear(saldo, formateadorMoneda);

		var texto  = `El saldo del comensal ${nombre} quedará en ${saldoTexto}, ¿está seguro que desea emitir la nota de crédito?`;
		return texto;
	};

	/**
	 * Actualiza el saldo del comensal luego de anular la carga de crédito.
	 *
	 * @returns {void}
	 */
	self.actualizarSaldo = function() {
		var saldoNuevo = self.saldoAnulacionCarga;
		self.saldo(saldoNuevo);
	};

}