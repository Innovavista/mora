//<editor-fold defaultstate="collapsed" desc="Configuración">
let opcionesPantalla = {
	'observe' : [""],
	'orden'  : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = [""];
			let objeto = new koOrden(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'ajuste'  : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = ["motivo"];
			let objeto = new koAjuste(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
	'lineas'  : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = ["cantidadAjustar", "ajustarEntrega", "ajustarFacturacion"];
			let objeto = new koLinea(options.data, options.parent, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koOrden(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	let self = this;
	
}

function koAjuste(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	let self = this;
	
	/**
	 * Devuelve los datos del ajuste para el guardado.
	 * 
	 * @returns {Object}
	 */
	self.getDatos = function() {
		let lineas = self.getDatosLineas();
		let motivo = self.motivo();
		let datos  = {
			motivo : motivo,
			lineas : lineas
		};
		return datos;
	};
	
	/**
	 * Devuelve los datos de las líneas del ajuste para el guardado.
	 * 
	 * @returns {Array|Object}
	 */
	self.getDatosLineas = function() {
		let lineas = self.lineas;
		var datos  = [];
		lineas.forEach(linea => {
			let dato = linea.getDatos();
			datos.push(dato);
		});
		return datos;
	};
	
	/**
	 * Devuelve la cantidad de líneas que no realizan ajuste sobre la orden de 
	 * compra. Es decir las que poseen ambos checkboxs deshabilitados, tanto de 
	 * ajustar entrega o ajustar facturación.
	 * 
	 * @returns {Number}
	 */
	self.getCantidadLineasNoRealizanAjuste = function() {
		let lineas = self.lineas;
		let salida = [];
		lineas.forEach(linea => {
			let realizaAjuste = linea.comprobarRealizaAjuste();
			if (!realizaAjuste) {
				salida.push(linea);
			}
		});
		
		let cantidad = salida.length;
		return cantidad;
	};
	
	//<editor-fold defaultstate="collapsed" desc="Comprobaciones">
	/**
	 * Devuelve true si las líneas del ajuste de la orden de compra poseen los
	 * datos suficientes para ser guardadas.
	 * 
	 * @param {bool} mostrar
	 * @returns {bool}
	 */
	self.comprobarValidez = function(mostrar) {
		let errores = [];
		
		let lineas = self.lineas;
		lineas.forEach(linea => {
			let cantidad	  = linea.cantidadAjustar();
			let cantidadFloat = !isNaN(cantidad) && cantidad !== "" ? parseFloat(cantidad) : 0.00;
			let realizaAjuste = linea.comprobarRealizaAjuste();			
			if (realizaAjuste && cantidadFloat <= 0.00) {
				let presentacion = linea.presentacion.nombreLargo;
				errores.push(`El ajuste para el artículo '${presentacion}' debe ser mayor a cero, sino debe deshabilitar los ajustes del mismo.`);
			}
		});
		
		let deshabilitadas = self.comprobarTodasLineasDeshabilitadas();
		if (deshabilitadas) {
			errores.push("Debe habilitar el ajuste de al menos un artículo.");
		}
		
		if (mostrar) {
			errores.forEach(error => Notificacion(error, 'error'));
		}		
		
		return errores.length === 0;
	};
	
	/**
	 * Devuelve true si todas las líneas del ajuste están deshabilitadas para
	 * realizar un ajuste.
	 * 
	 * @returns {bool}
	 */
	self.comprobarTodasLineasDeshabilitadas = function() {
		let lineas				= self.lineas;
		let cantidadLineas		= lineas.length;
		let deshabilitadas		= self.getCantidadLineasNoRealizanAjuste();
		let todasDeshabilitadas = deshabilitadas === cantidadLineas;
		return todasDeshabilitadas;
	};
	//</editor-fold>
	
}

function koLinea(js, ajuste, opciones) {
	this.ajuste = ajuste;
	ko.mapping.fromJS(js, opciones, this);
	let self = this;
	
	/**
	 * Devuelve los datos de la línea del ajuste para el guardado.
	 * 
	 * @returns {Object}
	 */
	self.getDatos = function() {
		let cantidad		   = self.cantidadAjustar();
		let idLineaOrden	   = self.idLineaOrden;
		let ajustarEntrega	   = self.ajustarEntrega() ? 1 : 0;
		let ajustarFacturacion = self.ajustarFacturacion() ? 1 : 0;
		
		let dato = {
			cantidad		   : cantidad,
			idLineaOrden	   : idLineaOrden,
			ajustarEntrega	   : ajustarEntrega,
			ajustarFacturacion : ajustarFacturacion
		};
		return dato;
	};
	
	/**
	 * Cambia los checkbox de ajustar pendiente de entrega o pendiente de
	 * facturación.
	 * 
	 * @param {string} tipoPendiente
	 * @param {koLinea} linea
	 * @returns {void}
	 */
	self.cambiarAjustar = function(tipoPendiente, linea) {
		if (
			typeof(koOrdenCompra) !== "undefined" 
			&& (
				koOrdenCompra.ajax() 
				|| linea.deshabilitada
			)
		) {
			return;
		}
		
		if (tipoPendiente === ENTREGA && !linea.deshabilitarEntrega) {
			let ajustarEntrega = linea.ajustarEntrega();
			let opuestoEntrega = !ajustarEntrega;
			linea.ajustarEntrega(opuestoEntrega);
		}
		
		if (tipoPendiente === FACTURACION && !linea.deshabilitarFacturacion) {
			let ajustarFacturacion = linea.ajustarFacturacion();
			let opuestoFacturacion = !ajustarFacturacion;
			linea.ajustarFacturacion(opuestoFacturacion);
		}
	};
	
	/**
	 * Devuelve true si la línea del ajuste debe realizar un ajuste de entrega 
	 * o facturación.
	 * 
	 * @returns {bool}
	 */
	self.comprobarRealizaAjuste = function() {
		let ajustarEntrega	   = self.ajustarEntrega();
		let ajustarFacturacion = self.ajustarFacturacion();		
		return ajustarEntrega || ajustarFacturacion;
	};
	
}