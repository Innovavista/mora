function koCaja(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.saldoFormateado = ko.pureComputed(function() {
		var saldo = ko.isObservable(self.saldo) ? self.saldo() : self.saldo;
		saldo	  = parseFloat(saldo);
		return saldo.format(2, 3, '.', ',');
	});

	self.sumarSaldo = function(saldoAgregar, elementoDOM) {
		var saldo = ko.isObservable(self.saldo) ? self.saldo() : self.saldo;
		saldo	  = parseFloat(saldo);
		total	  = parseFloat(saldoAgregar) + saldo;
		if (elementoDOM) {
			$(elementoDOM).removeClass();
			setTimeout(function() {
				self.saldo(total);
				$(elementoDOM).addClass('animated bounceIn');
			}, 300);
		} else {
			self.saldo(total);
		}
	};
}

function koOperacion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.comprobarEsPuntoDeVenta = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_VENTA_PUNTO_VENTA;
	});

	self.comprobarEsVentaMostrador = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_VENTA_MOSTRADOR;
	});

	self.comprobarEsCargaCredito = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_CARGA_CREDITO;
	});

	self.comprobarEsPagoProveedor = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_PAGO_PROVEEDOR;
	});

	self.comprobarEsDepositoTurno = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_DEPOSITO_TURNO;
	});

	self.comprobarEsCierreTurno = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_CIERRE_TURNO;
	});

	self.comprobarEsMovimientosCaja = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_MOVIMIENTOS_CAJA;
	});

	self.comprobarEsCobroEnCC = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_CUENTA_CORRIENTE_COBRO;
	});

	self.comprobarEsComprobantesTurno = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_COMPROBANTES_TURNO;
	});

	self.comprobarEsDepositoBancario = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_DEPOSITO_BANCARIO;
	});

	self.comprobarEsApertura = ko.computed(function() {
		var tipo = self.tipo();
		return tipo === OPERACION_APERTURA_TURNO;
	});

}

