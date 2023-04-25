var koPagoProveedor = null;

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

	self.concepto = self.mostrarPV() ? "pago al proveedor" : "comprobante de compra";

	self.volverPantalla = function() {
		window.location.href = self.volverA();
	};

	self.comprobarTipoFactura	  = self.factura.tipo() === TIPO_FACTURA_COMPRA;
	self.comprobarTipoNotaCredito = self.factura.tipo() === TIPO_NOTA_CREDITO_COMPRA;

	self.comprobarMostrarTipoNC = ko.pureComputed(function() {
		let mostrarPV = self.mostrarPV();
		let editar = self.editar();
		let comprobarTipoFactura = self.comprobarTipoFactura;
		return (!mostrarPV && !(editar && comprobarTipoFactura));
	});;

	self.comprobarMostrarTipoFactura = ko.pureComputed(function() {
		let editar = self.editar();
		let comprobarTipoNotaCredito = self.comprobarTipoNotaCredito;
		return !(editar && comprobarTipoNotaCredito);
	});;

	self.deshabilitarTipo = ko.pureComputed(function() {
		var ajax   = self.ajax();
		var editar = self.editar();
		var tipoNC = self.comprobarTipoNotaCredito;
		return ajax || (editar && tipoNC);
	});

	//<editor-fold defaultstate="collapsed" desc="Filtrado">
	self.facturasFiltradas = ko.observable(self.facturas());
	self.filtradoProveedor = ko.observable(null);

	self.filtrarFacturas = function() {
		let facturas   = [];
		let proveedor  = self.filtradoProveedor();
		let originales = self.facturas();
		if (!proveedor) {
			self.facturasFiltradas(originales);
			return;
		}
		for (var i = 0; i < originales.length; i++) {
			let factura  = originales[i];
			let proveedorFactura = factura.clienteProveedor.id();
			if (proveedor.id() === proveedorFactura) {
				facturas.push(factura);
			}
		}
		self.facturasFiltradas(facturas);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Alta pago proveedor">

	self.setLetraFactura = function(proveedor) {
		if (proveedor === undefined && self.proveedor() !== undefined) {
			proveedor = self.proveedor();
		}
		if (proveedor === undefined && self.proveedor() === undefined) {
			return;
		}
		if (proveedor.iva() === IVA_RESPONSABLE_INSCRIPTO) {
			self.factura.letra('B');
		} else {
			self.factura.letra('C');
		}
	};

	//<editor-fold defaultstate="collapsed" desc="Inicialización">
	var fecha			   = moment();
	self.proveedor		   = ko.observable('');
	self.focusNumero	   = ko.observable(false);
	self.focusPuntoDeVenta = ko.observable(false);

	self.seleccionarProveedor = function(proveedorABuscar) {
		var proveedor = ko.utils.arrayFirst(self.proveedores(), function(proveedor) {
			return proveedorABuscar.id() === proveedor.id();
		});
		if (proveedor !== undefined) {
			self.proveedor(proveedor);
			ko.tasks.runEarly();
			$('.selectpicker').selectpicker('refresh');
		}
	};

	if (self.factura.id() === 0) {
		self.factura = {
			fecha			 : ko.observable(fecha.format("YYYY-MM-DD")),
			letra			 : ko.observable(''),
			numero			 : ko.observable(''),
			puntoDeVentaAfip : ko.observable(''),
			tipo			 : ko.observable(''),
			total			 : ko.observable(''),
			detalle			 : ko.observable(''),
			subtipo			 : ko.observable(''),
			proveedor		 : ko.observable(null)
		};
	} else {
		self.seleccionarProveedor(self.factura.clienteProveedor);
	}

	self.labelLetra = ko.computed(function() {
		let subtipo = self.factura.subtipo();
		let label	= "Letra";
		if (subtipo !== SUBTIPO_FACTURA_OTROS) {
			label += " *";
		}
		return label;
	});

	self.labelPuntoDeVenta = ko.computed(function() {
		let subtipo = self.factura.subtipo();
		let label	= "Punto de venta";
		if (subtipo !== SUBTIPO_FACTURA_OTROS) {
			label += " *";
		}
		return label;
	});

	self.labelNumero = ko.computed(function() {
		let subtipo = self.factura.subtipo();
		let label	= "Número";
		if (subtipo !== SUBTIPO_FACTURA_OTROS) {
			label += " *";
		}
		return label;
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Suscripciones">
	/**
	 * Subscriber de los checkbox de subtipo de factura 'Factura' u 'Otros'
	 *
	 * Dependiendo si selecciona Factura o no le asigna la letra a la compra
	 * siempre y cuando tenga un proveedor para verificar que letra hay que
	 * asignarle
	 *
	 */
	self.factura.subtipo.subscribe(function(subtipo) {
		if (subtipo === SUBTIPO_FACTURA_OTROS) {
			self.factura.letra("");
		} else {
			self.setLetraFactura();
		}
		if (subtipo === SUBTIPO_NOTA_CREDITO) {
			self.factura.tipo(TIPO_NOTA_CREDITO_COMPRA);
		} else {
			self.factura.tipo(TIPO_FACTURA_COMPRA);
		}
	});

	self.factura.letra.subscribe(function(letra) {
		if (!letra) {
			return;
		}
		let mayuscula = letra.toUpperCase();
		self.factura.letra(mayuscula);
	});

	self.proveedor.subscribe(function(proveedor) {
		if (!proveedor) {
			return;
		}
		self.setLetraFactura(proveedor);
	});

	self.factura.puntoDeVentaAfip.subscribe(function(puntoDeVenta) {
		let salida = puntoDeVenta;
		let longitud = puntoDeVenta.toString().length;
		if (longitud > 4) {
			salida = puntoDeVenta.substr(0, 4);
			self.factura.puntoDeVentaAfip(salida);
		}
	});

	self.factura.numero.subscribe(function(numero) {
		let salida = numero;
		let longitud = numero.toString().length;
		if (longitud > 8) {
			salida = numero.substr(0, 8);
			self.factura.numero(salida);
		}
	});

	self.focusPuntoDeVenta.subscribe(function(foco) {
		if (!foco) {
			let puntoDeVentaAfip = self.factura.puntoDeVentaAfip();
			if (puntoDeVentaAfip === '' || parseInt(puntoDeVentaAfip) < 0) {
				return;
			}
			let	nuevo = self.llenarConCeros(puntoDeVentaAfip, 4);
			self.factura.puntoDeVentaAfip(nuevo);
		}
	});

	self.focusNumero.subscribe(function(foco) {
		if (!foco) {
			let numero = self.factura.numero();
			if (numero === '' || parseInt(numero) < 0) {
				return;
			}
			let	nuevo  = self.llenarConCeros(numero, 8);
			self.factura.numero(nuevo);
		}
	});
	//</editor-fold>

	self.llenarConCeros = function(numero, ceros) {
		let numeroSinCeros = numero.replace(/^0+/, '');
		let cantidad	   = numeroSinCeros.toString().length;
		if (cantidad === ceros) {
			return numeroSinCeros;
		}
		let formateado = numeroSinCeros.padStart(ceros, '0');
		return formateado;
	};

	//<editor-fold defaultstate="collapsed" desc="Pago">

	self.confirmarPago = function() {
		let valido = self.validarPago();
		if (!valido) {
			return;
		}
		var opciones = {
			title: `¿Confirmar que desea realizar el ${self.concepto}?`,
			onConfirmCallback: function() { self.guardarPago(); }
		};
		let factura				= self.factura;
		let total				= parseFloat(factura.total());
		let saldoPuntoDeVenta   = self.getSaldoPuntoDeVenta();
		let diferencia			= saldoPuntoDeVenta - total;

		if (diferencia < 0 && self.puntoDeVenta !== undefined) {
			opciones.background         = '#f8d7da';
			opciones.confirmButtonColor = '#f44336';
			opciones.html               = "<p style=\"color:red;\">Está intentando guardar un pago mayor al saldo actual disponible. ¿Desea continuar?</p>";
		}

		Alerta(opciones);
	};

	/**
	 * Devuelve el saldo del punto de venta, en caso de no haber un punto de
	 * venta devuelve cero
	 *
	 * @returns {Number}
	 */
	self.getSaldoPuntoDeVenta = function() {
		let puntoDeVenta = self.puntoDeVenta;
		if (puntoDeVenta === undefined) {
			return 0;
		}
		let saldo = puntoDeVenta.saldo !== undefined ? puntoDeVenta.saldo() : 0;
		return saldo;
	};

	self.validarPago = function() {
		let factura			 = self.factura;
		let fecha			 = moment(factura.fecha());
		let letra			 = factura.letra();
		let total			 = parseFloat(factura.total());
		let valido			 = true;
		let numero			 = factura.numero();
		let subtipo			 = factura.subtipo();
		let detalle			 = factura.detalle();
		let proveedor		 = self.proveedor();
		let puntoDeVentaAfip = factura.puntoDeVentaAfip();
		if (!fecha.isValid()) {
			Notificacion("La fecha es inválida", "error");
			valido = false;
		}
		if(!proveedor || isNaN(proveedor.id())) {
			Notificacion("Debe seleccionar un proveedor", "error");
			valido = false;
		}
		if (subtipo === "") {
			Notificacion(`Debe elegir el tipo de ${self.concepto}`, "error");
			valido = false;
		}
		if (subtipo !== SUBTIPO_FACTURA_OTROS) {
			let numeroValido = self.validarNumeroFactura(letra, numero, puntoDeVentaAfip);
			if (!numeroValido) {
				valido = false;
			}
		}
		if (detalle === '') {
			Notificacion(`Debe indicar un detalle del ${self.concepto}`, "error");
			valido = false;
		}
		if (isNaN(total) || parseFloat(total) <= 0) {
			Notificacion("El total no puede estar vacío y debe ser mayor a cero", "error");
			valido = false;
		}
		return valido;
	};

	/**
	 * Valida que la letra, el número y el punto de venta tengan valores válidos
	 *
	 * @param {string} letra
	 * @param {int} numero
	 * @param {int} puntoDeVentaAfip
	 * @returns {Boolean}
	 */
	self.validarNumeroFactura = function(letra, numero, puntoDeVentaAfip) {
		let valido = true;
		let letraMayuscula = letra.toUpperCase();
		if (letra === '' || (letraMayuscula !== 'B' && letraMayuscula !== 'C')) {
			Notificacion(`La letra del ${self.concepto} debe ser B o C`, "error");
			valido = false;
		}
		if (isNaN(puntoDeVentaAfip) || puntoDeVentaAfip === '') {
			Notificacion(`El punto de venta del ${self.concepto} es requerido`, "error");
			valido = false;
		}
		let afip = parseInt(puntoDeVentaAfip);
		if (!isNaN(puntoDeVentaAfip) && afip <= 0) {
			Notificacion(ERROR_COMPROBANTE_PUNTO_DE_VENTA_AFIP, "error");
			valido = false;
		}
		if (isNaN(numero) || numero === '') {
			Notificacion(`El número del ${self.concepto} es requerido`, "error");
			valido = false;
		}
		let numeroInt = parseInt(numero);
		if (!isNaN(numero) && numeroInt <= 0) {
			Notificacion(ERROR_COMPROBANTE_NUMERO, "error");
			valido = false;
		}
		return valido;
	};

	self.guardarPago = function() {
		var url = self.urls.guardar();
		if(self.factura.tipo() === TIPO_NOTA_CREDITO_COMPRA) {
			url = self.urls.guardarNC();
		}

		var puntoDeVenta = self.puntoDeVenta;

		self.factura.clienteProveedor = self.proveedor();
		var data	= {
			puntoDeVenta : puntoDeVenta !== undefined ? puntoDeVenta.id() : null,
			factura		 : self.factura
		};
		data = {json: ko.mapping.toJSON(data)};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						Notificacion(`El ${self.concepto} se ha guardado con éxito`, 'success');
						window.location.href = self.volverA();
						return;
					}
					let mensaje = "";
					if (Array.isArray(data.errores)) {
						mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" :"";
						mensaje += data.errores.join("<br/>");
					} else if (typeof data.error !== "undefined") {
						mensaje = "Ha ocurrido el siguiente error: " + data.error;
					}
					if (mensaje !== "") {
						return Notificacion(mensaje, 'error');
					}
					Notificacion('Ha ocurrido un error', 'error');
				} else {
					Notificacion('Ha ocurrido un error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	//</editor-fold>

	//</editor-fold>

	self.comprobanteOperacionClick = function(operacion) {
		switch (operacion.accion()) {
			case "iframe":
				return self.iframe(operacion);
			case "anular":
				return self.modalAnular(operacion);
			case "url":
				window.location.href = operacion.url();
			default:
				if (typeof operacion.url === "string" && operacion.url.length > 0 && operacion.url !== "#") {
					//Dejamos el comportamiento por defecto del botón
					return true;
				}
				return;
		}
	};

	self.iframe = function(operacion) {
		if (!operacion.urlIframe()) {
			return;
		}
		return verTicket(operacion.urlIframe(), operacion.urlEnviar());
	};

	self.modalAnular = function(operacion) {
		swal({
			title: `¿Está seguro que desea anular el ${self.concepto}?`,
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#F44336',
			cancelButtonColor: '#BFBFBF',
			showLoaderOnConfirm: false,
			preConfirm: function() {
				self.anularPagoProveedor(operacion.url());
			}
		});
	};

	self.anularPagoProveedor = function(url) {
		var opciones = self.getAjaxOpciones({
			url		: url,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.success) {
						Notificacion(`El ${self.concepto} se ha anulado con éxito`, 'success');
						if (data.mensajes) {
							data.mensajes.forEach(mensaje => {
								Notificacion(mensaje, 'info');
							});
						}
						window.location.reload();
						return;
					}
					if (data.error) {
						return Notificacion(data.error, 'error');
					}
					Notificacion('Ha ocurrido un error', 'error');
				} else {
					Notificacion('Ha ocurrido un error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Alta rápida proveedor">
	self.$modalProveedores = $('#modal-proveedores-alta');

	self.proveedorAbrirModalNuevo = function() {
		self.$modalProveedores.modal('show');
	};

	self.proveedorNuevo = function(formulario) {
		var $formulario = $(formulario);
		var url			= self.urls.nuevoProveedor();
		var data		= $formulario.formSerialize();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			async	: false,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.exito === 'undefined' || typeof data.cliente === 'undefined' || !data.exito) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				var proveedor = ko.mapping.fromJS(data.cliente, opcionesPantalla);
				self.proveedores.push(proveedor);
				self.seleccionarProveedor(proveedor);
				Notificacion('Proveedor creado éxitosamente.', 'success');
				self.$modalProveedores.modal('hide');
				formulario.reset();
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
	var $seccion = $('#pago-proveedor');
	ko.options.deferUpdates = true;
	koPagoProveedor		= new koPantalla(jsonAltaPagoProveedor, opcionesPantalla);
	ko.applyBindings(koPagoProveedor, $seccion.get(0));
	koPagoProveedor.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});
