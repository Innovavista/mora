/* global ko, opcionesPantalla, jsonCC */

var koGestionarCC = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.opcionesMappingDemanda	   = opciones.demanda;
	self.opcionesMappingAsignacion = opciones.asignacion;

	self.calendario		= ko.observable(null);
	self.fecha			= ko.observable(moment());
	self.deshabilitado	= ko.observable(false); // Para deshabilitar el calendario.
	self.seleccionPlato	= ko.observable(null);

	self.calendarioFechaDesde = self.calendarioFechaDesde() !== null
		? moment(self.calendarioFechaDesde())
		: null;

	self.clonando = ko.observable(null);

	self.onClickDiaCalendario = function(demanda) {
		self.seleccionPlato(demanda);
	};

	self.bajarMes = function() {
		self.calendario().bajarMes(function() {
			self.buscarDemandas('bajar');
		});
	};

	self.subirMes = function() {
		self.calendario().subirMes(function() {
			self.buscarDemandas('subir');
		});
	};

	self.diaClonar = function(demanda) {
		self.clonando(demanda);
	};

	self.diaClonarConfirmar = function(dia) {
		var demanda		 = dia.demanda();
		var nuevas		 = [];
		var asignaciones = demanda.asignaciones();

		for (var i = 0, max = asignaciones.length; i < max; i++) {
			var asignacion = asignaciones[i];
			var nueva	   = ko.mapping.fromJS(ko.mapping.toJS(asignacion), opcionesPantalla.asignacion);
			nuevas.push(nueva);
		}
		self.clonando().asignaciones(nuevas);
		self.clonando(null);
	};

	self.diaClonarCancelar = function() {
		self.clonando(null);
	};

	self.diaReiniciar = function(demanda) {
		demanda.asignaciones([]);
	};

	self.seleccionarPlato = function(plato, tipo, demanda) {
		var asignacion		 = ko.mapping.fromJS(ko.mapping.toJS(self.asignacion), self.opcionesMappingAsignacion);
		asignacion.plato	 = ko.observable(plato);
		asignacion.tipoPlato = ko.observable(tipo);
		demanda.asignaciones.push(asignacion);
	};

	self.deseleccionarPlato = function(plato, tipo, demanda) {
		var asignacion = demanda.getAsignacionPorPlato(plato);
		demanda.asignaciones.remove(asignacion);
	};

	self.guardarInvalido = ko.computed(function() {
		var salida	 = true;
		var demandas = self.demandas();
		for (var i = 0; i < demandas.length; i++) {
			var demanda = demandas[i];
			if (demanda.comprobarTienePlatosAsignados()) {
				salida = false;
				break;
			}
		}
		return salida;
	});

	self.comprobarEnClonacion = ko.pureComputed(function() {
		return self.clonando() !== null;
	});

	//<editor-fold defaultstate="collapsed" desc="Guardar">
	/**
	 * Guarda los platos de los días de producción del centro de costos.
	 * El mostrarAlerta lo dejo por si en el futuro existe alguna validación
	 * que que implique mostrar un modal antes de guardar los platos
	 *
	 * @returns {void}
	 */
	self.guardar = function() {
		var mostrarAlerta	= false;
		var demandasGuardar = [];
		ko.utils.arrayForEach(self.demandas(), function(demanda) {
			if ((demanda.comprobarTienePlatosAsignados() || demanda.comprobarGuardada()) && !demanda.esPasado()) {
				demandasGuardar.push(demanda.data());
			}
		});
		if (mostrarAlerta) {
			Alerta({
				title: 'Existen días sin completar platos',
				html: '<p>¿Desea continuar de todas formas?</p>',
				onConfirmCallback: function() {
					self.ejecutarGuardar(demandasGuardar);
				}
			});
		} else {
			self.ejecutarGuardar(demandasGuardar);
		}
	};

	/**
	 * Persiste los platos de los días de producción del centro de costos
	 *
	 * @param {array} demandas
	 * @returns {void}
	 */
	self.ejecutarGuardar = function(demandas) {
		var url	 = self.urls.guardarDemandas();
		var data = { centroCostos: self.centroCostos.id(), demandas: demandas };
		data	 = { json: ko.mapping.toJSON(data) };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}
					if (data.success) {
						Notificacion('Guardado exitoso', 'success');
					} else {
						Notificacion('Hubo un error al guardar las demandas', 'error');
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Buscar demandas por mes">
	/**
	 * Busca las demandas al cambiar de mes en el calendario
	 *
	 * @param {string} operacion
	 * @returns {void}
	 */
	self.buscarDemandas = function(operacion) {
		var url	  = self.urls.buscarDemandasMes();
		var fecha = moment(self.fecha());
		if (operacion === 'bajar') {
			fecha = fecha.subtract(1, 'month');
		} else {
			fecha = fecha.add(1, 'month');
		}
		var data = { centroCostos: self.centroCostos.id(), fecha: fecha.format('YYYY-MM-DD') };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data) {
				if (Array.isArray(data.errores) && data.errores.length > 0) {
					mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
					mensaje += data.errores.join("<br/>");
					Notificacion(mensaje, 'error');
					window.location.href = self.urls.centroCostosListado();
				}
				if (data.success) {
					var demandas = ko.mapping.fromJS(data.demandas, self.opcionesMappingDemanda);
					self.demandas(demandas());
					self.fecha(fecha);
					self.deshabilitado(false);
				}

			}
		});
		self.deshabilitado(true);
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax		  = ko.observable(false);
	self.ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
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
	var $seccion = $('#centro-costos-gestionar');
	ko.options.deferUpdates = true;
	koGestionarCC = new koPantalla(jsonCC, opcionesPantalla);
	ko.applyBindings(koGestionarCC, $seccion.get(0));
	koGestionarCC.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

