//<editor-fold defaultstate="collapsed" desc="Configuración">
var configTurno = {
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
};

var opcionesPantalla = {
	'turno': configTurno,
	'turnos': configTurno,
	'servicio': {
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
	'asignaciones': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koAsignacion(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koTurno(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	if (!ko.isObservable(self.asignaciones)) {
		self.asignaciones = ko.observableArray(self.asignaciones);
	}

	self.seleccionarPlato = function(plato, tipo) {
		var idTipoPlato	= tipo.id();
		var asignacion	= self.getAsignacionByCategoria(idTipoPlato);
		if (asignacion.plato() !== null && self.comprobarEsPublico() && !asignacion.comprobarEsPlatoOriginal(plato)) {
			asignacion.modificado(true);
		} else {
			asignacion.modificado(false);
		}
		asignacion.plato(plato);
	};

	self.getAsignacionByCategoria = function(idTipoPlato) {
		var salida = null;
		for (var i = 0; i < self.asignaciones().length; i++) {
			var asignacion = self.asignaciones()[i];
			if (asignacion.tipoPlato.id() === idTipoPlato) {
				salida = asignacion;
				break;
			}
		}
		return salida;
	};

	self.platosSeleccionados = ko.computed(function() {
		var salida		 = [];
		var asignaciones = self.asignaciones();
		ko.utils.arrayForEach(asignaciones, function(asignacion) {
			if (asignacion.plato()) {
				var idTipoPlato = asignacion.tipoPlato.id();
				if (!salida[idTipoPlato]) {
					salida[idTipoPlato] = [];
				}
				salida[idTipoPlato].push(asignacion.plato().id());
			}
		});
		return salida;
	});

	self.comprobarEmpezo = function() {
		var salida = false;
		if (!self.fecha) {
			return salida;
		}
		var ahora = moment();
		var fecha = moment(self.fecha.mysql());
		var horaInicio = moment(self.servicio.horaInicio.mysql());
		fecha.hour(horaInicio.hour());
		fecha.minute(horaInicio.minute());
		return ahora.isAfter(fecha);
	};

	self.comprobarEsPublico = ko.computed(function() {
		return self.id() !== null;
	});

	self.comprobarTienePlatosAsignadosPublicos = ko.computed(function() {
		var esPublico = self.comprobarEsPublico();
		var tienePlatosAsignados = self.comprobarTienePlatosAsignados();
		return (esPublico === true && tienePlatosAsignados === true);
	});

	self.comprobarTienePlatosAsignados = ko.computed(function() {
		var asignaciones = self.asignaciones();
		if (asignaciones.length === 0) {
			return false;
		}
		var salida = false;
		for (var i = 0; i < asignaciones.length; i++) {
			var asignacion = asignaciones[i];
			if (asignacion.comprobarTienePlato()) {
				salida = true;
				break;
			}
		}
		return salida;
	});

	self.comprobarTienePlatosTodosAsignados = ko.computed(function() {
		var asignaciones = self.asignaciones();
		if (asignaciones.length === 0) {
			return false;
		}
		var salida = true;
		for (var i = 0; i < asignaciones.length; i++) {
			var asignacion = asignaciones[i];
			if (asignacion.comprobarTienePlato()) {
				continue;
			}
			salida = false;
			break;
		}
		return salida;
	});

	self.comprobarTienePlatosModificadosPublicos = function() {
		var salida = false;
		if (!self.comprobarEsPublico()) {
			return salida;
		}
		var asignaciones = self.asignaciones();
		for (var i = 0; i < asignaciones.length; i++) {
			var asignacion = asignaciones[i];
			if (asignacion.modificado()) {
				salida = true;
				break;
			}
		}
		return salida;
	};

	self.urlInformeConsumos = ko.computed(function() {
		var url = URL_REPORTE_CONSUMOS;
		if (!url || !self.fecha) {
			return null;
		}
		var params = self.getUrlParams();
		return url + '?'
				+ params['fechas']
				+ '&' + params['servicio']
				+ '&' + params['tipo']
				+ '&' + params['comedor'];
	});

	self.urlInformeDetallesReservas = ko.computed(function() {
		var url = URL_REPORTE_DETALLE_RESERVA;
		if (!url || !self.fecha) {
			return null;
		}
		var params = self.getUrlParams();
		return url + '?'
				+ params['fechas']
				+ '&' + params['servicio']
				+ '&' + params['tipo']
				+ '&' + params['comedor'];
	});

	self.getUrlParams = function() {
		var fecha = self.fecha.fechaMysql();
		return {
			fechas		: 'fecha-desde=' + fecha + '&fecha-hasta=' + fecha,
			servicio	: 'servicio=' + self.servicio.id(),
			tipo		: 'tipo=' + self.servicio.tipo.id(),
			comedor		: 'comedor=' + self.servicio.comedor.id()
		};
	};

}

function koAsignacion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	if (!ko.isObservable(self.plato)) {
		self.plato = ko.observable(self.plato);
	}

	self.platoOriginal			= self.plato() ? self.plato() : null;
	self.platoIdOriginal		= self.plato() ? self.plato().id() : null
	self.platoNombreOriginal	= self.plato() ? self.plato().nombre() : null
	self.modificado				= ko.observable(false);

	self.comprobarEsPlatoOriginal = function(plato) {
		if (self.platoIdOriginal === null) {
			return true;
		}
		var comparar = ko.isObservable(plato) ? plato() : plato;
		return self.platoIdOriginal === comparar.id();
	};

	self.reiniciarPlatoOriginal = function() {
		self.plato(self.platoOriginal);
		self.modificado(false);
	};

	self.comprobarTienePlato = ko.computed(function() {
		return self.plato() !== null;
	});
}

function koServicio(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.getDiasConServicio = function() {
		var salida	= [];
		var dias	= self.dias();
		for (var d = 0; d < dias.length; d++) {
			var dia = dias[d];
			salida.push(dia.numeroDia());
		}
		return salida;
	};
}
