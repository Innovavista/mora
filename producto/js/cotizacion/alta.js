//<editor-fold defaultstate="collapsed" desc="Extensiones">
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
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.hoy  = moment().format('YYYY-MM-DD');
	self.ajax = ko.observable(false);
	
	self.colspan	  = self.adicional.visible ? 4 : 3;
	self.tituloElegir = "Cotizar artículo.";
	
	self.tituloBadgeCotizaciones = "Visualizar cotizaciones realizadas al item para la nota de pedido consolidada actual.";
	
	var paso				   = self.paso();
	self.deshabilitarTabs	   = ko.observable(true);
	self.mostrarTabArticulos   = paso === PASO_ARTICULOS;
	self.mostrarTabProveedor   = paso === PASO_PROVEEDOR;
	self.mostrarTabConfirmar   = paso === PASO_CONFIRMAR;
	self.mostrarTabConsolidada = paso === PASO_CONSOLIDADA;
	
	self.mostrarGuardarBorrador  = !self.mostrarTabConsolidada;
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
		//Falta implementar
	};
	
	//<editor-fold defaultstate="collapsed" desc="Botones">
	self.titleListar		  = "Volver al listado de pedidos de cotización";
	self.titleGuardarBorrador = "Guardar el pedido de cotización para continuar después";
	
	self.textoBotonSeguir = self.mostrarTabConfirmar ? "Guardar y cerrar" : "Siguiente >";
	
	/**
	 * Devuelve el título que se muestra en el tooltipster del botón de color
	 * verde. El texto interno del botón puede ser "Seguir" o "Guardar y cerrar".
	 * 
	 * @returns {String}
	 */
	self.getTextoTitleBotonSeguir = function() {
		var paso = self.paso();
		switch (paso) {
			case PASO_CONSOLIDADA:
				return "Guardar y continuar a la selección de artículos.";
				
			case PASO_ARTICULOS:
				return "Guardar y continuar a la selección del proveedor.";
				
			case PASO_PROVEEDOR:
				return "Guardar y continuar a la confirmación del pedido.";
			
			case PASO_CONFIRMAR:
				return "Guardar y cerrar el pedido de cotización.";
		}
	};
	
	self.titleSeguir = self.getTextoTitleBotonSeguir();
	//</editor-fold>
	
	/**
	 * Realiza el guardado del paso actual y continúa al paso siguiente.
	 * 
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos 
	 *						al listado
	 * @param {bool} cerrar Indica si se debe cerrar el pedido de cotización.
	 * @returns {void}
	 */
	self.guardarSeguir = function(seguir = true, cerrar = true) {		
		var paso = self.paso();
		switch (paso) {
			case PASO_CONSOLIDADA:
				self.guardarPasoConsolidado(seguir);
				break;
				
			case PASO_ARTICULOS:
				self.guardarPasoArticulos(seguir);
				break;
				
			case PASO_PROVEEDOR:
				self.guardarPasoProveedor(seguir);
				break;
				
			case PASO_CONFIRMAR:
				self.guardarPasoConfirmarModal(cerrar);
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
			Notificacion("El pedido de cotización se ha guardado con éxito", "success");
		} else {
			Notificacion("Redirigiendo al siguiente paso ...", "info");
		}
		var listar = self.urls.listar;
		var ruta   = seguir ? urlEdicion : listar;
		window.location.href = ruta;
	};
	
	//<editor-fold defaultstate="collapsed" desc="Paso 1 - Selección de consolidados">
	self.seleccionado			= ko.observable("");
	self.seleccionarConsolidado = function(consolidado, evento) {
		var link		 = $(evento.target).closest("a");
		var esLink		 = link.length > 0;
		var esTipoRadio  = evento.target.type === "radio";
		var deshabilitar = self.deshabilitarCampos();
		if (esLink || esTipoRadio || deshabilitar) {
			return true;
		}
		var id = ko.isObservable(consolidado.id) ? consolidado.id() : consolidado.id;
		self.seleccionado(id);
	};
	
	/**
	 * Comprueba que la fecha desde del filtro de notas de pedidos sea válida.
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
	
	self.ajaxBuscarConsolidados = ko.observable(false);
	self.deshabilitarFiltrado = ko.pureComputed(function() {
		var ajax = self.ajax();
		var buscando = self.ajaxBuscarConsolidados();
		return ajax || buscando;
	});
	
	/**
	 * Busca los consolidados según la fecha desde del filtro.
	 * 
	 * @returns {void}
	 */
	self.filtrarConsolidados = function() {
		var fechaValida = self.comprobarFechaFiltroValida(true);
		if (!fechaValida) {
			return;
		}
		self.seleccionado("");
		var url		= self.urls.buscarConsolidados;
		var data	= { fecha: self.filtroFechaDesde };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined' 
					|| typeof data.resultado.exito === 'undefined' 
					|| typeof data.resultado.consolidados === 'undefined' 
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				var consolidados = ko.mapping.fromJS(data.resultado.consolidados, opcionesPantalla.consolidados);
				self.consolidados(consolidados());
			},
			beforeSend : function(jqXHR, settings) {
				self.ajax(true);
				self.ajaxBuscarConsolidados(true);
			},
			complete   : function(jqXHR, settings) {
				self.ajax(false);
				self.ajaxBuscarConsolidados(false);
			}
		});
		$.ajax(opciones);
	};
	
	/**
	 * Comprueba que el paso de elección de una nota de pedido consolidada sea
	 * válido.
	 * 
	 * @param {bool} mostrar
	 * @returns {Boolean}
	 */
	self.comprobarPasoConsolidadoValido = function(mostrar) {
		var id		= self.seleccionado();
		var errores = [];
		
		if (isNaN(id) || id === "") {
			errores.push("Debe seleccionar una nota de pedido consolidada.");
		}
		
		if (mostrar) {
			errores.forEach(error => Notificacion(error, 'error'));
		}
		return errores.length === 0;	
	};
	
	/**
	 * Guarda la cotización con los datos mínimos para continuar a la selección
	 * de artículos del consolidado.
	 * 
	 * @param {seguir} Indica si continuamos al siguiente paso o volvemos 
	 *				   al listado
	 * @returns {void}
	 */
	self.guardarPasoConsolidado = function(seguir) {
		var valido = self.comprobarPasoConsolidadoValido(true);
		if (!valido) {
			return;
		}
		
		var url		= self.urls.guardarConsolidado;
		var data	= { id: self.seleccionado() };
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined' 
					|| typeof data.resultado.exito === 'undefined' 
					|| typeof data.resultado.edicion === 'undefined' 
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error, vuelva a intentar.', 'error');
					return;
				}
				
				var edicion = data.resultado.edicion;
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
	self.$modalPresentaciones	 = $('#modal-presentaciones');
	self.agrupamientoActual		 = ko.observable(null);
	self.presentaciones			 = ko.observableArray();
	self.presentacionBusqueda	 = ko.observable("");
	self.titleModalPresentacion  = "Seleccionar artículo.";
	
	/**
	 * Abre el modal de presentaciones para su posterior selección.
	 * 
	 * @param {koAgrupamiento} agrupamiento
	 * @returns {void}
	 */
	self.abrirModalPresentacion = function(agrupamiento) {
		var presentaciones = agrupamiento.presentaciones;
		self.presentaciones(presentaciones);
		self.agrupamientoActual(agrupamiento);
		
		self.$modalPresentaciones.on('shown.bs.modal', function (e) {
			$('.componente-tabla-filtro').focus();
		});
		self.$modalPresentaciones.modal('show');
	};
	
	/**
	 * Selecciona la presentación a cotizar.
	 * 
	 * @param {Object} presentacion
	 * @returns {void}
	 */
	self.presentacionSeleccionar = function(presentacion) {
		self.$modalPresentaciones.modal('hide');
		
		var actual = self.agrupamientoActual();
		actual.presentacionSeleccionada(presentacion);
		actual.elegible(true);
		self.agrupamientoActual(null);
		self.presentaciones([]);
	};
	
	/**
	 * Devuelve todas las presentaciones seleccionadas para cada agrupamiento
	 * sin repetirlas.
	 * 
	 * @returns {Array|koPresentacion}
	 */
	self.getPresentacionesSeleccionadas = function() {
		var agrupamientos  = self.agrupamientos;
		var presentaciones = [];
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];
			var presentacion = agrupamiento.getPresentacionSeleccionada();
			
			var id	   = presentacion !== null ? presentacion.id : 0;
			var existe = presentaciones.find(p => p.id === id);
			if (id > 0 && !existe) {
				presentaciones.push(presentacion);
			}
		}
		return presentaciones;
	};
	
	/**
	 * Devuelve las presentaciones seleccionadas con cantidad a cotizar mayor a
	 * cero y elegible true.
	 * 
	 * @returns {Array}
	 */
	self.lineasPresentacionesCalculadas = ko.computed(function() {
		var presentaciones = self.getPresentacionesSeleccionadas();
		
		//Para cada presentación defino sus agrupamientos
		var agrupamientos = self.agrupamientos;
		for (var i = 0; i < presentaciones.length; i++) {
			var presentacion = presentaciones[i];
			//Me permite calcular la cantidad solicitada
			presentacion.setAgrupamientosSolicitados(agrupamientos);
		}
		presentaciones.sort(function (a, b) {
			return a.nombre.toLowerCase() > b.nombre.toLowerCase() ? 1 : -1;
		});
		return presentaciones;
	});
	
	/**
	 * Líneas de la tabla resumen que contiene los datos de las presentaciones
	 * a cotizar.
	 * 
	 * Si lineasResumen es un array vacío la interfaz se encarga de calcular
	 * las cantidades solicitadas por presentación, sino las mismas vienen
	 * definidas desde el servidor.
	 */
	self.lineasPresentaciones = ko.pureComputed(function() {		
		var lineasResumen = self.lineasResumen;
		if (Array.isArray(lineasResumen) && lineasResumen.length > 0) {
			return lineasResumen;
		}
		
		var lineasPresentaciones = self.lineasPresentacionesCalculadas();
		return lineasPresentaciones;
	});
	
	/**
	 * Comprueba que al menos haya un agrupamiento a cotizar y el mismo sea 
	 * válido.
	 * 
	 * @param {Boolean} mostrar
	 * @returns {Boolean}
	 */
	self.comprobarPasoArticulosValido = function(mostrar) {
		var elegidos	  = 0;
		var validos		  = true;
		var agrupamientos = self.agrupamientos;
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];
			var valido		 = agrupamiento.comprobarValidez(mostrar);
			
			var elegido = agrupamiento.elegible();
			if (elegido) {
				elegidos++;
			}
			
			if (!valido) {
				validos = false;
			}
		}
		
		var errores = [];
		if (elegidos === 0) {
			errores.push("Debe elegir al menos un artículo a cotizar.");
		}
		
		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}
		
		return validos && errores.length === 0;
	};
	
	/**
	 * Devuelve los datos de los agrupamientos para crear las líneas del pedido
	 * de cotización.
	 * 
	 * @returns {Array}
	 */
	self.getDatosAgrupamientos = function() {
		var datos		  = [];
		var agrupamientos = self.agrupamientos;
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];
			dato = agrupamiento.getDatosPost();
			if (dato.lineas.length > 0) {
				datos.push(dato);
			}
		}
		return datos;
	};
	
	/**
	 * Realiza el guardado de las líneas del pedido de cotización en base a los
	 * datos de los agrupamientos que contienen las líneas de la nota de pedido
	 * consolidada.
	 * 
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos 
	 *						al listado
	 * @returns {void}
	 */
	self.guardarPasoArticulos = function(seguir) {
		var valido = self.comprobarPasoArticulosValido(true);
		if (!valido) {
			return;
		}
		
		var url	 = self.urls.guardar;
		var data = {
			agrupamientos : self.getDatosAgrupamientos()
		};
		 var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined' 
					|| typeof data.resultado.exito === 'undefined' 
					|| typeof data.resultado.edicion === 'undefined' 
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al guardar los artículos del pedido de cotización, vuelva a intentar.', 'error');
					return;
				}
				
				var edicion = data.resultado.edicion;
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
	
	//<editor-fold defaultstate="collapsed" desc="Paso 3 - Seleccionar proveedor">
	self.proveedorSeleccionado = ko.observable("");	
	self.seleccionarProveedor  = function(proveedor, evento) {
		var link		 = $(evento.target).closest("a");
		var esLink		 = link.length > 0;
		var esTipoRadio  = evento.target.type === "radio";
		var deshabilitar = self.deshabilitarCampos();
		if (esLink || esTipoRadio || deshabilitar) {
			return true;
		}
		var id = proveedor.id;
		self.proveedorSeleccionado(id);
	};
	
	self.filtroProveedor	  = ko.observable('');
	self.proveedoresFiltrados = ko.pureComputed(function() {
		var filtrar	= self.filtroProveedor().toLowerCase();
		var filtro  = filtrar.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
		var proveedores = self.proveedores;
		if (filtro === "") {
			return proveedores;
		}
		
		var salida = [];
		for (var i = 0; i < proveedores.length; i++) {
			var proveedor = proveedores[i];
			var nombre    = proveedor.nombre;
			
			var buscar  = "";
			var esTexto = typeof nombre === "string";
			if (esTexto) {
				buscar = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
			}
			
			if (esTexto && buscar.includes(filtro)) {
				salida.push(proveedor);
			}
		}
		return salida;
	});
	
	/**
	 * Comprueba que el proveedor selccionado tenga un id válido.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarPasoProveedorValido = function(mostrar) {
		var id		 = self.proveedorSeleccionado();
		var errores  = [];
		var idValido =  id !== "" && !isNaN(id) && parseInt(id) > 0;
		if (!idValido) {
			errores.push("Debe seleccionar un proveedor para el pedido de cotización");
		}
		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}
		return errores.length === 0;
	};
	
	/**
	 * Realiza el guardado del proveedor del pedido de cotización.
	 * 
	 * @param {bool} seguir Indica si continuamos al siguiente paso o volvemos 
	 *						al listado
	 * @returns {void}
	 */
	self.guardarPasoProveedor = function(seguir) {
		var valido = self.comprobarPasoProveedorValido(true);
		if (!valido) {
			return;
		}
		
		var url	 = self.urls.guardar;
		var data = {
			proveedor : self.proveedorSeleccionado()
		};
		 var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined' 
					|| typeof data.resultado.exito === 'undefined' 
					|| typeof data.resultado.edicion === 'undefined' 
					|| !data.resultado.exito
				) {
					Notificacion('Ha ocurrido un error al guardar el proveedor del pedido de cotización, vuelva a intentar.', 'error');
					return;
				}
				
				var edicion = data.resultado.edicion;
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
	
	//<editor-fold defaultstate="collapsed" desc="Paso 4 - Confirmar y enviar">
	/**
	 * Abre el modal que pregunta si desea enviar un email de aviso al 
	 * proveedor.
	 * 
	 * @returns {void}
	 */
	self.abrirModalEnvioEmail = function() {		
		var url = self.urls.enviarCorreo;
		
		var cotizacion = self.cotizacion;
		var proveedor  = cotizacion.proveedor;
		var correo	   = proveedor.correo;
		
		var nombre = proveedor.nombre;		
		var titulo = "Enviar correo a " + nombre;
		
		var callback   = self.abrirModalRepetirCotizacion;
		var sinCorreo  = correo.toString().length === 0;
		var texto	   = sinCorreo ? MENSAJE_SIN_CORREO : "";
		enviarTicketSolicitarCorreo(url, correo, titulo, texto, 'cotización', callback, callback, 'No enviar');
	};
	
	/**
	 * Abre un modal para repetir el pedido de cotización actual permitiendo
	 * volver al paso de selección de artículos a partir de la misma nota 
	 * consolidada o al paso del selección del proveedor a partir de los mismos
	 * artículos.
	 * 
	 * @returns {void}
	 */
	self.abrirModalRepetirCotizacion = function() {
		Alerta({
			type: 'question',
			title: '¿Desea repetir el pedido de cotización?',
			showDenyButton: true,
			confirmButtonText: 'Cambiar proveedor',
			cancelButtonText: 'Salir',
			denyButtonColor: '#39a1f4',
			denyButtonText: 'Cambiar artículos',
			allowOutsideClick: false,
			onConfirmCallback: function() {				
				self.repetirDesdePasoProveedor();
			},
			onDenyCallback: function() {				
				self.repetirDesdePasoArticulos();
			},
			onCancelCallback: function() {				
				window.location.href = self.urls.listar;
			},
		});
	};
	
	/**
	 * Repite el pedido de cotización desde el paso indicado y luego redirige
	 * a la pantalla de edición del mismo.
	 * 
	 * @param {string} paso
	 * @returns {void}
	 */
	self.repetirDesdePaso = function(paso) {
		Notificacion("Repitiendo cotización ...", "info");
		
		var url  = self.urls.repetir;
		var data = {
		 paso: paso
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (
					typeof data.resultado === 'undefined' 
					|| typeof data.resultado.exito === 'undefined' 
					|| !data.resultado.exito
					|| typeof data.resultado.edicion === 'undefined' 
				) {
					Notificacion('Ha ocurrido un error al intentar repetir el pedido de cotización, vuelva a intentar.', 'error');
					return;
				}
				
				window.location.href = data.resultado.edicion;
				
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
	
	self.repetirDesdePasoArticulos = function() {
		self.repetirDesdePaso(PASO_ARTICULOS);
	};
	
	self.repetirDesdePasoProveedor = function() {
		self.repetirDesdePaso(PASO_PROVEEDOR);
	};
	
	/**
	 * Comprueba que la fecha del pedido de cotización sea válida y no sea 
	 * pasada.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarPasoConfirmarValido = function(mostrar) {
		var errores = [];
		
		var cotizacion  = self.cotizacion;
		var fecha		= cotizacion.fecha();
		var fechaMoment = moment(fecha).startOf('day');
		var fechaValida = fechaMoment.isValid();
		if (!fechaValida) {
			errores.push("La fecha del pedido de cotización no es válida.");
		}
		
		var hoy = moment().startOf('day');
		if (fechaMoment.isBefore(hoy)) {
			errores.push("La fecha del pedido de cotización no puede ser pasada.");
		}
		
		if (mostrar) {
			errores.forEach(error => {
				Notificacion(error, "error");
			});
		}
		
		return errores.length === 0;
	};
	
	self.guardarPasoConfirmarModal = function(cerrar) {
		var valido = self.comprobarPasoConfirmarValido(true);
		if (!valido) {
			return;
		}
		
		if (cerrar) {
			Alerta({
				title: '¿Está seguro que desea cerrar el pedido de cotización?',
				text: 'Una vez cerrado no podrá modificarlo.',
				confirmButtonColor: '#d33',
				confirmButtonText: 'Si, cerrar pedido de cotización.',
				onConfirmCallback: function() {				
					self.guardarCerrarCotizacion(false);
				}
			});
		} else {
			self.guardarBorradorCotizacion(false);
		}
	};
	
	/**
	 * Guarda el pedido de cotización en estado cerrado para luego permitirle
	 * al usuario enviarle un email y repetir el pedido.
	 * 
	 * @param {bool} validar
	 * @returns {void}
	 */
	self.guardarCerrarCotizacion = function(validar = true) {
		var valido = validar ? self.comprobarPasoConfirmarValido(false) : true;
		if (!valido) {
			return;
		}
		
		var cotizacion = self.cotizacion;
		var url		   = self.urls.confirmar;
		var data	   = {
			fecha		  : cotizacion.fecha(),
			observaciones : cotizacion.observaciones()
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
					Notificacion('Ha ocurrido un error al cerrar el pedido de cotización, vuelva a intentar.', 'error');
					return;
				}
				
				Notificacion("El pedido de cotización se ha cerrado con éxito", "success");
				
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
	 * Guarda el pedido de cotización en estado cerrado.
	 * 
	 * @param {bool} validar Indica si se deben validar los datos.
	 * @returns {void}
	 */
	self.guardarBorradorCotizacion = function(validar = true) {
		var valido = validar ? self.comprobarPasoConfirmarValido(false) : true;
		if (!valido) {
			return;
		}
		
		var cotizacion = self.cotizacion;
		var url		   = self.urls.guardar;
		var data	   = {
			fecha		  : cotizacion.fecha(),
			estado		  : ESTADO_BORRADOR,
			observaciones : cotizacion.observaciones()
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
					Notificacion('Ha ocurrido un error al guardar el pedido de cotización, vuelva a intentar.', 'error');
					return;
				}
				
				Notificacion("El pedido de cotización se ha guardado con éxito", "success");
				
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
	
	/**
	 * Realiza el guardado del pedido de cotización en estado borrador y redirige
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
		},
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
	var $seccion = $('#cotizacion-alta');
	ko.options.deferUpdates = true;
	koCotizacion = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koCotizacion, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});

