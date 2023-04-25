var koExpedir = null;

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

	self.reserva	= ko.observable(null);
	self.reservas	= ko.observableArray([]);
	self.busqueda	= ko.observable("");
	self.buscando	= ko.observable(false);
	self.recuperado = ko.observable(false);

	self.claseMensajeError	= "expedicion-mensaje expedicion-mensaje-error";
	self.claseMensajeInfo	= "expedicion-mensaje expedicion-mensaje-info";

	self.tipo = ko.computed(function() {
		var busqueda = self.busqueda();
		var tamano	 = busqueda.length;
		return (tamano >= 5 && tamano <= 9) ? "dni" : "qr";
	});

	//<editor-fold defaultstate="collapsed" desc="Mensaje">
	self.mensajeClase = ko.observable("");
	self.mensajeTexto = ko.observable("");
	self.mensaje = function(mensaje, clase) {
		self.mensajeClase(clase);
		self.mensajeTexto(mensaje);
	};
	self.alerta = function(mensaje, tipo, funcion) {
		var tipoAlerta	= typeof tipo !== 'undefined' ? tipo : 'warning';
		var callback	= typeof funcion !== 'undefined' ? funcion : function() { return; };
		return Alerta({
			title: mensaje,
			type: tipoAlerta,
			showCancelButton: false,
			onConfirmCallback: callback
		});
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Servicios">
	self.serviciosHabilitadosCalcular = function() {
		var en15	  = moment().add(15, 'm');
		var ahora	  = moment();
		var salida	  = [];
		var servicios = self.servicios;

		for (var i = 0, max = servicios.length; i < max; i++) {
			var servicio = servicios[i];
			var inicio	 = moment(servicio.horaInicio.hora, "HH:mm:ss");
			var fin		 = moment(servicio.horaFin.hora, "HH:mm:ss");

			if (inicio.isSame(en15) || (inicio.isSameOrBefore(ahora) && fin.isSameOrAfter(ahora))) {
				//Si arranca en 15 minutos o estamos dentro del intervalo de
				//expedición
				salida.push(servicio);
			} else if (self.mv) {
//				servicio.nombreCorto += " (mv)";
//				salida.push(servicio);
			}
		}

		return salida;
	};
	self.serviciosHabilitados = ko.observableArray(self.serviciosHabilitadosCalcular());

	self.servicioActualCalcular = function() {
		var servicios = self.servicios;
		if (servicios.length === 0) {
			return null;
		}
		var ahora = moment();
		for (var i = 0, max = servicios.length; i < max; i++) {
			var servicio = servicios[i];
			var inicio	 = moment(servicio.horaInicio.hora, "HH:mm:ss");
			var fin		 = moment(servicio.horaFin.hora, "HH:mm:ss");
			if (ahora.isSameOrAfter(inicio) && ahora.isSameOrBefore(fin)) {
				return servicio;
			}
		}
		return null;
	};
	self.servicioActual = ko.observable(self.servicioActualCalcular());

	self.servicioSiguienteCalcular = function() {
		var servicios		= self.servicios;
		var cantServicios	= servicios.length
		if (cantServicios === 0) {
			return null;
		}
		var ahora = moment().seconds(0);
		for (var i = 0; i < cantServicios; i++) {
			var servicio = servicios[i];
			var inicio	 = moment(servicio.horaInicio.hora, "HH:mm:ss");
			if (inicio.isAfter(ahora)) {
				return servicio;
			}
		}
		return null;
	};
	self.servicioSiguiente = ko.observable(self.servicioSiguienteCalcular());

	self.activarCambioServicioSiguiente = function() {
		setTimeout(function() {
			var ahora		= moment().seconds(0);
			var servicio	= self.servicioSiguiente();
			var horaInicio	= moment(servicio.horaInicio.hora, "HH:mm:ss");
			if (ahora.isSameOrAfter(horaInicio)) {
				self.servicioActual(servicio);
				self.serviciosHabilitados(self.serviciosHabilitadosCalcular());
				ko.tasks.runEarly();
				$("#expedir-servicio").selectpicker('refresh');
				return Alerta({
					title: 'El nuevo servicio ha comenzado',
					type: 'success',
					showCancelButton: false,
					onConfirmCallback: function() {
						self.buscarNueva();
						return;
					}
				});
			}
			self.activarCambioServicioSiguiente();
		}, 10000);
	};

	self.servicioExpiradoAccion = function() {
		var servicioActual			= self.servicioActualCalcular();
		var serviciosHabilitados	= self.serviciosHabilitadosCalcular();
		if (servicioActual === null) {
			// Si no hay servicio actual disponible para cambiar se busca
			// el siguiente.
			var servicioSiguiente = self.servicioSiguienteCalcular();
			if (servicioSiguiente !== null) {
				// En caso de que haya siguiente se activa el cambio automático
				// de servicio para cuando el horario corresponda con el del servicio
				self.servicioSiguiente(servicioSiguiente);
				self.activarCambioServicioSiguiente();
				var horaInicioSiguiente = moment(servicioSiguiente.horaInicio.hora, "HH:mm:ss").format('HH:mm');

				self.servicioActual(servicioActual);
				self.serviciosHabilitados(serviciosHabilitados);
				ko.tasks.runEarly();
				$("#expedir-servicio").selectpicker('refresh');

				return Alerta({
					title: 'El servicio actual ha expirado',
					html: '<p>El servicio próximo comienza a las ' + horaInicioSiguiente + '</p>',
					showCancelButton: false,
					onConfirmCallback: function() {
						self.buscarNueva();
						self.mensaje('El servicio próximo comienza a las ' + horaInicioSiguiente, self.claseMensajeError);
						return;
					}
				});
			} else {
				// En caso de que no haya servicio actual y próximo significa que
				// no hay más servicios disponibles en el día.
				self.servicioActual(servicioActual);
				self.serviciosHabilitados(serviciosHabilitados);
				ko.tasks.runEarly();
				$("#expedir-servicio").selectpicker('refresh');

				return Alerta({
					title: 'El servicio actual ha expirado',
					html: '<p>No hay más servicios en el día</p>',
					showCancelButton: false,
					onConfirmCallback: function() {
						self.buscarNueva();
						self.mensaje('No hay más servicios en el día', self.claseMensajeError);
						return;
					}
				});
			}
		} else {
			// En caso de que exista servicio actual se reemplaza por el expirado.
			return Alerta({
				title: 'El servicio actual ha expirado',
				html: '<p>Se cambiará por el servicio que corresponde al horario.</p>',
				showCancelButton: false,
				onConfirmCallback: function() {
					self.servicioActual(servicioActual);
					self.serviciosHabilitados(serviciosHabilitados);
					ko.tasks.runEarly();
					$("#expedir-servicio").selectpicker('refresh');
					self.buscar();
				}
			});
		}
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Errores">
	self.errores  = ko.computed(function() {
		//La búsqueda es un DNI o un QR
		//El DNI soportamos de 10.000 a 999.999.999 (de 5 a 9 dígitos - extranjeros tienen 5 dígitos)
		//El QR se compone de [fecha][idTipoServicio][dniComensal][aleatorio]
		//por lo que tiene como mínimo 18 caracteres y máximo incierto (por el
		//id de tipo de servicio).
		var busqueda = self.busqueda();
		var servicio = self.servicioActual();
		var salida	 = [];
		var tamano	 = busqueda.length;
		var tipo	 = self.tipo();

		if (tipo === "qr" && tamano < 18) {
			salida.push("El número ingresado no se corresponde con un documento o código qr");
		}
		if (servicio === null || typeof servicio === "undefined") {
			salida.push("Debe seleccionar un servicio");
		}
		return salida;
	});
	self.erroresMostrar = ko.observable(false);
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Foco">
	self.focoBusqueda = ko.observable(true);
	self.focoAccion	  = ko.observable(false);
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Búsqueda">
	self.busquedaErrores = ko.observable(false);

	self.buscarNueva = function() {
		self.buscarReiniciar();
		self.busqueda("");
	};
	self.buscarReiniciar = function() {
		self.reserva(null);
		self.reservas([]);
		self.mensaje("", "");
		self.recuperado(false);
		self.focoBusqueda(true);
		self.erroresMostrar(false);
		self.busquedaErrores(false);
	};
	self.buscarNueva();

	self.mostrarBusquedaExcepcion = function(mensaje) {
		self.mensaje(mensaje, self.claseMensajeError);
		self.busquedaErrores(true);
	};

	/**
	 * Realiza la búsqueda por el documento o código qr ingresado
	 */
	self.buscar = function() {
		// Comprueba antes de buscar que el servicio actual no esté expirado.
		if (self.comprobarServicioActualExpirado()) {
			return self.servicioExpiradoAccion();
		}

		var url		 = self.urls.buscar;
		var tipo	 = self.tipo();
		var busqueda = self.busqueda();
		var servicio = self.servicioActual();
		var errores	 = self.errores();

		self.erroresMostrar(true);
		if (errores.length > 0) {
			return;
		}
		self.buscarReiniciar();
		self.buscando(true);

		var data	 = {
			servicio : servicio.id,
			busqueda : busqueda
		};
		var opciones = self.getAjaxOpciones({
			url		   : url,
			data	   : data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.reservas === "undefined") {
					return self.mensaje("Ha ocurrido un error, vuelva a intentar", self.claseMensajeError);
				}
				var total	 = data.reservas.length;
				var reservas = [];
				for (var i = 0; i < total; i++) {
					var reserva = new koReserva(data.reservas[i], opcionesPantalla);
					reservas.push(reserva);
				}
				if (total === 0) {
					var mensaje = "No se ha encontrado ninguna reserva para el " + tipo + " " + busqueda;
					self.mostrarBusquedaExcepcion(mensaje);
				} else if (total === 1) {
					//Si hay una sola, entonces la variable reserva contiene
					//la única reserva recuperada
					self.reserva(reserva);
					self.focoAccion(true);
					if (reserva.ultimoEstado === ESTADO_CANCELADA || reserva.ultimoEstado === ESTADO_VENCIDA) {
						var mensaje = "La reserva ha sido " + reserva.ultimoEstado;
						self.mostrarBusquedaExcepcion(mensaje);
					} else if (reserva.ultimoEstado === ESTADO_ENTREGADA) {
						var fecha	= moment(reserva.ultimoEstadoFechaHora.mysql);
						var mensaje = "La reserva ya fue entregada el " + fecha.format('DD/MM/YYYY') + ' a las ' + fecha.format('HH:mm');
						self.mostrarBusquedaExcepcion(mensaje);
					}
					var servicio		= reserva.turno.servicio;
					var servicioActual	= self.servicioActual();
					if (servicio.id !== servicioActual.id) {
						var mensaje = "La reserva corresponde al servicio " + servicio.tipo.nombre + ' ' + servicio.horario + ' en el comedor ' + servicio.comedor.nombre;
						self.mostrarBusquedaExcepcion(mensaje);
					}
					if (reserva.comedor.id !== servicioActual.comedor.id) {
						var comedor = reserva.comedor.nombre;
						var mensaje = "La reserva corresponde al comedor " + comedor;
						self.mostrarBusquedaExcepcion(mensaje);
					}
					if (moment(reserva.turno.fecha.mysql).isBefore(moment(), 'day')) {
						var fecha   = moment(reserva.turno.fecha.mysql).format('DD/MM/YYYY');
						var mensaje = "La fecha de la reserva (" + fecha + ") es pasada";
						self.mostrarBusquedaExcepcion(mensaje);
					}
					if (moment(reserva.turno.fecha.mysql).isAfter(moment(), 'day')) {
						var fecha   = moment(reserva.turno.fecha.mysql).format('DD/MM/YYYY');
						var mensaje = "La fecha de la reserva (" + fecha + ") es futura";
						self.mostrarBusquedaExcepcion(mensaje);
					}
				} else if (total > 1) {
					self.reservas(reservas);
					self.mostrarBusquedaExcepcion('No se ha encontrado ninguna reserva para el servicio actual');
				}
				self.recuperado(true);
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Expedición">
	/**
	 * Ejecuta la expedición del pedido.
	 */
	self.expedir = function() {
		var url		= self.urls.expedir;
		var reserva = self.reserva();
		if (reserva === null) {
			self.mensaje("No se pudo recuperar la reserva, vuelva a intentar el proceso desde el principio.", self.claseMensajeError);
			return;
		}
		self.mensaje("", "");
		var data = { reserva: reserva.id, servicio: self.servicioActual().id };
		var opciones = self.getAjaxOpciones({
			url		   : url,
			data	   : data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.expedido === "undefined") {
					return self.mensaje("Ha ocurrido un error, vuelva a intentar", self.claseMensajeError);
				}
				if (data.expedido) {
					self.alerta("Se ha expedido el pedido correctamente", 'success', function() { self.buscarNueva(); });
				} else if (Array.isArray(data.errores)) {
					self.mensaje("No se pudo expedir debido a:<br/>" + data.errores.join("<br/>"), self.claseMensajeError);
				} else {
					self.mensaje("El pedido no ha sido expedido, vuelva a intentar.", self.claseMensajeError);
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax			= ko.observable(false);
	self.ajaxOpciones	= {
		method	   : "POST",
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error : function(jqXHR, textStatus, errorThrown) {
			var mensaje = "Ha ocurrido un error, vuelva a intentar";
			if (typeof jqXHR.responseJSON !== "undefined") {
				var data = jqXHR.responseJSON;
				if (Array.isArray(data.errores)) {
					mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
					mensaje += data.errores.join("<br/>");
				} else if (typeof data.error !== "undefined") {
					mensaje = "Ha ocurrido el siguiente error: " + data.error;
				}
			}
			self.mensaje(mensaje, self.claseMensajeError);
		},
		complete : function (jqXHR, settings) {
			self.ajax(false);
			self.buscando(false);
		}
	};
	self.getAjaxOpciones = function(opciones) {
		if (typeof opciones === "undefined") {
			opciones = {};
		}
		return jQuery.extend(true, {}, self.ajaxOpciones, opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Íconos">
	self.iconoBusqueda = ko.computed(function() {
		var ajax = self.ajax();
		return ajax ? 'zmdi zmdi-hc-spin zmdi-spinner' : 'zmdi zmdi-search';
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Comprobaciones">
	self.comprobarServicioActualExpirado = function() {
		var servicio = self.servicioActual();
		if (!servicio) {
			return false;
		}
		var ahora	= moment().seconds(0);
		// Se le suma 1 minuto para poder seguir expidiendo reservas
		// a la hora justa de fin del servicio.
		var horaFin	= moment(servicio.horaFin.hora, "HH:mm:ss").add(1, 'm').seconds(0);
		return ahora.isAfter(horaFin);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Comienzo de pantalla">
	if (self.servicioActual() === null && self.servicioSiguiente() !== null) {
		var hora		= moment(self.servicioSiguiente().horaInicio.hora, "HH:mm:ss");
		var mensaje		= 'No hay servicio actual disponible. El próximo comenzará a las ' + hora.format("HH:mm") + '.';
		self.mensaje(mensaje, self.claseMensajeError);
		self.activarCambioServicioSiguiente();
	}

	if (self.servicioActual() === null && self.servicioSiguiente() === null) {
		self.mensaje('No hay más servicios en el día', self.claseMensajeError);
	}
	//</editor-fold>

}

$(document).ready(function () {
	var $seccion = $("#expedir");
	ko.options.deferUpdates = true;
	koExpedir = new koPantalla(jsonExpedir, opcionesPantalla);
	ko.applyBindings(koExpedir, $seccion.get(0));
	koExpedir.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut("slow",function(){$(this).remove();});
	});
});