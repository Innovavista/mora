/**
 * BindingHandler para agregar acceso por teclado a alguna función en pantalla.
 *
 * Ejemplos:
 * Agregar acceso rápido al click de un botón:
 * <button data-bind="click: $root.accion, hotkey: 'ctrl+a'"><b>Ctrl+A</b>: Acción</button>
 *
 * Agregar acceso rápido una función específica:
 * <button data-bind="hotkey: {trigger: 'ctrl+a', action: $root.accion}"><b>Ctrl+A</b>: Acción</button>
 *
 * Documentación en:
 * http://fantastico.innovavista.net/articulo/articulo/105
 */
ko.bindingHandlers.hotkey = {
	init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
		var options = ko.utils.unwrapObservable(valueAccessor());

		if (typeof options === "object") {
			var trigger = options.trigger.toLowerCase();
			var action = options.action;
		} else {
			var trigger = options;
		}

		var shift	= trigger.indexOf("shift") > -1;
		var ctrl	= trigger.indexOf("ctrl") > -1;
		var alt		= trigger.indexOf("alt") > -1;
		var esc		= trigger.indexOf("esc") > -1;
		var key		= trigger.substring(trigger.length - 1).toUpperCase().charCodeAt(0);
		var combina = trigger.indexOf("+") !== -1;

		$(document).on("keydown", function (e) {
			escKey = e.keyCode === 27;
			if (e.shiftKey === shift
				&& e.ctrlKey === ctrl
				&& e.altKey === alt
				&& escKey === esc
				&& (
					!combina
					|| e.which === key
				)
			) {
				if (action && typeof action === "function") {
					action(element);
				} else {
					$(element).click();
				}
				e.preventDefault();
			}
		});
	}
};

