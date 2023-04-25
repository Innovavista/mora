var koGestionarTurnos = null;

//<editor-fold defaultstate="collapsed" desc="Tooltipster">
ko.bindingHandlers['tooltipster'] = {
    init: function(element, valueAccessor){
		var value = valueAccessor();
        $(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			content: value,
			contentAsHTML: true,
			delay:	200,
			side: 'top',
			contentCloning: true
		});
    }
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.opcionesMappingTurno	= opciones.turno;

	self.calendario				= ko.observable(null);
	self.fecha					= ko.observable(moment());
	self.seleccionPlato			= ko.observable(null);
	self.deshabilitado			= ko.observable(false); // Para deshabilitar el calendario.
	self.mostrarAlertaCambioMes = ko.observable(false);
	
	self.htmlMes = function(anterior) {
		let fecha = self.fecha().clone();
		let mes   = fecha.add(1,'month');
		if (anterior) {
			mes = fecha.subtract(2,'month');
		}
		let texto = mes.format('MMMM');
		return "Ver <span class='text-capitalize'>" + texto + '</span>';
	};

	self.serviciosClonar = ko.observableArray([]);

	self.fechaHasta		= null;
	self.fechaDesde		= moment(self.servicio.fechaVigenciaDesde.mysql());
	if (!ko.isObservable(self.servicio.fechaVigenciaHasta)) {
		// Si es observable significa que tiene valor.
		self.fechaHasta = moment(self.servicio.fechaVigenciaHasta.mysql());
	}

	self.onClickDiaCalendario = function(turno, asignacion) {
		if (asignacion !== null) {
			asignacion.plato(null);
			return;
		}
		self.seleccionPlato(turno);
		self.mostrarAlertaCambioMes(true);
	};

	self.callbackAfterCreateCalendario = function() {
		var dias			= self.calendario().dias();
		var diasConServicio = self.servicio.getDiasConServicio();
		for (var d = 0; d < dias.length; d++) {
			var dia				= dias[d];
			var nroDiaSemana	= dia.numeroDiaSemana();
			if (diasConServicio.indexOf(nroDiaSemana) > -1) {
				dia.sinServicio = ko.observable(false);
			} else {
				dia.sinServicio = ko.observable(true);
			}
		}
	};

	self.seleccionarPlato = function(plato, tipo, turno) {
		turno.seleccionarPlato(plato, tipo);
	};

	self.bajarMes = function() {
		window.scrollTo(0, 0);
		self.calendario().bajarMes(function() {
			self.buscarTurnos('bajar');
		});
	};

	self.subirMes = function() {
		window.scrollTo(0, 0);
		self.calendario().subirMes(function() {
			self.buscarTurnos('subir');
		});
	};

	self.guardarInvalido = ko.computed(function() {
		var salida = true;
		for (var i = 0; i < self.turnos().length; i++) {
			var turno = self.turnos()[i];
			if (turno.comprobarTienePlatosTodosAsignados()) {
				salida = false;
				break;
			}
		}
		return salida;
	});

	self.vaciarAsignacionesTurno = function(t) {
		ko.utils.arrayForEach(t.asignaciones(), function(asignacion) {
			asignacion.plato(null);

		});
	};

	self.rellenarTurnosCalendario = function(turnos) {
		var turnosActuales = self.turnos();
		ko.utils.arrayForEach(turnosActuales, function(turnoActual) {
			var fechaTurno	= moment(turnoActual.fecha.mysql());
			var hoy			= moment();
			if ((fechaTurno.isSame(hoy, 'day') || fechaTurno.isAfter(hoy, 'day')) && !turnoActual.comprobarTienePlatosAsignados()) {
				var turnoRellenar	= self.filtrarTurnoPorFecha(turnos(), fechaTurno);
				if (turnoRellenar !== null && turnoRellenar.comprobarTienePlatosAsignados()) {
					var asignaciones = turnoRellenar.asignaciones();
					ko.utils.arrayForEach(asignaciones, function(asignacion) {
						asignacion.id(null);
						asignacion.turno = null;
					});
					turnoActual.servicio = self.servicio;
					turnoActual.asignaciones(asignaciones);
				}
			}
		});
	};

	self.filtrarTurnoPorFecha = function(turnos, fechaFiltrar) {
		var salida = null;
		for (var t = 0; t < turnos.length; t++) {
			var turno = turnos[t];
			var fecha = moment(turno.fecha.mysql());
			if (fecha.isSame(fechaFiltrar, 'day')) {
				salida = turno;
				break;
			}
		}
		return salida;
	};

	//<editor-fold defaultstate="collapsed" desc="Guardar">
	self.guardar = function() {
		var turnosGuardar = [];
		var mostrarAlerta = false;
		ko.utils.arrayForEach(self.turnos(), function(turno) {
			if (turno.comprobarTienePlatosTodosAsignados()) {
				turnosGuardar.push(turno);
			}
			if (turno.comprobarTienePlatosAsignados() && !turno.comprobarTienePlatosTodosAsignados()) {
				mostrarAlerta = true;
			}
		});
		if (mostrarAlerta) {
			Alerta({
				title: 'Hay turnos sin completar todos los platos',
				html: 'Los turnos incompletos no serán guardados. <p>¿Desea continuar de todos modos?</p>',
				onConfirmCallback: function() {
					self.comprobarGuardarTurnosModificados(turnosGuardar);
				}
			});
		} else {
			self.comprobarGuardarTurnosModificados(turnosGuardar);
		}
	};

	self.comprobarGuardarTurnosModificados = function(turnos) {
		var modificados		= [];
		var modificadosIds	= [];

		ko.utils.arrayForEach(turnos, function(turno) {
			var modificado = turno.comprobarTienePlatosModificadosPublicos();
			if (modificado) {
				modificados.push(turno);
				modificadosIds.push(turno.id());
			}
		});

		if (modificadosIds.length === 0) {
			return self.ejecutarGuardar(turnos);
		}
		var url		= self.urls.comprobarCantReservasPendientesTurnos();
		var data	= { turnos: modificadosIds };
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
						var cantidades = data.success.cantidades;
						self.mostrarPantallaModificarTurno(cantidades, modificados, turnos);
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.mostrarPantallaModificarTurno = function(datos, turnosModificados, turnosGuardar) {
		var formateados = [];

		for (var i = 0; i < turnosModificados.length; i++) {
			var turno = turnosModificados[i];
			var datoTurno = { comprobarReservas: false };

			for (var t = 0; t < datos.length; t++) {
				var dato = datos[t];
				if (dato.id == turno.id()) {
					datoTurno = dato;
					datoTurno.comprobarReservas = true;
					break;
				}
			}

			datoTurno.asignaciones = [];

			var asignaciones = turno.asignaciones();
			for (var a = 0; a < asignaciones.length; a++) {
				var asignacion = asignaciones[a];
				if (asignacion.modificado()) {
					datoTurno.asignaciones.push({
						id			: asignacion.id(),
						tipoPlato	: asignacion.tipoPlato.id(),
						viejo		: asignacion.platoNombreOriginal,
						nuevo		: asignacion.plato().nombre()
					});
				}
			}

			if (datoTurno['fecha']) {
				fecha = moment(datoTurno['fecha']).format('DD/MM/YYYY');
			} else {
				fecha = moment(turno.fecha.fechaMysql()).format('DD/MM/YYYY');
			}

			if (!datoTurno['id']) {
				id = turno.id();
			} else {
				id = datoTurno['id'];
			}

			datoTurno.fecha = fecha;
			datoTurno.id	= id;
			formateados.push(datoTurno);
		}

		var template = $("#turno-accion-modificado").html();
		var html	 = Mustache.render(template, {turnos: formateados});
		Alerta({
			html: html,
			type: 'question',
			confirmButtonText: 'Confirmar',
			onConfirmCallback: function() {
				self.ejecutarGuardar(turnosGuardar, formateados);
			}
		});
	};

	self.ejecutarGuardar = function(turnos, turnosModificados) {
		var url		= self.urls.turnosGuardar();
		var data	= { turnos: turnos, turnosModificados: turnosModificados };
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
						window.location.href = self.urls.turnosListar();
					} else {
						Notificacion('No se han guardado los turnos', 'error');
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Anulación">
	self.anularTurno	= function(t) {
		if (!t.comprobarTienePlatosAsignadosPublicos()) {
			return self.mostrarPantallaAnularTurno(t, false, 0);
		}
		Alerta({
			title: 'Podrían haber reservas asociadas a este turno',
			onConfirmCallback: function() {
				self.comprobarAnularTurno(t, true);
			}
		});
	};

	self.comprobarAnularTurno = function(turno, tieneAsignacionesPublicas) {
		var url		= self.urls.comprobarCantReservas();
		var data	= { turno: turno };
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
						var cantReservas = data.success.cantReservas;
						return self.mostrarPantallaAnularTurno(turno, tieneAsignacionesPublicas, cantReservas);
					} else {
						Notificacion('Ha ocurrido un error al anular el turno.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.mostrarPantallaAnularTurno = function(t, tieneAsignacionesPublicas, cantReservas) {
		var asignaciones = null;
		if (tieneAsignacionesPublicas) {
			asignaciones = [];
			ko.utils.arrayForEach(t.asignaciones(), function(asignacion) {
				asignaciones.push({
					tipo: asignacion.tipoPlato.nombre(),
					plato: asignacion.plato().nombre()
				});
			});
		}

		var servicio	= t.servicio;
		var horaInicio	= moment(servicio.horaInicio.mysql());
		var horaFin		= moment(servicio.horaFin.mysql());
		var reservas	= parseInt(cantReservas);

		var template = $("#turno-accion-anular").html();
		var html	 = Mustache.render(template, {
			titulo				: 'Anular turno ' + t.fecha.fecha(),
			cantReservas		: reservas,
			cantReservasText	: reservas === 1 ? 'Existe ' + reservas + ' reserva' : 'Existen ' + reservas + ' reservas',
			comedor				: servicio.comedor.nombre(),
			fecha				: t.fecha.fecha(),
			tipoServicio		: servicio.tipo.nombre(),
			horario				: ' de ' + horaInicio.format('HH:mm') + ' a ' + horaFin.format('HH:mm'),
			tieneAsignaciones	: tieneAsignacionesPublicas,
			asignaciones		: asignaciones
		});

		Alerta({
			html: html,
			type: 'question',
			confirmButtonText: 'Aceptar',
			onConfirmCallback: function() {
				swal({
					title: 'Ingrese el motivo de la anulación',
					input: 'textarea',
					inputPlaceholder: '...',
					animation: false,
					inputValue: '',
					showCancelButton: true,
					showCancelButton: 'Cancelar',
					confirmButtonText: 'Confirmar anulación',
					cancelButtonText: 'Cancelar',
					confirmButtonColor: '#58db83',
					cancelButtonColor: '#F44336',
					inputValidator: function(value) {
						if (!value) {
							return 'El motivo es obligatorio.'
						}
					}
				}).then(function(resultado) {
					if (!resultado.value) {
						return;
					}
					Alerta({
						title: '¿Está seguro de que desea confirmar la anulación del turno?',
						type: 'question',
						animation: false,
						onConfirmCallback: function() {
							self.guardarAnularTurno(t, resultado.value);
						}
					});
				});
			}
		});
	};

	self.guardarAnularTurno = function(turno, motivo) {
		var url		= self.urls.anularTurno();
		var data	= { turno: turno, motivo: motivo };
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
						Notificacion('Turno anulado exitosamente', 'success');
						self.vaciarAsignacionesTurno(turno);
						turno.habilitado(false);
					} else {
						Notificacion('Ha ocurrido un error al anular el turno.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Restablecer">
	self.restablecerTurno = function(turno) {
		var url		= self.urls.restablecerTurno();
		var data	= { turno: turno };
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
						Notificacion('Turno restablecido exitosamente', 'success');
						turno.habilitado(true);
					} else {
						Notificacion('Ha ocurrido un error al restablecer el turno.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cupos">
	self.cuposTurno = function(turno) {
		if (!turno.comprobarTienePlatosAsignadosPublicos()) {
			return self.mostrarPantallaCuposTurno(turno, 0);
		}
		Alerta({
			title: 'Podrían haber reservas asociadas a este turno',
			onConfirmCallback: function() {
				self.comprobarCuposTurno(turno);
			}
		});
	};

	self.comprobarCuposTurno = function(turno) {
		var url		= self.urls.comprobarCantReservas();
		var data	= { turno: turno };
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
						var cantReservas = data.success.cantReservas;
						return self.mostrarPantallaCuposTurno(turno, cantReservas);
					} else {
						Notificacion('Ha ocurrido un error al anular el turno.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.mostrarPantallaCuposTurno = function(turno, cantReservas) {
		var servicio	= turno.servicio;
		var horaInicio	= moment(servicio.horaInicio.mysql());
		var horaFin		= moment(servicio.horaFin.mysql());

		var reservas	= parseInt(cantReservas);
		var cuposTotal	= parseInt(turno.cupos());
		var cuposRest	= cuposTotal - reservas;

		var template = $("#turno-accion-cupos").html();
		var html	 = Mustache.render(template, {
			titulo				: 'Modificar cupos de turno ' + turno.fecha.fecha(),
			fecha				: turno.fecha.fecha(),
			comedor				: servicio.comedor.nombre(),
			tipoServicio		: servicio.tipo.nombre(),
			horario				: ' de ' + horaInicio.format('HH:mm') + ' a ' + horaFin.format('HH:mm'),
			cuposVigentes		: cuposTotal,
			cuposDisponibles	: cuposRest,
			cantReservas		: reservas,
			cantReservasText	: reservas === 1 ? 'Existe ' + reservas + ' reserva' : 'Existen ' + reservas + ' reservas',
		});

		Alerta({
			html: html,
			type: 'question',
			confirmButtonText: 'Aceptar',
			onConfirmCallback: function() {
				swal({
					title: 'Nueva cantidad de cupos',
					input: 'number',
					animation: false,
					showCancelButton: true,
					showCancelButton: 'Cancelar',
					confirmButtonText: 'Confirmar cambio de cupos',
					cancelButtonText: 'Cancelar',
					confirmButtonColor: '#58db83',
					cancelButtonColor: '#F44336',
					inputValidator: function(value) {
						if (!value) {
							return 'Los cupos són obligatorios.'
						}
						if (parseInt(value) < reservas) {
							return 'Debe ser mayor o igual a la cantidad de reservas (' + reservas + ')';
						}
					}
				}).then(function(resultado) {
					if (!resultado.value) {
						return;
					}
					Alerta({
						title: '¿Está seguro de que desea confirmar el cambio de cupos?',
						type: 'question',
						animation: false,
						onConfirmCallback: function() {
							self.guardarCuposTurno(turno, resultado.value);
						}
					});
				});
			}
		});
	};

	self.guardarCuposTurno = function(turno, cupos) {
		var url		= self.urls.guardarCuposTurno();
		var data	= { turno: turno, cupos: cupos };
		data		= { json: ko.mapping.toJSON(data) };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						Alerta({
							title: data.error,
							type: 'error',
							animation: false,
							confirmButtonText: 'Volver a intentar',
							onConfirmCallback: function() {
								self.comprobarCuposTurno(turno);
							}
						});
						return;
					}
					if (data.success) {
						Notificacion('Actualización de cupos exitosa', 'success');
						turno.cupos(cupos);
					} else {
						Notificacion('Ha ocurrido un error al anular el turno.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Buscar turnos por mes">
	self.buscarTurnos = function(operacion) {
		var url		= self.urls.buscarTurnosMes();
		var fecha	= moment(self.fecha());
		if (operacion === 'bajar') {
			fecha = fecha.subtract(1, 'month');
		} else {
			fecha = fecha.add(1, 'month');
		}
		var data	= { servicio: self.servicio, fecha: fecha.format('YYYY-MM-DD') };
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
					if (data.success.turnos) {
						var turnos = ko.mapping.fromJS(data.success.turnos, opcionesPantalla.turno);
						self.turnos(turnos());
						self.fecha(fecha);
						self.deshabilitado(false);
						self.mostrarAlertaCambioMes(false);
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		if (self.mostrarAlertaCambioMes()) {
			Alerta({
				title: 'Advertencia',
				html: 'Todos los cambios realizados sin guardar en este mes se perderan.',
				onConfirmCallback: function() {
					self.deshabilitado(true);
					$.ajax(opciones);
				}
			});
		} else {
			self.deshabilitado(true);
			$.ajax(opciones);
		}
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Clonación">
	self.clonarCalendario = function() {
		var url		= self.urls.buscarServiciosMes();
		var fecha	= moment(self.fecha());
		var data	= { fecha: fecha.format('YYYY-MM-DD') };
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
						var servicios = ko.mapping.fromJS(data.success.servicios, opcionesPantalla.servicio);
						if (servicios().length === 0) {
							return Notificacion('No hay ningún servicio disponible para clonar.', 'error');
						}
						self.serviciosClonar(servicios());
					} else {
						Notificacion('Ha ocurrido un error al clonar el calendario.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.seleccionarServicioClonar = function(servicio) {
		var url		= self.urls.buscarTurnosMes();
		var fecha	= moment(self.fecha());
		var data	= { servicio: servicio, fecha: fecha.format('YYYY-MM-DD') };
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
						if (data.success.turnos.length === 0) {
							return Notificacion('No hay ningún plato asignado en el servicio seleccionado.', 'error');
						}
						var turnos = ko.mapping.fromJS(data.success.turnos, opcionesPantalla.turno);
						self.rellenarTurnosCalendario(turnos);
						self.cerrarClonacion();
						Notificacion('Calendario clonado exitosamente.', 'success')
					} else {
						Notificacion('Ha ocurrido un error al clonar el calendario.', 'error');
						return;
					}
				} else {
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.cerrarClonacion = function() {
		self.serviciosClonar([]);
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
	var $seccion = $('#turnos-gestionar');
	ko.options.deferUpdates = true;
	koGestionarTurnos = new koPantalla(jsonGestionarTurnos, opcionesPantalla);
	ko.applyBindings(koGestionarTurnos, $seccion.get(0));
	koGestionarTurnos.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

