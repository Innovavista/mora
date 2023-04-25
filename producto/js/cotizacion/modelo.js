//<editor-fold defaultstate="collapsed" desc="Configuración">
var configProveedor = {
	key: function (data) {
		return ko.utils.unwrapObservable(data.id);
	},
	create: function (options) {
		var objeto = new koProveedor(options.data, opcionesPantalla);
		return objeto;
	}
};

var opcionesPantalla = {
	'observe'	   : ["filtroFechaDesde", "paso", "deshabilitarTabs", "consolidados", "fecha"],
	'consolidados' : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koPedido(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'agrupamientos' : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = ["elegible"];
			var objeto = new koAgrupamiento(options.data, opcionesPantalla);
			return objeto;
		}
	},
	'cotizacion' : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = ["fecha", "observaciones"];
			var objeto = new koCotizacion(options.data, opcionesPantalla);
			return objeto;
		}
	},
	'lineas' : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = ["cantidadACotizar"];
			var objeto = new koLinea(options.data, options.parent, opcionesPantalla);
			return objeto;
		}
	},
	'proveedor'   : configProveedor,
	'proveedores' : configProveedor,
	'presentaciones': {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koPresentacion(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
};
//</editor-fold>

function koCotizacion(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
}

function koPedido(js, opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}
}

function koAgrupamiento(js , opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	/**
	 * La clase css de la fila del total del agrupamiento que indica si se 
	 * excedió o no la cantidad total pedida de la presentación.
	 */
	self.clase = ko.pureComputed(function() {
		var totalACotizar   = parseFloat(self.totalGenericoACotizar());
		var totalSolicitado = parseFloat(self.totalGenerico);
		var menorIgualCero  = totalACotizar <= 0.00;
		if (!menorIgualCero && totalSolicitado > totalACotizar) {
			return "table-danger";
		}
		if (!menorIgualCero && totalACotizar > totalSolicitado) {
			return "table-primary";
		}
		return "";
	});
	
	/**
	 * Verifica que el comprable del agrupamiento sea una presentación.
	 */
	self.comprobarComprableTipoPresentacion = ko.pureComputed(function() {
		var tipo			 = self.comprable.tipoComprable;
		var tipoPresentacion = tipo === TIPO_PRESENTACION;
		return tipoPresentacion;
	});
	
	/**
	 * Comprueba haya al menos una cantidad de las líneas del agrupamiento que
	 * tenga valor mayor a cero. Debido a que la cantidad a cotizar depende del
	 * usuario y no validamos si los totales coinciden.
	 * 
	 * @param {Boolean} mostrar Si es true muestra los mensajes de error.
	 * @return {Boolean}
	 */
	self.comprobarValidez = function(mostrar) {
		var lineas   = self.lineas;
		var elegible = self.elegible();
		if (!elegible) {
			return true;
		}
		
		var errores  = [];
		var validas  = true;
		var cantidad = 0;
		for (var i = 0; i < lineas.length; i++) {
			var linea  = lineas[i];
			var valida = linea.comprobarValidez(mostrar);
			if (!valida) {
				validas = false;
			}
			
			var cotizar    = linea.cantidadACotizar();
			var convertida = parseFloat(cotizar);
			if (!isNaN(convertida)) {
				cantidad += convertida;
			}
		}
		
		if (cantidad <= 0.00) {
			var nombre  = self.comprable.nombre;
			var mensaje = `La cantidad total a cotizar de '${nombre}' no puede ser menor o igual a cero`;
			errores.push(mensaje);
		}
		
		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}
		
		return validas && errores.length === 0;
	};
	
	self.presentacionSeleccionada = ko.observable(null);
	self.inicializarPresentacion = function() {
		var tipoPresentacion = self.comprobarComprableTipoPresentacion();
		if (!tipoPresentacion) {
			return;
		}
		var comprable	 = self.comprable;
		var presentacion = self.presentaciones.find(p => p.id === comprable.id);
		self.presentacionSeleccionada(presentacion);
	};
	self.inicializarPresentacion();
	
	/**
	 * Verifica si se deben deshabilitar las cantidades. Esto pasa cuando el
	 * comprable es un genérico y no se seleccionó una presentación.
	 */
	self.deshabilitarCantidades = ko.pureComputed(function() {
		var presentacion	 = self.presentacionSeleccionada();
		var tipoPresentacion = self.comprobarComprableTipoPresentacion();
		return !tipoPresentacion && presentacion === null;
	});
	
	/**
	 * Representa la cantidad total a cotizar del comprable del agrupamiento.
	 */
	self.totalACotizar = ko.pureComputed(function() {
		var total = 0;
		self.lineas.forEach(function(linea) {
			var cantidad = linea.cantidadACotizar();
			var valida   = !isNaN(cantidad) && cantidad !== "";
			
			total += valida ? parseFloat(cantidad) : 0;
		});
		var totalRedondeado = parseFloat(total).toFixed(2);
		return parseFloat(totalRedondeado);
	});
	
	/**
	 * Representa la cantidad genérica total a cotizar del comprable del 
	 * agrupamiento. 
	 * 
	 * Genérica significa que la cantidad se encuentra medida en la unidad del 
	 * genérico, el genérico puede ser una materia prima o mercadería. 
	 * 
	 * La materia prima o mercadería pueden proceder de una línea de una nota de
	 * pedido consolidada o de una presentación la cual está relacionada a la 
	 * línea de una nota de pedido consolidada.
	 */
	self.totalGenericoACotizar = ko.pureComputed(function() {
		var total		  = 0.00;
		var lineas		  = self.lineas;
		var unidadDestino = self.unidadGenericaClave;
		for (var i = 0; i < lineas.length; i++) {
			var linea		 = lineas[i];
			var cantidad	 = linea.cantidadGenericaACotizar();
			var unidadOrigen = linea.unidadGenericaClave;
			if (unidadDestino !== unidadOrigen) {
				cantidad = self.convertirCantidad(unidadOrigen, cantidad);
			}
			
			if (!isNaN(cantidad)) {
				total += cantidad;
			}
		}
		
		// Primero redondeo el total a dos decimales y después lo convierto a
		// float
		var totalRedondeado = parseFloat(total).toFixed(2);
		return parseFloat(totalRedondeado);
	});
	
	self.textoTotalGenericoACotizar = ko.pureComputed(function() {
		var total  = self.totalGenericoACotizar();
		var unidad = self.unidadGenerica;
		return total + " " + unidad;
	});
	
	/**
	 * Convierte una cantidad de una unidad de origen a la unidad genérica del
	 * agrupamiento.
	 * 
	 * @param {string} unidadOrigen
	 * @param {float} cantidad
	 * @returns {Number}
	 */
	self.convertirCantidad = function(unidadOrigen, cantidad) {
		var ratio  = self.ratios.find(ratio => ratio.unidad === unidadOrigen);
		var factor = 1;
		if (ratio !== undefined && ratio.factor !== undefined && !isNaN(ratio.factor)) {
			factor = ratio.factor;
		}
		return factor * cantidad;
	};
	
	/**
	 * Devuelve los datos del agrupamiento necesarios para crear las líneas del 
	 * pedido de cotización relacionadas a las líneas del agrupamiento actual y su 
	 * presentación.
	 * 
	 * @returns {Array}
	 */
	self.getDatosPost = function() {
		var elegible      = self.elegible();
		var presentacion  = self.presentacionSeleccionada();
		var cantidadTotal = self.totalGenericoACotizar();
		if (!elegible || presentacion === null || cantidadTotal <= 0.00) {
			return {
				'lineas' : []
			};
		}
		
		var datos  = {
			'lineas'		 : [],
			'idPresentacion' : self.presentacionSeleccionada().id,
			'presentacion'   : self.presentacionSeleccionada().nombre
		};
		var lineas = self.lineas;
		for (var i = 0; i < lineas.length; i++) {
			var linea	   = lineas[i];
			var datosLinea = linea.getDatosPost();
			datos.lineas.push(datosLinea);
		}
		return datos;
	};
	
	/**
	 * Devuelve la presentación seleccionada en caso que sea elegible y la
	 * cantidad a cotizar de la misma sea mayor a cero.
	 * 
	 * @returns {koPresenacion|null}
	 */
	self.getPresentacionSeleccionada = function() {
		var elegible	 = self.elegible();
		var presentacion = self.presentacionSeleccionada();
		if (!elegible || presentacion === null) {
			return null;
		}
		var cantidad = self.totalACotizar();
		if (cantidad <= 0.00) {
			return null;
		}
		return presentacion;
	};
	
	/**
	 * Devuelve los datos de la presentación a cotizar.
	 * 
	 * @returns {Object|null}
	 */
	self.getLineaPresentacion = function() {
		var elegible	 = self.elegible();
		var presentacion = self.presentacionSeleccionada();
		if (!elegible || presentacion === null) {
			return null;
		}
		
		var cantidad = self.totalGenericoACotizar();
		if (cantidad <= 0.00) {
			return null;
		}
		
		var nombre		  = presentacion.nombre;
		var textoCantidad = self.textoTotalGenericoACotizar();
		return {
			'nombre'   : nombre,
			'cantidad' : textoCantidad
		};
	};
}

function koLinea(js, agrupamiento, opciones) {
	this.agrupamiento = agrupamiento;
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	/**
	 * La clase css de las filas que indica si se excedió o no la cantidad 
	 * pedida por la nota de pedido consolidada.
	 */
	self.clase = ko.pureComputed(function() {
		var cantidadInicial  = parseFloat(self.cantidadGenerica);
		var cantidadACotizar = parseFloat(self.cantidadGenericaACotizar());
		var menorIgualCero   = cantidadACotizar <= 0.00;
		if (!menorIgualCero && cantidadInicial > cantidadACotizar) {
			return "table-danger";
		}
		if (!menorIgualCero && cantidadACotizar > cantidadInicial) {
			return "table-primary";
		}
		return "";
	});
	
	/**
	 * Cantidad genérica de la presentación definida en la unidad de la línea
	 * para luego multiplicar por las unidades y calcular el total 
	 * genérico a cotizar por línea.
	 */
	self.cantidadPresentacion = ko.pureComputed(function() {
		var presentacion = self.agrupamiento.presentacionSeleccionada();
		if (presentacion === null) {
			return 0;
		}
		
		// Si la presentación seleccionada era el comprable del agrupamiento
		// la misma no posee ratios por lo que buscamos dentro del arreglo de 
		// presentaciones que vienen con ratios.
		if (presentacion.ratios === undefined) {
			var agrupamiento   = self.agrupamiento;
			var presentaciones = agrupamiento.presentaciones;
			presentacion = presentaciones.find(p => p.id === presentacion.id);
		}
		
		var ratios   = presentacion.ratios;
		var cantidad = presentacion.cantidad;
		if (
			!isNaN(cantidad) 
			&& (ratios === undefined || !Array.isArray(ratios) || ratios.length === 0)
		) {
			// Si no hay ratios definidos se devuelve la cantidad sin convertir.
			return cantidad;
		}
		
		if (isNaN(cantidad)) {
			// Si la presentación no posee definida la cantidad genérica 
			// devolvemos cero
			return 0;
		}
		
		// Si el factor no fue encontrado multiplicamos la cantidad por uno.
		var unidad = self.unidadGenericaClave;
		var ratio  = ratios.find(ratio => ratio.destino === unidad);
		var factor = 1;
		if (ratio !== undefined && !isNaN(ratio.factor)) {
			factor = ratio.factor;
		}

		return factor * cantidad;
	});
	
	/**
	 * Cantidad genérica a cotizar. Se calcula en base a la cantidad en unidades
	 * multiplicada por la cantidad genérica de la presentación.
	 */
	self.cantidadGenericaACotizar = ko.pureComputed(function() {
		var cantidad			 = self.cantidadACotizar();
		var cantidadPresentacion = self.cantidadPresentacion();
		var total				 = parseFloat(cantidad * cantidadPresentacion).toFixed(2);
		return parseFloat(total);
	});
	
	self.cantidadGenericaACotizarTexto = ko.pureComputed(function() {
		var cantidad			 = self.cantidadGenericaACotizar();
		var total				 = parseFloat(cantidad).toFixed(2);
		var unidad				 = self.unidadGenerica;
		return total + " " + unidad;
	});
	
	/**
	 * Comprueba que la cantidad de la línea sea válida.
	 * 
	 * @param {Boolean} mostrar Si es true muestra los mensajes de error.
	 * @returns {Boolean}
	 */
	self.comprobarValidez = function(mostrar) {
		var nombre		 = self.agrupamiento.comprable.nombre;
		var destino		 = self.destino.nombre;
		var errores		 = [];
		var cantidad     = self.cantidadACotizar();
		var convertida   = parseFloat(cantidad);		
		if (!isNaN(cantidad) && convertida < 0.00) {
			errores.push(`La cantidad a cotizar de '${nombre}' para el ${destino} no puede ser menor que cero.`);
		}
		
		var decimales		  = cantidad.toString().split(".")[1];
		var cantidadDecimales = decimales !== undefined ? decimales.length : 0;			
		if (cantidadDecimales > 2) {
			errores.push(`La cantidad de '${nombre}' para el ${destino} no puede tener más de dos decimales.`);
		}
		
		if (mostrar) {
			errores.forEach(error => Notificacion(error, "error"));
		}
		
		return errores.length === 0;
	};
	
	/**
	 * Devuelve los datos necesarios para una línea del pedido de cotización 
	 * relacionada con la línea de la nota de pedido consolidada actual y la
	 * cantidad elegida para la presentación del agrupamiento.
	 * 
	 * @returns {Object}
	 */
	self.getDatosPost = function() {		
		var idLinea			 = self.id;
		var cantidadACotizar = self.cantidadACotizar();
		return {
			'id'	   : idLinea,
			'cantidad' : cantidadACotizar
		};
	};
	
}

function koProveedor(js, opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}
	
	/**
	 * Si el proveedor ofrece alguna de las presentaciones del pedido de 
	 * cotización se lo resalta sobre el resto.
	 */
	self.clase = ko.pureComputed(function() {
		var cantidad = parseInt(self.cantidad);
		return cantidad > 0 ? "table-primary" : "";
	});
	
	self.telefonoTexto  = self.telefono !== "" ? self.telefono : "Sin teléfono";
	self.direccionTexto = self.direccion !== "" ? self.direccion : "Sin dirección";
}

function koPresentacion(js, opciones) {
	var self = this;
	for (clave in js) {
		self[clave] = js[clave];
	}
	
	self.agrupamientos = ko.observableArray();
	
	/**
	 * Calcula la cantidad solicitada de la presentación según los 
	 * agrupamientos.
	 * 
	 * @param {koPresentacion} presentacionSolicitada
	 * @returns {Number}
	 */
	self.cantidadSolicitada = ko.pureComputed(function() {
		var cantidad	  = 0;
		var agrupamientos = self.agrupamientos();
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];
			var presentacion = agrupamiento.getPresentacionSeleccionada();
			
			var idSolicitado   = self.id;
			var idPresentacion = presentacion !== null && presentacion.id ? presentacion.id : 0;
			if (idSolicitado === idPresentacion) {
				var cantidadCotizar = agrupamiento.totalACotizar();
				cantidad += cantidadCotizar;
			}
		}
		return cantidad;
	});
	
	/**
	 * Define cuáles son los agrupamientos que solicitaron la presentación 
	 * actual. Esto me permite luego calcular la cantidad solicitada de la
	 * presentación.
	 * 
	 * @param {Array} agrupamientos
	 * @returns {void}
	 */
	self.setAgrupamientosSolicitados = function(agrupamientos) {
		var solicitados = [];
		for (var i = 0; i < agrupamientos.length; i++) {
			var agrupamiento = agrupamientos[i];
			var presentacion = agrupamiento.getPresentacionSeleccionada();
			
			var idSolicitado    = self.id;
			var idPresentacion  = presentacion !== null && presentacion.id ? presentacion.id : 0;
			var cantidadCotizar = agrupamiento.totalACotizar();
			if (idSolicitado === idPresentacion && cantidadCotizar > 0) {
				solicitados.push(agrupamiento);
			}
		}
		self.agrupamientos(solicitados);
	};
	
}