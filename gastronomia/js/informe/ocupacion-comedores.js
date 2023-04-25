var koOcupacion = null;

var opcionesPantalla = {};

//<editor-fold defaultstate="collapsed" desc="Velocímetro">
ko.bindingHandlers.chartJs = {
    init: function(element, valueAccessor) {
		var params		= ko.utils.unwrapObservable(valueAccessor());
		var servicioId	= ko.utils.unwrapObservable(params.data.servicioId);

		var data = koOcupacion.getPorcentajeDataOcupacion(params);

		var ctx = $(element)[0].getContext("2d");

		var chart = new Chart(ctx, {
			type: "doughnut",
			data: {
				datasets: [{
						backgroundColor: [data.color, '#eeeeee'],
						borderWidth: 0,
						data: [data.reservas, data.cupos - data.reservas]
					}]
			},
			custom: {
				porcentaje: data.porcentaje
			},
			options: {
				rotation: -1.0 * Math.PI,
				circumference: Math.PI,
				cutoutPercentage: 70,
				legend: {
					display: false
				},
				tooltips: {
					enabled: false
				},
				hover: { mode: null }
			}
		});

		Chart.pluginService.register({
			beforeDraw: function (chart) {
				var width = chart.chart.width,
				height = chart.chart.height,
				ctx = chart.chart.ctx;

				ctx.restore();
				var fontSize = (height / 70).toFixed(2);
				ctx.font = fontSize + "em sans-serif";
				ctx.textBaseline = "middle";

				var porcentaje	= chart.config.custom.porcentaje;
				var color		= chart.config.data.datasets[0].backgroundColor[0];
				ctx.fillStyle	= color;

				var text = porcentaje + '%',
				textX = Math.round((width - ctx.measureText(text).width) / 2),
				textY = (height / 2) + 20;

				ctx.fillText(text, textX, textY);
				ctx.save();
			}
		});

		koOcupacion.charts()[servicioId] = chart;
    },
	update: function(element, valueAccessor) {
		var charts		= koOcupacion.charts();
		var params		= ko.utils.unwrapObservable(valueAccessor());
		var servicioId	= ko.utils.unwrapObservable(params.data.servicioId);

		if (!charts[servicioId]) {
			return;
		}

		var chart	= charts[servicioId];
		var data	= koOcupacion.getPorcentajeDataOcupacion(params);

		if (chart.config.custom.porcentaje === data.porcentaje) {
			return;
		}

		chart.config.custom.porcentaje = data.porcentaje;

		var datasets = chart.data.datasets;
		ko.utils.arrayForEach(datasets, function(dataset) {
			dataset.backgroundColor = [data.color, '#eeeeee'];
			dataset.data = [data.reservas, data.cupos - data.reservas];
		});
		chart.update();
	}
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Selectpicker">
ko.bindingHandlers.selectPicker = {
	after: ['options'], /* KO 3.0 feature to ensure binding execution order */
	init: function (element, valueAccessor, allBindingsAccessor) {
		$(element).addClass('selectpicker').selectpicker();
	},
	update: function (element, valueAccessor, allBindingsAccessor) {
		/* KO 3.3 will track any bindings we depend on automagically and call us on changes */
		allBindingsAccessor.get('options');
		allBindingsAccessor.get('value');
		allBindingsAccessor.get('selectedOptions');

		$(element).selectpicker('refresh');
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.charts				= ko.observable({});
	self.filtroActivo		= ko.observable(false);
	self.pantallaCompleta	= ko.observable(false);

	//<editor-fold defaultstate="collapsed" desc="Tipo de servicio actual">
	self.selectTipo = $(".informe-ocupacion-comedores-tipo");
	self.tipoActual = ko.observable(null);

	/**
	 * Comprueba cuales de los tipos de servicios es el
	 * actual y lo setea. Puede pasarse un parámetro con un array de tipos de
	 * servicios que fueron recuperados desde el servicio para actualizar el
	 * tipo en tiempo real.
	 *
	 * @param {array} filtro
	 * @return {void}
	 */
	self.setearTipoActual = function(tiposNuevos) {
		if (self.filtroActivo() || !self.tipos) {
			return;
		}
		var salida	= null;
		var tipos	= self.tipos();
		if (tiposNuevos) {
			var actualNuevo = ko.utils.arrayFirst(tiposNuevos, function(tipoNuevo) {
				return tipoNuevo.actual();
			});
			salida = actualNuevo ? ko.utils.arrayFirst(tipos, function(tipo) {
				return tipo.id() === actualNuevo.id();
			}) : null;
		}
		if (salida === null) {
			for (var i = 0; tipos.length > i; i++) {
				var tipo = tipos[i];
				if (tipo.actual()) {
					salida = tipo;
					break;
				}
			}
		}
		if (salida === null) {
			return;
		}
		self.tipoActual(salida);
		ko.tasks.runEarly();
		self.selectTipo.selectpicker('refresh');
	};

	self.setearTipoActual();
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Filtros">
	self.filtrosVisible = ko.observable(true);
	self.toggleFiltros = function() {
		self.filtrosVisible(!self.filtrosVisible());
	};

	/**
	 * Realiza el filtrado de servicios por el tipo de servicio seleccionado.
	 *
	 * @param {boolean} actualizacion
	 * @return {void}
	 */
	self.filtrar = function(actualizacion) {
		var tipoActual  = self.tipoActual();
		if (!tipoActual) {
			return;
		}
		var comprobarActualizacion = actualizacion ? actualizacion : false;
		if (!comprobarActualizacion) {
			self.filtroActivo(true);
		}
		var data = { id: tipoActual.id(), filtroActivo: self.filtroActivo() };
		self.actualizarDatos(data);
	};

	/**
	 * Remueve el tipo de servicio seleccionado para que el servidor decida cuando
	 * hay que cambiar de tipo de servicio automáticamente.
	 *
	 * @return {void}
	 */
	self.removerFiltroActivo = function() {
		self.filtroActivo(false);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Actualización de datos">
	/**
	 * Realiza la consulta para recuperar los nuevos datos.
	 *
	 * @param {object} datos
	 * @return {void}
	 */
	self.actualizarDatos = function(datos) {
		var url	 = self.urls.ocupacionComedores();
		var data = datos ? datos : {};
		var opciones = self.getAjaxOpciones({
			url	 : url,
			data : data,
			success : function (data, textStatus, jqXHR) {
				if (data.array) {
					var comedores	= ko.mapping.fromJS(data.array.comedores);
					var tipos		= ko.mapping.fromJS(data.array.tipos);

					self.compararYActualizarComedores(comedores());
					self.setearTipoActual(tipos());

					return;
				}
				if (data.error) {
					Notificacion(data.error, 'error');
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			}
		});
		$.ajax(opciones);
	};

	/**
	 * Realiza la comparación de:
	 *
	 *		- Si varía el tipo de servicio de los servicios actuales.
	 *		- Si varía la cantidad de servicios actuales con los nuevos.
	 *		- Si varía la cantidad de reservas de un turno de un servicio.
	 *		- Si varía la cantidad de cupos de un turno de un servicio.
	 *
	 * @param {array} comedoresNuevos
	 * @return {void}
	 */
	self.compararYActualizarComedores = function(comedoresNuevos) {
		if (comedoresNuevos.length === 0) {
			self.comedores([]);
			return;
		}
		if (self.comedores().length === 0) {
			self.comedores(comedoresNuevos);
			return;
		}
		var comedoresActuales = self.comedores();
		ko.utils.arrayForEach(comedoresNuevos, function(comedorNuevo) {
			var ocupacionesNuevas	= comedorNuevo.datos();
			var comedorActual		= ko.utils.arrayFirst(comedoresActuales, function(comedorActual) {
				return comedorActual.id() === comedorNuevo.id();
			});
			var ocupacionesActuales	= comedorActual.datos();
			var ocupacionesActualesOtroServicio = false;

			for (var i = 0; ocupacionesNuevas.length > i; i++) {
				var ocupacionNueva = ocupacionesNuevas[i];

				var ocupacionActual = ko.utils.arrayFirst(ocupacionesActuales, function(ocupacionActual) {
					return ocupacionNueva.servicioId() === ocupacionActual.servicioId();
				});

				// Si al menos 1 servicio cambia, es decir, no se encuentra en los actuales
				// se reinician todas las ocupaciones
				if (!ocupacionActual && !ocupacionesActualesOtroServicio) {
					comedorActual.datos([]);
					ocupacionesActualesOtroServicio = true;
				}

				// Por algún motivo el servicio que estaba no está más así que agregamos el nuevo
				if (!ocupacionActual) {
					comedorActual.datos.push(ocupacionNueva);
					continue;
				}

				// Si no es el mismo servicio pero si el comedor removemos el actual
				if (ocupacionActual.servicioId() !== ocupacionNueva.servicioId()) {
					comedorActual.remove(ocupacionActual);
					continue;
				}

				// Comparación de reservas del turno actual con el nuevo
				if (ocupacionActual.reservas() !== ocupacionNueva.reservas()) {
					ocupacionActual.reservas(ocupacionNueva.reservas());
				}

				// Comparación de cupos del turno actual con el nuevo
				if (ocupacionActual.cupos() !== ocupacionNueva.cupos()) {
					ocupacionActual.cupos(ocupacionNueva.cupos());
				}
			}

			// Puede que varien las cantidades de servicios entre las actuales
			// y las nuevas, esto se debe a que se anuló un servicio.
			if (ocupacionesActuales.length !== ocupacionesNuevas.length) {
				comedorActual.datos(ocupacionesNuevas);
			}

		});
	};

	/**
	 * Función recursiva para actualizar constantemente la pantalla.
	 *
	 * @return {void}
	 */
	self.autoActualizar = function() {
		if (self.virtual()) {
			return;
		}
		setTimeout(function() {
			self.filtrar(true);
			self.autoActualizar();
		}, 5000);
	};
	self.autoActualizar();
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Pantalla completa">
	/**
	 * Función para poner el navegador en pantalla completa y ocultar
	 * componentes.
	 *
	 * @return {void}
	 */
	self.togglePantallaCompleta = function() {
		self.pantallaCompleta(!self.pantallaCompleta());
		$("body").toggleClass("informe-ocupacion-comedores-pantalla-completa");
		if (document.fullscreenEnabled) {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
		}
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Getters">
	/**
	 * Devuelve un objeto con los siguientes datos:
	 *
	 *		- cupos que tiene el servicio
	 *		- reservas pendientes/entregadas
	 *		- porcentaje que representan las reservas sobre los cupos
	 *		- color del porcentaje
	 *
	 * @param {Object} params
	 * @return {Object}
	 */
	self.getPorcentajeDataOcupacion = function(params) {
		var reservas	= parseInt(ko.utils.unwrapObservable(params.data.reservas));
		var cupos		= parseInt(ko.utils.unwrapObservable(params.data.cupos));
		var	porcentaje	= Math.round((reservas / cupos) * 100);

		var partesCupos  = cupos / 3;
		var valoresCupos = [0, partesCupos, partesCupos * 2, partesCupos * 3];
		var coloresCupos = ['#91bd3a', '#ffa259', '#fe6845', '#fa4252'];

		var sinControl	= ko.utils.unwrapObservable(params.data.sinControlCupos);
		if (sinControl) {
			return {
				cupos: 1, // Con valor 1 para que muestre el gráfico gris
				reservas: 0,
				porcentaje: 0,
				color: '#91bd3a'
			};
		}

		var color = '';
		for (var i = 0; valoresCupos.length > i; i++) {
			var tercio = valoresCupos[i];
			var tercioSiguiente = valoresCupos[i + 1] ? valoresCupos[i + 1] : null;

			if (tercioSiguiente && porcentaje >= tercio && porcentaje <= tercioSiguiente) {
				color = coloresCupos[i];
				break;
			} else if (tercio >= porcentaje) {
				color = coloresCupos[i];
				break;
			}

		}

		return {
			cupos: cupos,
			reservas: reservas,
			porcentaje: porcentaje,
			color: color
		};
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax		= ko.observable(false);
	self.ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			alerta('Ha ocurrido el siguiente error: ' + textStatus, 'danger', $('#votacion'));
		},
		complete   : function(jqXHR, settings) {
			self.ajax(false);
		}
	};
	self.getAjaxOpciones = function(opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#ocupacion-comedores');
	ko.options.deferUpdates = true;
	koOcupacion = new koPantalla(jsonOcupacion, opcionesPantalla);
	ko.applyBindings(koOcupacion, $seccion.get(0));
	koOcupacion.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});