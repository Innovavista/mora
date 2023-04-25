

/* global ko */

/**
 * Representa el componente KO para seleccionar platos por tipo.
 *
 * @param {Observable} seleccion			| Entidad que contiene / tendrá los platos seleccionados.
 * @param {ObservableArray} tipos			| Tipos de platos con los platos mismos.
 * @param {Function} callbackSeleccionar	| Callback para ejecutar cuando se selecciona un plato.
 * @param {Function} callbackDeseleccionar	| Callback para ejecutar cuando se deselecciona un plato.
 * @param {Integer} limite					| Un límite de selección de platos. (opcional)
 *
 * @returns {void}
 */
ko.components.register('plato-seleccion', {
	viewModel: function(params) {
		var self = this;

		self.entidad				= params.seleccion;
		self.callbackSeleccionar	= params.callbackSeleccionar;
		self.callbackDeseleccionar	= params.callbackDeseleccionar ? params.callbackDeseleccionar : function() {};
		self.limite					= params.limite ? params.limite : false;

		if (ko.isObservable(self.limite)) {
			self.limite = self.limite();
		}

		self.tipos = ko.observableArray([]);

		var tipos = params.tipos();
		ko.utils.arrayForEach(tipos, function(tipo) {
			var tipoNuevo = new Tipo(tipo);
			self.tipos.push(tipoNuevo);
		});

		/**
		 * Función para seleccionar/desleccionar un plato ejecutando la
		 * callback pasada por parámetro que corresponda.
		 *
		 * @param {Object} plato
		 * @param {Object} tipo
		 * @param {Object} entidad
		 *
		 * @returns {void}
		 */
		self.seleccionar = function(plato, tipo, entidad) {
			var seleccionados = entidad.platosSeleccionados();
			if (seleccionados[tipo.id()] && seleccionados[tipo.id()].indexOf(plato.id()) !== -1) {
				self.callbackDeseleccionar(plato, tipo, entidad);
			} else {
				if (self.limite !== false) {
					var cantidad = entidad.cantidadPlatosSeleccionados();
					if (parseInt(self.limite) === cantidad) {
						return;
					}
				}
				self.callbackSeleccionar(plato, tipo, entidad);
			}
		};

		/**
		 * Indica cuantos platos restan por seleccionar.
		 *
		 * @returns {Integer}
		 */
		self.platosRestantes = ko.computed(function() {
			if (self.limite === false || !self.entidad()) {
				return false;
			}
			var cantidad = self.entidad().cantidadPlatosSeleccionados();
			return parseInt(self.limite) - cantidad;
		});

		/**
		 * Indica si el límite de platos seleccionados fue alcanzado,
		 * en caso de que corresponda.
		 *
		 * @returns {Boolean}
		 */
		self.limiteAlcanzado = ko.computed(function() {
			if (self.limite === false || !self.entidad()) {
				return false;
			}
			var cantidad = self.entidad().cantidadPlatosSeleccionados();
			return parseInt(self.limite) === cantidad;
		});

		/**
		 * Cierra la selección de platos.
		 *
		 * @returns {void}
		 */
		self.cerrar = function () {
			self.entidad(null);
		};
	},
	template: { element: 'componente-plato-seleccion' }
});

/**
 * Representa un tipo de plato. Este es necesario para poder realizar
 * la búsqueda de platos por tipo.
 *
 * @param {Object|JSON} json
 *
 * @returns {Tipo}
 */
function Tipo(json) {
	ko.mapping.fromJS(json, {}, this);
	var self = this;

	self.busqueda			= ko.observable('');
	self.platosFiltrados	= ko.computed(function() {
		var salida		= [];
		var platos		= self.platos();
		var busqueda	= self.busqueda();
		if (busqueda === '' || busqueda.length <= 3) {
			return platos;
		}
		ko.utils.arrayForEach(platos, function(plato) {
			var busquedaTextoLimpio	= busqueda.toLowerCase();
			busquedaTextoLimpio		= self.omitirAcentos(busquedaTextoLimpio);
			if (busqueda === '' || busqueda.length <= 3) {
				return platos;
			}
			var nombre				= plato.nombre();
			nombre					= nombre.toLowerCase();
			nombre					= self.omitirAcentos(nombre);
			if (nombre.indexOf(busquedaTextoLimpio) > -1) {
				salida.push(plato);
			}
		});
		return salida;
	});


	self.omitirAcentos = function(text) {
		var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
		var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
		for (var i=0; i<acentos.length; i++) {
			text = text.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
		}
		return text;
	};
}

