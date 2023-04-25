var koPantallaVM = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	//<editor-fold defaultstate="collapsed" desc="Ticket">
	$('body').on('click', '.reserva-detalle-accion-ticket', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.recuperarUrlTicket(id);
	});

	self.urlTicket = ko.observable(null);

	self.abrirTicket = function(urlTicket) {
		self.urlTicket(urlTicket);
		ko.tasks.runEarly();
		$("#reservar-ticket-iframe").load(function() {
			$(this).show();
		});
	};

	self.cerrarTicket = function() {
		self.urlTicket(null);
	};

	self.recuperarUrlTicket = function(id) {
		var url			= URL_RECUPERAR_TICKET;
		var data		= { id: id };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success.url) {
					self.abrirTicket(data.success.url);
				} else {
					Notificacion('Ha ocurrido un error al mostrar el ticket', 'error');
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cancelación">
	$('body').on('click', '.reserva-detalle-accion-cancelar', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.comprobarCancelarReserva(id);
	});

	self.comprobarCancelarReserva = function(id) {
		var url			= URL_COMPROBAR_CANCELAR;
		var reserva		= { id: id }
		var data		= { reserva: reserva };
		data			= { json: ko.mapping.toJSON(data) };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success) {
					self.cancelarReserva(reserva)
				} else {
					Notificacion(data.error, 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	self.cancelarReserva = function(reserva) {
		swal({
			title: 'Ingrese el motivo de la cancelación',
			input: 'textarea',
			inputPlaceholder: '...',
			animation: false,
			inputValue: '',
			showCancelButton: true,
			showCancelButton: 'Cancelar',
			confirmButtonText: 'Confirmar cancelación',
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
			var url			= URL_CANCELAR;
			var data		= { reserva: reserva, motivo: resultado.value };
			data			= { json: ko.mapping.toJSON(data) };
			var opciones	= self.getAjaxOpciones({
				url		: url,
				data	: data,
				success : function (data, textStatus, jqXHR) {
					if (data.success) {
						Notificacion('Reserva cancelada', 'success');
						var $accion = $('.reserva-card-accion-cancelar[data-id=' + reserva.id + ']');
						var $estado = $accion.closest("tr").find(".reserva-card-estado");
						$estado.replaceWith(ESTADO_CANCELADA_LABEL);
						$accion.remove();
					} else {
						Notificacion('Ha ocurrido un error al cancelar la reserva.', 'error');
					}
				}
			});
			$.ajax(opciones);
		});
	}
	//</editor-fold>

	$('body').on('click', '.reserva-detalle-accion-expedir', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.expedirReserva(id);
	});

	self.expedirReserva = function(id) {
		swal({
			title: 'Confirmar la expedición de la reserva',
			showCancelButton: true,
			showCancelButton: 'Cancelar',
			confirmButtonText: 'Confirmar expedición',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
		}).then(function(resultado) {
			if (!resultado.value) {
				return;
			}
			var url			= URL_EXPEDIR_FORZAR;
			var data		= { id: id };
			data			= { json: ko.mapping.toJSON(data) };
			var opciones	= self.getAjaxOpciones({
				url		: url,
				data	: data,
				success : function (data, textStatus, jqXHR) {
					if (data.success) {
						Notificacion('Reserva expedida', 'success');
						var $accionExpedir	= $('.reserva-card-accion-expedir[data-id=' + id + ']');
						var $accionCancelar	= $('.reserva-card-accion-cancelar[data-id=' + id + ']');
						var $estado = $accionExpedir.closest("tr").find(".reserva-card-estado");
						$estado.replaceWith(ESTADO_ENTREGADA_LABEL);
						$accionExpedir.remove();
						$accionCancelar.remove();
					} else {
						Notificacion('Ha ocurrido un error al expedir la reserva.', 'error');
					}
				}
			});
			$.ajax(opciones);
		});
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax			= ko.observable(false);
	self.ajaxOpciones	= {
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

$(document).ready(function() {

	var $selects	= $("select.select-comedor, select.select-tipo, select.select-servicio");
	var $comedores	= $("select.select-comedor");
	var $tipos		= $("select.select-tipo");
	var $servicios	= $("select.select-servicio");

	//<editor-fold defaultstate="collapsed" desc="Mensaje vacío">
	function selectMensajeVacio() {
		$selects.each(function() {
			var $select		= $(this);
			var $dropdown	= $select.parent();
			if ($select.val() === null) {
				if ($dropdown.find(".mensaje-vacio").length === 0) {
					$dropdown.find(".filter-option").append("<span class='mensaje-vacio'>--- Seleccionar ---</span>");
				}
			} else {
				$dropdown.find(".mensaje-vacio").remove();
			}
		});
	}
	selectMensajeVacio();
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Eventos select">
	$comedores.change(function() {
		selectMensajeVacio();
	});

	$tipos.change(function() {
		selectMensajeVacio();
	});

	$servicios.change(function() {
		selectMensajeVacio();
	});
	//</editor-fold>

	var $seccion = $('#reservas-detalles');
	ko.options.deferUpdates = true;
	koPantallaVM = new koPantalla();
	ko.applyBindings(koPantallaVM, $seccion.get(0));
	koPantallaVM.inicializando = false;
	ko.tasks.runEarly();
});
