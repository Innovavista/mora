//<editor-fold defaultstate="collapsed" desc="Binding: moneda">
var formatoNumero = {
	groupSeparator: ".",
	radixPoint: ',',
	alias: "numeric",
	placeholder: "0",
	autoGroup: !0,
	digits: 2,
	digitsOptional: !1,
	clearMaskOnLostFocus: !1
};

var formatearNumero = function(valor) {
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
	return final;
};

ko.bindingHandlers.moneda = {
	update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var valor = parseFloat(ko.utils.unwrapObservable(valueAccessor()));
		if (isNaN(valor)) {
			return;
		}
		final = formatearNumero(valor);
		$(element).html('<span>$ </span> ' + final);
	}
};
//</editor-fold>

function koPantalla(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.precio	= ko.observable(null);
	self.fecha	= ko.observable(moment().format('YYYY-MM-DD'));

	/**
	 * Determina si la fecha que se quiere definir es válida. Esta
	 * lo es cuando no es anterior a la fecha del día.
	 *
	 * @param {String} fechaNueva
	 * @returns {void}
	 */
	self.fecha.subscribe(function(fechaNueva) {
		var ahora = moment().format('YYYY-MM-DD');
		if (moment(fechaNueva).isBefore(ahora)) {
			self.fecha(ahora);
			return;
		}
		return true;
	});

	/**
	 * Ordena los precios por su fecha.
	 *
	 * @returns {void}
	 */
	self.ordenarPrecios = function() {
		self.precios.sort(function (l, r) {
			var fecha1 = moment(l.fecha.fechaMysql());
			var fecha2 = moment(r.fecha.fechaMysql());
			return moment(fecha1).isBefore(fecha2) ? 1 : -1;
		});
	};

	/**
	 * Devuelve el precio vigente o null en caso que no haya.
	 *
	 * Además, asignará vigente(true) al mismo y al resto vigente(false).
	 *
	 * @returns {void}
	 */
	self.precioVigente = ko.computed(function() {
		//Debido a que los precios están en orden descendente, el primer precio
		//cuya fecha de vigencia sea menor o igual a la actual será el vigente.
		var actual  = null;
		var precios = self.precios();
		for (var i = 0; i < precios.length; i++) {
			var precio = precios[i];
			var fecha  = moment(precio.fecha.fechaMysql());
			if (fecha.isSameOrBefore() && actual === null) {
				actual = precio;
			}
			precio.vigente(false);
		}
		if (actual !== null) {
			actual.vigente(true);
		}
		return actual;
	});

	/**
	 * Crea y agrega un precio al array de precios.
	 *
	 * @param {Object} data
	 * @returns {void}
	 */
	self.agregarPrecio = function(data) {
		var precio = data.precio;
		var fecha  = moment(data.fecha).hour(00).minute(00).second(00);
		self.precios.push(new koPrecio({
			precio: precio,
			fecha: {
				fecha: ko.observable(moment(fecha).format('DD/MM/YYYY')),
				fechaMysql: ko.observable(moment(fecha).format('YYYY-MM-DD'))
			}
		}, opcionesPantalla));
		self.ordenarPrecios();
	};

	/**
	 * Reinicia el formulario con los datos iniciales.
	 *
	 * @returns {void}
	 */
	self.limpiarForm = function() {
		var ahora = moment().format('YYYY-MM-DD');
		self.precio(null);
		self.fecha(ahora);
	};

	/**
	 * Computed que determina si hay precios próximos en el histórico.
	 *
	 * @returns {Boolean}
	 */
	self.hayPreciosProximos = ko.computed(function() {
		var salida = false;
		var precios = self.precios();
		for (var i = 0; i < precios.length; i++) {
			if (precios[i].comprobarEsProximo()) {
				salida = true;
				break;
			}
		}
		return salida;
	});

	/**
	 * Computed que determina si hay precios pasados en el histórico.
	 *
	 * @returns {Boolean}
	 */
	self.hayPreciosPasados = ko.computed(function() {
		var salida = false;
		var precios = self.precios();
		for (var i = 0; i < precios.length; i++) {
			var precio = precios[i];
			var fecha  = moment(precio.fecha.fechaMysql());
			if (fecha.isBefore()) {
				salida = true;
				break;
			}
		}
		return salida;
	});

	/**
	 * Computed que determina si se puede guardar el nuevo precio.
	 *
	 * @returns {Boolean}
	 */
	self.guardarInvalido = ko.computed(function() {
		if (self.precio() === null || self.precio() === '') {
			return true;
		}
		if (self.fecha() === null ||self.fecha === '') {
			return true;
		}
		return false;
	});

	/**
	 * Validación de la fecha del nuevo precio que no sea igual a otra
	 * fecha de un precio existente.
	 *
	 * @returns {Boolean}
	 */
	self.validarFecha = function() {
		var salida  = true;
		var precios = self.precios();
		for (var i = 0; i < precios.length; i++) {
			var fechaNuevo			= moment(self.fecha()).hour(00).minute(00).second(00);
			var fechaNuevoString	= moment(fechaNuevo).format('YYYY-MM-DD');
			var fechaPrecio			= precios[i].fecha.fechaMysql();
			if (fechaNuevoString === fechaPrecio) {
				salida = false;
				break;
			}
		}
		return salida;
	};

	self.guardar = function(categoria) {
		swal({
			title: 'Confirme los datos',
			html: '<span>Precio: $' + formatearNumero(self.precio()) + '</span><br/><span>Fecha: ' + moment(self.fecha()).format('DD/MM/YYYY') + '</span>',
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Aceptar',
			cancelButtonText: 'Cancelar',
			confirmButtonColor: '#58db83',
			cancelButtonColor: '#F44336',
			showLoaderOnConfirm: true
		}).then(function(resultado) {
			if (resultado.value !== true) {
				return;
			}
			if (!self.validarFecha()) {
				Notificacion('Ya existe un precio con esa fecha.', 'error');
				return;
			}
			self.procesarGuardado(categoria);
		});
	};

	/**
	 * Procesa el ajax del guardado del nuevo precio.
	 *
	 * @returns {void}
	 */
	self.procesarGuardado = function(categoria) {
		var url		= self.urlGuardar();
		var data	= {
			precio		: self.precio(),
			fecha		: self.fecha(),
			idEntidad	: self.idEntidad()
		};
		if (categoria) {
			data.idCategoria = categoria.id();
		}
		data = { json: ko.mapping.toJSON(data) };
		var opciones	= self.getAjaxOpciones({
			url		: url,
			data	: data,
			success : function (data, textStatus, jqXHR) {
				if (data) {
					if (data.error) {
						Notificacion(data.error, 'error');
						return;
					}
					self.agregarPrecio({
						precio: self.precio(),
						fecha: self.fecha()
					});
					self.limpiarForm();
					Notificacion('Guardado exitoso', 'success');
				} else {
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

function koPrecio(json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	//Si es vigente o no se calculo en el subscribe de koPantalla::precios
	self.vigente			= ko.observable(false);
	self.comprobarEsVigente = ko.computed(function() {
		return self.vigente();
	});
	self.comprobarEsProximo = ko.computed(function() {
		var ahora = moment().format('YYYY-MM-DD');
		if (moment(ahora).isBefore(self.fecha.fechaMysql())) {
			return true;
		}
		return false;
	});
}

