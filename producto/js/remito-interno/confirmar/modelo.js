/* global ko */

//<editor-fold defaultstate="collapsed" desc="Configuración">
var opcionesPantalla = {
	'observe'  : [""],
	'remito'   : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			opcionesPantalla["observe"] = ["fechaConfirmacion"];
			var objeto = new koRemito(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	},
    'lineas'   : {
		key: function (data) {
			return ko.utils.unwrapObservable(data.id);
		},
		create: function (options) {
			var objeto = new koLinea(options.data, opcionesPantalla);
			return objeto;
		},
		update: function (options) {
			ko.mapping.fromJS(options.data, opcionesPantalla, options.target);
			return options.target;
		}
	}
};
//</editor-fold>

function koRemito(js, opciones) {
	ko.mapping.fromJS(js, opciones, this);
	var self = this;

	//<editor-fold defaultstate="collapsed" desc="Firma digital">
	var canvas		 = document.getElementById("remito-interno-firma");
	var signaturePad = new SignaturePad(canvas, {
	  backgroundColor: 'rgb(255, 255, 255)'
	});

	self.firma = signaturePad;

	/**
	 * Limpia la firma digital realizada.
	 *
	 * @returns {void}
	 */
	self.limpiarFirma = function() {
		var firma = self.firma;
		firma.clear();
	};
	//</editor-fold>

	/**
	 * Comprueba que haya seleccionado una fecha.
	 *
	 * @param {Boolean} mostrar
	 * @returns {Boolean}
	 */
	self.comprobarValidez = function(mostrar) {
		var errores = [];

		var fecha   = self.fechaConfirmacion();
		var momento = moment(fecha);
		var valida  = momento.isValid();
		if (!valida) {
			errores.push("Debe seleccionar una fecha válida.");
		}

		if (mostrar) {
			errores.forEach(error => Notificacion(error, 'error'));
		}

		return errores.length === 0;
	};

}

function koLinea(js, opciones) {
    ko.mapping.fromJS(js, opciones, this);
	var self = this;

    self.cantidadRecibida = ko.observable(self.cantidad);
    self.observacionesRecepcion = ko.observable("");

    self.data = function() {
        return {
            'id'                     : self.id,
            'cantidadRecibida'       : self.cantidadRecibida(),
            'observacionesRecepcion' : self.observacionesRecepcion()
        };
    };
}