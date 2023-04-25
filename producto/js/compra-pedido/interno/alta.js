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
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.hoy		= moment().format('YYYY-MM-DD');
	self.visualizar = ko.observable(false);
	
	// Cuando estamos editando el depósito no es un observable, para mantener
	// siempre el mismo tipo lo convierto a observable.
	if (!ko.isObservable(self.pedido.deposito)) {
		self.pedido.deposito = ko.observable(self.pedido.deposito);
	}
	
	/**
	 * Campo adicional del depósito definido en el servicio que permite agregar
	 * datos adicionales de otros módulos.
	 */
	self.pedido.adicional = ko.pureComputed(function() {
		var deposito = self.pedido.deposito();
		if (deposito !== undefined && deposito.adicional && ko.isObservable(deposito.adicional.nombre)) {
			return deposito.adicional.nombre();
		}
		return "";
	});
	
	if (self.depositos().length === 1) {
		self.pedido.deposito(self.depositos()[0]);
	}
	
	//<editor-fold defaultstate="collapsed" desc="Filtrado">
	self.busqueda	      = ko.observable("");
	self.tipoComprable    = ko.observable("");
	self.busquedaCodigo   = ko.observable("");
	self.filtrarPorCodigo = ko.observable(false);
	
	/**
	 * Quita los acentos del texto y lo convierte a minúscula.
	 * 
	 * @param {string} text
	 * @returns {string}
	 */
	self.limpiarBusqueda = function(text) {
		var acentos  = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
		var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
		for (var i=0; i < acentos.length; i++) {
			text = text.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
		}
		return text.toLowerCase();
	};
	
	/**
	 * Comprables filtrados por campos tipo y nombre, además quita los 
	 * comprables que ya fueron agregados al pedido y los ordena por nombre.
	 */
	self.comprablesFiltrados = ko.pureComputed(function() {
		var salida		   = [];
		var lineas		   = self.pedido.lineas();
		var busqueda	   = self.busqueda();
		var comprables	   = self.comprables();
		var busquedaTipo   = self.tipoComprable();
		var filtrarCodigo  = self.filtrarPorCodigo();
		var busquedaCodigo = self.busquedaCodigo();
		for (var i = 0; comprables.length > i; i++) {
			var comprable  = comprables[i];
			var tipo	   = comprable.tipoComprable();
			var codigo	   = comprable.codigo();
			
			// Buscamos por id y por tipo porque los comprables pertenecen a
			// diferentes tablas.
			var encontrado = lineas.find(function(linea) {
				let comprobarId   = linea.comprable.id() === comprable.id();
				let comprobarTipo = linea.comprable.tipoComprable() === tipo;
				return comprobarId && comprobarTipo;
			});
			var noFuePedido   = encontrado === undefined;
			var buscarPorTipo = busquedaTipo === "" || (
				busquedaTipo !== "" 
				&& tipo === busquedaTipo
			);	
			var nombre			= comprable.nombre();
			var nombreLimpio	= self.limpiarBusqueda(nombre);
			var busquedaLimpia	= self.limpiarBusqueda(busqueda);
			var buscarPorNombre = busquedaLimpia === "" || (
				nombreLimpio.indexOf(busquedaLimpia) > -1
			);
			var buscarPorCodigo = !filtrarCodigo 
				|| (filtrarCodigo && codigo.indexOf(busquedaCodigo) > -1);
			if (noFuePedido && buscarPorTipo && buscarPorNombre && buscarPorCodigo) {
				salida.push(comprable);
			}
		}
		salida.sort(function (l, r) {
			return l.nombre().toLowerCase() > r.nombre().toLowerCase() ? 1 : -1;
		});
		return salida;
	});
	
	/**
	 * Busca un comprable por código si existe un único comprable que coincida
	 * con el código. Si coinciden más de uno no busca ni filtra.
	 * 
	 * @param {koPantalla} data
	 * @param {jQuery.Event} e
	 * @returns {Boolean}
	 */
	self.buscarPorCodigo = function(data, e) {
		var value		  = e.target.value;
		var presionoEnter = e.keyCode === 13;
		if (!presionoEnter || value.length < 3) {
			self.filtrarPorCodigo(false);
			return true;
		}
				
		var tipo = self.tipoComprable();
		if (tipo === "") {
			Notificacion("Debe seleccionar un tipo para buscar por código", "error");
			return false;
		}
		var comprables = self.comprablesFiltrados().filter(function(comprable) {
			var comprobarTipo	= comprable.tipoComprable() === tipo;
			var comprobarCodigo = comprable.codigo().indexOf(value) > -1;
			return comprobarCodigo && comprobarTipo;
		});
		if (comprables.length === 1) {
			var comprable = comprables[0];
			self.agregarLinea(comprable);
			return true;
		}
		if (comprables.length > 1 && presionoEnter) {
			// Si hay más de uno filtro por código.
			self.filtrarPorCodigo(true);
		}
		return false;
	};
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Líneas del pedido">
	
	self.agregarLinea = function(generico) {
		var linea = new koLinea(self.pedido, opciones);
		linea.comprable = generico;
		linea.agregarOpcionesUnidades();
		self.pedido.lineas.push(linea);
		
	};
	
	self.quitarLinea = function(linea) {
		self.pedido.lineas.remove(linea);
	};
	
	/**
	 * Para todos los artículos y genéricos le inicializa sus posibles unidades
	 * para que cuando sean agregados al pedido el select de unidades de la 
	 * linea ya tenga los datos necesarios para cargarlos.
	 * 
	 * @returns {void}
	 */
	self.inicializarSelectUnidades = function() {
		ko.utils.arrayForEach(self.pedido.lineas(), function(linea) {
			linea.agregarOpcionesUnidades(self.unidades);
		});
	};
	
	self.inicializarSelectUnidades();
	
	/**
	 * Busca un comprable por id y tipo.
	 * 
	 * @param {Object} comprable
	 * @returns {Object|undefined}
	 */
	self.getComprable = function(comprable) {
		var id		    = ko.isObservable(comprable.id) ? comprable.id() : comprable.id;
		var tipo	    = ko.isObservable(comprable.tipoComprable) ? comprable.tipoComprable() : comprable.tipoComprable;
		var encontrada  = self.comprables().find(buscado => buscado.id() === id && buscado.tipoComprable() === tipo);
		return encontrada;
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Guardar">
	self.guardarBorrador = function() {
		self.pedido.estado(ESTADO_BORRADOR);
		self.guardar();
	};
	
	self.guardarFinalizado = function() {
		self.pedido.estado(ESTADO_CERRADA);
		self.guardarPreguntar();
	};
	
	/**
	 * Comprueba que el pedido sea válido, si mostrar es true acumula y muestra 
	 * los errores.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarGuardadoValido = function(mostrar) {
		var errores		= [];
		
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
		
		var deposito   = self.pedido.deposito();
		var idDeposito = deposito !== undefined && ko.isObservable(deposito.id) ? deposito.id() : 0;
		if (deposito === undefined || isNaN(idDeposito) || parseInt(idDeposito) <= 0) {
			errores.push("Debe seleccionar un depósito.");
		}
		
		if (mostrar) {
			errores.forEach(error => { 
				Notificacion(error, "error");
			});
		}
		var lineasValidas = self.comprobarLineasValidas(mostrar);
		return errores.length === 0 && lineasValidas;
	};
	
	/**
	 * Comprueba que las líneas del pedido sean válidas, si mostrar es true 
	 * acumula y muestra los errores.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarLineasValidas = function(mostrar) {
		var errores = [];
		
		var lineas  = self.pedido.lineas();
		if (lineas.length === 0) {
			errores.push("Debe seleccionar al menos una materia prima, mercadería o artículo.");
		}
		
		ko.utils.arrayForEach(lineas, function(linea) {
			var tipo		 = linea.comprable.tipoComprable ? linea.comprable.tipoComprable() : "";
			var nombre		 = ko.isObservable(linea.comprable.nombre) ? linea.comprable.nombre() : linea.comprable.nombre;
			var tipoNombre	 = linea.comprable.tipoComprableNombre ? linea.comprable.tipoComprableNombre() : "";
			var preposicion  = tipo === TIPO_PRESENTACION ? "el" : "la";
			var descripcion  = "uno de los artículos";			
			if (tipo !== "") {
				descripcion = `${preposicion} ${tipoNombre.toString().toLowerCase()} "${nombre}"`;
			}
			
			var unidad = linea.unidad();
			if (typeof unidad === "undefined") {
				errores.push(`Debe seleccionar una unidad para ${descripcion}.`);
			}			
			
			var cantidad = linea.getCantidadRedondeada();
			if (isNaN(cantidad) || cantidad === 0.00) {
				errores.push(`La cantidad para ${descripcion} no puede estar vacía o ser cero.`);
			}
			
			if (!isNaN(cantidad) && cantidad < 0.00) {
				errores.push(`La cantidad para ${descripcion} no puede ser negativa.`);
			}
			
			var original		  = linea.cantidad();
			var decimales		  = original.toString().split(".")[1];
			var cantidadDecimales = decimales !== undefined ? decimales.length : 0;			
			if (cantidadDecimales > 2) {
				errores.push(`La cantidad para ${descripcion} no puede tener más de dos decimales.`);
			}
			
			var hoy			 = moment().startOf('day');
			var fechaEntrega = moment(linea.fechaEntrega());
			if (!fechaEntrega.isValid()) {
				errores.push(`La fecha de entrega para ${descripcion} no es válida.`);
			}
			if (fechaEntrega.isBefore(hoy)) {
				errores.push(`La fecha de entrega para ${descripcion} no puede ser pasada.`);
			}
			
			var restante = linea.longitudObservacionesRestante();
			if (restante < 0) {
				errores.push(`Las observaciones para ${descripcion} no puede tener más de ${LONGITUD_OBSERVACIONES} caracteres.`);
			}
		});
		if (mostrar) {
			errores.forEach(error => { 
				Notificacion(error, "error");
			});
		}
		return errores.length === 0;
	};
	
	self.guardarPreguntar = function() {
		var valido = self.comprobarGuardadoValido(true);
		if (!valido) {
			return false;
		}
		
		var estado = self.pedido.estado();
		if (estado === ESTADO_CERRADA) {
			Swal.fire({
				title: '¿Está seguro que desea cerrar la nota de pedido interna?',
				text: "Una vez cerrada no podrá modificarla.",
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				confirmButtonText: 'Si, cerrar nota de pedido interna.',
				cancelButtonText: 'Cancelar'
			}).then(function(resultado) {
				if (!resultado.value) {
					return;
				}
				self.guardar(false);
			});
		}
	};
	
	/**
	 * Guarda el pedido de compra en base de datos.
	 * 
	 * @param {bool} validar Indica si debemos validar o no la nota de pedido 
	 *						 antes de guardar, puede haber casos que ya esté
	 *						 validada anteriormente.
	 * @returns {Boolean}
	 */
	self.guardar = function(validar = true) {
		var valido = validar ? self.comprobarGuardadoValido(true) : true;
		if (!valido) {
			return false;
		}
		
		var url		= self.urls.guardar();
		var data	= {
			id		 : self.pedido.id(),
			fecha	 : self.pedido.fecha(),
			lineas	 : ko.mapping.toJSON(self.pedido.lineas()),
			estado	 : self.pedido.estado(),
			deposito : self.pedido.deposito().id(),
			edicion	 : self.edicion()
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar la nota de pedido, vuelva a intentar.', 'error');
					return;
				}
				Notificacion('La nota de pedido se ha guardado con éxito', 'success');
				window.location.href = self.volverA();
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Ajax">

	self.ajax = ko.observable(false);
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