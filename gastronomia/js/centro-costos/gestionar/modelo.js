/* global ko, moment */

//<editor-fold defaultstate="collapsed" desc="Configuración">
var configDemanda = {
	key: function(data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create : function(options) {
		var objeto = new koDemanda(options.data, opcionesPantalla);
		return objeto;
	},
	update : function(options) {
		ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
		return options.target;
	}
};

var configAsignacion = {
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
};

var opcionesPantalla = {
	'demanda'		: configDemanda,
	'demandas'		: configDemanda,
	'asignaciones'	: configAsignacion,
	'asignacion'	: configAsignacion
};
//</editor-fold>

function koDemanda(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	if (!ko.isObservable(self.asignaciones)) {
		self.asignaciones = ko.observableArray(self.asignaciones);
	}

	self.platosSeleccionados = ko.computed(function() {
		var salida		 = [];
		var asignaciones = self.asignaciones();
		ko.utils.arrayForEach(asignaciones, function(asignacion) {
			if (asignacion.plato()) {
				var idTipoPlato = asignacion.tipoPlato().id();
				if (!salida[idTipoPlato]) {
					salida[idTipoPlato] = [];
				}
				salida[idTipoPlato].push(asignacion.plato().id());
			}
		});
		return salida;
	});

	self.cantidadPlatosSeleccionados = ko.computed(function() {
		var cantidad	 = 0;
		var asignaciones = self.asignaciones();
		ko.utils.arrayForEach(asignaciones, function(asignacion) {
			if (asignacion.comprobarTienePlato()) {
				cantidad++;
			}
		});
		return cantidad;
	});

	self.comprobarTienePlatosAsignados = ko.computed(function() {
		return self.cantidadPlatosSeleccionados() > 0;
	});

	self.comprobarTienePlatosAsignadosGuardados = ko.computed(function() {
		const guardado = self.id() !== null;
		return guardado && self.comprobarTienePlatosAsignados() > 0;
	});

	self.comprobarMostrarDiaAcciones = ko.pureComputed(function() {
		return self.comprobarTienePlatosAsignados() || !self.esPasado();
	});

	self.esPasado = ko.computed(function() {
		var fecha = moment(self.fecha.mysql());
		var hoy	  = moment().hour(0).minute(0).second(0);
		if (fecha.isBefore(hoy, 'day')) {
			return true;
		}
		return false;
	});

	self.getAsignacionPorPlato = function(platoEncontrar) {
		var salida		 = null;
		var asignaciones = self.asignaciones();
		for (var i = 0; i < asignaciones.length; i++) {
			var asignacion	= asignaciones[i];
			var plato		= asignacion.plato();
			if (plato.id() === platoEncontrar.id()) {
				salida = asignacion;
				break;
			}
		}
		return salida;
	};

	self.deseleccionarAsignacion = function(asignacion) {
		self.asignaciones.remove(asignacion);
	};

	self.comprobarGuardada = function() {
		return !!self.id();
	};

    self.data = function() {
        const id           = self.id();
        const fecha        = self.fecha;
        const asignaciones = self.asignaciones();
        const asignacionesData = [];

        for (var i = 0; i < asignaciones.length; i++) {
            const asignacion = asignaciones[i];
            asignacionesData.push(asignacion.data());
        }

        return {
            id           : id,
            fecha        : fecha,
            asignaciones : asignacionesData
        };
    };

}

function koAsignacion(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	if (!ko.isObservable(self.id)) {
		self.id = ko.observable(self.id);
	}

	if (!ko.isObservable(self.plato)) {
		self.plato = ko.observable(self.plato);
	}

	if (!ko.isObservable(self.tipoPlato)) {
		self.tipoPlato = ko.observable(self.tipoPlato);
	}

	self.comprobarTienePlato = ko.computed(function() {
		return self.plato() !== null;
	});

    self.data = function() {
        const platoId     = self.plato().id();
        const tipoPlatoId = self.tipoPlato().id();
        const cantidad    = self.cantidad();

        return {
            plato : {id : platoId},
            tipoPlato : {id : tipoPlatoId},
            cantidad : cantidad
        };
    };

}