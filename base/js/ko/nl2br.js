ko.bindingHandlers.nl2br = {
	update: function (
			element,
			valueAccessor,
			allBindingsAccessor,
			viewModel,
			bindingContext
			) {
		var field = ko.utils.unwrapObservable(valueAccessor());
		field = field.replace(/\n/g, "<br />");
		ko.bindingHandlers.html.update(element, function () {
			return field;
		});
	}
};