/* global ko, moment */

var opciones = {
	'comprobantes' : {
		key: function(data) {
			var clave = ko.utils.unwrapObservable(data.tipo) + '-' + ko.utils.unwrapObservable(data.id);
			return clave;
		},
		create : function(options) {
			var id = options.data.tipo + "-" + options.data.id;
			options.data.id = id;
			var objeto = new koComprobante(options.data, opciones);
			return objeto;
		}
	}
};

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

ko.bindingHandlers.formato = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var opciones = ko.utils.unwrapObservable(valueAccessor());
		var valor	 = ko.unwrap(opciones.valor);
		var formato	 = ko.unwrap(opciones.formato);
		var final	 = Inputmask.format(valor, formato);
		$(element).html(final);
	}
};

ko.bindingHandlers.porcentaje = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var valor = ko.utils.unwrapObservable(valueAccessor());
		$(element).html(valor + ' %');
	}
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
			contentCloning: true,
			contentAsHTML: true
		});
    }
};

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
	var self		 = this;
	var hoy			 = moment().endOf('day');
	var haceTresDias = moment().startOf('hour').subtract(3, 'days');

	self.paginacion	   = ko.observable(true);
	self.tituloListado = ko.observable('Listado');

	let comprobantes		   = self.comprobantes();
	self.comprobantesFiltrados = ko.observableArray(comprobantes);

	//<editor-fold defaultstate="collapsed" desc="Filtros">
	self.condiciones = ko.pureComputed(function() {
		return [
			{
				nombre: 'Todos',
				valor: ''
			},
			{
				nombre: 'Contado',
				valor: CONDICION_CONTADO
			},
			{
				nombre: 'Cuenta corriente',
				valor: CONDICION_CUENTA_CORRIENTE
			}
		];
	});

	if (self.historico()) {
		var fechaDesde = self.filtros.fechaDesde.fechaMysql();
		var fechaHasta = self.filtros.fechaHasta.fechaMysql();

		self.filtros.desde = ko.observable(fechaDesde);
		self.filtros.hasta = ko.observable(fechaHasta);
	}

	self.comprobarFiltroAplicado = ko.computed(function() {
		var filtros		   = self.filtros;
		var fechaHoy	   = hoy.format('YYYY-MM-DD');
		var fechaHace3Dias = haceTresDias.format('YYYY-MM-DD');
		if (
				filtros.tipo() !== ''
				|| ( self.historico() && filtros.desde() !== fechaHace3Dias )
				|| ( self.historico() && filtros.hasta() !== fechaHoy )
				|| filtros.numero() !== ''
				|| filtros.cliente() !== ''
				|| filtros.condicion() !== ''
				|| ( self.historico() && filtros.vendedor() !== '' )
				|| filtros.medioDePago() !== ''
				|| ( self.historico() && filtros.puntoDeVenta() !== '' )
				|| filtros.comensal() !== ''
				) {
			return true;
		}
		return false;
	});

	self.removerFiltros = function() {
		self.filtros.tipo('');
		self.filtros.numero('');
		self.filtros.cliente('');
		self.filtros.comensal('');
		self.filtros.condicion('');
		self.filtros.medioDePago('');

		var comprobantes = self.comprobantes();
		self.comprobantesFiltrados(comprobantes);
		if (self.historico()) {
			let fechaHoy	   = hoy.format('YYYY-MM-DD');
			let fechaHace3Dias = haceTresDias.format('YYYY-MM-DD');
			self.filtros.vendedor('');
			self.filtros.puntoDeVenta('');
			self.filtros.desde(haceTresDias.format('YYYY-MM-DD'));
			self.filtros.hasta(hoy.format('YYYY-MM-DD'));
			if (self.filtros.fechaDesde.fechaMysql() !== fechaHace3Dias || self.filtros.fechaHasta.fechaMysql() !== fechaHoy) {
				self.buscarComprobantes();
			}
		}
		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
		self.filtrarComprobantes(false);
	};
	//</editor-fold>

	if (self.historico()) {
		self.comprobarFechasValidas = function(fechaDesde, fechaHasta) {
			return fechaDesde.isValid() && fechaHasta.isValid();
		};

		self.validarFechas = function(notificar) {
			let fechaDesde  = moment(self.filtros.desde());
			let fechaHasta  = moment(self.filtros.hasta());
			if (self.comprobarFechasValidas(fechaDesde, fechaHasta)) {
				if (fechaDesde.isAfter(fechaHasta)) {
					if (notificar) {
						Notificacion("La fecha desde no puede ser mayor que la fecha hasta", "error");
					}
					return false;
				}
			}
			if (!self.comprobarFechasValidas(fechaDesde, fechaHasta)) {
				return false;
			}
			return true;
		};

		self.comprobarPaginacionPasada = ko.computed(function() {
			return self.validarFechas(false);
		});

		self.comprobarPaginacionFutura = ko.computed(function() {
			let hoy			= moment();
			let fechaHasta  = moment(self.filtros.hasta());
			return self.validarFechas(false) && fechaHasta.isBefore(hoy, 'day');
		});

		self.buscarConPaginacion = function(futuro) {
			let periodo	   = 0;
			var fechaDesde = moment(self.filtros.desde());
			var fechaHasta = moment(self.filtros.hasta());
			if (!futuro) {
				periodo = self.periodoAnterior();
				fechaDesde.subtract(periodo, 'days');
				fechaHasta.subtract(periodo, 'days');
			}
			if (futuro) {
				periodo = self.periodoPosterior();
				fechaDesde.add(periodo, 'days');
				fechaHasta.add(periodo, 'days');
			}
			self.filtros.desde(fechaDesde.format('YYYY-MM-DD'));
			self.filtros.hasta(fechaHasta.format('YYYY-MM-DD'));
			self.buscarComprobantes();
		};
	}

	self.buscarComprobantes = function() {
		if (!self.validarFechas(true)) {
			return false;
		}

		self.comprobantes([]);
		self.comprobantesFiltrados([]);
		let fechaDesde  = moment(self.filtros.desde());
		let fechaHasta  = moment(self.filtros.hasta());
		var url		= self.urls.buscarComprobantes();
		var data	= {
			desde: fechaDesde.isValid() ? fechaDesde.format('YYYY-MM-DD') : self.filtros.fechaDesde.fechaMysql(),
			hasta: fechaHasta.isValid() ? fechaHasta.format('YYYY-MM-DD') : self.filtros.fechaHasta.fechaMysql()
		};
		var opcionesAjax	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data.success === false) {
					Notificacion(data.error, 'error');
					return false;
				}
				var comprobantes = ko.mapping.fromJS(data.comprobantes, opciones.comprobantes);
				self.comprobantes(comprobantes());

				//Se utiliza para verificar que no haya que volver a buscar las mismas fechas
				self.filtros.fechaDesde.fechaMysql(fechaDesde.format('YYYY-MM-DD'));
				self.filtros.fechaHasta.fechaMysql(fechaHasta.format('YYYY-MM-DD'));

				self.textoPaginacionAnterior(data.textoPaginacionAnterior);
				self.textoPaginacionPosterior(data.textoPaginacionPosterior);
				self.periodoAnterior(data.periodoAnterior);
				self.periodoPosterior(data.periodoPosterior);

				self.filtrarComprobantes(false);
				return true;
			}
		});
		$.ajax(opcionesAjax);
	};

	self.puntoDeVenta = json.puntoDeVenta;

	self.comprobarHayClientes = ko.pureComputed(function() {
		return self.clientes().length > 0;
	});

	self.opcionesCliente = ko.pureComputed(function () {
		if (!self.comprobarHayClientes()) {
			return {
				nombre: 'Sin clientes',
				valor: ''
			};
		}
		return self.clientes();
	});

	self.filtrarComprobantes = function(buscar) {
		var historico   = self.historico();
		var cambioFecha = historico && (self.filtros.desde() !== self.filtros.fechaDesde.fechaMysql() || self.filtros.hasta() !== self.filtros.fechaHasta.fechaMysql());
		if (buscar && cambioFecha) {
			return self.buscarComprobantes();
		}

		var tipo		 = self.filtros.tipo();
		var numero		 = self.filtros.numero();
		var cliente		 = self.filtros.cliente();
		var comensal	 = self.filtros.comensal();
		var vendedor	 = "";
		var condicion	 = self.filtros.condicion();
		var medioDePago	 = self.filtros.medioDePago();
		var puntoDeVenta = "";

		if (historico) {
			vendedor = self.filtros.vendedor();
			puntoDeVenta = self.filtros.puntoDeVenta();
		}

		var salida		 = new Array();
		var comprobantes = self.comprobantes();

		for (var i = 0; i < comprobantes.length; i++) {
			var mostrar		   = true;
			var comprobante    = comprobantes[i];
			var comprobanteCae = comprobante.cae;

			if (numero !== "" && comprobante.nombre.indexOf(numero) === -1) {
				mostrar = false;
			}
			switch (tipo) {
				case TIPO_FACTURA:
					if (comprobante.tipo !== TIPO_FACTURA || (comprobante.tipo === TIPO_FACTURA && comprobanteCae.length === 0 ) ) {
						mostrar = false;
					}
					break;

				case TIPO_FACTURA + "-x":
					if (comprobante.tipo !== TIPO_FACTURA || (comprobante.tipo === TIPO_FACTURA && comprobanteCae.length > 0 ) ) {
						mostrar = false;
					}
					break;

				case TIPO_NOTA_CREDITO:
					if (comprobante.tipo !== TIPO_NOTA_CREDITO) {
						mostrar = false;
					}
					break;

				case TIPO_INTERNO:
					if (comprobante.tipo !== TIPO_INTERNO) {
						mostrar = false;
					}
					break;
				default:
					break;
			}
			if (cliente !== ""
				&& (comprobante.comensal === null || comprobante.comensal.id !== cliente)
				&& (comprobante.clienteProveedor === null || comprobante.clienteProveedor.id !== cliente)
			) {
				mostrar = false;
			}

			if (medioDePago !== "" && comprobante.medioDePago !== medioDePago) {
				mostrar = false;
			}

			if (condicion !== "" && comprobante.condicion !== condicion) {
				mostrar = false;
			}

			if (puntoDeVenta !== "" && (comprobante.puntoDeVenta === null || comprobante.puntoDeVenta.id !== puntoDeVenta)) {
				mostrar = false;
			}

			if (vendedor !== "" && (comprobante.auditoriaCreador === null || comprobante.auditoriaCreador.id !== vendedor)) {
				mostrar = false;
			}

			if (comensal !== "" && (
					comprobante.comensal === null ||
					(
						comprobante.comensal !== null &&
						(
							comprobante.comensal.id !== "0" ||
							typeof comprobante.comensal.dni === "undefined" ||
							(comprobante.comensal.id === "0" && comprobante.comensal.dni.indexOf(comensal) === -1)
						)
					)
				)
			) {
				mostrar = false;
			}

			if (mostrar) {
				salida.push(comprobante);
			}
		}

		self.comprobantesFiltrados(salida);
	};

	self.comprobarListadoVacio = ko.pureComputed(function() {
		var comprobantes = self.comprobantesFiltrados();
		return comprobantes.length === 0;
	});

	self.textoListadoVacio = ko.pureComputed(function() {
		var total = self.comprobantes.length;

		if (total === 0) {
			return "No se han encontrado comprobantes para el criterio de búsqueda ingresado";
		}
		return 'No se han encontrado comprobantes que coincidan con los criterios de búsqueda y/o filtrado.';
	});

	self.comprobanteOperacionClick = function(operacion) {
		switch (operacion.accion) {
			case "iframe":
				return self.iframe(operacion);

			case "anular":
				return self.modalAnular(operacion);

			default:
				if (typeof operacion.url === "string" && operacion.url.length > 0 && operacion.url !== "#") {
					//Dejamos el comportamiento por defecto del botón
					return true;
				}
				return;
		}
	};

	self.iframe = function(operacion) {
		if (!operacion.urlIframe) {
			return;
		}
		return verTicket(operacion.urlIframe, operacion.urlEnviar);
	};

	self.modalAnular = function(operacion) {
		Alerta({
			title: '¿Está seguro que desea anular el comprobante?',
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#F44336',
			cancelButtonColor: '#BFBFBF',
			showLoaderOnConfirm: false,
			preConfirm: function() {
				window.location.href = operacion.url;
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

function koComprobante(js, opciones) {
	var self = this;
	self.mapeado = function(js) {
		for (clave in js) {
			self[clave] = js[clave];
		}
	};
	self.mapeado(js);

	if (typeof self.comensal === "undefined") {
		self.comensal = null;
	}

	if (typeof self.clienteProveedor === "undefined") {
		self.clienteProveedor = null;
	}

	if (typeof self.condicion === "undefined") {
		self.condicion = "";
	}

	if (typeof self.operaciones === "undefined") {
		self.operaciones = [];
	}

	if (typeof self.puntoDeVenta === "object" && self.puntoDeVenta === null) {
		self.puntoDeVenta = {};
		self.puntoDeVenta.id = "";
		self.puntoDeVenta.nombre = "";
	}

	self.condicionTexto = "";
	switch (self.condicion) {
		case CONDICION_CONTADO:
			self.condicionTexto = "Contado";
			break;

		case CONDICION_CUENTA_CORRIENTE:
			self.condicionTexto = "Cuenta corriente";
			break;
	}

	if (self.anulado) {
		self.estadoHtml = 'Anulado';
	} else if (typeof self.cae !== "undefined") {
		self.estadoHtml = self.cae === "" ? '<span class="text-danger">Sin CAE</span>' : 'CAE ok';
	} else {
		self.cae = "";
	}
}

$(document).ready(function () {
	var $seccion = $('#comprobantes-turno');
	ko.options.deferUpdates = true;
	koComprobantesVenta = new koPantalla(json, opciones);
	ko.applyBindings(koComprobantesVenta, $seccion.get(0));
	koComprobantesVenta.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});