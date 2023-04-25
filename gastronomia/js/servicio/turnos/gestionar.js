var koGestionTurnosServicio = null;

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

	//<editor-fold defaultstate="collapsed" desc="Calendario">
	self.$modalSeleccion = $('#modal-composicion-seleccion');

	self.calendario = ko.observable(null);
	self.fecha		= ko.observable(moment());

	self.fechaHasta = null;
	self.fechaDesde	= moment(self.servicio.fechaComienzo.fechaMysql());
	if (!ko.isObservable(self.servicio.fechaFin) && self.servicio.fechaFin.fechaMysql() !== "") {
		self.fechaHasta	= moment(self.servicio.fechaFin.fechaMysql());
	}

	// Para deshabilitar el calendario.
	self.deshabilitado	   = ko.observable(false);
	self.turnoSeleccionado = ko.observable(null);

	self.onClickDiaCalendario = function(turno, dia) {
		let numero = dia();
		turno.actualizarFecha(numero);
		self.$modalSeleccion.modal('show');
		self.turnoSeleccionado(turno);
	};

	/**
	 * Realiza el cambio de mes anterior del calendario
	 *
	 * @returns {void}
	 */
	self.ejecutarBajarMes = function() {
		self.calendario().bajarMes(function() {
			self.buscarTurnos('bajar');
		});
	};

	/**
	 * Realiza el cambio de mes posterior del calendario
	 *
	 * @returns {void}
	 */
	self.ejecutarSubirMes = function() {
		self.calendario().subirMes(function() {
			self.buscarTurnos('subir');
		});
	};

	/**
	 * Acción que se ejecuta cuando apretamos la flecha izquierda del mes
	 * del calendario que realiza el cambio al mes anterior si está permitido.
	 *
	 * Verifica que el turno no tenga modificaciones antes de cambiar de mes.

	 * Para que pueda realizarse el cambio al mes anterior la fecha de inicio
	 * del servicio debe tener el mismo mes o inferor al mes que se intenta
	 * cambiar
	 *
	 * @returns {void}
	 */
	self.bajarMes = function() {
		let modificado = self.comprobarTurnosModificados();
		if (modificado) {
			Alerta({
				title: 'Advertencia',
				html: 'Todos los cambios realizados sin guardar este mes se perderán.',
				onConfirmCallback: function() {
					self.ejecutarBajarMes();
				}
			});
		} else {
			self.ejecutarBajarMes();
		}

	};

	/**
	 * Acción que se ejecuta cuando apretamos la flecha derecha del mes
	 * del calendario que realiza el cambio al mes anterior si está permitido.
	 *
	 * Verifica que el turno no tenga modificaciones antes de cambiar de mes.
	 *
	 * Para que pueda realizarse el cambio al mes posterior la fecha de fin
	 * del servicio debe tener el mismo mes o inferor al mes que se intenta
	 * cambiar, si el servicio no posee fecha de fin se inicializa una variable
	 * al llamar al componente calendario llamada subirMesMax que indica la
	 * cantidad máxima de meses a subir.
	 *
	 * @returns {undefined}
	 */
	self.subirMes = function() {
		let modificado = self.comprobarTurnosModificados();
		if (modificado) {
			Alerta({
				title: 'Advertencia',
				html: 'Todos los cambios realizados sin guardar este mes se perderán.',
				onConfirmCallback: function() {
					self.ejecutarSubirMes();
				}
			});
		} else {
			self.ejecutarSubirMes();
		}
	};
	//</editor-fold>

	self.redirigirA = function() {
		let volverA  = self.volverA();
		let modificados = self.comprobarTurnosModificados();
		if (modificados) {
			Alerta({
				title: 'Advertencia',
				html: 'Todos los cambios realizados sin guardar este mes se perderán.',
				onConfirmCallback: function() {
					window.location.href = volverA;
				}
			});
		} else {
			window.location.href = volverA;
		}
	};

	self.tituloGestionTurnos = ko.pureComputed(function() {
		var cliente  = self.servicio.cliente.nombreCorto();
		var servicio = self.servicio.nombre();
		return cliente + " - " + servicio;
	});

	self.opcionesMappingTurno = opciones.turno;

	/**
	 * Busca los turnos que tengan cargados productos
	 *
	 * @returns {Array|koPantalla.turnos}
	 */
	self.buscarTurnosAGuardar = function() {
		let turnos = [];
		for (var i = 0; i < self.turnos().length; i++) {
			var turno = self.turnos()[i];
			let tiene = turno.comprobarTieneProductos();
			if (tiene || turno.id() !== null) {
				turnos.push(turno);
			}
		}
		return turnos;
	};

	/**
	 * Inicializa todas las variables "modificada" de las composiciones como
	 * false para indicar que el servicio ya fue guardado en la base de datos.
	 *
	 * @returns {undefined}
	 */
	self.marcarTurnosComoGuardados = function() {
		let turnos = self.turnos();
		for (var i = 0; i < turnos.length; i++) {
			var turno = turnos[i];
			turno.setTurnoModificado(false);
		}
	};

	//<editor-fold defaultstate="collapsed" desc="Guardar turnos">
	/**
	 * Valida que los turnos que tienen productos estén completos
	 *
	 * @returns {Boolean}
	 */
	self.validarTurnos = function() {
		let turnos = self.buscarTurnosAGuardar();
		let valido = true;
		for (var i = 0; i < turnos.length; i++) {
			var turno = turnos[i];
			let turnoValido = turno.comprobarValido();
			if (!turnoValido) {
				valido = false;
				let fecha = turno.fecha.fecha();
				Notificacion("El turno de la fecha " + fecha + " no está completo.", "error");
			}
		}
		return valido;
	};

	/**
	 * Si el servicio no posee turnos con productos y si no posee turnos
	 * con modificaciones se invalida el guardado
	 */
	self.guardarInvalido = ko.computed(function() {
		var comprobarTurnosModificados  = false;
		var comprobarTurnosConProductos = false;
		ko.utils.arrayForEach(self.turnos(), function(turno) {
			if (turno.comprobarModificado()) {
				comprobarTurnosModificados = true;
			}
			if (turno.comprobarTieneProductos()) {
				comprobarTurnosConProductos = true;
			}
		});
		return !(comprobarTurnosConProductos && comprobarTurnosModificados);
	});

	/**
	 * Verifica que un turno haya sido modificado. Para eso se analiza si
	 * algún turno tiene alguna composición con el campo modificada en true.
	 * Esta cambio pasa a true cuando se agrega o quita alguna composición,
	 * no verifica que se agregue y quite el mismo producto por lo que una
	 * vez modificada una composición permanecerá modificada siempre.
	 *
	 * @returns {Boolean}
	 */
	self.comprobarTurnosModificados = function() {
		let turnos = self.turnos();
		for (var i = 0; i < turnos.length; i++) {
			var turno = turnos[i];
			let turnoModificado = turno.comprobarModificado();
			if (turnoModificado) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Modal que pregunta si el usuario está seguro de guardar los turnos
	 *
	 * @returns {void}
	 */
	self.modalGuardar = function() {
		Alerta({
			title: 'Advertencia',
			html: '¿Está seguro de que desea guardar y publicar?',
			onConfirmCallback: function() {
				self.guardar();
			}
		});
	};

	/**
	 * Guarda los turnos del servicio
	 *
	 * @returns {Boolean}
	 */
	self.guardar = function() {
		if (!self.validarTurnos()) {
			return false;
		}
		var url    = self.urls.guardarTurnos();
		var data = {
			turnos: self.buscarTurnosAGuardar()
		};
		data = ko.mapping.toJSON(data);
		var opciones = self.getAjaxOpciones({
			url: url,
			data: {json: data},
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					Notificacion('Los turnos han sido guardados con éxito', 'success');
					self.marcarTurnosComoGuardados();
					window.location.href = self.volverA();
					return;
				}
				if (data.errores && data.errores.length > 0) {
					ko.utils.arrayForEach(data.errores, function (error) {
						Notificacion(error, 'error');
					});
					return;
				}
				if (data.error && data.error.length > 0) {
					Notificacion(data.error, 'error');
					return;
				}
				return Notificacion('Ha ocurrido un error', 'error');
			},
			beforeSend: function (jqXHR, settings) {
				self.ajax(true);
			},
			complete: function (jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
		return true;
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Buscar turnos por mes">
	/**
	 * Busca los turnos al cambiar de mes en el calendario
	 *
	 * @param {string} operacion
	 * @returns {void}
	 */
	self.buscarTurnos = function(operacion) {
		var url	  = self.urls.buscarTurnosMes();
		var fecha = moment(self.fecha());
		if (operacion === 'bajar') {
			fecha = fecha.subtract(1, 'month');
		} else {
			fecha = fecha.add(1, 'month');
		}
		var data = { servicio: self.servicio.id(), fecha: fecha.format('YYYY-MM-DD') };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data) {
				if (Array.isArray(data.errores) && data.errores.length > 0) {
					mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
					mensaje += data.errores.join("<br/>");
					Notificacion(mensaje, 'error');
					window.location.href = self.urls.servicioListado();
				}
				if (data.success) {
					var turnos = ko.mapping.fromJS(data.turnos, self.opcionesMappingTurno);
					self.turnos(turnos());
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

	self.ajax = ko.observable(false);
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
	var $seccion = $('#servicio-turnos-gestion');
	ko.options.deferUpdates = true;
	koGestionTurnosServicio = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koGestionTurnosServicio, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});

	function confirmarSalida() {
		var modificados = koGestionTurnosServicio.comprobarTurnosModificados();
		if (modificados) {
			return "";
		}
	}

	window.onbeforeunload = confirmarSalida;
});

