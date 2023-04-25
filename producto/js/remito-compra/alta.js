/* global ko, json, opcionesPantalla, moment, Intl */

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
	var self         = this;
	ko.mapping.fromJS(js, opciones, this);

	self.hoy  = moment().format('YYYY-MM-DD');
	self.ajax = ko.observable(false);

	//<editor-fold defaultstate="collapsed" desc="Cambio de pasos">
	var pasoOrdenes		   = self.pasoOrdenes;
	self.mostrarTabRemito  = ko.observable(!pasoOrdenes);
	self.mostrarTabOrdenes = ko.observable(pasoOrdenes);

	/**
	 * Indica si las órdenes seleccionadas en el primer paso fueron modificadas.
	 */
	self.modificadas = ko.observable(false);

	/**
	 * Indica si se debe alertar al usuario sobre la modificación de las
	 * órdenes previamente seleccioandas.
	 */
	self.alertar = ko.observable(false);

	self.textoAlerta = "Si modifica las órdenes de compra, perderá los " +
		"cambios realizados en el remito de compra.";

	/**
	 * Cambia de pestaña según el parámetro mostrarOrdenes. En caso que nos
	 * encontremos en el paso uno y no hay órdenes realiza la búsqueda de las
	 * mismas.
	 *
	 * @param {Boolean} mostrarOrdenes
	 * @returns {void}
	 */
	self.cambiarTab = function(mostrarOrdenes) {
		var ordenes = self.ordenes();
		if (mostrarOrdenes && ordenes.length === 0) {
			self.filtrarOrdenes();
		}

		if (mostrarOrdenes) {
			self.alertar(true);
		}

		self.mostrarTabOrdenes(mostrarOrdenes);
		self.mostrarTabRemito(!mostrarOrdenes);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Paso 1 - Elegir órdenes de compra">

	//<editor-fold defaultstate="collapsed" desc="Filtrado de órdenes">
	self.filtroEstado			= ko.observable('pendiente');
	self.filtroNumeroOC			= ko.observable('');
	self.filtroProveedor		= ko.observable('');
	self.ajaxBuscarOrdenes		= ko.observable(false);
	self.ocultarFiltroEncargado = false;

	var haceUnMes = moment().subtract(1, 'months').format('YYYY-MM-DD');
	self.filtroFechaDesde = ko.observable(haceUnMes);

	/**
	 * Comprueba que la fecha desde del filtro de órdenes de compra sea válida.
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
			errores.push("La fecha es inválida.");
		}

		var futura  = valida ? momento.isAfter(moment(), 'day') : false;
		if (futura) {
			errores.push("La fecha no puede ser futura.");
		}

		if (mostrar) {
			errores.forEach(error => Notificacion(error, 'error'));
		}
		return errores.length === 0;
	};

	/**
	 * Busca las órdenes de compra cerradas según los filtros aplicados.
	 *
	 * @returns {void}
	 */
	self.filtrarOrdenes = function() {
		var fechaValida = self.comprobarFechaFiltroValida(true);
		if (!fechaValida) {
			return;
		}

		var url		= self.urls.buscarOrdenes;
		var data	= {
			fecha	  : self.filtroFechaDesde(),
			numero	  : self.filtroNumeroOC(),
			estado	  : self.filtroEstado(),
			proveedor : self.filtroProveedor(),
			depositos : self.filtroDepositos()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined'
					|| typeof data.resultado.exito === 'undefined'
					|| !data.resultado.exito
					|| !Array.isArray(data.ordenes)
				) {
					Notificacion('Ha ocurrido un error al buscar las órdenes de compra, vuelva a intentar.', 'error');
					return;
				}
				var ordenes = ko.mapping.fromJS(data.ordenes, opcionesPantalla.ordenes);
				self.ordenes(ordenes());
				self.modificadas(true);
			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
				self.ajaxBuscarOrdenes(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
				self.ajaxBuscarOrdenes(false);
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	/**
	 * Devuelve las órdenes de compra seleccionadas.
	 */
	self.ordenesSeleccionadas = ko.pureComputed(function() {
		var salida  = [];
		var ordenes = self.ordenes();
		for (var i = 0; i < ordenes.length; i++) {
			var orden = ordenes[i];
			if (orden.seleccionada()) {
				salida.push(orden);
			}
		}
		return salida;
	});

	/**
	 * Comprueba que todos las órdenes de compra estén seleccionadas.
	 *
	 * @returns {Boolean}
	 */
	self.comprobarTodasSeleccionadas = function() {
		var total		  = self.ordenes().length;
		var seleccionadas = self.ordenesSeleccionadas().length;
		return total === seleccionadas;
	};

	/**
	 * Selecciona todas las órdenes de compra.
	 *
	 * @returns {void}
	 */
	self.seleccionarTodas = function() {
		var ordenes = self.ordenes();
		var todos	= self.comprobarTodasSeleccionadas();
		for (var i = 0; i < ordenes.length; i++) {
			var orden = ordenes[i];
			orden.seleccionada(!todos);
		}
	};

	/**
	 * Devuelve los ids de las órdenes de compra seleccionadas.
	 *
	 * @returns {Array}
	 */
	self.getIdsOrdenes = function() {
		var salida  = [];
		var ordenes = self.ordenesSeleccionadas();
		ordenes.forEach(orden => {
			salida.push(orden.id);
		});
		return salida;
	};

	/**
	 * Devuelve false si se seleccionaron órdenes de compra de diferentes
	 * proveedores.
	 *
	 * @param {Boolean} mostrar
	 * @returns {Boolean}
	 */
	self.comprobarPasoOrdenesValido = function(mostrar) {
		var errores		= [];
		var ordenes		= self.ordenesSeleccionadas();
		var proveedores = new Set();
		for (var i = 0; i < ordenes.length; i++) {
			var orden = ordenes[i];
			var id	  = orden.proveedor.id;
			proveedores.add(id);
		}
		if (proveedores.size > 1) {
			errores.push("Debe seleccionar órdenes de compra de un único proveedor.");
		}

		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}

		return errores.length === 0;
	};

	/**
	 * Guarda el remito de compra asignándole las órdenes de compra y con
	 * el resto de sus campos por defecto.
	 *
	 * @returns {void}
	 */
	self.seguir = function() {
		var valido = self.comprobarPasoOrdenesValido(true);
		if (!valido) {
			return;
		}

		var ordenes	 = self.ordenesSeleccionadas();
		var unica	 = ordenes.length === 1;
		var completo = self.comprobarOrdenesEstadoEntregaCompleto();
		if (ordenes.length >= 1 && completo) {
			var textoPoseen		  = unica ? "posee" : "poseen";
			var textoOrdenes	  = unica ? "La orden de compra" : "Las órdenes de compra";
			var textoSeleccionada = unica ? "seleccionada" : "seleccionadas" ;
			var titulo = `${textoOrdenes} ${textoSeleccionada} no ${textoPoseen} pendiente de entrega.`;

			Alerta({
				title: titulo,
				confirmButtonText: 'Continuar',
				showCancelButton: false,
				onConfirmCallback: function() {
					self.redirigirPasoRemito();
				},
				onCancelCallback: function() {
					self.redirigirPasoRemito();
				}
			});
			return;
		}

		self.redirigirPasoRemito();
	};

	/**
	 * Devuelve true si todas las órdenes seleccionadas ya están totalmente
	 * entregadas.
	 *
	 * @returns {Boolean}
	 */
	self.comprobarOrdenesEstadoEntregaCompleto = function() {
		var ordenes	= self.ordenesSeleccionadas();
		for (var i = 0; i < ordenes.length; i++) {
			var orden = ordenes[i];
			if (!orden.estadoEntregaCompleto) {
				return false;
			}
		}
		return true;
	};

	/**
	 * Redirige al paso de carga de datos del remito de compra.
	 *
	 * @returns {void}
	 */
	self.redirigirPasoRemito = function() {
		var query	 = "";
		var ordenes	 = self.ordenesSeleccionadas();
		for (var i = 0; i < ordenes.length; i++) {
			var orden = ordenes[i];
			var id	  = orden.id;
			var and   = query !== "" ? "&" : "";
			query += and + 'ordenes%5B%5D=' + id;
		}

		var url = self.urls.editar;
		if (query !== "") {
			url += "?" +  query;
		}

		Notificacion("Redirigiendo al siguiente paso ...", "info");
		window.location.href = url;
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Paso 2 - Cargar remito">

	if (self.remito.tieneProveedor) {
		var proveedor	 = self.remito.proveedor();
		var proveedores  = [proveedor];
		self.proveedores = ko.observable(proveedores);
		self.remito.proveedor(proveedor);

		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
	}

	//<editor-fold defaultstate="collapsed" desc="Modal presentaciones">
	self.presentacionBusqueda    = ko.observable("");
	self.$modalPresentaciones	 = $('#modal-presentaciones');
	self.titleModalPresentacion  = "Seleccionar artículo.";

	/**
	 * Devuelve un arreglo con los ids de las presentaciones seleccionadas.
	 */
	self.idsPresentacionesSeleccionadas = ko.pureComputed(function() {
		var salida  = [];
		var lineas = self.remito.lineas();
		lineas.forEach(linea => {
			var id		 = linea.presentacion.id;
			var idEntero = parseInt(id);
			salida.push(idEntero);
		});
		return salida;
	});

	/**
	 * Devuelve las presentaciones a seleccionar ordenadas por nombre en forma
	 * descendente.
	 */
	self.presentaciones = ko.pureComputed(function() {
		var ids			   = self.idsPresentacionesSeleccionadas();
		var todas		   = self.articulos;
		var presentaciones = [];
		for (var i = 0; i < todas.length; i++) {
			var presentacion = todas[i];
			var idActual	 = parseInt(presentacion.id);
			var seleccionada = ids.includes(idActual);
			if (!seleccionada) {
				presentaciones.push(presentacion);
			}
		}
		presentaciones.sort(function (a, b) {
			return a.nombreLargo.toLowerCase() > b.nombreLargo.toLowerCase() ? 1 : -1;
		});
		return presentaciones;

	});

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
	 * Selecciona la presentación a agregar al remito de compra, quitándola
	 * del arreglo de presentaciones.
	 *
	 * @param {Object} presentacion
	 * @returns {void}
	 */
	self.presentacionSeleccionar = function(presentacion) {
		self.$modalPresentaciones.modal('hide');

		self.remito.agregarLinea(presentacion);
	};

	/**
	 * Quita una línea del remito de compra y agrega su presentación al
	 * arreglo de presentaciones y después las ordena por nombre.
	 *
	 * @param {koLinea} linea
	 * @returns {void}
	 */
	self.quitarLinea = function(linea) {
		self.remito.quitarLinea(linea);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Alta rápida proveedor">
	self.$modalProveedores = $('#modal-proveedores-alta');

	/**
	 * Abre el modal para el alta rápida de proveedor.
	 *
	 * @returns {void}
	 */
	self.proveedorAbrirModalNuevo = function() {
		self.$modalProveedores.modal('show');
	};

	/**
	 * Crea un nuevo proveedor y lo selecciona.
	 *
	 * @param {Object} formulario
	 * @returns {void}
	 */
	self.proveedorNuevo = function(formulario) {
		var $formulario = $(formulario);
		var url			= self.urls.nuevoProveedor;
		var data		= $formulario.formSerialize();
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			async	: false,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.exito === 'undefined' || typeof data.cliente === 'undefined' || !data.exito) {
					Notificacion('Ha ocurrido un error al crear el proveedor, vuelva a intentar.', 'error');
					return;
				}

				var creado		  = data.cliente;
				var clavesValidas = self.mapeoProveedores;
				Object.keys(creado).forEach((key) => clavesValidas.includes(key) || delete creado[key]);

				var proveedor = ko.mapping.fromJS(creado, opcionesPantalla.proveedor);
				self.proveedores.push(proveedor);
				self.proveedores.sort(function (proveedorA, proveedorB) {
					return proveedorA.nombre.toLowerCase() > proveedorB.nombre.toLowerCase() ? 1 : -1;
				});

				self.remito.proveedor(proveedor);
				ko.tasks.runEarly();
				$('.selectpicker').selectpicker('refresh');

				Notificacion('Proveedor creado éxitosamente.', 'success');
				self.$modalProveedores.modal('hide');
				formulario.reset();
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	/**
	 * Reestablece todo lo realizado sobre la tabla de líneas del remito
	 * de compra.
	 *
	 * @returns {void}
	 */
	self.reestablecer = function() {
		self.remito.deposito(null);
		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');

		self.remito.reestablecerLineas();
	};

	/**
	 * Guarda el remito de compra en la base de datos.
	 *
	 * @returns {void}
	 */
	self.guardar = function() {
		var valido = self.remito.comprobarValidez(true);
		if (!valido) {
			return;
		}

		var url		= self.urls.guardar;
		var data	= {
			remito : self.remito.getDatos()
		};

		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar el remito de compra, vuelva a intentar.', 'error');
					return;
				}

				Notificacion('El remito de compra se ha guardado con éxito.', 'success');
				window.location.href = self.urls.listar;
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

	//<editor-fold defaultstate="collapsed" desc="Botones">
	self.titleListar  = "Volver al listado de remitos de compra";

	self.titleGuardar = ko.pureComputed(function() {
		var tabOrdenes    = self.mostrarTabOrdenes();
		var titleSeguir	  = "Crear remito de compra a partir de las órdenes de compra seleccionadas";
		var titleGuardar  = "Guardar remito de compra";
		return tabOrdenes ? titleSeguir : titleGuardar;
	});

	self.textoBotonGuardar = ko.pureComputed(function() {
		var tabOrdenes    = self.mostrarTabOrdenes();
		return tabOrdenes ? "Siguiente >" : "Guardar";
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Guardado">
	/**
	 * Guarda el remito de compra.
	 *
	 * Paso 1: selecciona las órdenes de compra y rediriga al alta del remito
	 *
	 * Paso 2: guarda el remito de compra.
	 *
	 * @returns {void}
	 */
	self.guardarSeguir = function() {
		var alta = self.mostrarTabOrdenes();
		if (alta) {
			self.seguir();
		} else {
			self.guardar();
		}
	};
	//</editor-fold>

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
	var $seccion = $('#remito-compra-alta');
	ko.options.deferUpdates = true;
	koRemitoCompra = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koRemitoCompra, $seccion.get(0));
	ko.tasks.runEarly();

	$('#select-depositos-multiple').selectpicker('refresh');
	$('.optgroup-1 a').trigger("click");

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});

});