/* global ko, opcionesPantalla, Intl, TIPO_CARGA_CREDITO, json, MEDIO_PAGO_MULTIPLES */

var koCrearNotaCredito = null;

//<editor-fold defaultstate="collapsed" desc="Extensiones">
var formateadorMoneda = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'ARS'
});
var formateadorNumero = new Intl.NumberFormat(undefined, {
  style: 'decimal'
});

var formatear = function(valor, formateador) {
  var salida = formateador.format(valor);
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
    var tipo = typeof valor;
    if ((tipo !== 'number' && isNaN(valor))
        || valor === null
    ) {
      $(element).html('');
        return;
      }
      var final = formatear(valor, formateadorMoneda);
      $(element).html(final);
  }
};


ko.bindingHandlers.numero = {
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    var valor = ko.utils.unwrapObservable(valueAccessor());
    var tipo = typeof valor;
    if ((tipo !== 'number' && isNaN(valor))
        || valor === null
    ) {
      $(element).html('');
        return;
      }
      var final = formatear(valor, formateadorNumero);
      $(element).html(final);
  }
};


//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	var factura			  = ko.mapping.fromJS(json.factura, opciones.notaCredito);
	self.notaCredito	  = ko.observable(factura);
	self.totalReembolsado = ko.observable(0);

	/**
	 * Devuelve el saldo del comensal luego de anular la línea que tiene la
	 * carga de crédito.
	 *
	 * @returns {float}
	 */
	self.getSaldoAnulacionCarga = function() {
		var comensal = self.comensal;
		if (comensal === null) {
			return 0;
		}

		var total		= 0;
		var notaCredito = self.notaCredito();
		var lineas		= notaCredito.lineas();
		for (var i = 0; i < lineas.length; i++) {
			var linea = lineas[i];
			var tipo  = linea.tipo();
			if (tipo === TIPO_CARGA_CREDITO) {
				total = linea.total();
				break;
			}
		}

		var saldo	   = comensal.saldoFloat();
		var diferencia = saldo - total;
		return diferencia;
	};

	if (self.comensal === undefined) {
		self.comensal = null;
	} else {
		self.comensal.saldoAnulacionCarga = self.getSaldoAnulacionCarga();
	}

	self.reembolsarCargaCredito = ko.observable(false);

	/**
	 * Devuelve true si al anular la carga de crédito el saldo de comensal va
	 * quedar negativo.
	 *
	 * @returns {bool}
	 */
	self.comprobarAlertarSaldoNegativo = ko.computed(function() {
		var comensal = self.comensal;
		if (comensal === null) {
			return 0;
		}

		var total		= 0;
		var notaCredito = self.notaCredito();
		var lineas		= notaCredito.lineas();
		for (var i = 0; i < lineas.length; i++) {
			var linea	   = lineas[i];
			var tipo	   = linea.tipo();
			var reembolsar = linea.cantidadAReembolsar();
			if (tipo === TIPO_CARGA_CREDITO && reembolsar !== "" && reembolsar > 0) {
				total = linea.total();
				self.reembolsarCargaCredito(true);
			}
		}

		var saldo	   = comensal.saldoFloat();
		var diferencia = saldo - total;
		return diferencia < 0.00;
	});

	/**
	 * Actualiza el saldo del comensal.
	 *
	 * @returns {void}
	 */
	self.actualizarSaldoComensal = function() {
		var comensal = self.comensal;
		if (comensal !== null) {
			comensal.actualizarSaldo();
		}
	};

	self.nombreCliente = ko.computed(function() {
		var factura = self.factura;
		if (factura === null) {
			return "";
		}
		var cliente = self.factura.clienteProveedor;
		if (typeof cliente === "function" && cliente() === null) {
			return "";
		}
		return "de " + cliente.nombre();
	});

	self.comprobarLineaSeleccionada = ko.pureComputed(function() {
		var seleccionada = false;
		var lineas       = self.notaCredito().lineas();
		ko.utils.arrayForEach(lineas, function(linea) {
			if (linea.cantidadAReembolsar() > 0) {
				//No hacemos el corte porque necesitamos que genere la
				//dependencia con todas las cantidades a reembolsar.
				seleccionada = true;
			}
		});

		return seleccionada;
	});

	self.comprobarReembolsarHabilitado = ko.pureComputed(function() {
		var ajax              = self.ajax();
		var lineaSeleccionada = self.comprobarLineaSeleccionada();

		return !ajax && lineaSeleccionada;
	});

    self.comprobarMedioDePagoMultiples = self.factura.medioDePago() === MEDIO_PAGO_MULTIPLES;

	self.notasCreditoTabla = ko.computed(function() {
		var notasCreditoTabla = ko.observableArray([]);
		var totalReembolsado = 0.00;
		ko.utils.arrayForEach(self.notasCredito(), function(notaCredito) {
			ko.utils.arrayForEach(notaCredito.lineas(), function(linea) {
				var fila = {};
				fila.id = parseInt((Math.random() * 10000), 10);
				fila.fecha = notaCredito.fecha.fechaCorta();
				fila.nombre = notaCredito.nombre();
				fila.codigo = linea.codigo();
				if (fila.codigo === "") {
					fila.codigo = linea.descripcion();
				}
				fila.cantidad = linea.cantidad();
				fila.precio = linea.precio();
				fila.total = linea.total();
				totalReembolsado += parseFloat(fila.total);
				notasCreditoTabla.push(fila);
			});
		});
		self.totalReembolsado(totalReembolsado);
		return notasCreditoTabla();
	});

	//<editor-fold defaultstate="collapsed" desc="Crear Nota de Crédito">

	/**
	 * Modal de confirmación para la creación de la nota de crédito
	 *
	 * @returns {Boolean}
	 */
	self.crearNotaCreditoModal = function() {
		var valida = self.comprobarNotaCreditoValida();
		if (!valida) {
			return false;
		}
		var total   = parseFloat(self.notaCredito().totalReembolso());

		var texto				= '';
		var comensal			= self.comensal;
		var reembolsarCarga		= self.reembolsarCargaCredito();
		var alertar				= self.comprobarAlertarSaldoNegativo();
		var background			= '#FFFFFF';
		var colorBotonConfirmar = '#58db83';
		if (alertar && comensal !== null) {
			texto				= comensal.getTextoAlerta();
			background			= '#f8d7da';
			colorBotonConfirmar = '#f44336';
		}
		Alerta({
			title: 'Confirmar reembolso de $' + total.toFixed(2),
			text: texto,
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			showLoaderOnConfirm: false,
			background: background,
			confirmButtonColor: colorBotonConfirmar,
			preConfirm: function() {
				self.crearNotaCredito(reembolsarCarga);
			}
		});
	};

	/**
	 * Realiza la petición para crear la nota de crédito
	 *
	 *	@param {bool} actualizarSaldo true si debe actualizar el saldo del
	 *								  comensal
	 *  @returns {bool}
	 */
	self.crearNotaCredito = function(actualizarSaldo) {
		var url = self.urls.guardarNotaCredito();
		var data = self.normalizarNotaCredito();

		var opciones = self.getAjaxOpciones({
			url: url,
			data: {json: ko.mapping.toJSON(data)},
			success: function (data, textStatus, jqXHR) {
				if (data.success) {
					if (actualizarSaldo) {
						self.actualizarSaldoComensal();
					}

					var notasCredito = ko.mapping.fromJS(data.datos.notasCredito, opcionesPantalla.notasCredito);
					var notaCredito = ko.mapping.fromJS(data.datos.factura, opcionesPantalla.notaCredito);
					self.notasCredito(notasCredito());
					self.notaCredito(notaCredito);
					Notificacion('Se ha creado la nota de crédito con éxito', 'success');
					self.reembolsada(data.reembolsada);
					return;
				}
				if (data.error && data.error.length > 0) {
					ko.utils.arrayForEach(data.error, function (error) {
						Notificacion(error, 'error');
					});
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

	/**
	 * Valida que la nota de crédito sea válida, verificando para cada linea que
	 * la cantidad de items a reembolsar sea menor o igual a la inicial
	 *
	 * @returns {Boolean}
	 */
	self.comprobarNotaCreditoValida = function() {
		var bandera	= true;
		var total   = 0;

		var comprobarHayNotasCredito = self.notasCredito().length > 0;
		ko.utils.arrayForEach(self.notaCredito().lineas(), function (linea) {
			var cantidadInicial     = parseFloat(linea.cantidadInicial());
			var cantidadRestante    = parseFloat(linea.cantidadRestante());
			var cantidadAReembolsar = parseFloat(linea.cantidadAReembolsar());
			var lineaSeleccionada   = cantidadAReembolsar > 0;
			var descripcion         = linea.descripcion();
			var reembolsoTotal      = linea.reembolsoTotal();

			if (comprobarHayNotasCredito && lineaSeleccionada && cantidadRestante === 0) {
				bandera     = false;
				Notificacion("El item '" + descripcion + "' ya fue reembolsado.", "error");
			}

			if (comprobarHayNotasCredito
				&& lineaSeleccionada
				&& cantidadRestante > 0
				&& cantidadAReembolsar > cantidadRestante
			) {
				bandera = false;
				Notificacion("La cantidad a reembolsar del item '" + descripcion + "' no puede ser mayor que la cantidad restante.", "error");
			}

			if (reembolsoTotal
				&& cantidadAReembolsar > 0
				&& cantidadAReembolsar !== cantidadRestante
			) {
				bandera = false;
				Notificacion("La cantidad a reembolsar del item '" + descripcion + "' debe ser igual a la cantidad restante, no puede hacerse un reembolso parcial.", "error");
			}

			total += cantidadAReembolsar * linea.precio();
			if (lineaSeleccionada && cantidadAReembolsar > cantidadInicial) {
				bandera = false;
				Notificacion("La cantidad a reembolsar de cada item '" + descripcion + "' no puede ser mayor que la cantidad inicial.", "error");
			}
			if (lineaSeleccionada && (isNaN(cantidadAReembolsar) || cantidadAReembolsar <= 0)) {
				bandera = false;
				Notificacion("La cantidad a reembolsar del item '" + descripcion + "' no puede ser cero.", "error");
			}
		});
		return bandera;
	};

	/**
	 * Normaliza una nota de crédito antes de guardarla, quitando los items
	 * (líneas) que no serán devueltos.
	 *
	 * @returns {object}
	 */
	self.normalizarNotaCredito = function() {
		var difiereCantidad = false;
		var datos = {
			factura: self.factura.id(),
			lineas: ko.observableArray([]),
			cantidades: ko.observableArray([])
		};

		ko.utils.arrayForEach(self.notaCredito().lineas(), function(linea) {
			if (linea.cantidadAReembolsar() > 0) {
				var idLinea				 = parseInt(linea.id());
				var cantidadLinea		 = parseFloat(linea.cantidadAReembolsar());
				var cantidadInicialLinea = parseFloat(linea.cantidadInicial());
				datos.lineas.push(idLinea);
				datos.cantidades.push(cantidadLinea);
				if (cantidadLinea !== cantidadInicialLinea) {
					difiereCantidad = true;
				}
			}
		});
		if (!difiereCantidad) {
			datos.cantidades([]);
		}
		return datos;
	};

	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax = ko.observable(false);
	self.ajaxOpciones = {
		method: 'POST',
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
	var $seccion = $('#nota-credito');
	ko.options.deferUpdates = true;
	koCrearNotaCredito = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koCrearNotaCredito, $seccion.get(0));
	koCrearNotaCredito.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});

