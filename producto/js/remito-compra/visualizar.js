/* global ko, opcionesPantalla, json */

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

	self.ajax = ko.observable(false);

	self.abrirModalPresentaciones = function() {
		//Función definida para reutilizar partial.
	};

	var proveedor = self.remito.proveedor();
	if (proveedor && !isNaN(proveedor.id)) {
		var proveedores  = [proveedor];
		self.proveedores = ko.observable(proveedores);
		self.remito.proveedor(proveedor);

		ko.tasks.runEarly();
		$('.selectpicker').selectpicker('refresh');
	}

	//<editor-fold defaultstate="collapsed" desc="Botones">
	self.titleListar  = "Volver al listado de remitos de compra";
	//</editor-fold>	
}

$(document).ready(function () {
	var $seccion = $('#remito-compra-visualizar');
	ko.options.deferUpdates = true;
	koRemitoCompra = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koRemitoCompra, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});