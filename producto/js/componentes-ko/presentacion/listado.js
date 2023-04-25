/* global ko */

//<editor-fold defaultstate="collapsed" desc="Tooltipster">
ko.bindingHandlers['tooltipster'] = {
    init: function(element, valueAccessor){
        $(element).tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay:	200,
			side: 'top',
			maxWidth: 350,
			contentCloning: true
		});
    }
};
//</editor-fold>

ko.components.register('presentacion-listado', {
	viewModel: function(params) {
		var self = this;

		self.nombre					= params.nombre;
		self.nombreLargo			= params.nombreLargo;
		self.deReferencia			= params.deReferencia;
		self.ventaDirecta			= params.ventaDirecta;
		self.componeA				= params.componeA;
		self.componeAPresentaciones = params.componeAPresentaciones;

		self.recursivo				= params.recursivo;
		self.onClickRemover			= params.onClickRemover;
		self.onClickEditar			= params.onClickEditar;
	},
	template: { element: 'componente-presentacion-listado' }
});

