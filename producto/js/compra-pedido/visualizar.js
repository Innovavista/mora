/* global ko, moment */

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

ko.bindingHandlers['tooltipster'] = {
    init: function(element, valueAccessor){
        $(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay:	200,
			side: 'top',
			contentCloning: true
		});
    }
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.hoy		= moment().format('YYYY-MM-DD');
	self.ajax		= ko.observable(false);
	self.alertar    = ko.observable(false);
	self.visualizar = ko.observable(true);

	self.deshabilitarTabs   = false;
	self.deshabilitarCampos = true;

	//<editor-fold defaultstate="collapsed" desc="Tipo interno">
	if (json.pedido.fecha.fechaMysql) {
		self.pedido.fecha = json.pedido.fecha.fechaMysql;
	}

	let unidades = self.unidades;
	if (ko.isObservable(self.pedido.lineas)) {
		ko.utils.arrayForEach(self.pedido.lineas(), function(linea) {
			linea.agregarOpcionesUnidades(unidades);
		});
	}

	self.buscarDeposito = function(id) {
		var deposito = ko.utils.arrayFirst(self.depositos(), function(deposito) {
			return deposito.id() === id;
		});
		return deposito;
	};

	if (!ko.isObservable(self.pedido.deposito)) {
		var deposito = self.pedido.deposito;
		if (self.pedido.deposito && ko.isObservable(self.pedido.deposito.id)) {
			var idDeposito = self.pedido.deposito.id();
			deposito = self.buscarDeposito(idDeposito);
			self.pedido.deposito = ko.observable(deposito);
		}
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Tipo consolidado">
	var alta				    = self.alta();
	self.mostrarTabInternos		= ko.observable(alta);
	self.mostrarTabConsolidados = ko.observable(!alta);

	self.cantidadInternas = self.pedidos().length.toString() + " disponibles";

	self.cambiarTab = function(interno) {
		var alta = self.alta();
		if (alta) {
			return;
		}
		var consolidado = !interno;
		self.mostrarTabInternos(interno);
		self.mostrarTabConsolidados(consolidado);
	};

	/**
	 * Deshabilita todos los inputs relaciones al pedido consolidado.
	 *
	 * @returns {undefined}
	 */
	self.deshabilitarConsolidado = function() {
		if (ko.isObservable(self.agrupamientos)) {
			var agrupamientos = self.agrupamientos();
			for (var i = 0; i < agrupamientos.length; i++) {
				var agrupamiento = agrupamientos[i];
				agrupamiento.deshabilitarLineas();
			}
		}

	};

	if (self.tipoConsolidado()) {
		self.deshabilitarConsolidado();
	}

	//</editor-fold>

}

$(document).ready(function () {
	var $seccion = $('#compra-pedido-visualizar');
	ko.options.deferUpdates = true;
	koPedidoVer = new koPantalla(json, opcionesPantalla);
	ko.applyBindings(koPedidoVer, $seccion.get(0));
	ko.tasks.runEarly();

	$(window).load(function () {
		$(".preloader-container").fadeOut('slow', function () {
			$(this).remove();
		});
	});
});

