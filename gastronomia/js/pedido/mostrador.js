var koMostrador = null;

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

//<editor-fold defaultstate="collapsed" desc="Funciones">
function omitirAcentos(text) {
	var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
	var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
	for (var i=0; i<acentos.length; i++) {
		text = text.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
	}
	return text;
}
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesMostrador = {
	'clientes' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koCliente(options.data, opcionesMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesMostrador, options.target);
			return options.target;
		}
	},
	'clienteDummy' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koCliente(options.data, opcionesMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesMostrador, options.target);
			return options.target;
		}
	},
	'productos' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koProducto(options.data, opcionesMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesMostrador, options.target);
			return options.target;
		}
	},
	'categorias' : {
		key: function(data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create : function(options) {
			var objeto = new koCategoria(options.data, opcionesMostrador);
			return objeto;
		},
		update : function(options) {
			ko.mapping.fromJS(options.data, opcionesMostrador, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self			= this;

	self.pedidoActual	= {
		cliente: ko.observable(null),
		lineas: ko.observableArray([]),
		observacionesGenerales: ko.observable("")
	};

	self.total = ko.computed(function() {
		var salida = 0;
		ko.utils.arrayForEach(self.pedidoActual.lineas(), function(linea) {
			var subtotal = parseFloat(linea.subtotal());
			salida += subtotal;
		});
		return Math.round(salida * 100) / 100;
	});

	self.pedidoVistaConfirmacion	= ko.observable(false);
	self.pedidoValido				= ko.computed(function() {
		if (self.pedidoActual.cliente() !== null && self.pedidoActual.lineas().length > 0) {
			return true;
		}
		return false;
	});

	self.cerrarVistaConfirmacion = function() {
		self.pedidoVistaConfirmacion(false);
	};

	self.confirmarPedido = function() {
		var valido = self.validarCliente(self.pedidoActual.cliente());
		if (!valido) {
			return;
		}
		if (!self.pedidoVistaConfirmacion()) {
			self.pedidoVistaConfirmacion(true);
			return;
		}
		self.guardarPedido();
	};

	self.guardarPedido = function() {
		var url					= self.urls.guardarPedido();
		self.pedidoActual.total	= self.total();
		var data		= {
			'pedido': ko.mapping.toJSON(self.pedidoActual)
		};
		var opciones = self.getAjaxOpciones({
			url: url,
			data: data,
			success: function (data, textStatus, jqXHR) {
				if (!data) {
					return;
				}
				if (data.success) {
					alerta('Su pedido se ha guardado satisfactoriamente.', 'success', $('#mensajes'));
					self.cerrarVistaConfirmacion();
					self.cancelarPedido();
				}
				if (data.error) {
					alerta(data.error, 'danger', $('#mensajes'));
					self.cerrarVistaConfirmacion();
				}
			}
		});
		$.ajax(opciones);
	};

	self.cancelarPedido = function() {
		self.pedidoActual.cliente(null);
		self.pedidoActual.lineas([]);
		self.pedidoActual.observacionesGenerales("");
		self.busquedaTelefono("");
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax		= ko.observable(false);
	self.ajaxObjeto = null;
	self.ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
			if (self.ajaxObjeto !== null) {
				var tipo = typeof self.ajaxObjeto.ajax;
				if (tipo === 'function') {
					self.ajaxObjeto.ajax(true);
				}
			}
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			alerta('Ha ocurrido el siguiente error: ' + textStatus, 'danger', $('#votacion'));
		},
		complete   : function(jqXHR, settings) {
			self.ajax(false);
			if (self.ajaxObjeto !== null) {
				var tipo = typeof self.ajaxObjeto.ajax;
				if (tipo === 'function') {
					self.ajaxObjeto.ajax(false);
				}
			}
			self.ajaxObjeto = null;
		}
	};
	self.getAjaxOpciones = function(opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, self.ajaxOpciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Cliente">
	self.clienteNuevo				= ko.mapping.fromJS(ko.mapping.toJS(self.clienteDummy), opcionesMostrador);
	self.busquedaCodigoArea			= ko.observable("3400");
	self.totalDigitosTelefono		= ko.observable(6);
	self.busquedaTelefono			= ko.observable("");
	self.busquedaClienteAjax		= ko.observable(false);
	self.busquedaClienteVacia		= ko.observable(false);
	self.erroresBusquedaClieteNuevo = ko.observableArray([]);
	self.mensajeClienteSeleccionado	= ko.observable(false);
	self.clientesBusqueda			= ko.computed(function() {
		self.busquedaClienteVacia(false);
		var salida				= null;
		var clientes			= self.clientes();
		var codigoArea			= self.busquedaCodigoArea();
		var telefono			= self.busquedaTelefono();
		var telefonoCompleto	= codigoArea + telefono;
		if (telefonoCompleto.length !== 10) {
			return salida;
		}
		ko.utils.arrayForEach(clientes, function(cliente) {
			var telefonoCliente = cliente.telefonoCompleto();
			if (telefonoCliente.indexOf(telefonoCompleto) > -1) {
				salida = cliente;
			}
		});
		if (salida === null) {
			self.busquedaClienteAjax(true);
			self.buscarCliente(codigoArea, telefono);
		}
		return salida;
	});

	self.clientesBusqueda.subscribe(function() {
		var cliente = self.clientesBusqueda();
		if (cliente !== null) {
			self.seleccionarCliente(cliente);
			self.busquedaTelefono("");
		}
	});

	self.busquedaTelefono.subscribe(function() {
		var telefono	= self.busquedaTelefono();
		var codigoArea	= self.busquedaCodigoArea();
		var total		= telefono.length + codigoArea.length;
		self.totalDigitosTelefono(10 - total);
		if (total > 10) {
			self.busquedaTelefono(self.busquedaTelefono().slice(0, -1));
		}
	});

	self.busquedaCodigoArea.subscribe(function() {
		var telefono	= self.busquedaTelefono();
		var codigoArea	= self.busquedaCodigoArea();
		var total		= telefono.length + codigoArea.length;
		self.totalDigitosTelefono(10 - total);
		if (total > 10) {
			self.busquedaCodigoArea(self.busquedaCodigoArea().slice(0, -1));
		}
	});

	self.activarAltaCliente = function() {
		self.clienteNuevo = ko.mapping.fromJS(ko.mapping.toJS(self.clienteDummy), opcionesMostrador);
		var telefono = self.busquedaTelefono();
		var codigoArea = self.busquedaCodigoArea();
		var telefonoCompleto = codigoArea + telefono;
		var telefonoCompletoSeparado = codigoArea + '-' + telefono;
		self.clienteNuevo.telefono(telefono);
		self.clienteNuevo.codigoArea(codigoArea);
		self.clienteNuevo.telefonoCompleto(telefonoCompleto);
		self.clienteNuevo.telefonoCompletoSeparado(telefonoCompletoSeparado);
		self.busquedaClienteVacia(true);
	};

	self.seleccionarCliente = function(cliente) {
		self.pedidoActual.cliente(cliente);
		self.busquedaTelefono("");
		self.mostrarMensajeClienteSeleccionado();
	};

	self.seleccionarClienteNuevo = function() {
		var valido = self.validarCliente(self.clienteNuevo);
		if (!valido) {
			return;
		}
		self.pedidoActual.cliente(self.clienteNuevo);
		self.clienteNuevo = ko.mapping.fromJS(ko.mapping.toJS(self.clienteDummy), opcionesMostrador);
		self.busquedaClienteVacia(false);
		self.busquedaTelefono("");
		self.mostrarMensajeClienteSeleccionado();
	};

	self.deseleccionarCliente = function() {
		self.pedidoActual.cliente(null);
	};

	self.mostrarMensajeClienteSeleccionado = function() {
		self.mensajeClienteSeleccionado(true);
		setTimeout((function() {
			self.mensajeClienteSeleccionado(false);
		}), 2500);
	};

	self.validarCliente = function(cliente) {
		self.erroresBusquedaClieteNuevo([]);
		if (cliente.nombre() === '' || cliente.nombre() === null) {
			self.erroresBusquedaClieteNuevo.push({mensaje: 'El nombre es obligatorio'});
		}
		if (cliente.direccionCalle() === '' || cliente.direccionCalle() === null || cliente.direccionNumero() === '' || cliente.direccionNumero() === null) {
			self.erroresBusquedaClieteNuevo.push({mensaje: 'La dirección es obligatoria'});
		}
		if (self.erroresBusquedaClieteNuevo().length > 0) {
			return false;
		}
		return true;
	};

	self.buscarCliente = function(codigoArea, telefono) {
		var url			= self.urls.buscarCliente();
		var data		= {
			codigoArea: codigoArea,
			telefono: telefono
		};
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					self.busquedaClienteAjax(false);
					if (data.error) {
						self.activarAltaCliente();
						return;
					}
					self.seleccionarCliente(ko.mapping.fromJS(data, opcionesMostrador));
				} else {
					alerta('Error', 'danger', $('#mensajes'));
				}
			}
		});
		$.ajax(opciones);
	};
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Lineas y productos">
	self.categoriaSeleccionada	= ko.observable(null);
	self.busquedaProducto		= ko.observable("");
	self.lineas					= ko.observableArray([]);
	self.lineasFiltradas		= ko.observableArray([]);
	ko.utils.arrayForEach(self.productos(), function(producto) {
		var linea = new koLinea({
			producto: producto,
			cantidad: ko.observable(0),
			subtotal: ko.observable(0)
		});
		self.lineas.push(linea);
	});
	self.lineasBusqueda = ko.computed(function() {
		var salida		= [];
		var lineas		= self.lineas();
		var busqueda	= self.busquedaProducto();
		if (busqueda === '' || busqueda.length <= 3) {
			return lineas;
		}
		ko.utils.arrayForEach(lineas, function(linea) {
			var busquedaTextoLimpio	= busqueda.toLowerCase();
			busquedaTextoLimpio		= omitirAcentos(busquedaTextoLimpio);
			if (busqueda === '' || busqueda.length <= 3) {
				return lineas;
			}
			var nombre				= linea.producto.nombre();
			nombre					= nombre.toLowerCase();
			nombre					= omitirAcentos(nombre);
			if (nombre.indexOf(busquedaTextoLimpio) > -1) {
				salida.push(linea);
			}
		});
		return salida;
	});
	self.lineasBusqueda.subscribe(function() {
		self.lineasFiltradas(self.lineasBusqueda());
	});
	self.categoriaSeleccionada.subscribe(function() {
		if (!self.categoriaSeleccionada()) {
			self.lineasFiltradas(self.lineas());
			return;
		}
		var salida	= [];
		self.lineasFiltradas(self.lineas());
		var id		= self.categoriaSeleccionada().id();
		ko.utils.arrayForEach(self.lineasFiltradas(), function(linea) {
			var categorias = linea.producto.categorias();
			ko.utils.arrayForEach(categorias, function(categoria) {
				if (categoria.id() === id) {
					salida.push(linea);
				}
			});
		});
		self.lineasFiltradas(salida);
	});

	self.agregarLinea = function(linea) {
		var esLineaDuplicada	= false;
		ko.utils.arrayForEach(self.pedidoActual.lineas(), function(lineaConfirmada) {
			if (lineaConfirmada.producto.id() === linea.producto.id()) {
				var cantidadAgregar		= parseInt(linea.cantidad());
				var cantidadEstablecida	= parseInt(lineaConfirmada.cantidad());
				var cantidadTotal		= cantidadAgregar + cantidadEstablecida;
				lineaConfirmada.cantidad(cantidadTotal);
				esLineaDuplicada = true;
			}
		});
		if (esLineaDuplicada) {
			linea.cantidad(0);
			return;
		}
		var lineaClon = new koLinea(ko.mapping.fromJS(ko.mapping.toJS(linea)));
		self.pedidoActual.lineas.push(lineaClon);
		linea.cantidad(0);
	};

	self.removerLinea = function(linea) {
		self.pedidoActual.lineas.remove(linea);
	};
	//</editor-fold>

}

function koLinea(data) {
	var self = this;
	self.producto = data.producto;
	self.cantidad = data.cantidad;
	self.subtotal = ko.computed(function() {
		var precio		= parseFloat(self.producto.precio());
		var cantidad	= parseInt(self.cantidad());
		if (Number.isNaN(cantidad)) {
			cantidad = 0;
		}
		var salida = precio * cantidad;
		return Math.round(salida * 100) / 100;
	});

	self.sumarCantidad = function(linea) {
		linea.cantidad(parseInt(linea.cantidad()) + 1);
	};
	self.sumarMediaDocenaCantidad = function(linea) {
		linea.cantidad(parseInt(linea.cantidad()) + 6);
	};
	self.sumarDocenaCantidad = function(linea) {
		linea.cantidad(parseInt(linea.cantidad()) + 12);
	};
	self.restarCantidad = function(linea) {
		if (parseInt(linea.cantidad()) !== 0) {
			linea.cantidad(parseInt(linea.cantidad()) - 1);
		}
	};
}

function koCliente(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koProducto(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

function koCategoria(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
}

$(document).ready(function () {
	var $mostrador = $('#mostrador');
	ko.options.deferUpdates = true;
	koMostrador = new koPantalla(jsonMostrador, opcionesMostrador);
	ko.applyBindings(koMostrador, $mostrador.get(0));
	koMostrador.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function(){
		$('.mostrador-placeholder-contenido').fadeOut('slow',function(){$(this).remove();});
	});
});