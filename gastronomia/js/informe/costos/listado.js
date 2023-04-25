var koCostos = null;

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
		var final = Inputmask.format(valor, formatoNumero);
		var partes = final.split(',');
		if (partes.length === 1) {
			final += ',00';
		} else if (partes.length > 1) {
			var decimales = partes[partes.length - 1];
			if (decimales.length === 1) {
				final += '0';
			}
		}
		$(element).html('$ ' + final);
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;
	
	self.paginaActual   = ko.observable(1);
	self.paginaAnterior = ko.observable(null);
	
	self.textoUnidad = ko.computed(function() {
		let lineas		 = self.lineas();
		let linea		 = lineas[0];
		let unidad		 = "unidad";
		if (!linea) {
			return "Precio por " + unidad;
		}
		let presentacion = linea.presentacion;
		let mercaderia   = ko.isObservable(presentacion.mercaderia) ? presentacion.mercaderia() : presentacion.mercaderia;
		let materiaPrima = ko.isObservable(presentacion.materiaPrima) ? presentacion.materiaPrima() : presentacion.materiaPrima;
		if (mercaderia) {
			unidad = mercaderia.unidad.getUnidad();
		}
		if (materiaPrima) {
			unidad = materiaPrima.unidad.getUnidad();
		}
		return "Precio por " + unidad;
	});
	
	self.buscarConPaginacion = function(posterior) {
		let actual = self.paginaActual();
		self.paginaAnterior(actual);
		if (posterior) {
			pagina = actual + 1;
		} else {
			pagina = actual > 1 ? actual - 1 : 1;
		}
		self.paginaActual(pagina);
		self.buscarLineas(pagina);
	};
	
	self.getTextoPaginacion = function(posterior) {
		let texto = posterior ? "Siguiente" : "Anterior";
		let cantidad = posterior ? self.siguientes() : self.cantidad();
		if (cantidad > 1) {
			texto += posterior ? "s" : "es";
		} else {
			cantidad = "";
		}
		return texto + " " + cantidad;
	};
	
	self.textoPaginacionAnterior = ko.computed(function() {
		return self.getTextoPaginacion(false);
	});
	
	self.textoPaginacionPosterior = ko.computed(function() {
		return self.getTextoPaginacion(true);
	});
	
	self.comprobarPaginacionAnterior = ko.computed(function() {
		let actual = self.paginaActual();
		return actual > 1;
	});
	
	self.comprobarPaginacionPosterior = ko.computed(function() {
		let actual  = self.paginaActual();
		let paginas = self.paginas();
		return actual < paginas;
	});

	self.buscarLineas = function(pagina) {
		var url		= self.urls.buscarLineas();
		var data	= { costos: self.costos(), pagina: pagina};
		data		= { json: ko.mapping.toJSON(data) };
		self.lineas([]);
		var opciones = self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						self.paginaActual(self.paginaAnterior());
						Notificacion(data.error, 'error');
						return;
					}
					if (data.success) {
						var lineas = ko.mapping.fromJS(data.lineas, opcionesPantalla.lineas);
						self.lineas(lineas());
						self.siguientes(data.siguientes);
						self.paginaActual(pagina);
					} else {
						self.paginaActual(self.paginaAnterior());
						Notificacion('Hubo un error al buscar el detalle de los artículos', 'error');
					}
				} else {
					self.paginaActual(self.paginaAnterior());
					Notificacion('Error', 'error');
				}
			}
		});
		$.ajax(opciones);
	};

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	self.ajax		= ko.observable(false);
	self.ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			self.ajax(true);
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			alerta('Ha ocurrido el siguiente error: ' + textStatus, 'danger', $('#votacion'));
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

$(document).ready(function () {
	var $seccion = $('#informe-costos');
	ko.options.deferUpdates = true;
	koCostos = new koPantalla(jsonLineas, opcionesPantalla);
	ko.applyBindings(koCostos, $seccion.get(0));
	koCostos.inicializando = false;
	ko.tasks.runEarly();

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});

