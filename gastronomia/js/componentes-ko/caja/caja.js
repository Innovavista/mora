/* global ko */

ko.components.register('caja', {
	viewModel: function(params) {
		var self = this;

		self.id							= params.id;
		self.url						= params.url ? params.url : '';
		self.comedor					= params.comedor;
		self.nombre						= params.nombre;
		self.saldo						= params.saldo ? params.saldo : ko.observable(0);
		self.central					= params.central;
		self.comprobarTieneTurnoAbierto	= params.comprobarTieneTurnoAbierto;
		self.mini						= params.mini;
		self.color						= params.color;
		self.acciones					= params.acciones;
		self.onClick					= params.onClick;
		self.operacionesDisponibles		= params.operacionesDisponibles;
		self.centroCostos			    = params.centroCostos ? params.centroCostos : '';

		self.saldoFormateado = ko.computed(function() {
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

	},
	template: { element: 'componente-caja' }
});

