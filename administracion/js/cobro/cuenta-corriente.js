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

//<editor-fold defaultstate="collapsed" desc="Extensiones">
var formatoNumero = {
	groupSeparator: ".",
	radixPoint	  : ',',
	alias: "numeric",
	placeholder: "0",
	autoGroup: !0,
	digits: 2,
	digitsOptional: !1,
	clearMaskOnLostFocus: !1
};
ko.bindingHandlers.moneda = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var valor = ko.utils.unwrapObservable(valueAccessor());
		var tipo  = typeof valor;
		if ((tipo !== 'number' && isNaN(valor))
			|| valor === null
		) {
			$(element).html('');
			return;
		}
		var final = Inputmask.format(valor, formatoNumero);
		var partes = final.split(',');
		if (partes.length === 1) {
			final += ',00';
		} else if (partes.length > 1) {
			var decimales = partes[partes.length - 1];
			if (decimales.length === 1) {
				final += '0';
			}
		}
		$(element).html('$ ' + final);
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.recibos = ko.observableArray(self.recibosTodos());
	
	//<editor-fold defaultstate="collapsed" desc="Listado operaciones">
	
	self.comprobanteOperacionClick = function(operacion) {
		switch (operacion.accion()) {
			case "anular":
				return self.modalAnular(operacion);
			default:
				if (typeof operacion.url() === "string" && operacion.url().length > 0 && operacion.url() !== "#") {
					window.location.href = operacion.url();
				}
				return;
		}
	};
	
	self.modalAnular = function(operacion) {
		swal({
			title: '¿Está seguro que desea anular el comprobante?',
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#F44336',
			cancelButtonColor: '#BFBFBF',
			showLoaderOnConfirm: false,
			preConfirm: function() {
				window.location.href = operacion.url();
			}
		});
	};
	
	//<editor-fold defaultstate="collapsed" desc="Ver Ticket">
	self.urlTicket = ko.observable(null);
	
	$('body').on('click', '.accion-ticket', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.recuperarUrlTicket(id);
	});
	
	self.verTicket = function(urlTicket) {
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

	self.recuperarUrlTicket = function(id) {
		var url			= URL_RECUPERAR_TICKET;
		var data		= { id: id };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.url) {
					return self.verTicket(data.url);
				}
				return Notificacion('Ha ocurrido un error al recuperar el ticket', 'error');
			}
		});
		$.ajax(opciones);
	};
	
	self.cerrarTicket = function() {
		self.urlTicket(null);
	};
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Ver Recibo">
	self.recibo  = ko.observable();
	self.$modal = $('#tablero-cobranzas-modal');

	self.cerrarModal = function() {
		self.$modal.modal('hide');
		self.recibo(null);
	};
	
	$('body').on('click', '.accion-ver', function(e) {
		e.preventDefault();
		var id = $(this).data('id');
		self.verRecibo(id);
	});
	
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
	//</editor-fold>

	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Inicializar filtros">
	
	self.filtroMedioDePago = ko.observable('');
	self.filtroImputacion  = ko.observable('');
	self.filtroCliente	   = ko.observable('');
	self.filtroEstado	   = ko.observable('');
	
	/**
	 * Comprueba si existe algún filtro aplicado.
	 */
	self.comprobarFiltroAplicado = ko.pureComputed(function() {
		var estado      = self.filtroEstado();
		var cliente     = self.filtroCliente();
		var imputacion  = self.filtroImputacion();
		var medioDePago = self.filtroMedioDePago();
		return estado !== '' || cliente !== '' || imputacion !== '' || medioDePago !== '';
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Filtros">
	
	/**
	 * Indica si se tienen que deshabilitar los fitros. Sólo sucede cuando
	 * no hay recibos o se está ejecutando alguna petición.
	 */
	self.deshabilitarFiltros = ko.pureComputed(function() {
		var ajax		 = self.ajax();
		var recibos		 = self.recibosTodos();
		var noHayRecibos = recibos.length === 0;
		return noHayRecibos || ajax;
	});
	
	/**
	 * Filtra los recibos buscados inicialmente mediante los filtros. Es decir, 
	 * no se realiza una nueva petición de búsqueda.
	 * 
	 * @returns {void}
	 */
	self.filtrarRecibos = function() {
		var filtrados   = [];
		var recibos	    = self.recibosTodos();
		var medioDePago = self.filtroMedioDePago();
		var cliente	    = self.filtroCliente();
		var estado	    = self.filtroEstado();
		var imputacion  = self.filtroImputacion();

		if (medioDePago === '' && cliente === '' && estado === '' && imputacion === '') {
			self.recibos(recibos);
			return;
		}

		for (var i = 0; i < recibos.length; i++) {
			var agregar      = true;
			var recibo	     = recibos[i];
			var clienteR     = recibo.clienteProveedor;
			var anulado      = typeof recibo.anulado !== "object" ? recibo.anulado() : recibo.anulado;
			var tieneCliente = typeof clienteR !== "function";
			var pendiente	 = parseFloat(recibo.pendiente());

			if (cliente !== "" && (typeof clienteR === "object" && clienteR.id() !== cliente || !tieneCliente)) {
				agregar = false;
			}
			
			if (medioDePago !== "" && recibo.medioDePago() !== medioDePago) {
				agregar = false;
			}
			
			if (
				estado !== "" && (
					(estado === ESTADO_ACTIVO && anulado) 
					|| (estado === ESTADO_ANULADO && !anulado)
				)
			) {
				agregar = false;
			}
			
			if (imputacion !== "" && (
					(imputacion === ESTADO_PENDIENTE_IMPUTAR && pendiente === 0)
					|| (imputacion === ESTADO_IMPUTADO && pendiente > 0)
				)
			) {
				agregar = false;
			}
			
			if (agregar) {
				filtrados.push(recibo);
			}
		}

		self.recibos(filtrados);
	};
	
	/**
	 * Inicializa los filtros en su estado inicial.
	 * 
	 * @returns {void}
	 */
	self.removerFiltros = function() {
		self.filtroMedioDePago('');
		self.filtroImputacion('');
		self.filtroCliente('');
		self.filtroEstado('');
		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
			
		self.filtrarRecibos();
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax = ko.observable(false);
	self.ajaxOpciones	= {
		method : 'POST',
		beforeSend: function(jqXHR, settings) {
			self.ajax(true);
		},
		error: function (jqXHR, textStatus, errorThrown) {
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
		complete: function(jqXHR, settings) {
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
	var $seccion = $('#cobro-cc');
	ko.options.deferUpdates = true;
	koCobroCC = new koPantalla(json, {});
	ko.applyBindings(koCobroCC, $seccion.get(0));
	koCobroCC.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

