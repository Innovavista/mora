ko.components.register('comensal-buscador', {
    viewModel: function(params) {
		var self = this;

		self.busqueda				= ko.observable("");
		self.ajax					= params.ajax;
		self.tituloBusqueda			= params.tituloBusqueda;
		self.focus					= ko.observable(true);
		self.comensal				= params.comensal						? params.comensal	 : false;
		self.seleccionar			= params.seleccionar && params.comensal ? params.seleccionar : false;

		self.comprobarPuedeSeleccionar = ko.computed(function() {
			var	ajax	 = self.ajax();
			var comensal = null;

			if (self.comensal !== false) {
				comensal = self.comensal();
			}

			return comensal !== null && !ajax;
		});

		self.onEnterBusqueda = function(data, event) {
			if (event.keyCode === 13) {
				self.buscarComensal();
			}
			$('select').unbind();
			return true;
		};

		self.buscarComensal = function() {
			params.buscarComensal({ busqueda: self.busqueda() });
		};
    },
	template: { element: 'componente-comensal-buscador' }
});

