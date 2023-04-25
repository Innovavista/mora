ko.components.register('comensal-resultado', {
    viewModel: function(params) {
		var self = this;

		self.comensal				= params.comensal;
		self.comensalNoEncontrado	= params.comensalNoEncontrado;
		self.limpiarComensal		= params.limpiarComensal ? params.limpiarComensal : function() {};
		self.mostrarAlta			= params.mostrarAlta;
		self.mostrarOperaciones		= params.mostrarOperaciones;
		self.buscando				= params.buscando;
		self.ajax					= params.ajax;

		self.limpiarComensalActual = function() {
			self.limpiarComensal();
		};

		self.cerrarComensalNoEncontrado = function() {
			self.comensalNoEncontrado(false);
		};

    },
	template: { element: 'componente-comensal-resultado' }
});

