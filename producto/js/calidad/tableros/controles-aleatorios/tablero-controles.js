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

//<editor-fold defaultstate="collapsed" desc="Velocímetro">
ko.bindingHandlers.chartJs = {
	init: function (element, valueAccessor) {
		var params = ko.utils.unwrapObservable(valueAccessor());
		var data = params.data;
		var atributo = data.atributo,
				positivos = parseInt(data.positivos()),
				total = parseInt(data.total()),
				porcentaje = total !== 0 ? positivos * 100 / total : 0;

		var ctx = $(element)[0].getContext("2d");

		var datasetData = total !== 0 ? [positivos, (total - positivos)] : [0, 1];

		var chart = new Chart(ctx, {
			type: "doughnut",
			data: {
				datasets: [{
						backgroundColor: [koTableroControles.getColor(data), '#d0d0d0'],
						borderWidth: 0,
						data: datasetData,
					}]
			},
			custom: {
				porcentaje: porcentaje,
				positivos: positivos,
				total: total
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
				hover: {mode: null}
			}
		});
		koTableroControles.charts()[atributo.id()] = chart;
	},
	update: function (element, valueAccessor) {
		var charts = koTableroControles.charts();
		var params = ko.utils.unwrapObservable(valueAccessor());
		var data = params.data;
		var atributo = data.atributo,
				positivos = parseInt(data.positivos()),
				total = parseInt(data.total()),
				porcentaje = total !== 0 ? positivos * 100 / total : 0;

		if (!charts[atributo.id()]) {
			return;
		}

		var chart = charts[atributo.id()];

		if (chart.config.custom.porcentaje === porcentaje) {
			return;
		}

		chart.config.custom.porcentaje = porcentaje;

		var datasets = chart.data.datasets;
		var datasetData = total !== 0 ? [positivos, (total - positivos)] : [0, 1];
		ko.utils.arrayForEach(datasets, function (dataset) {
			dataset.backgroundColor = [koTableroControles.getColor(data), '#d0d0d0'];
			dataset.data = datasetData;
		});
		chart.update();
	}
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Tooltipster">
ko.bindingHandlers['tooltipster'] = {
	init: function (element, valueAccessor) {
		$(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay: 200,
			side: 'top',
			contentCloning: true
		});
	}
};
//</editor-fold>

function koTablero(json, opcionesPantalla) {
	ko.mapping.fromJS(json, opcionesPantalla, this);
	var self = this;

	self.charts			= ko.observable([]);
	self.general		= ko.observable(self.general);
	self.tituloCantidad = "Cantidad de " + self.conceptoPlural();

	/**
	 * Devuelve  un color random para los gráficos
	 * 
	 * @returns {String}
	 */
	self.getColor = function (data) {
		var index  = self.atributos().indexOf(data);
		var length = self.atributos().length;
		var modulo = index % length;
		var colors = [
			"#30d230", "#007bff", "#808000", "#f71212", "#ffa500",
			"#000000", "#9d4dbf", "#495057", "#a7a7a7", "#a52a2a"
		];
		var comprobarGeneral = data.atributo.nombre() === 'General';
		
		var color = !comprobarGeneral ? colors[modulo] : "#30d230";
		data.color(color);
		
		return color;
	};

	//<editor-fold defaultstate="collapsed" desc="Filtrado de productos">

	var fechaDesde = moment().subtract(30, 'days').format('YYYY-MM-DD')
	self.filtroFechaDesde = ko.observable(fechaDesde);
	self.filtroFechaHasta = ko.observable("");
	self.filtroControlables = ko.observableArray([]);

	self.filtroFechaDesde.subscribe(function (fechaDesde) {
		var fecha = moment(fechaDesde);
		if (fecha.isValid() || fechaDesde === "") {
			self.buscarControlablesAjax(fechaDesde, self.filtroFechaHasta());
		}
	});

	self.filtroFechaHasta.subscribe(function (fechaHasta) {
		var fecha = moment(fechaHasta);
		if (fecha.isValid() || fechaHasta === "") {
			self.buscarControlablesAjax(self.filtroFechaDesde(), fechaHasta);
		}
	});

	/**
	 * Devuelve un arreglo con los id de los controlabes para luego realizar
	 * el filtrado con los mismos
	 * 
	 * @returns {Array}
	 */
	self.obtenerControlablesId = function () {
		var salida = [];
		ko.utils.arrayForEach(self.filtroControlables(), function (controlable) {
			salida.push(controlable.id());
		});
		return salida;
	};

	/**
	 * Realiza el filtrado de controles por fecha desde, fecha hasta y 
	 * controlables
	 * 
	 * @returns {Boolean}
	 */
	self.filtrarControlesAjax = function (mostrarMensaje) {
		var url = self.urls.filtrarControles();
		var fechaDesde = moment(self.filtroFechaDesde());
		var fechaHasta = moment(self.filtroFechaHasta());
		if (
			(fechaDesde.isValid() && fechaDesde.isAfter(moment()))
			|| (fechaHasta.isValid() && fechaHasta.isAfter(moment()))
		) {
			Notificacion("La fecha no puede ser futura", "error");
			return false;
		}
		var data = {
			fechaDesde: fechaDesde.isValid() ? fechaDesde.format("YYYY-MM-DD") : null,
			fechaHasta: fechaHasta.isValid() ? fechaHasta.format("YYYY-MM-DD") : null,
			controlables: self.obtenerControlablesId()
		};
		let opciones = self.getAjaxOpciones({
			url: url,
			data: data,
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					if (mostrarMensaje) {
						Notificacion(data.success.mensaje, 'success');
					}					
					var controles = ko.mapping.fromJS(data.success.controles, opcionesPantalla.controles);
					self.controles(controles());
					var atributos = ko.mapping.fromJS(data.success.atributos, opcionesPantalla.atributos);
					self.atributos(atributos());
					var general = ko.mapping.fromJS(data.success.general, opcionesPantalla.general);
					self.general(general);
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajaxFiltrarControles(true);
			},
			complete: function (jqXHR, settings) {
				self.ajaxFiltrarControles(false);
			}
		});
		$.ajax(opciones);
	};

	/**
	 * Busca los controlables para cargar el select de controlables en los
	 * filtros
	 * 
	 * @param {string} fechaDesde
	 * @param {string} fechaHasta
	 * @returns {undefined}
	 */
	self.buscarControlablesAjax = function (fechaDesde, fechaHasta) {
		var url = self.urls.buscarControlablesFecha();
		var fechaD = moment(fechaDesde);
		var fechaH = moment(fechaHasta);
		var data = {
			fechaDesde: fechaD.isValid() ? fechaD.format("YYYY-MM-DD") : null,
			fechaHasta: fechaH.isValid() ? fechaH.format("YYYY-MM-DD") : null
		};
		let opciones = self.getAjaxOpciones({
			url: url,
			data: data,
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					var controlables = ko.mapping.fromJS(data.success.controlables, opcionesPantalla.controlables);
					self.controlables(controlables());
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajaxBuscarControlables(true);
			},
			complete: function (jqXHR, settings) {
				self.ajaxBuscarControlables(false);
			}
		});
		$.ajax(opciones);
	};

	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Borrado de control">
	/**
	 * Modal que confirma el borrado de un control
	 * 
	 * @param {koControl} control
	 * @param {jQuery.Event} evento
	 * @returns {undefined}
	 */
	self.modalBorrarControl = function (control, evento) {
		swal({
			title: 'Se eliminará el control',
			text: control.fecha(),
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
			showLoaderOnConfirm: true
		}).then(function (resultado) {
			if (resultado.value !== true) {
				return;
			}
			self.borrarControlAjax(control);
		});
	};

	/**
	 * Realiza la petición para borrar el control y luego lo quita de la tabla
	 * 
	 * @param {koControl} control
	 * @returns {undefined}
	 */
	self.borrarControlAjax = function (control) {
		var url = control.acciones.quitar();
		var data = {
			control: control.id(),
		};
		let opciones = self.getAjaxOpciones({
			url: url,
			data: data,
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					var control = ko.utils.arrayFirst(self.controles(), function (control) {
						return parseInt(control.id()) === parseInt(data.success.idControl);
					});
					self.controles.remove(control);
					self.filtrarControlesAjax(false);
					Notificacion("Se ha borrado el control con éxito", "success");
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				control.ajaxBorrarControl(true);
			},
			complete: function (jqXHR, settings) {
				control.ajaxBorrarControl(false);
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">

	self.ajaxFiltrarControles = ko.observable(false);
	self.ajaxBuscarControlables = ko.observable(false);
	self.ajaxBorrarControl = ko.observable(false);
	self.ajaxOpciones = {
		method: 'POST',
		error: function (jqXHR, textStatus, errorThrown) {
			Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
		}
	};
	self.getAjaxOpciones = function (opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#tablero-controles-aleatorios');
	ko.options.deferUpdates = true;
	koTableroControles = new koTablero(json, opcionesPantalla);
	ko.applyBindings(koTableroControles, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});

