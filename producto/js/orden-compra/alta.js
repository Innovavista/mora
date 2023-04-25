/* global ko, Intl, moment, PASO_ARTICULOS, PASO_CONFIRMAR, PASO_COTIZACION, opcionesPantalla, MENSAJE_SIN_CORREO, json */

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

ko.bindingHandlers['tooltipster'] = {
	init: function (element, valueAccessor) {
		$(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay: 200,
			side: 'top',
			contentCloning: true
		});
	}
};

var formateadorMoneda = new Intl.NumberFormat(undefined, {
	style: 'currency',
	currency: 'ARS'
});

var formatearMoneda = function(valor) {
	var salida = formateadorMoneda.format(valor);
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
	$(element).html(final);
  }
};

var formateadorNumero = new Intl.NumberFormat(undefined, {
	style: 'decimal'
});

var formatearNumero = function(valor) {
	var salida = formateadorNumero.format(valor);
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
	var final = formatearNumero(valor);
	$(element).html(final);
  }
};
//</editor-fold>

function koPantalla(js, opciones) {
	var self = this;
	ko.mapping.fromJS(js, opciones, this);

	self.hoy  = moment().format('YYYY-MM-DD');
	self.ajax = ko.observable(false);

	self.colspanPresentacion   = self.adicional.visible ? 3 : 2;
	self.colspanNuevaLogistica = self.adicional.visible ? 7 : 6;

	var paso				  = self.orden.paso;
	self.deshabilitarTabs	  = ko.observable(true);
	self.mostrarTabArticulos  = paso === PASO_ARTICULOS;
	self.mostrarTabConfirmar  = paso === PASO_CONFIRMAR;
	self.mostrarTabCotizacion = paso === PASO_COTIZACION;

	self.mostrarGuardarBorrador  = !self.mostrarTabCotizacion;
	self.mostrarGuardarSiguiente = !self.mostrarTabConfirmar;

	self.deshabilitarCampos = ko.pureComputed(function() {
		var ajax	   = self.ajax();
		var visualizar = self.visualizar;
		return ajax || visualizar;
	});

	self.cambiarTab = function() {
		var deshabilitar = self.deshabilitarTabs();
		if (deshabilitar) {
			return;
		}
		//Actualmente no se permite cambiar de pestañas.
	};

	//<editor-fold defaultstate="collapsed" desc="Botones">
	self.titleListar		  = "Volver al listado de órdenes de compra";
	self.titleGuardarBorrador = "Guardar la orden de compra para continuar después";

	self.textoBotonSeguir = self.mostrarTabConfirmar ? "Guardar y cerrar" : "Siguiente >";

	/**
	 * Devuelve el título que se muestra en el tooltipster del botón de color
	 * verde. El texto interno del botón puede ser "Seguir" o "Guardar y cerrar".
	 *
	 * @returns {String}
	 */
	self.getTextoTitleBotonSeguir = function() {
		var paso = self.orden.paso;
		switch (paso) {
			case PASO_COTIZACION:
				return "Guardar y continuar a la selección de artículos.";

			case PASO_ARTICULOS:
				return "Guardar y continuar a la confirmación de la orden de compra.";

			case PASO_CONFIRMAR:
				return "Guardar y cerrar la orden de compra.";
		}
	};

	self.titleSeguir = self.getTextoTitleBotonSeguir();
	//</editor-fold>

	/**
	 * Realiza el guardado del paso actual y continúa al paso siguiente.
	 *
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos
	 *						al listado
     * @param {bool} cerrar
	 * @returns {void}
	 */
	self.guardarSeguir = function(seguir = true, cerrar = true) {
		var paso = self.orden.paso;
		switch (paso) {
			case PASO_COTIZACION:
				self.guardarNuevaOrden(seguir);
				break;

			case PASO_ARTICULOS:
				self.guardarLineasOrden(seguir);
				break;

			case PASO_CONFIRMAR:
				self.guardarConfirmarModal(cerrar);
				break;
		}
	};

	/**
	 * Si 'seguir' es true redirige la página al siguiente paso, sino muestra
	 * mensaje de éxito y redirige al listado.
	 *
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos
	 *						al listado
	 * @param {string} urlEdicion
	 * @returns {void}
	 */
	self.redirigirExito = function(seguir, urlEdicion) {
		if (!seguir) {
			Notificacion("La orden de compra se ha guardado con éxito", "success");
		} else {
			Notificacion("Redirigiendo al siguiente paso ...", "info");
		}
		var listar = self.urls.listar;
		var ruta   = seguir ? urlEdicion : listar;
		window.location.href = ruta;
	};

	//<editor-fold defaultstate="collapsed" desc="Paso 1 - Selección de cotización">
	/**
	 * Id de la cotización seleccionada.
	 */
	self.idCotizacion = ko.observable("");

	/**
	 * Selecciona la cotización de la tabla de cotizaciones, en caso que
	 * seleccione la misma cotización nuevamente la misma queda deseleccionada.
	 *
	 * Si el elemento seleccionado es un link o los campos están deshabilitados
	 * no se permite la selección de la cotización.
	 *
	 * @param {koCotizacion} cotizacion
	 * @param {jQuery.Event} evento
	 * @returns {Boolean}
	 */
	self.seleccionarCotizacion = function(cotizacion, evento) {
		var link		 = $(evento.target).closest("a");
		var esLink		 = link.length > 0;
		var esTipoRadio  = evento.target.type === "radio";
		var deshabilitar = self.deshabilitarCampos();
		if (esLink || esTipoRadio || deshabilitar) {
			return true;
		}

		var id		 = cotizacion.id;
		var anterior = self.idCotizacion();
		self.idCotizacion(id);
		if (id === anterior) {
			self.idCotizacion("");
		}
	};

	self.filtroProveedor		= ko.observable('');
	self.ajaxBuscarCotizaciones = ko.observable(false);
	self.deshabilitarFiltrado   = ko.pureComputed(function() {
		var ajax	 = self.ajax();
		var buscando = self.ajaxBuscarCotizaciones();
		return ajax || buscando;
	});

	/**
	 * Comprueba que la fecha desde del filtro de pedidos de cotización es
	 * válida.
	 *
	 * @param {bool} mostrar Indica si muestra los errores.
	 * @returns {bool}
	 */
	self.comprobarFechaFiltroValida = function(mostrar) {
		var fecha   = self.filtroFechaDesde();
		var errores = [];
		var momento = moment(fecha);

		var valida  = momento.isValid();
		if (!valida) {
			errores.push("La fecha es inválida");
		}

		var futura  = valida ? momento.isAfter(moment(), 'day') : false;
		if (futura) {
			errores.push("La fecha no puede ser futura");
		}

		if (mostrar) {
			errores.forEach(error => Notificacion(error, 'error'));
		}
		return errores.length === 0;
	};

	/**
	 * Busca los pedidos de cotización según la fecha del filtro.
	 *
	 * @returns {void}
	 */
	self.filtrarCotizaciones = function() {
		var fechaValida = self.comprobarFechaFiltroValida(true);
		if (!fechaValida) {
			return;
		}

		self.idCotizacion("");
		var url		 = self.urls.buscarCotizaciones;
		var data	 = {
			fecha	  : self.filtroFechaDesde(),
			proveedor : self.filtroProveedor()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined'
					|| typeof data.resultado.exito === 'undefined'
					|| typeof data.cotizaciones === 'undefined'
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al buscar los pedidos de cotización, vuelva a intentar.', 'error');
					return;
				}
				var cotizaciones = ko.mapping.fromJS(data.cotizaciones, opcionesPantalla.cotizaciones);
				self.cotizaciones(cotizaciones());
			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
				self.ajaxBuscarCotizaciones(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
				self.ajaxBuscarCotizaciones(false);
			}
		});
		$.ajax(opciones);
	};

	/**
	 * Guarda la orden de compra con los datos mínimos para continuar a la
	 * procesamiento de artículos.
	 *
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos
	 *				        al listado
	 * @returns {void}
	 */
	self.guardarNuevaOrden = function(seguir) {
		var url		= self.urls.guardarNueva;
		var data	= { cotizacion: self.idCotizacion() };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined'
					|| typeof data.resultado.exito === 'undefined'
					|| typeof data.edicion === 'undefined'
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al guardar la orden de compra, vuelva a intentar.', 'error');
					return;
				}

				var edicion = data.edicion;
				self.redirigirExito(seguir, edicion);

			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Paso 2 - Procesar artículos">
	self.presentacionBusqueda    = ko.observable("");
	self.$modalPresentaciones	 = $('#modal-presentaciones');
	self.titleModalPresentacion  = "Seleccionar artículo.";

	/**
	 * Abre el modal de presentaciones para su posterior selección.
	 *
	 * @returns {void}
	 */
	self.abrirModalPresentaciones = function() {
		self.$modalPresentaciones.on('shown.bs.modal', function (e) {
			$('.componente-tabla-filtro').focus();
		});
		self.$modalPresentaciones.modal('show');
	};

	/**
	 * Selecciona la presentación a agregar a la orden de compra, quitándola del
	 * arreglo de presentaciones.
	 *
	 * @param {Object} presentacion
	 * @returns {void}
	 */
	self.presentacionSeleccionar = function(presentacion) {
		self.$modalPresentaciones.modal('hide');

		self.orden.agregarLinea(presentacion);

		var filtradas = self.presentaciones().filter(p => p.id !== presentacion.id);
		self.presentaciones(filtradas);
	};

	/**
	 * Quita una línea de la orden de compra y agrega su presentación al arreglo
	 * de presentaciones y después las ordena por nombre.
	 *
	 * @param {koLinea} linea
	 * @returns {void}
	 */
	self.quitarLinea = function(linea) {
		self.orden.quitarLinea(linea);

		var presentacion = linea.presentacion;
		self.agregarPresentacion(presentacion);
	};

	/**
	 * Agrega la presentación al arreglo de presentaciones y luego las ordena
	 * por nombre largo.
	 *
	 * @param {Object} presentacion
	 * @returns {void}
	 */
	self.agregarPresentacion = function(presentacion) {
		self.presentaciones.push(presentacion);
		self.presentaciones.sort(function (a, b) {
			return a.nombreLargo.toLowerCase() > b.nombreLargo.toLowerCase() ? 1 : -1;
		});
	};

	/**
	 * Guarda las líneas de la orden de compra.
	 *
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos
	 *				        al listado
	 * @returns {void}
	 */
	self.guardarLineasOrden = function(seguir) {
		var orden  = self.orden;
		var valida = orden.comprobarValidez(true);
		if (!valida) {
			return;
		}

		var url		= self.urls.guardar;
		var data	= {
			paso   : PASO_ARTICULOS,
			lineas : orden.getDatosLineas()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined'
					|| typeof data.resultado.exito === 'undefined'
					|| typeof data.edicion === 'undefined'
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al guardar la orden de compra, vuelva a intentar.', 'error');
					return;
				}

				var edicion = data.edicion;
				self.redirigirExito(seguir, edicion);

			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Paso 3 - Confirmar y enviar">
	/**
	 * Abre el modal para guardar y cerrar la orden de compra.
	 *
	 * @param {Boolean} cerrar
	 * @returns {void}
	 */
	self.guardarConfirmarModal = function(cerrar) {
		var orden  = self.orden;
		var valido = orden.comprobarProveedorSeleccionado(true);
		if (!valido) {
			return;
		}

		if (cerrar) {
			Alerta({
				title: '¿Está seguro que desea cerrar la orden de compra?',
				text: 'Una vez cerrada no podrá modificarla.',
				confirmButtonColor: '#d33',
				confirmButtonText: 'Si, cerrar orden de compra.',
				onConfirmCallback: function() {
					self.guardarConfirmar(false);
				}
			});
		} else {
			self.guardarBorradorOrden(false);
		}
	};

	/**
	 * Guardar la orden de compra en estado cerrada, asignándole el proveedor
	 * y las observaciones.
	 *
	 * @param {Boolean} seguir
	 * @returns {void}
	 */
	self.guardarConfirmar = function(seguir) {
		var orden  = self.orden;
		var valida = orden.comprobarProveedorSeleccionado(true);
		if (!valida) {
			return;
		}

		var url		= self.urls.guardarConfirmacion;
		var data	= {
			proveedor	  : orden.proveedor().id,
			observaciones : orden.observaciones()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined'
					|| typeof data.resultado.exito === 'undefined'
					|| typeof data.edicion === 'undefined'
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al guardar la orden de compra, vuelva a intentar.', 'error');
					return;
				}

				Notificacion("La orden de compra se ha cerrado con éxito", "success");

				self.abrirModalEnvioEmail();

			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
	};

	/**
	 * Abre el modal que pregunta si desea enviar un email de aviso al
	 * proveedor.
	 *
	 * @returns {void}
	 */
	self.abrirModalEnvioEmail = function() {
		var url = self.urls.enviarCorreo;

		var orden	  = self.orden;
		var proveedor = orden.proveedor();
		var correo	  = proveedor.correo;

		var nombre = proveedor.nombre;
		var titulo = "Enviar correo a " + nombre;

		var callback   = self.redirigirListado;
		var sinCorreo  = correo.toString().length === 0;
		var texto	   = sinCorreo ? MENSAJE_SIN_CORREO : "";
		enviarTicketSolicitarCorreo(url, correo, titulo, texto, 'orden de compra', callback, callback, 'No enviar');
	};

	/**
	 * Redirige al listado de órdenes de compra.
	 *
	 * @returns {void}
	 */
	self.redirigirListado = function() {
		var listar = self.urls.listar;
		window.location.href = listar;
	};

	/**
	 * Guarda el paso de confirmación de la orden de compra en estado borrador.
	 *
	 * @param {Boolean} validar
	 * @returns {void}
	 */
	self.guardarBorradorOrden = function(validar) {
		var valido = validar ? self.comprobarPasoConfirmarValido(false) : true;
		if (!valido) {
			return;
		}

		var orden	   = self.orden;
		var url		   = self.urls.guardar;
		var data	   = {
			paso		  : PASO_CONFIRMAR,
			proveedor	  : orden.proveedor().id,
			observaciones : orden.observaciones()
		};
		 var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined'
					|| typeof data.resultado.exito === 'undefined'
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al guardar la orden de compra, vuelva a intentar.', 'error');
					return;
				}

				var listar = self.urls.listar;
				self.redirigirExito(false);
			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	/**
	 * Realiza el guardado de la orden de compra en estado borrador y redirige
	 * al listado.
	 *
	 * @returns {void}
	 */
	self.guardarBorrador = function() {
		self.guardarSeguir(false, false);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajaxOpciones = {
		method: 'POST',
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
	var $seccion = $('#orden-compra-alta');
	ko.options.deferUpdates = true;
	koOrdenCompra = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koOrdenCompra, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});