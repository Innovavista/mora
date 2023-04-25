ko.components.register('plato-modal', {
    viewModel: function(params) {
		var self = this;

		self.plato		= params.plato;
		self.cargando	= params.cargando;

		self.cerrar = function() {
			self.plato(null);
			$("#plato-modal").modal('hide');
		};

    },
	template: { element: 'componente-plato-modal' }
});



