//<editor-fold defaultstate="collapsed" desc="Extensiones">
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

var formatearMoneda = function(valor) {
	var salida = Inputmask.format(valor, formatoNumero);
	var partes = salida.split(',');
	if (partes.length === 1) {
		salida += ',00';
	} else if (partes.length > 1) {
		var decimales = partes[partes.length - 1];
		if (decimales.length === 1) {
			salida += '0';
		}
	}
	return salida;
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
		var final = formatearMoneda(valor);
		$(element).html('$ ' + final);
	}
};

ko.bindingHandlers.cantidad = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var valor = ko.utils.unwrapObservable(valueAccessor());
		var tipo  = typeof valor;
		if ((tipo !== 'number' && isNaN(valor))
			|| valor === null
		) {
			$(element).html('');
			return;
		}
		var final = formatearMoneda(valor);
		$(element).html(final);
	}
};

ko.bindingHandlers['tooltipster'] = {
    init: function(element, valueAccessor){
        $(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
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
	
	self.hoy		= moment().format('YYYY-MM-DD');
	self.ajax		= ko.observable(false);
	self.modificado = ko.observable(false);
	
	var alta				    = self.alta();
	self.mostrarTabInternos		= ko.observable(alta);
	self.mostrarTabConsolidados = ko.observable(!alta);
	
	self.deshabilitarTabs = ko.observable(alta);
	
	self.deshabilitarCampos = ko.computed(function() {
		var ajax	   = self.ajax();
		var visualizar = self.visualizar();
		return ajax || visualizar;
	});
	
	
	self.textoAlerta = "Si modifica las notas de pedido internas, perderá los " +
		"cambios realizados en la pestaña de Consolidados que no hayan sido " +
		"guardados.";
	self.alertar	 = ko.computed(function() {
		var alta		   = self.alta();
		var modificado     = self.modificado();
		var deshabilitadas = self.deshabilitarTabs();
		return !alta && (!deshabilitadas || modificado);
	});
	
	/**
	 * Devuelve la cantidad redondeada por dos decimales, si la cantidad es una 
	 * cadena vacía devuelve cero. La cantidad de decimales a redondear por 
	 * defecto son 2 pero se puede modificar mediante el parámetro decimales.
	 * 
	 * @param {Number} valor
	 * @param {Number} decimales
	 * @returns {Number}
	 */
	self.getCantidadRedondeada = function(valor, decimales = 2) {
		if (valor === "") {
			return 0;
		}
		var cantidad = parseFloat(valor).toFixed(decimales);
		return parseFloat(cantidad);
	};
	
	self.cambiarTab = function(interno) {
		var deshabilitar = self.deshabilitarTabs();
		if (deshabilitar) {
			return;
		}
		var consolidado = !interno;
		self.mostrarTabInternos(interno);
		self.mostrarTabConsolidados(consolidado);
	};
	
	self.tituloNoElegir		 = "No pedir nada de este artículo/genérico";
	self.textoBotonContinuar = ko.pureComputed(function() {
		var guardar = self.alta() || self.modificado();
		if (guardar) {
			return "Guardar y continuar";
		}
		return "Continuar";
	});
	
	self.cantidadInternas = self.pedidos().length.toString() + " disponibles";
	
	self.pedidosSeleccionados = ko.pureComputed(function() {
		var salida  = [];
		var pedidos = self.pedidos();
		for (var i = 0; i < pedidos.length; i++) {
			var pedido = pedidos[i];
			if (pedido.seleccionado()) {
				salida.push(pedido);
			}			
		}
		return salida;
	});
	
	/**
	 * Comprueba que todos los pedidos estén seleccionados.
	 * 
	 * @returns {Boolean}
	 */
	self.comprobarTodosSeleccionados = function() {
		var total		  = self.pedidos().length;
		var seleccionados = self.pedidosSeleccionados().length;
		return total === seleccionados;
	};
	
	/**
	 * Selecciona todos los pedidos internos.
	 * 
	 * @returns {void}
	 */
	self.seleccionarTodos = function() {
		var pedidos = self.pedidos();
		var todos	= self.comprobarTodosSeleccionados();
		for (var i = 0; i < pedidos.length; i++) {
			var pedido = pedidos[i];
			pedido.seleccionado(!todos);
		}
		self.modificado(true);
		self.deshabilitarTabs(true);
	};
	
	//<editor-fold defaultstate="collapsed" desc="Guardar y continuar">
	/**
	 * Comprueba que el pedido consolidado a guardar sea válido, si mostrar es 
	 * true acumula y muestra los errores. 
	 * 
	 * Verifica los datos mínimos para continuar en la siguiente pestaña. Por lo
	 * que en este caso el usuario sólo debe seleccionar los pedidos internos
	 * que conformarán al pedido consolidado.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarGuardadoContinuarValido = function(mostrar) {
		var errores = [];
		
		var pedidos = self.pedidosSeleccionados();
		if (pedidos.length === 0) {
			errores.push("Debe seleccionar al menos un pedido interno.");
		}
		
		var fecha	    = self.pedido.fecha();
		var fechaMoment = moment(fecha).startOf('day');
		var fechaValida = fechaMoment.isValid();
		if (!fechaValida) {
			errores.push("La fecha de la nota de pedido no es válida.");
		}
		
		var hoy = moment().startOf('day');
		if (fechaMoment.isBefore(hoy)) {
			errores.push("La fecha de la nota de pedido no puede ser pasada.");
		}
		
		if (mostrar) {
			errores.forEach(error => {
				Notificacion(error, "error");
			});
		}
		return errores.length === 0;
	};
	
	/**
	 * Devuelve los ids de los pedidos internos seleccionados.
	 * 
	 * @returns {Array}
	 */
	self.getIdsPedidosInternos = function() {
		var salida  = [];
		var pedidos = self.pedidosSeleccionados();
		pedidos.forEach(pedido => {
			salida.push(pedido.id);
		});
		return salida;
	};
	
	/**
	 * Guarda la nota de pedido consolidada asignandolé sus pedidos internos y
	 * para cada linea de cada pedido interno se crea una línea de pedido 
	 * consolidada con los datos mínimos para poder continuar a la siguiente
	 * pantalla.
	 * 
	 * @returns {Boolean}
	 */
	self.guardarContinuar = function() {
		var valido	   = self.comprobarGuardadoContinuarValido(true);
		var modificado = self.modificado();
		if (!modificado && valido) {
			self.cambiarTab(false);
			return;
		}
		
		if (!valido) {
			return false;
		}
		
		var url	 = self.urls.guardarContinuar();
		var data = {
			fecha   : self.pedido.fecha(),
			pedido  : self.pedido.id,
			pedidos : self.getIdsPedidosInternos()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar la nota de pedido consolidada, vuelva a intentar.', 'error');
					return;
				}
				window.location.href = data.resultado.url;
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>
	
	/**
	 * Comprueba que la nota de pedido consolidada a guardar sea válida. Para 
	 * que sea válido la fecha debe ser válida y no puede ser pasada, el total 
	 * a pedir por cada comprable no debe ser menor a cero, y para cada línea 
	 * de cada comprable se debe seleccionar una fecha que no sea pasada y debe 
	 * tener seleccionado un depósito.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarGuardadoFinalizarValido = function(mostrar) {
		var errores	= [];
		
		var fecha	    = self.pedido.fecha();
		var fechaMoment = moment(fecha).startOf('day');
		var fechaValida = fechaMoment.isValid();
		if (!fechaValida) {
			errores.push("La fecha de la nota de pedido no es válida.");
		}
		
		var hoy = moment().startOf('day');
		if (fechaMoment.isBefore(hoy)) {
			errores.push("La fecha de la nota de pedido no puede ser pasada.");
		}
		
		var agrupamientos = self.agrupamientos();
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];
			
			var lineas		  = agrupamiento.lineas;
			var comprable	  = agrupamiento.comprable;
			var erroresLineas = self.getErroresLineasAgrupamientoValidas(lineas, comprable);
			
			errores = errores.concat(erroresLineas);
		}
		
		if (mostrar) {
			errores.forEach(error => {
				Notificacion(error, "error");
			});
		}
		return errores.length === 0;
	};
	
	/**
	 * Devuelve un array de errores para las líneas de un agrupamiento. 
	 * 
	 * @param {Array} lineas
	 * @param {Object} comprable
	 * @returns {Array}
	 */
	self.getErroresLineasAgrupamientoValidas = function(lineas, comprable) {
		var nombre	= comprable.nombre;
		var errores = [];
		for (var i = 0; i < lineas.length; i++) {
			var linea = lineas[i];
			
			var cantidad = self.getCantidadRedondeada(linea.cantidad());
			if (isNaN(cantidad) || cantidad === 0.00) {
				continue;
			}
			
			var deposito		  = linea.deposito.nombre;
			var original		  = linea.cantidad();
			var decimales		  = original.toString().split(".")[1];
			var cantidadDecimales = decimales !== undefined ? decimales.length : 0;			
			if (cantidadDecimales > 2) {
				errores.push(`La cantidad a elegir del item '${nombre}' para el 
					depósito de origen '${deposito}' no puede tener más de 
					dos decimales.`);
			}
			
			if (cantidad < 0.00) {
				errores.push(`La cantidad a elegir del item '${nombre}' para el 
					depósito de origen '${deposito}' no puede ser menor a cero.`);
			}
			
			var id = linea.id;
			if (isNaN(id) || parseInt(id) < 0) {
				errores.push(`El id de la línea del item '${nombre}' para el 
					depósito de origen '${deposito}' es inválido.`);
			}
			
			var hoy   = moment().startOf('day');
			var fecha = moment(linea.fechaEntrega).startOf('day');
			if (!fecha.isValid()) {
				errores.push(`La fecha elegida para el item '${nombre}' para el 
					depósito de origen '${deposito}' es inválida.`);
			}
			if (fecha.isBefore(hoy)) {
				errores.push(`La fecha elegida para el item '${nombre}' para el 
					depósito de origen '${deposito}' no puede ser pasada.`);
			}
			
			var destino = linea.destino;
			if (destino === undefined) {
				errores.push(`Debe seleccionar un depósito de destino para el 
					item '${nombre}' con depósito de origen '${deposito}'.`);
			}
		}
		return errores;
	};
	
	/**
	 * Devuelve los datos mínimos para guardar el pedido consolidado.
	 * 
	 * @returns {Array}
	 */
	self.getDatosAgrupamientos = function() {
		var datos		  = [];
		var agrupamientos = self.agrupamientos();
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];			
			
			var dato = agrupamiento.getDatosPost();			
			datos.push(dato);
		}
		return datos;
	};
	
	self.guardarBorrador = function() {
		self.pedido.estado(ESTADO_BORRADOR);
		self.guardarFinalizar();
	};
	
	self.guardarCerrarPreguntar = function() {
		var valido = self.comprobarGuardadoFinalizarValido(true);
		
		if (!valido) {
			return false;
		}

		Swal.fire({
			title: '¿Está seguro que desea cerrar la nota de pedido consolidada?',
			text: "Una vez cerrada no podrá modificarla.",
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			confirmButtonText: 'Si, cerrar nota de pedido consolidada.',
			cancelButtonText: 'Cancelar'
		}).then(function(resultado) {
			if (!resultado.value) {
				return;
			}
			self.guardarCerrar();
		});
	};
	
	self.guardarCerrar = function() {
		self.pedido.estado(ESTADO_CERRADA);
		self.guardarFinalizar();
	};
	
	/**
	 * Guarda el pedido consolidado.
	 * 
	 * @returns {Boolean}
	 */
	self.guardarFinalizar = function() {		
		var valido = self.comprobarGuardadoFinalizarValido(true);
		if (!valido) {
			return false;
		}
		
		var url	 = self.urls.guardar();
		var data = {
			fecha		  : self.pedido.fecha(),
			estado		  : self.pedido.estado(),
			agrupamientos : self.getDatosAgrupamientos()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar la nota de pedido consolidada, vuelva a intentar.', 'error');
					return;
				}
				Notificacion("La nota de pedido consolidada se ha guardado con éxito.", "success");
				window.location.href = self.urls.listar();
			}
		});
		$.ajax(opciones);
	};
	
	//<editor-fold defaultstate="collapsed" desc="Ajax">

	self.ajaxOpciones = {
		method: 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			var mensaje = "Ha ocurrido un error, vuelva a intentar";
			if (typeof jqXHR.responseJSON !== "undefined") {
				var data = jqXHR.responseJSON;
				if (Array.isArray(data.resultado.errores)) {
					mensaje = data.resultado.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
					mensaje += data.resultado.errores.join("<br/>");
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
	self.getAjaxOpciones = function (opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>
}

$(document).ready(function () {
	var $seccion = $('#compra-pedido-alta');
	ko.options.deferUpdates = true;
	koPedidoAlta = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koPedidoAlta, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});	
});

