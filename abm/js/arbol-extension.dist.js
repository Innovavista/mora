// Extiendo funcionalidad de arbol.js
// Código obtenido de: http://coreymaynard.com/blog/extending-a-javascript-function/
// Create an anonymous function to wrap everything in. This gets called immediately
// on script load.
(function() {
    // Store a copy of the original function that will be extended so that we can call
    // it in our new function
    var arbolOriginal = arbolModelo;

    // Create a new function with the same name as the function we're extending.
    // This overrides the existing one, so that all calls to that function call this
    // new one instead
    arbolModelo = function() {
		var self = this;

        // Call the original function, and pass the arguments to it, storing the return
        // value in a new variable
        arbolOriginal.apply(this, arguments);

		// Additional work can be done after the original function has run as well:
		self.tablas = function($parent) {
			$parent.tablas(self);
		};
    };
})();

// Create an anonymous function to wrap everything in. This gets called immediately
// on script load.
(function() {
    // Store a copy of the original function that will be extended so that we can call
    // it in our new function
    var arbolTipoHijoOriginal = arbolTipoHijo;

    // Create a new function with the same name as the function we're extending.
    // This overrides the existing one, so that all calls to that function call this
    // new one instead
    arbolTipoHijo = function() {
		var self = this;

        // Call the original function, and pass the arguments to it, storing the return
        // value in a new variable
        arbolTipoHijoOriginal.apply(this, arguments);

		// Additional work can be done after the original function has run as well:
		self.tablas = function(objeto) {
			var controlador		= self.controlador();
			var id				= objeto.id();
			var url				= '/' + controlador + '/editar/tablas/' + id + '?layout=iframe';
			var $formulario		= $('.arbol-formulario');
			var opcionesEditar	= {
				method		: "GET",
				url			: url,
				data		: arbolAjaxDatos(self),
				beforeSend	: function(jqXHR, settings) {
					modelo.ajax(true);
					modelo.editandoComenzar(self, 'Tablas de ' + self.singular().toLowerCase() + ' "' + objeto.nombre() + '"');
					self.editando(true);
				},
				success		: function(data, textStatus, jqXHR) {
					$formulario.replaceWith('<div class="arbol-formulario">' + data + '</div>');
					var $editar = $('.arbol-formulario form');
					arbolFormulario($editar, url, self);
				},
				error	: function(jqXHR, textStatus, errorThrown) {
					alerta('Ha ocurrido el siguiente error: ' + textStatus + ' - '
							+ errorThrown + '. Vuelva a intentar', 'danger', $formulario
					);
				},
				complete: function(jqXHR, textStatus ) {
					modelo.ajax(false);
				}
			};
			$.ajax(opcionesEditar);
		};
    };
})();
