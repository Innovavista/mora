
function ViewModel(options, index) {
	var self = this;
	
	self.hasCardFooterActions  = options.hasCardFooterActions;
	self.items = options.items;
	
	self.cantItems = ko.computed(function() {
		return self.items ? self.items.length : 0;
	});
	
	self.index = ko.observable(index);

	self.currentItem = ko.computed(function () {
		return self.items.find(function(item, i) {
			return i === self.index();
		});
	});

	self.currentItemHasLabel = ko.computed(function () {
		var currentItem = self.currentItem();
		return !!(currentItem && currentItem.label);
	});

	self.currentItemLabel = ko.computed(function () {
		var currentItem = self.currentItem();
		return (currentItem && currentItem.label) ? currentItem.label : "";
	});
	
	self.currentItemHasAccionFab= ko.computed(function() {
		var currentItem = self.currentItem();
		return !!(currentItem && currentItem.accionFab);
	});
	
	self.currentItemAccionFab = ko.computed(function() {
		var salida = "";
		var currentItem = self.currentItem();
		if(self.currentItemHasAccionFab()) {
			salida = currentItem.accionFab;
		}
		return salida;
	});

	self.indexMostrable = ko.computed(function () {
		return self.index() + 1;
	});

	self.hasNext = ko.computed(function () {
		return self.cantItems() - self.index() > 1;
	});

	self.hasPrev = ko.computed(function () {
		return self.index() > 0;
	});

	self.next = function () {
		self.index(self.index() + 1);
	};

	self.prev = function () {
		self.index(self.index() - 1);
	};
	
	
	self.mustShowFooter = ko.computed(function() {
		return self.cantItems() > 1 || self.currentItemHasLabel() || self.currentItemHasAccionFab() || self.hasCardFooterActions;
	});
}



$(document).ready(function () {

	$('[data-c="card-deslizable"]').each(function () {
		
		var $card = $(this);
		var options = $card.data('options');
		var items = [];
		$card.find('[data-c="card-deslizable-item"]').each(function (index) {
			var $item = $(this);
			items.push({
				index: index,
				label: $item.data('label'),
				accionFab: $item.data('accion-fab')
			});
		});
		options.items = items;
		var viewModel = new ViewModel(options, 0);
		ko.applyBindings(viewModel, this);
	});

});