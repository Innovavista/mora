var koSucursalDemandas = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.opcionesMappingDemanda		= opciones.demanda;
	self.opcionesMappingAsignacion	= opciones.asignacion;

	self.calendario		= ko.observable(null);
	self.fecha			= ko.observable(moment());
	self.deshabilitado	= ko.observable(false); // Para deshabilitar el calendario.
	self.seleccionPlato	= ko.observable(null);

	self.onClickDiaCalendario = function(demanda) {
		self.seleccionPlato(demanda);
	};

	self.bajarMes = function() {
		self.calendario().bajarMes(function() {
			self.buscarDemandas('bajar')
		});
	};

	self.subirMes = function() {
		self.calendario().subirMes(function() {
			self.buscarDemandas('subir')
		});
	};

	self.seleccionarPlato = function(plato, tipo, demanda) {
		var asignacion			= ko.mapping.fromJS(ko.mapping.toJS(self.asignacion), self.opcionesMappingAsignacion);
		asignacion.plato		= ko.observable(plato);
		asignacion.tipoPlato	= ko.observable(tipo);
		demanda.asignaciones.push(asignacion);
	};

	self.deseleccionarPlato = function(plato, tipo, demanda) {
		var asignacion = demanda.getAsignacionPorPlato(plato);
		demanda.asignaciones.remove(asignacion);
	};

	self.guardarInvalido = ko.computed(function() {
		var salida		= true;
		var demandas	= self.demandas();
		for (var i = 0; i < demandas.length; i++) {
			var demanda = demandas[i];
			if (demanda.comprobarTienePlatosAsignados()) {
				salida = false;
				break;
			}
		}
		return salida;
	});

	//<editor-fold defaultstate="collapsed" desc="Guardar">
	self.guardar = function() {
		var demandasGuardar = [];
		var mostrarAlerta	= false;
		ko.utils.arrayForEach(self.demandas(), function(demanda) {
			if (demanda.comprobarTienePlatosAsignados() && !demanda.esPasadoActual()) {
				demandasGuardar.push(demanda);
			}
			if (!demanda.limitePlatosAlcanzado()) {
				mostrarAlerta = true;
			}
		});
		if (mostrarAlerta) {
			Alerta({
				title: 'Existen días sin completar los ' + self.sucursal.maxAsignacionesDemandas() + ' platos',
				html: '<p>¿Desea continuar de todas formas?</p>',
				onConfirmCallback: function() {
					self.ejecutarGuardar(demandasGuardar);
				}
			});
		} else {
			self.ejecutarGuardar(demandasGuardar);
		}
	};

	self.ejecutarGuardar = function(demandas) {
		var url		= self.urls.guardarDemandas();
		var data	= { demandas: demandas };
		data		= { json: ko.mapping.toJSON(data) };
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
						self.deshabilitado(true);
						window.location.href = self.urls.sucursalListado();
					} else {
						Notificacion('No se han guardado las demandas', 'error');
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
	self.buscarDemandas = function(operacion) {
		var url		= self.urls.buscarDemandasMes();
		var fecha	= moment(self.fecha());
		if (operacion === 'bajar') {
			fecha = fecha.subtract(1, 'month');
		} else {
			fecha = fecha.add(1, 'month');
		}
		var data	= { sucursal: self.sucursal, fecha: fecha.format('YYYY-MM-DD') };
		data		= { json: ko.mapping.toJSON(data) };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data) {
				if (data) {
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}
					if (data.success.demandas) {
						var demandas = ko.mapping.fromJS(data.success.demandas, self.opcionesMappingDemanda);
						self.demandas(demandas());
						self.fecha(fecha);
						self.deshabilitado(false);
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		self.deshabilitado(true);
		$.ajax(opciones);
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
	var $seccion = $('#sucursal-demandas');
	ko.options.deferUpdates = true;
	koSucursalDemandas = new koPantalla(jsonSucursalDemandas, opcionesPantalla);
	ko.applyBindings(koSucursalDemandas, $seccion.get(0));
	koSucursalDemandas.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

