var opcionesPantalla = {
	'servicios': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koServicio(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'turnos' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koTurno(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};

function koServicio(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	self.formatearHora = function(hora) {
		return hora.substr(0, hora.length - 3);
	};

	self.horaInicio = ko.observable(self.formatearHora(self.horaInicio.hora()));
	self.horaFin	= ko.observable(self.formatearHora(self.horaFin.hora()));

	self.getDiasConServicio = function() {
		var salida	= [];
		var dias	= self.dias();
		for (var d = 0; d < dias.length; d++) {
			var dia = dias[d];
			salida.push(dia.numeroDia());
		}
		return salida;
	};

	self.comprobarSinTurnos = function() {
		var turnos = ko.isObservable(self.turnos) ? self.turnos() : self.turnos;
		if (turnos === null) {
			return true;
		}
		return turnos.length === 0;
	};
}

function koTurno(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	self.getPlato = function(preferenciaId) {
		var asignaciones = self.asignaciones();

		for (var i = 0; i < asignaciones.length; i++) {
			var asignacion = asignaciones[i];
			var tipo	   = asignacion.tipoPlato.id();
			if (tipo === preferenciaId) {
				return asignacion.plato;
			}
 		}

		return null;
	};
}
