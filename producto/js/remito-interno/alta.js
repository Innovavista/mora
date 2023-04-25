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
	ko.mapping.fromJS(js, opciones, this);
	var self = this;
	
	self.ajax = ko.observable(false);
	
	//<editor-fold defaultstate="collapsed" desc="Filtrado">
	self.busqueda		  = ko.observable("");
	self.busquedaCodigo	  = ko.observable("");
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
	 * Despachables filtrados por campos tipo y nombre, además quita los 
	 * despachables que ya fueron agregados al remito y los ordena por nombre.
	 * 
	 * Los tipos de despachables son productos y presentaciones.
	 */
	self.despachablesFiltrados = ko.pureComputed(function() {
		var tipo		 = self.tipoItem();
		var despachables = self.filtrarDespachables(tipo);
		return despachables;
	});
	
	/**
	 * Filtra los items despachables según el tipo, el nombre y el código de 
	 * barras.
	 * 
	 * @param {String} tipo
	 * @returns {Array}
	 */
	self.filtrarDespachables = function(tipo) {
		var tipoProductos = tipo === TIPO_PRODUCTO;
		var despachables  = tipoProductos ? self.productos : self.presentaciones;
				
		var salida		   = [];
		var lineas		   = self.remito.lineas();
		var busqueda	   = self.busqueda();
		var filtrarCodigo  = self.filtrarPorCodigo();
		var busquedaCodigo = self.busquedaCodigo();
		for (var i = 0; despachables.length > i; i++) {
			var despachable = despachables[i];
			var idBuscar    = parseInt(despachable.id);
			var codigo	    = despachable.codigo;
			
			var encontrado = lineas.find(function(linea) {
				var buscar	   = linea.despachable;
				var idActual   = parseInt(buscar.id);
				var tipoActual = buscar.tipo;
				var existe     = idActual === idBuscar && tipo === tipoActual;
				return existe;
			});
			
			var noFueDespachado = encontrado === undefined;
			var nombre			= despachable.nombre;
			var nombreLimpio	= self.limpiarBusqueda(nombre);
			var busquedaLimpia	= self.limpiarBusqueda(busqueda);
			var buscarPorNombre = busquedaLimpia === "" || (
				nombreLimpio.indexOf(busquedaLimpia) > -1
			);
			var buscarPorCodigo = !filtrarCodigo 
				|| (filtrarCodigo && codigo.indexOf(busquedaCodigo) > -1);
			
			if (noFueDespachado && buscarPorNombre && buscarPorCodigo) {
				salida.push(despachable);
			}
		}
		salida.sort(function (l, r) {
			return l.nombre.toLowerCase() > r.nombre.toLowerCase() ? 1 : -1;
		});
		return salida;
	};
	
	/**
	 * Busca un despachable por código si existe un único despachable que 
	 * coincida con el código. Si coinciden más de uno no busca ni filtra.
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
				
		var despachables = self.despachablesFiltrados().filter(function(despachable) {
			return despachable.codigo.indexOf(value) > -1;
		});
		
		if (despachables.length === 1) {
			var despachable = despachables[0];
			self.remito.agregarLinea(despachable);
			return true;
		}
		if (despachables.length > 1 && presionoEnter) {
			// Si hay más de uno filtro por código.
			self.filtrarPorCodigo(true);
		}
		return false;
	};
	//</editor-fold>
	
	self.guardar = function() {
		var valido = self.remito.comprobarValidez(true);
		if (!valido) {
			return;
		}
		
		var url	   = self.urls.guardar;
		var remito = self.remito.getDatos();
		var data   = {
			remito : remito
		};
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (typeof data.resultado === 'undefined' || typeof data.resultado.exito === 'undefined' || !data.resultado.exito) {
					Notificacion('Ha ocurrido un error al guardar el remito interno, vuelva a intentar.', 'error');
					return;
				}
				
				Notificacion('El remito interno se ha guardado con éxito.', 'success');
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
	var $seccion = $('#remito-interno-alta');
	ko.options.deferUpdates = true;
	koRemitoInterno = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koRemitoInterno, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
}); 