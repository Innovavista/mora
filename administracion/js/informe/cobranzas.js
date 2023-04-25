var koPantallaVM = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	//<editor-fold defaultstate="collapsed" desc="Ticket">
	$('body').on('click', '.accion-ticket', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.recuperarUrlTicket(id);
	});

	self.urlTicket = ko.observable(null);

	self.abrirTicket = function(urlTicket) {
		self.urlTicket(urlTicket);
		ko.tasks.runEarly();
		$("#cobro-cc-ticket-iframe").load(function() {
			$(this).show();
			var iFrameID = document.getElementById('cobro-cc-ticket-iframe');
			if (iFrameID) {
				iFrameID.height = "";
				iFrameID.height = iFrameID.contentWindow.document.body.scrollHeight + "px";
			}
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
				if (data.url) {
					return self.abrirTicket(data.url);
				}
				return Notificacion('Ha ocurrido un error al recuperar el ticket', 'error');
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	$('body').on('click', '.accion-ver', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.verRecibo(id);
	});

	self.recibo = ko.observable(null);
	self.$modal = $('#tablero-cobranzas-modal');

	self.cerrarModal = function() {
		self.$modal.modal('hide');
		self.recibo(null);
	};

	self.verRecibo = function(id) {
		var url			= URL_VER;
		var data		= { id: id };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.recibo) {
					self.recibo(data.recibo);
					self.$modal.modal('show');
					return;
				}
				return Notificacion('Ha ocurrido un error al recuperar el recibo', 'error');
			}
		});
		$.ajax(opciones);
	};

	$('body').on('click', '.accion-anular', function(e) {
		e.preventDefault();
		var href = $(this).attr('href');
		self.modalAnular(href);
	});
	self.modalAnular = function(href) {
		swal({
			title: '¿Está seguro que desea anular el comprobante?',
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
			showLoaderOnConfirm: false,
			preConfirm: function() {
				window.location.href = href;
			}
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
			Notificacion(mensaje, 'error');
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

	var $seccion = $('#tablero-cobranzas');
	ko.options.deferUpdates = true;
	koPantallaVM = new koPantalla();
	ko.applyBindings(koPantallaVM, $seccion.get(0));
	koPantallaVM.inicializando = false;
	ko.tasks.runEarly();
});
