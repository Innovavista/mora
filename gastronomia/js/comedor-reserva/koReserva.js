function koReserva(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.fechaTurno			= self.turno.fecha.fecha;
	self.servicio			= self.turno.servicio;
	self.tipoServicio		= self.servicio.tipo.nombre;
	self.comedor			= self.servicio.comedor.nombre;

	var horaInicio	= moment(self.servicio.horaInicio.hora(), 'HH:mm:ss');
	var horaFin		= moment(self.servicio.horaFin.hora(), 'HH:mm:ss');

	self.servicioHoraInicio	= horaInicio.format("HH:mm");
	self.servicioHoraFin	= horaFin.format("HH:mm");

	self.comprobarEsDeHoy = ko.computed(function() {
		var hoy = moment();
		var fechaTurno = moment(self.turno.fecha.mysql(), 'YYYY-MM-DD');
		if (hoy.isSame(fechaTurno, 'day')) {
			return true;
		}
		return false;
	})

	self.comprobarEsPasadaDia = ko.computed(function() {
		var ahora		= moment();
		var fechaTurno	= moment(self.turno.fecha.mysql());
		return fechaTurno.isBefore(ahora, 'day');
	});

	self.comprobarPuedeCancelar = ko.computed(function() {
		if (!self.comprobarEstadoPendiente()) {
			return false;
		}
		var ahora		= moment();
		var horaFin		= moment(self.servicio.horaFin.hora(), "HH:mm:ss");
		var fechaTurno	= moment(self.turno.fecha.mysql());

		fechaTurno.hour(horaFin.hour());
		fechaTurno.minute(horaFin.minute());
		fechaTurno.subtract(self.cancelacionLimite(), 'minute');
		return ahora.isBefore(fechaTurno);
	});

	self.comprobarEstadoVencida = ko.computed(function() {
		if (self.comprobarEstadoEntregada() || self.comprobarEstadoCancelada()) {
			return false;
		}
		var ahora		= moment();
		var fechaTurno	= moment(self.turno.fecha.mysql());
		var horaFin	= moment(self.servicio.horaFin.hora(), "HH:mm:ss");
		fechaTurno.hour(horaFin.hour());
		fechaTurno.minute(horaFin.minute());
		var vencida = ahora.isAfter(fechaTurno);
		if (vencida) {
			self.comprobarEstadoPendiente(false);
		}
		return vencida;
	});

	self.comprobarMostrarTicket = ko.computed(function() {
		if (self.comprobarEsPasadaDia()
			|| self.comprobarEstadoCancelada()
			|| self.comprobarEstadoEntregada()
			|| self.comprobarEstadoVencida()
		) {
			return false;
		}
		return true;
	});

}


