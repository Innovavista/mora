/* global ko, moment */

/**
 * Representa el componente KO de un calendario genérico.
 *
 * @param {Observable} calendario		| Observable donde se almacenará el calendario creado.
 * @param {Observable} deshabilitado	| Booleano para deshabilitar/habilitar el calendario.
 * @param {Boolean} rellenarDatos		| Boolean para rellenar los días vacíos sin datos.
 * @param {Object} datos				| Objeto con los datos necesarios para el calendario. Estructura:
 *
 * {
 *		{String} claveEntidad					| Clave donde se almacenará cada entidad en el día.
 *		{ObservableArray|Object} entidades	 	| Array de entidades.
 *		{Observable|Object} dummy		 		| Bosquejo para clonar.
 *		{Object} opciones	 					| Opciones de KO mapping.
 * }
 *
 * @param {Function} onClickDia				| Evento al apretar el día.
 * @param {Function} onClickDiaSecundario	| Evento secundario al apretar el día.
 * @param {Function} callbackBeforeCreate	| Callback para ejecutar antes de crear el calendario.
 * @param {Function} callbackAfterCreate	| Callback para ejecutar después de crear el calendario.
 *
 * @param {Moment} fechaDesde	| Fecha mínima para desplazarse con el calendario.
 * @param {Moment} fechaHasta	| Fecha máxima para desplazarse con el calendario.
 * @param {Moment} mes			| Fecha para crear el calendario en un mes particular.
 * @param {Integer} subirMesMax | Máxima cantidad de meses para desplazarse.
 *
 * @returns {void}
 */
ko.components.register('calendario', {
	viewModel: function(params) {
		var self = this;

		self.calendario		= params.calendario;
		self.deshabilitado	= params.deshabilitado ? params.deshabilitado : ko.observable(false);
		self.datos			= params.datos;
		self.rellenarDatos	= params.rellenarDatos === false ? params.rellenarDatos : true;

		self.onClickDia			  = params.onClickDia			? params.onClickDia				: function () {};
		self.onClickDiaSecundario = params.onClickDiaSecundario	? params.onClickDiaSecundario	: function () {};
		self.callbackBeforeCreate = params.callbackBeforeCreate ? params.callbackBeforeCreate	: function () {};
		self.callbackAfterCreate  = params.callbackAfterCreate  ? params.callbackAfterCreate	: function () {};

		self.fechaDesde		= params.fechaDesde ? params.fechaDesde : moment();
		self.fechaHasta		= params.fechaHasta ? params.fechaHasta : null;
		self.subirMesMax	= params.subirMesMax ? params.subirMesMax : 6;
		self.mes			= params.mes;

		self.semana = new Semana();

		self.crearCalendario = function() {
			var mes = ko.isObservable(self.mes) ? self.mes : ko.observable(self.mes);

			self.callbackBeforeCreate();

			var calendario	= new Calendario(
				mes(),
				self.fechaDesde,
				self.fechaHasta,
				self.subirMesMax
			);

			calendario.configurarDias();
			calendario.agregarDatos(self.datos, self.rellenarDatos);
			self.calendario(calendario);

			self.callbackAfterCreate();
		};

		self.mes.subscribe(function() {
			// Cuando cambié la fecha se vuelve a crear el calendario.
			self.crearCalendario();
		});

		self.crearCalendario();
	},
	template: { element: 'componente-calendario' }
});

/**
 * Representa un calendario de un mes en particular.
 *
 * @param {Moment} mes
 * @param {Moment} fechaDesde
 * @param {Moment|null} fechaHasta
 * @param {Integer} subirMesMax
 *
 * @returns {Calendario}
 */
function Calendario(mes, fechaDesde, fechaHasta, subirMesMax) {
	var self = this;

	self.placeholderAgregados = false;

	self.dias = ko.observableArray([]);

	if (!mes) {
		self.diasMesActual	= moment().daysInMonth();
	} else {
		self.diasMesActual	= mes.daysInMonth();
	}

	/**
	 * Agregado de "placeholders" al calendario que representan
	 * los días que no pertenecen al mes actual.
	 *
	 * @returns {void}
	 */
	for (var d = 1; d <= self.diasMesActual; d++) {
		var diasPlaceholder = 0;

		if (!mes) {
			var fecha = moment().date(d);
		} else {
			var fecha = mes.date(d);
		}

		var numeroDiaSemana = fecha.day();
		if (numeroDiaSemana === 0) {
			numeroDiaSemana = 7;
		}
		if (!self.placeholdersAgregados && numeroDiaSemana !== 1) {
			diasPlaceholder = numeroDiaSemana - 1;
			for (var i = 0; i < diasPlaceholder; i++) {
				self.dias.push(new Dia(fecha, true));
			}
		}
		self.placeholdersAgregados = true;

		self.dias.push(new Dia(fecha));
	}

	/**
	 * Agrega datos a cada día del calendario si corresponde.
	 *
	 * @param {Object} datos
	 * @param {Boolean} rellenarDatos
	 *
	 * @returns {void}
	 */
	self.agregarDatos = function(datos, rellenarDatos) {
		if (!datos) {
			return;
		}
		var clave		= datos.claveEntidad;
		var entidades	= datos.entidades;
		var dummy		= datos.dummy;
		var opciones	= datos.opciones;

		var nuevas	= [];
		var dias	= self.dias();
		for (var i = 0; i < dias.length; i++) {
			var dia = dias[i];
			if (dia.placeholder()) {
				continue;
			}
			for (var e = 0; e < entidades().length; e++) {
				var entidad		= entidades()[e];
				var encontrada	= false;
				if (dia.mysql() === entidad.fecha.mysql()) {
					dia[clave] = ko.observable(entidad);
					encontrada = true;
					break;
				}
			}
			if (!encontrada && rellenarDatos) {
				const entidad = ko.mapping.fromJS(ko.mapping.toJS(dummy), opciones);
                self.copiarDiaAFecha(dia, entidad.fecha);
				dia[clave] = ko.observable(entidad);
				nuevas.push(entidad);
			}
			if (!encontrada && !rellenarDatos) {
				dia[clave] = ko.observable(null);
			}
		}
		entidades(entidades().concat(nuevas));
	};

    /**
     * Copia los valores del objeto Dia en la fecha dada.
     *
     * @param {type} dia
     * @param {type} fecha
     * @returns {undefined}
     */
    self.copiarDiaAFecha = function(dia, fecha) {
        fecha.mysql(dia.mysql());
        fecha.fechaMysql(dia.fechaMysql());
        fecha.fecha(dia.fecha());
        fecha.fechaCorta(dia.fechaCorta());
    };

	/**
	 * Configuración de días para indicar cuales són pasados.
	 *
	 * @returns {void}
	 */
	self.configurarDias = function() {
		var hoy = moment().hour(0).minute(0).second(0);
		for (var d = 0; d < self.dias().length; d++) {
			var dia			= self.dias()[d];
			var diaObjeto	= moment(dia.mysql());
			if (dia.placeholder()) {
				continue;
			}
			if (diaObjeto.isBefore(hoy, 'day')) {
				dia.esPasado(true);
				dia.esPasadoActual(true);
			}
			if (diaObjeto.isSame(hoy, 'day')) {
				dia.esPasadoActual(true);
			}
		}
	};

	/**
	 * Se desplaza a un anterior, si corresponde, y ejecuta una callback.
	 *
	 * @param {Function} callback
	 *
	 * @returns {void}
	 */
	self.bajarMes = function(callback) {
		if (self.bajarMesDeshabilitado()) {
			return;
		}
		callback();
	};

	/**
	 * Se desplaza a un futuro, si corresponde, y ejecuta una callback.
	 *
	 * @param {Function} callback
	 *
	 * @returns {void}
	 */
	self.subirMes = function(callback) {
		if (self.subirMesDeshabilitado()) {
			return;
		}
		callback();
	};

	/**
	 * Indica si se puede desplazar a un mes anterior.
	 *
	 * @returns {Boolean}
	 */
	self.bajarMesDeshabilitado = ko.computed(function() {
		var mesPasado	= mes.subtract(1, 'month');
		if (mesPasado.isBefore(fechaDesde, 'month')) {
			return true;
		}
		return false;
	});

	/**
	 * Indica si se puede desplazar a un mes futuro.
	 *
	 * @returns {Boolean}
	 */
	self.subirMesDeshabilitado = ko.computed(function() {
		if (fechaHasta === null) {
			var max				= moment().hour(0).minute(0).second(0).add(subirMesMax, 'month');
			var mesSiguiente	= mes.add(1, 'month');
			if (mesSiguiente.isSame(max, 'month')) {
				return true;
			}
			return false;
		}
		var mesSiguiente = mes.add(1, 'month');
		if (mesSiguiente.isSame(fechaHasta, 'month')) {
			return true;
		}
		return false;
	});
};

/**
 * Representa 7 días de una semana.
 *
 * @returns {ObservableArray|Dia}
 */
var Semana = function() {
	var semana = ko.observableArray([]);
	for (var d = 0; d <= 6; d++) {
		var dia = moment().weekday(d);
		semana.push(new Dia(dia));
	}
	return semana;
};

/**
 * Representa un día de la semana.
 *
 * @param {Moment} moment
 * @param {Boolean} placeholder
 *
 * @property {Observable|Boolean} placeholder | booleano que indica si el día no corresponde al mes del calendario.
 * @property {Observable|Boolean} esPasado | booleano que indica si el día es pasado.
 * @property {Observable|Boolean} esPasadoActual | booleano que indica si el día es pasado o actual.
 * @property {Observable|Number} numero | número del día en el mes (01 - 31).
 * @property {Observable|Number} numeroDiaSemana | número del día en la semana (1 - 7).
 * @property {Observable|String} dia | nombre del día (Lunes, Martes, etc.).
 * @property {Observable|String} mes | nombre del mes (Enero, Febrero, etc.).
 * @property {Observable|String} año | número del año.
 * @property {Observable|String} mysql | formato mysql de la fecha (YYYY-MM-DD 00:00:00).
 *
 * @returns {Dia}
 */
var Dia = function(moment, placeholder) {
	var numeroDiaSemana = moment.day();
	if (numeroDiaSemana === 0) {
		// El valor 0 en moment es Domingo, le cambiamos el valor a 6
		// para que coincida con los valores normalizados.
		numeroDiaSemana = 7;
	}
	var obj = {
		placeholder		: ko.observable(placeholder ? true : false),
		esPasado		: ko.observable(false),
		esPasadoActual	: ko.observable(false),
		numero			: ko.observable(moment.format('DD')),
		numeroDiaSemana : ko.observable(numeroDiaSemana),
		dia				: ko.observable(moment.format('dddd')),
        mes				: ko.observable(moment.format('MM')),
		año				: ko.observable(moment.format('YYYY')),
		mysql			: ko.observable(moment.format('YYYY-MM-DD 00:00:00')),
		fechaMysql		: ko.observable(moment.format('YYYY-MM-DD')),
		fecha   		: ko.observable(moment.format('DD/MM/YYYY')),
		fechaCorta 		: ko.observable(moment.format('DD/MM'))
    };
    return obj;
};