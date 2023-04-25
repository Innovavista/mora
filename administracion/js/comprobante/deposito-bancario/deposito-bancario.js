var koDepositoVM = null;

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.operacion		= ko.observable(true);
	self.tituloPantalla = ko.observable('Listado depósito bancario');
	
	self.volverPantalla = function() {
		window.location.href = URL_LISTADO;
	};

	//<editor-fold defaultstate="collapsed" desc="Ticket">
	$('body').on('click', '.accion-ver', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.verTicket(id);
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

	self.verTicket = function(id) {
		var url			= URL_VER;
		var data		= { id: id };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.url) {
					return verTicket(data.url, null, 'Depósito bancario');
				}
				return Notificacion('Ha ocurrido un error al recuperar el ticket', 'error');
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>	

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

	var $seccion = $('#tablero-depositos');
	ko.options.deferUpdates = true;
	koDepositoVM = new koPantalla();
	ko.applyBindings(koDepositoVM, $seccion.get(0));
	koDepositoVM.inicializando = false;
	ko.tasks.runEarly();
});
