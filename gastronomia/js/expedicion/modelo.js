//Por defecto hacemos que ninguno sea observable, dado que la pantalla no lo
//necesita en el mapeado
ko.mapping.defaultOptions().observe = ["nada"];
var opcionesPantalla = {
	'turno': {
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
	},
	'comedor': {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koComedor(options.data, opcionesPantalla);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
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
};

function koComedor(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self   = this;
	self.fecha = moment().format("dddd DD/MM/YYYY");
}

function koTurno(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
}

function koServicio(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	var paraLlevar = self.paraLlevar ? ' - Para llevar' : '';
	self.nombreCorto = self.tipo.nombre + " " + self.horario + paraLlevar;
}

function koReserva(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	self.servicioHoraInicio	= moment(self.turno.servicio.horaInicio.hora, "HH:mm:ss").format('HH:mm');
	self.servicioHoraFin	= moment(self.turno.servicio.horaFin.hora, "HH:mm:ss").format('HH:mm');
}