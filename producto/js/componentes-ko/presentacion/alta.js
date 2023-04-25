/* global ko */

ko.components.register('presentacion-alta', {
	viewModel: function(params) {
		var self = this;
		self.destino		= params.destino;

		self.presentaciones	= params.presentaciones;
		self.envases		= params.envases;
		self.unidadesMedida	= params.unidadesMedida;
		self.marcas			= params.marcas;

		self.esCompuesta	= ko.computed(function() {
			if (!self.unidadesMedida || !self.marcas && self.presentaciones) {
				return true;
			}
			return false;
		});
	},
	template: { element: 'componente-presentacion-alta' }
});

