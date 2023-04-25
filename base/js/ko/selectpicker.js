/*
 * Custom Knockout binding to apply the selectpicker widget (bootstrap-select) to a bound dropdown and
 * refresh it when the contents of the dropdown change.
 *
 * The binding can be used in two ways:
 *
 * 1. If you don't want to bind the dropdown's selected option to an observable, just use data-bind="selectPicker: true"
 * 2. If you wish to bind the dropdown's selected option to an observable, so that when a different option is selected
 *    in the list it updates the observable, use data-bind="selectPicker: myObservable".
 *    If the options in the dropdown are generated from an observableArray, you can wrap the standard Knockout options binding parameters
 *    in a selectPickerOptions object
 *
 *    ie. data-bind="selectPicker: myObservable, selectPickerOptions: { options: myOptionsObservableArray, optionsText: 'arrayTextField', optionsValue: 'arrayValueField', optionsCaption: 'Please select...', disabledCondition: someBooleanExpression, resetOnDisabled: true|false }"
 *
 *    Note the two further parameters in the selectPickerOptions object, disabledCondition and resetOnDisabled. If provided, disabledCondition should be a boolean expression, that when evaluated as true will cause the selectpicker to be disabled.
 *    The resetOnDisabled parameter, if true, will cause the selected index of the dropdown to be reset to zero when it is disabled.
 *
 * Note requires that bootstrap-select.js is included in the view
 */
ko.bindingHandlers.selectPicker = {
	init: function (element, valueAccessor, allBindingsAccessor) {
		var $element = $(element);
		var bindings = ko.unwrap(allBindingsAccessor());
		if ($element.is("select")) {
			if (ko.isObservable(valueAccessor())) {
				if ($(element).prop("multiple") && $.isArray(ko.utils.unwrapObservable(valueAccessor()))) {
					// in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
					ko.bindingHandlers.selectedOptions.init(
						element,
						valueAccessor,
						allBindingsAccessor
					);
				} else {
					// regular select and observable so call the default value binding
					ko.bindingHandlers.value.init(
						element,
						valueAccessor,
						allBindingsAccessor
					);
				}
			}
			var clase = 'selectPicker ' + bindings.css();
			$element.addClass(clase).selectpicker();
		}
	},
	update: function (element, valueAccessor, allBindingsAccessor) {
		ko.unwrap(valueAccessor());
		var $element = $(element);
		if ($element.is("select")) {
			var selectPickerOptions = allBindingsAccessor().selectPickerOptions;
			if (typeof selectPickerOptions !== "undefined" && selectPickerOptions !== null ) {
				var options = selectPickerOptions.optionsArray,
					isDisabled = selectPickerOptions.disabledCondition || false,
					resetOnDisabled = selectPickerOptions.resetOnDisabled || false;
				// call the default Knockout options binding
				ko.bindingHandlers.options.update(
					element,
					options,
					allBindingsAccessor
				);

				if (isDisabled && resetOnDisabled) {
					// the dropdown is disabled and we need to reset it to its first option
					$element.selectpicker(
						"val",
						$element.children("option:first").val()
					);
				}
				$element.prop("disabled", isDisabled);
			}
			if (ko.isObservable(valueAccessor())) {
				if ( $element.prop("multiple") && $.isArray(ko.utils.unwrapObservable(valueAccessor())) ) {
					// in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
					ko.bindingHandlers.selectedOptions.update(element, valueAccessor);
				} else {
					// call the default Knockout value binding
					ko.bindingHandlers.value.update(element, valueAccessor);
				}
			}
			$element.selectpicker("refresh");
			if (typeof $element.valid !== 'undefined' && $element.parents('form').length) {
				$element.valid();
			}
			$element.attr('data-select-type', 'selectpicker');
			$element.attr('data-selectpicker-iniciado', '1');
		}
	}
};

//<editor-fold defaultstate="collapsed" desc="KO Component SelectPicker">
/*

Template fuente: Usar babel https://babeljs.io/en/repl para generar la otra version

var selectPickerTemplate = `<div data-bind="css: claseContenedor">
		<!-- ko if: label() !== '' && label() !== null -->
		<label data-bind="text: label"></label>
		<!-- /ko -->
			<select
				data-arreglado="readonly"
				data-live-search="true"
				data-select-on-tab="true"
				data-size="7"
				data-bind="
					selectPicker:		selectedId,
					value:				selectedId,
					optionsText:			itemToString,
					optionsValue :		itemIdentity,
					valueAllowUnset:		allowUnset,
					optionsCaption:		emptyOption,
					optionsAfterRender: optionsAfterRenderFunction,
					css:					clase,
					selectPickerOptions: {
						optionsArray:	options
					},
					attr: {
						disabled:	disabledOn,
						name:		elementName,
						required:	required,
						'data-valor': selectedId
					},
					visible: visibleOn
				"
				>
			</select>
		</div>`;
*/
var selectPickerTemplate = "<div data-bind=\"css: claseContenedor\">\n\t\t<!-- ko if: label() !== '' && label() !== null -->\n\t\t<label data-bind=\"text: label\"></label>\n\t\t<!-- /ko -->\n\t\t\t<select\n\t\t\t\tdata-arreglado=\"readonly\"\n\t\t\t\tdata-live-search=\"true\"\n\t\t\t\tdata-select-on-tab=\"true\"\n\t\t\t\tdata-size=\"7\"\n\t\t\t\tdata-bind=\"\n\t\t\t\t\tselectPicker:\t\tselectedId,\n\t\t\t\t\tvalue:\t\t\t\tselectedId,\n\t\t\t\t\toptionsText:\t\titemToString,\n\t\t\t\t\toptionsValue :\t\titemIdentity,\n\t\t\t\t\tvalueAllowUnset:\tallowUnset,\n\t\t\t\t\toptionsCaption:\t\temptyOption,\n\t\t\t\t\toptionsAfterRender: optionsAfterRenderFunction,\n\t\t\t\t\tcss:\t\t\t\tclase,\n\t\t\t\t\tselectPickerOptions: {\n\t\t\t\t\t\toptionsArray:\toptions\n\t\t\t\t\t},\n\t\t\t\t\tattr: {\n\t\t\t\t\t\tdisabled:\tdisabledOn,\n\t\t\t\t\t\tname:\t\telementName,\n\t\t\t\t\t\trequired:\trequired,\n\t\t\t\t\t\t'data-valor': selectedId\n\t\t\t\t\t},\n\t\t\t\t\tvisible: visibleOn\n\t\t\t\t\"\n\t\t\t\t>\n\t\t\t</select>\n\t\t</div>";

/**
 * @param {Object} params - Los parámetros del componente.
 * @param {Object[]} params.options - Las opciones.
 * @param {function} params.selected - Observable que guarda el resultado de la selección.
 * @param {function} params.optionsAfterRenderFunction - Función que se ejecutará luego de renderizar una opción del select.
 * @param {function} params.visibleOn - Observable para visibilizr el select.
 * @param {function} params.disabledOn - Observable para deshabilitar el select.
 * @param {(string|function)} [params.itemToString = "nombre"] - Propiedad o función para acceder a la representación en string.
 * @param {(string|function)} [params.itemIdentity = "id"] - Propiedad para acceder al identificador del objeto.
 * @param {string} params.label - El label del select.
 * @param {string} params.emptyOption - Opción por defecto cuando no hay selección.
 * @param {string} params.elementName - Nombre del elemento Html relacionado al select (atributo: name).
 * @param {string} params.claseContenedor - Clase del div que contrndrá al select, default: form-group.
 * @param {string} params.clase - Clase del select, default: form-control.
 * @param {bool} params.allowUnset - Permitir vacio.
 * @param {bool} params.required - Indica si el select es requerido.
 *
 * @returns {undefined}
 */
var selectPickerViewModel = function (params) {
	var self = this;
	self.verificarParametro = function(parametro, valorDefecto, forzarObservable) {
		var salida;
		if (forzarObservable) {
			salida = ko.isObservable(parametro)? parametro : ko.observable((typeof parametro === 'undefined')? valorDefecto : parametro);
		} else {
			salida = ko.isObservable(parametro)? parametro : (typeof parametro === 'undefined')? valorDefecto : parametro;
		}
		return salida;
	};
	self.inicializarValorSelecionado = function(self) {
		if (ko.isObservable(self.selected) ) {
			if (!isNaN(self.selected())) {
				self.selectedId(self.selected); //es un observable que tiene un numerico
				return;
			}
			if (self.selected() === null || typeof self.selected() === 'undefined') {
				self.selectedId(null);
				return;
			}
			var itemIdentity = self.itemIdentity;
			if (typeof self.itemIdentity === 'function' && !ko.isObservable(self.itemIdentity)) {
				return self.selectedId(self.itemIdentity(self.selected()));
			}
			if (ko.isObservable(self.selected()[itemIdentity]) || typeof self.selected()[itemIdentity] === 'function') {
				self.selectedId(self.selected()[itemIdentity]());
			} else {
				self.selectedId(self.selected()[itemIdentity]);
			}
			return;
		}
		if (typeof self.selected() === "function") {
			self.selectedId(self.selected()());
			return
		}
		self.selectedId(null);
	}
	self.label			 = self.verificarParametro(params.label, "", true);
	self.itemToString	 = self.verificarParametro(params.itemToString, "nombre", false);
	self.itemIdentity	 = self.verificarParametro(params.itemIdentity, "id", false);
	self.disabledOn		 = self.verificarParametro(params.disabledOn,  ko.observable(false), false);
	self.visibleOn		 = self.verificarParametro(params.visibleOn, ko.observable(true), false);
	self.elementName	 = self.verificarParametro(params.elementName, false, true);
	self.claseContenedor = self.verificarParametro(params.claseContenedor, "form-group", true);
	self.clase			 = self.verificarParametro(params.clase, "form-control", true);
	self.allowUnset		 = self.verificarParametro(params.allowUnset, true, true);
	self.required		 = self.verificarParametro(params.required, "required", true);
	self.options		 = self.verificarParametro(params.options, ko.observable([]), false);
	self.selected		 = self.verificarParametro(params.selected, ko.observable(null), false);
	self.optionsAfterRenderFunction = self.verificarParametro(params.optionsAfterRenderFunction, function() {}, false);
	self.selectedId		 = ko.observable();
	if (!self.allowUnset()) {
		self.emptyOption = null;
	} else {
		self.emptyOption = self.verificarParametro(params.emptyOption, "[Seleccionar]", false);
	}
	if (typeof self.options !== "function") {
		self.options = ko.observable(self.options);
	}
	self.inicializarValorSelecionado(self);
	//Cuando selecciono un item desde el select, propago el cambio al observable que represena el select.
	self.selectedId.subscribe(function (valor) {
		var itemSelected = ko.utils.arrayFirst(self.options(), function (item) {
			if (typeof self.itemIdentity === 'function' && !ko.isObservable(self.itemIdentity)) {
				return self.itemIdentity(item) === valor;
			}
			if (ko.isObservable(item[self.itemIdentity]) || typeof item[self.itemIdentity] === 'function') {
				return item[self.itemIdentity]() === valor;
			}
			return item[self.itemIdentity] === valor;
		});
		self.selected(itemSelected);
	});
	//Si desde el modelo se modifica el valor del observable, propago el valor al select.
	self.selected.subscribe(function(valor) {
		if (valor === null) {
			return self.selectedId(null);
		}
		var id = self.itemIdentity(valor);
		if (id !== self.selectedId()) {
			self.selectedId(id);
		}
	})
	if (!self.allowUnset() && (self.selectedId() === 0)) {
		var opcion = self.options()[0];
		self.selectedId(opcion.id());
	}
};

ko.components.register("selectPickerComponent", {
	viewModel: {
		createViewModel: function (params, componentInfo) {
			// - 'params' is an object whose key/value pairs are the parameters
			//   passed from the component binding or custom element
			// - 'componentInfo.element' is the element the component is being
			//   injected into. When createViewModel is called, the template has
			//   already been injected into this element, but isn't yet bound.
			// - 'componentInfo.templateNodes' is an array containing any DOM
			//   nodes that have been supplied to the component. See below.

			// Return the desired view model instance, e.g.:
			return new selectPickerViewModel(params);
		}
	},
	template: selectPickerTemplate
});
