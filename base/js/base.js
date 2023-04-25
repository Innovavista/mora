/* global listaDobleModalOptions usado en listaDoble.js
 * global agregableModalOptions usado en agregar-quitar.js
 * global templateElementoOculto usado en base.js
 */

//<editor-fold defaultstate="collapsed" desc="Polyfills">

if (!Array.prototype.forEach) {
    /**
     * @url https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/forEach
     * @param function callback
     * @param object thisArg
     * @returns undefined
     */
    Array.prototype.forEach = function forEach(callback, thisArg) {
        'use strict';
        var T, k;
        if (this == null) {
            throw new TypeError("this is null or not defined");
        }
        var kValue,
        O = Object(this),
        len = O.length >>> 0;
        if ({}.toString.call(callback) !== "[object Function]") {
            throw new TypeError(callback + " is not a function");
        }
        if (arguments.length >= 2) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}
//</editor-fold>

var formSubmitting = false; //indica si un Form esta haciendo submit

var extenderValidador = {
	getLength: function( value, element ) {
		switch ( element.nodeName.toLowerCase() ) {
			case "select":
				return $( "option:selected", element ).length;
			case "input":
				if ( this.checkable( element ) ) {
					return this.findByName( element.name ).filter( ":checked" ).length;
				}
				return value.length;
			case "textarea":
				var $element = this.findByName( element.name );
				if ($element.attr('data-tinymce-inicializado') === "true"){
					var $tinyMce = tinyMCE.get(element.id);
					$tinyMce.save();
					var text = $tinyMce.getContent({format: 'text'});
					return text.length;
				}
				return value.length;
		}
		return value.length;
	}

};
$.extend($.validator.prototype, extenderValidador);

//<editor-fold defaultstate="collapsed" desc="Extensión de busquedas de bootstrap select">
//Las siguientes funciones pisan el comportamiento definido en boots-selsect.js para que
//la busqueda se realize por cada una de las palabras ingresadas en el campo de busqueda,
//si todas las palabras del campo de búsqueda son contenidas en alguna de las opciones del
//select, estas opciones se mostrarán para seleccionar

//icontains: se utiliza cuando se busca con texto sin normailzar (distingue acentos)
$.expr.pseudos.icontains = function (obj, index, meta) {
	var aBuscar = meta[3].toUpperCase();
	var aBusarArray = aBuscar.split(' ');
	var $obj = $(obj);
	var haystack = ($obj.data('tokens') || $obj.text()).toUpperCase();
	for (var i = 0; i < aBusarArray.length; i++) {
		if (!haystack.includes(aBusarArray[i])) {
			return false;
		}
	}
    return true;
};

//aicontains: se utiliza cuando se busca con texto normailzado (sin distinguir acentos)
$.expr.pseudos.aicontains = function (obj, index, meta) {
	var aBuscar = meta[3].toUpperCase();
	var aBusarArray = aBuscar.split(' ');
	var $obj = $(obj);
	var texto = $obj.data('tokens') || $obj.data('normalizedText') || $obj.text()
	texto = removerAcentos(texto);
	var haystack = texto.toUpperCase();
	for (var i = 0; i < aBusarArray.length; i++) {
		if (!haystack.includes(aBusarArray[i])) {
			return false;
		}
	}
    return true;
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función para remover acentos de un string">
/**
 * Quita los acentos de una cadena. Ej: éè => ee.
 * @param {String} string
 * @returns {String}
 */
var removerAcentos = function(string) {
	return string.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función getUrlVars() que devuelve todas las variables del query string">
function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función que extiende los números para darle formato tipo moneda">
/**
 * Number.prototype.format(n, x, s, c)
 *
 * @param integer n: length of decimal
 * @param integer x: length of whole part
 * @param mixed   s: sections delimiter
 * @param mixed   c: decimal delimiter
 */
Number.prototype.format = function(n, x, s, c) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
        num = this.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función para poder buscar dependiendo del texto que tenga un elemento html, mejora de jquey.contains">
jQuery.expr[":"].contiene = jQuery.expr.createPseudo(function (arg) {
	return function (elem) {
		return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
	};
});
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Funciones para hacer Mayúsculas la primer letra de una palabra">
String.prototype.ucFirst = String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.capitalize = function(lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

function ucFirst(str) {
	str += '';
	var f = str.charAt(0).toUpperCase();
	return f + str.substr(1);
}
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función para clonar elementos textarea y select">
// Textarea and select clone() bug workaround | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Motivation.
// jQuery's clone() method works in most cases, but it fails to copy the value of textareas and select elements. This patch replaces jQuery's clone() method with a wrapper that fills in the
// values after the fact.

// An interesting error case submitted by Piotr Przybyl: If two <select> options had the same value, the clone() method would select the wrong one in the cloned box. The fix, suggested by Piotr
// and implemented here, is to use the selectedIndex property on the <select> box itself rather than relying on jQuery's value-based val().

(function (original) {
	jQuery.fn.clone = function () {
		var result           = original.apply(this, arguments),
        my_textareas     = this.find('textarea').add(this.filter('textarea')),
        result_textareas = result.find('textarea').add(result.filter('textarea')),
        my_selects       = this.find('select').add(this.filter('select')),
        result_selects   = result.find('select').add(result.filter('select'));

		for (var i = 0, l = my_textareas.length; i < l; ++i) $(result_textareas[i]).val($(my_textareas[i]).val());
		for (var i = 0, l = my_selects.length;   i < l; ++i) {
			for (var j = 0, m = my_selects[i].options.length; j < m; ++j) {
				if (my_selects[i].options[j].selected === true) {
					result_selects[i].options[j].selected = true;
				}
			}
		}
		return result;
	};
}) (jQuery.fn.clone);
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función jQuery para enfocar el primer campo habilitado de un formulario: enfocarFormulario">
jQuery.fn.enfocarFormulario = function(arg) {
	var $formulario = this;
	var $campo = $formulario.find('input,select,textarea').not(':hidden,[disabled],[readonly],[data-select-type="selectpicker"]').eq(0);
	$campo.focus();
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función jQuery para saber si tiene un atributo: hasAttr">
jQuery.fn.hasAttr = function(arg) {
	var attr = this.attr(arg);
	return typeof attr !== typeof undefined && attr !== false;
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Función jQuery para obtener el HTML de un objeto: outerHTML">
jQuery.fn.outerHTML = function() {
	return jQuery('<div />').append(this.eq(0).clone()).html();
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Jscolor">
(function ( $ ) {
     $.fn.jscolor = function(opts) {
		new jscolor.color( this[0] , opts );
        return this;
    };

}( jQuery ));
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Funcion para que el ENTER funcione como TAB en los Foms">
(function($) {
	$.fn.enterAsTab = function(options) {
		var settings = $.extend({
			'allowSubmit': false
		}, options);
		$(this).find('input, select, button').on("keydown", {localSettings: settings}, function(event) {
			if (settings.allowSubmit) {
				var type = $(this).attr("type");
				if (type == "submit") {
					return true;
				}
			}
			if (event.keyCode == 13) {
				var inputs = $(this).parents("form").eq(0).find(":input:visible:not(:disabled):not([readonly])");
				var idx = inputs.index(this);
				if (idx == inputs.length - 1) {
					idx = -1;
				} else {
					inputs[idx + 1].focus(); // handles submit buttons
				}
				try {
					inputs[idx + 1].select();
				}
				catch (err) {
					// handle objects not offering select
				}
				return false;
			}
		});
		return this;
	};
})(jQuery);
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Crea dinámicamente una alerta">
function alerta(mensaje, tipo, $contenedor) {
	var $alerta = $('<div class="alerta"><p class="alert alert-sombra alert-' + tipo + '"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button> ' + mensaje + '</p></div>');
	$contenedor.prepend($alerta);
}
//</editor-fold>

function readonlyFieldset($objeto) {
	$objeto.find('button').each(function(){
		$(this).hide();
	});
	$objeto.find('input, select, textarea').each(function(){
		$(this).attr('readonly', 'readonly');
	});
}

function agregarDatePicker($inputFecha) {
	$inputFecha.attr("data-arreglado", "arreglado");
	var clone = $inputFecha.clone(true);
	clone.attr('type', 'text');
	$inputFecha.after(clone);
	var tipo = $inputFecha.attr('type');
	var $clone = $(clone);
	var prefijo = 'clon-';
	if ($inputFecha.parents('.modal').length > 0) {
		prefijo = 'clon-modal-';
	}
	$clone.attr('name', prefijo + $inputFecha.attr('name') );
	var id = $inputFecha.attr('id');
	if (typeof id === 'undefined'){
		id = $inputFecha.attr('name');
	}
	$clone.attr('id', prefijo +  id);
	if (typeof $clone.attr("data-copiar-a") !== "undefined"){
		$clone.data("copiar-a", "clon-" + $clone.attr("data-copiar-a"));
		$clone.attr("data-copiar-a", "clon-" + $clone.attr("data-copiar-a"));
	}
	var dataName = $clone.attr("data-name");
	if (typeof dataName !== "undefined") {
		$clone.data("name", "clon-" + dataName);
		$clone.attr("data-name", "clon-" + dataName);
	}
	$clone.attr("data-validator", "ignorar");
	$clone.data("validator", "ignorar");
	$inputFecha.attr("data-validator", "forzar");
	$inputFecha.data("validator", "forzar");
	$inputFecha.hide();
	var dateFormat = "dd/mm/yy";
	var altFormat = "yy-mm-dd";
	if ($inputFecha.data("datepicker-format")) {
		dateFormat = $inputFecha.data("datepicker-format");
	}
	var optionsAdicionales = {};
	if ($inputFecha.data("datepicker-options")) {
		optionsAdicionales = $inputFecha.data("datepicker-options");
	}
	var value = transformarFecha($inputFecha.val());
	var min = null;
	var max = null;
	if ($inputFecha.attr('min')) {
		min = transformarFecha($inputFecha.attr('min'));
	}
	if ($inputFecha.attr('max')) {
		max = transformarFecha($inputFecha.attr('max'));
	}
	if (tipo === 'month') {
		dateFormat = "MM yy";
		value = transformarFecha($inputFecha.val() + '-01');
		if ($inputFecha.attr('min')) {
			min = transformarFecha($inputFecha.attr('min') + '-01');
		}
		if ($inputFecha.attr('max')) {
			max = transformarFecha($inputFecha.attr('max') + '-0');
		}
		altFormat = 'yy-mm';

	}
	var optionsDefault = {
		altFormat: altFormat,
		dateFormat: dateFormat,
		defaultDate: value,
		maxDate: max,
		minDate: min,
		altField: $inputFecha,
		firstDay: 0,
		monthNames: [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ],
		onSelect: function(date, $inputUi){
			var $original = $inputUi.settings.altField;
			$original.valid();
			$clone.attr('value', date);
			$clone.val(date);
		},
		beforeShow: function(date) {
			if (tipo === 'month') {
				var $date = $(date);
				var valueAux = $date.val();
				var fechaArr = $inputFecha.val().split('-');
				fechaArr[2] = '01';
				var fecha = transformarFecha(fechaArr.join('-'));
				$(this).datepicker("option", "defaultDate", fecha);
				$date.val(valueAux);
			}
			setTimeout(function(){
				$('#ui-datepicker-div').zIndex($inputFecha.zIndex() + 100);
			}, 0);

		}
	};
	$clone.datepicker($.extend(optionsDefault, optionsAdicionales));
	$clone.click(function(e) {
		if ($clone.is('[readonly="readonly"]')) {
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
	});
	$clone.datepicker( "setDate", value );
	var $datepickerIcono = $("<i class='fa fa-calendar datepicker-icono'></i>");
	$clone.not('[readonly="readonly"]').after($datepickerIcono);
	$datepickerIcono.click(function(){
		$clone.datepicker('show');
	});
	if (tipo === 'month') {

		$(document).on('mouseover', '.ui-datepicker [data-handler="selectDay"]', function() {
			var $dias = $('.ui-datepicker [data-handler="selectDay"]');
			$dias.addClass('ui-state-hover-mes');
		})
		$(document).on('mouseout', '.ui-datepicker [data-handler="selectDay"]', function() {
			var $dias = $('.ui-datepicker [data-handler="selectDay"]');
			$dias.removeClass('ui-state-hover-mes');
		});
	}
	$clone.on('change', function(){
		var fechaFinal = transformarFechaEspanol($clone.val());
		$clone.datepicker( "setDate", fechaFinal );
	});
}

//<editor-fold defaultstate="collapsed" desc="Input type date cross browser y validador">
/**
 *
 * @returns {undefined}
 */
function typeDateCrossBrowser(){
	if (typeof Modernizr !== 'undefined') {
		if (!Modernizr.inputtypes.date) {
			$('input[type="date"], input[type="month"]').not('[data-arreglado="arreglado"]').each(function(){
				var $this = $(this);
				if ($this.parents('[data-template="true"]').length > 0) {
					return true;
				}
				agregarDatePicker($this);
			});
		}
	}
	$('input[type="date"][data-forzar-datepicker="true"]').not('[data-arreglado="arreglado"]').each(function(){
		var $inputFecha = $(this);
		$inputFecha.attr('type', 'text');
		if ($inputFecha.parents('[data-template="true"]').length > 0) {
			return true;
		}
		agregarDatePicker($inputFecha);
	});
}
//</editor-fold>

function typeTimeCrossBrowser(){
	if (typeof Modernizr === 'undefined') {
		return;
	}
	if (!Modernizr.inputtypes.time) {
		$('input[type="time"]').not('[data-arreglado="arreglado"]').each(function(){
			var $this = $(this);
			if ($this.parents('[data-template="true"]').length > 0) {
				return true;
			}
			$this.datetimepicker({
				format: 'HH:mm'
			});
			$this.attr("data-arreglado", "arreglado");
		});
	}
}

function typeDateTimeLocalCrossBrowser() {
    var agregarDateTimePicker = function () {
        var $this = $(this);
        if ($this.parents('[data-template="true"]').length > 0) {
            return true;
        }
        var options = {
            format: "YYYY-MM-DDTHH:mm",
            parseInputDate: function (inputDate) {
                var fechaParseada = moment(inputDate, moment.ISO_8601);
                return fechaParseada;
            }
        };
        $this.datetimepicker(options);
        $this.attr("data-arreglado", "arreglado");
    }
	if (typeof Modernizr !== 'undefined') {
		if (!Modernizr.inputtypes['datetime-local']) {
			$('input[type="datetime-local"]').not('[data-arreglado="arreglado"]').each(agregarDateTimePicker);
		}
	}
    $('input[type="datetime-local"][data-forzar-datepicker="1"]').not('[data-arreglado="arreglado"]').each(agregarDateTimePicker);
}

function typeColorCrossBrowser(){
	if (typeof Modernizr === 'undefined') {
		return;
	}
	if (!Modernizr.inputtypes.color) {
		$('input[type="color"]').each(function(){
			var $this = $(this);
			if ($this.parents('[data-template="true"]').length > 0) {
				return true;
			}
			$this.jscolor({
				hash: true,
				slider:false
			});
		});
	}
}

function contadorTexto(){
	var $contadores = $('[maxlength]').not('[data-text-feedback="agregado"]');
	var textFeedBack = '<span data-text-feedback="true" class="text-feedback"></span>';
	$contadores.each(function(){
		var $this = $(this);
		if ($this.parents('[data-template="true"]').length > 0) {
			return true;
		}
		$this.attr("data-text-feedback", "agregado");
		$this.wrap( "<div class='text-feedback-container'></div>" );
		var $textFeedBack = $(textFeedBack);
		var maximo = $this.prop('maxlength');
		$this.parent()
				.addClass('relative')
				.append($textFeedBack);
		var text_length = $this.val().length;
		var text_remaining = maximo - text_length;
		if (text_remaining !== maximo){
			$textFeedBack.html(text_remaining);
		}
		$this.keyup(function() {
			var text_length = $this.val().length;
			var text_remaining = maximo - text_length;

			$textFeedBack.html(text_remaining);
			if (text_remaining === maximo){
				$textFeedBack.html('');
			}
		});
	});
}

function autosizeTextArea(){
	var $textarea = $('textarea').not('[data-tinymce]');
	$textarea.each(function(){
		var $this = $(this);
		if ($this.parents('[data-template="true"]').length > 0) {
			return true;
		}
		autosize($this);
	});

}

function filtradoSelect($selectFiltrado, opcionesFiltrado) {
	if (typeof opcionesFiltrado !== 'object'
		|| $selectFiltrado.data('filtrado-aplicado')
	) {
		return ;
	}
	$selectFiltrado.data('filtrado-aplicado', true);
	var config = {
		scope: 'form',
		elementoFiltro : '',
		buscarEn :'',
		buscarPor: 'valor'
	};
	config = $.extend(config, opcionesFiltrado);
	if (typeof config.elementoFiltro === 'undefined' || config.elementoFiltro === '') {
		console.log("Error: se debe definir 'elementoFiltro'");
		return;
	}

	var $selectFiltro = $selectFiltrado.closest(config.scope).find(config.elementoFiltro);
	filtrarSelectAccion($selectFiltrado, $selectFiltro, config);
	$selectFiltro.on('change', function() {
		$selectFiltrado.val("");
		filtrarSelectAccion($selectFiltrado, $selectFiltro, config);
	});
}


function filtrarSelectAccion($selectFiltrado, $selectFiltro, config) {
	var value	  = "";
	var $grupos	  = $selectFiltrado.find("optgroup");
	var $opciones = $selectFiltrado.find("option");

	if (config.buscarPor === 'valor') {
		if (typeof $selectFiltro.val() !== 'undefined' && $selectFiltro.val() !== null) {
			value = $selectFiltro.val().toString();
		}
	} else {
		if (typeof $selectFiltro.find('option:last-child').data(config.buscarPor) === 'undefined') {
			console.log("Error: se debe especificar el data del elemento filtro por el cual se debe buscar");
			return ;
		}
		var aux = $selectFiltro.val();
		if (aux !== "") {
			var buscarPorValor = $selectFiltro.find('option[value="' + aux + '"]').data(config.buscarPor);
			if (typeof buscarPorValor !== 'undefined') {
				value = buscarPorValor.toString();
			}
		}
	}
	var buscarPor = value.split(",");

	$opciones.addClass('hidden')
			 .attr('disabled', 'disabled');

	if (config.buscarEn === '') {
		$.each(buscarPor, function(index,value){
			$selectFiltrado.find( "option:contiene('" + value + "')" )
					.removeClass('hidden')
					.removeAttr('disabled');
		});
	}
	if (config.buscarEn === 'valor') {
		$opciones.filter(function() {
			var $option = $(this);
			var salida = false;
			$.each(buscarPor, function(index, value) {
				if ($option.val().toString().indexOf(value.toString()) >= 0) {
					salida = true;
				}
			});
			return salida;
		}).removeClass('hidden')
		.removeAttr('disabled');
	}
	$opciones.not('[value=""]').filter(function() {
		var salida = false;
		var datas = $(this).data();

			$.each(buscarPor, function(index, value) {
				for(var i in datas){
					if(config.buscarEn === '') {
						if (i === "value") {
							continue;
						}
						if (datas[i].toString().indexOf(value.toString()) >= 0) {
							salida = true;
						}
					} else {
						if(i === config.buscarEn) {
							if (datas[i].toString() == value) {
								salida = true;
							}
						}
					}
				}
			});
		return salida;
	}).removeClass('hidden').removeAttr('disabled');

	$opciones.filter('[value=""]')
			 .removeClass('hidden')
			 .removeAttr('disabled');

	//Revisamos si el filtrado genéro elementos <optgroup> vacíos
	$grupos.show().removeClass('hidden');
	$grupos.each(function() {
		var $grupo	  = $(this);
		var $visibles = $grupo.find('option:not(.hidden)');
		if ($visibles.length === 0) {
			$grupo.hide().addClass('hidden');
		}
	});

	//Revisamos si quedó una sola opción visible, para poder seleccionarla si
	//el elemento es obligatorio
	if ($selectFiltrado.prop('required')) {
		var $visibles = $opciones.filter('[value!=""]:not(.hidden)');
		if ($visibles.length === 1) {
			$visibles.prop('selected', true);
			$selectFiltrado.change();
		}
	}

	if ($selectFiltrado.data('select-type') === 'selectpicker') {
		$selectFiltrado.selectpicker("val", $selectFiltrado.val());
		$selectFiltrado.selectpicker('refresh');
	}

}

function transformarSelect(){
	$('select').not('[data-arreglado="readonly"]').each(function(){
		var $this = $(this);
		if ($this.parents('[data-template="true"]').length > 0) {
			return true;
		}
		var habilitado = true;
		if ($this.data("readonly")) {
			var $clone = $this.clone();
			$this.addClass('hidden');
			$clone.addClass('disabled');
			$clone.attr('disabled', 'disabled');
			$clone.attr('name', 'clon-' + $clone.attr('name'));
			if (typeof $this.attr("data-copiar-a") === "undefined") {
				$this.data("copiar-a", $clone.attr('name'));
				$this.attr("data-copiar-a", $clone.attr('name'));
				$this.attr("data-copiar", "copiar");
			}
			$this.after($clone);
			$this.attr("data-arreglado", "readonly");
			$clone.attr("data-arreglado", "readonly");
			habilitado = false;
			var $grupo = $this.parents('.input-group').eq(0);
			if (typeof $grupo !== 'undefined') {
				$grupo.find('.input-group-btn').hide();
				$grupo.attr('class', '');
			}
		}
		if (habilitado && !$this.attr('data-selectpicker-iniciado')) {
			var configSelectPicker = {
				liveSearch: true,
				liveSearchNormalize: true,
				size: 7,
				actionsBox: true,
				showTick: true,
				selectOnTab: true
			};
			if ($this.attr('data-content') || $this.attr('data-subtext')) {
				configSelectPicker.mobile = false;
			}
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
				configSelectPicker.size = false;
				configSelectPicker.mobile = true;
			}
            //Si es requerido y tiene solamente una opción la selecciono directamente.
            var $options = $this.find('option:not([value=""])');
            if ($this.prop("required") && $options.length === 1) {
                $options.attr('selected', 'selected');
            }
			$this.selectpicker(configSelectPicker);
			$this.attr('data-select-type', 'selectpicker');
			$this.attr('data-selectpicker-iniciado', '1');
			var $boton = $this.siblings('.bootstrap-select').find('.dropdown-toggle');
			$boton.blur(function() {
				setInterval(function() {
					if (!$boton.parent().is('.open')) {
						$this.valid();
					}
				}, 100);
			});

			$this.closest('form').on('reset', function () {
				setTimeout(function () {
					$this.selectpicker('refresh');
				});
			});
		}
		if ($this.data('filtrar')) {
			var opcionesFiltrar = $this.data('filtrar');
			filtradoSelect($this, opcionesFiltrar);
		}

	});
}

function tinyMceInicializar(elemento, configElemento){
	var max_chars_indicator = elemento.parent().find('.text-feedback');
	var maxlength = elemento.attr('maxlength');
	max_chars_indicator.css('margin-right', 11);
	var config = {
		language: "es",
		mode : "exact",
		menubar: false,
        elements : elemento.attr('name'),
	};

	var contadorCaracteres = {
		charLimit : 1000,
		max_chars: 1000,
		max_chars_indicator : max_chars_indicator,

		plugins: "wordcount",
		setup : function(ed) {

			wordcount = 0;
			wordCounter = function (e) {
				var text = ed.getContent({format: 'text'});
				this.wordcount = ed.getParam('max_chars') - text.length;
				ed.getParam('max_chars_indicator').text( 'Restan: ' + this.wordcount + " (de " +ed.getParam('max_chars')+ ") caracteres." );
			};
			ed.on('init', wordCounter);
			ed.on('keyup', wordCounter);
		}
	};


	if (maxlength > 0){
		contadorCaracteres.max_chars = maxlength;
		contadorCaracteres.charLimit = maxlength;
		config = $.extend(config, contadorCaracteres);
	}

	configElemento = JSON.parse(JSON.stringify(eval("(" + configElemento + ")")));
	var a = typeof configElemento;
	if (typeof configElemento === 'object'){
		config = $.extend(config, configElemento);
	};
	tinyMCE.init(config);

}

function tinyMce(){
	$('[data-tinymce]').not('[data-tinymce-inicializado="true"]').each(function(){
		var $this = $(this);
		if ($this.parents('[data-template="true"]').length > 0) {
			return true;
		}
		var configElemento = $this.data('tinymce');
		var name = $this.attr('name');
		tinyMceInicializar($this, configElemento);
		$this.attr('data-tinymce-inicializado', 'true');
		$this.parents('form').eq(0).attr('data-tinymce-inicializado', 'true');
	});
}

function formEtapas($forms) {
	$forms = $forms.not('[data-form-etapas-arreglado="1"]');
	if ($forms.length > 0) {
		var $btnAnterior	= $('[data-tab-btn="anterior"]');
		var $btnSiguiente	= $('[data-tab-btn="siguiente"]');
		var $navForm		= $('#nav-form');
		var $navFormTabs	= $navForm.find('a');
		var tabIdxA = 0;
		var tabIdxS = 1;
		$navFormTabs.on('show.bs.tab', function(e) {
			var $target = $(e.target);
			$target.parent().removeClass('has-error');
			var tabIdx = $target.data('tab-index');
			tabIdxA = tabIdx - 1;
			tabIdxS = tabIdx + 1;
			$btnAnterior.prop('disabled', false);
			$btnSiguiente.prop('disabled', false);
			if ($target.data('tab-primera')) {
				$btnAnterior.prop('disabled', true);
			}
			if ($target.data('tab-ultima')) {
				$btnSiguiente.prop('disabled', true);
			}
		});
		$btnAnterior.on('click', function(e){
			e.stopPropagation();
			e.preventDefault();
			$navFormTabs.eq(tabIdxA).click();
			return false;
		});

		$btnSiguiente.on('click', function(e){
			e.stopPropagation();
			e.preventDefault();
			$navFormTabs.eq(tabIdxS).click();
			return false;
		});
		if ($navForm.find('[aria-expanded="true"]').length > 0) {
			return ;
		}
		var $errores = $forms.find('.has-error');
		if ($errores.length > 0) {
			$errores.each(function(){
				var $this = $(this);
				var $tab = $this.parents('.tab-pane');
				if ($tab.length > 0) {
				var idTab = $tab.attr('id');
					$('[href="#' + idTab + '"]').parent().addClass('has-error');
				}
			});
			var $tab = $errores.eq(0).parents('.tab-pane');
			if ($tab.length > 0) {
				var idTab = $tab.attr('id');
				$('[href="#' + idTab + '"]').tab('show');
			}
		} else {
			$navFormTabs.eq(0).click();
		}
		$forms.attr('data-form-etapas-arreglado', "1");
	}
}

/**
 * Esta función prepara los inputs de los objetos UbicacionEmbebible para que
 * funcione correctamente el mapa
 *
 * @returns void
 */
function inicializarUbicacionesEmbebibles() {
	$('[data-objeto-gm]').not('[data-inicializado="true"]').each(function(){
		var $objetoGm = $(this);
		readyGoogleMaps($objetoGm);
	});
}

function cargarCSS(href) {
	var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
    $("head").append(cssLink);
}

function cargarJavascript(src) {
	 var jsLink = $("<script type='text/javascript' src='"+src+"'>");
     $("head").append(jsLink);
}

//<editor-fold defaultstate="collapsed" desc="InicializarFontIconPicker">
/**
 * Inicializa un jquerfontIconSelectPicker con iconos de fontAwesome
 *
 *
 * @returns void
 */
function inicializarFontIconPicker() {
	var $selects = $("[data-fonticonselectpicker='iconos']");
	if ($selects.length > 0) {
		cargarJavascript("/modules/base/lib/jquery-fontIconPicker/2.0.0/jquery.fonticonpicker.min.js");
		cargarCSS("/modules/base/lib/jquery-fontIconPicker/2.0.0/css/jquery.fonticonpicker.min.css");
		cargarCSS("/modules/base/lib/jquery-fontIconPicker/2.0.0/themes/grey-theme/jquery.fonticonpicker.grey.min.css");


		$selects.each(function() {
			var $select = $(this);
			var libreria = $select.data("libreriafontello");
			var url = "";
			if (libreria) {
				cargarCSS("/" + libreria + "/css/fontello.css");
				url = "/" + libreria + "/" + "config.json";
			} else {
				url = '/modules/base/lib/jquery-fontIconPicker/2.0.0/fontello-fontAwesome/config.json';
				cargarCSS("/modules/base/lib/jquery-fontIconPicker/2.0.0/fontello-fontAwesome/css/fontello.css");
			}
			$select = $select.fontIconPicker({theme: "fip-grey"});
			$select.attr("disabled", true);
			$.ajax({
				url: url,
				type: 'GET',
				dataType: 'json'
			}).done(function (response) {

				var fontello_json_icons = [];

				// Push the fonts into the array
				$.each(response.glyphs, function (i, v) {
					fontello_json_icons.push(response.css_prefix_text + v.css);
				});

				// Set new fonts
				$select.refreshPicker({source: fontello_json_icons});
				$select.on('change', function ($select) {
					var $self = $(this);
					var selectedIcon = $self.siblings(".icons-selector").find(".selected-icon > i").first().attr("class");
					if (selectedIcon === "fip-icon-block") {
						$self.removeAttr("value");
						$self.text("");
					} else {
						$self.attr("value", selectedIcon);
						$self.text(selectedIcon);
					}
				});
				$select.attr("disabled", false);
			}).fail(function () {
				$select.text("No se pudo inicializar fontIconPicker");
			});
		});

	}
}
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Inicializar starRating">
/**
 * Inicializa los elementos para valorar.
 * Como entrada necesita un elemento de tipo input text con el atributo data-valoracion
 * El valor del atributo data valoracion debe ser un json con la configuracion del elemento
 * acorde a http://plugins.krajee.com/star-rating#options
 *
 * @returns void
 */
function inicializarStarRating() {
	var $a  = $("[data-valoracion]");
	if ($a.length === 0) {
		return;
	}
	cargarJavascript("/modules/base/lib/bootstrap-star-rating/4.0.1/js/locales/es.js");
	var $opciones = {
		language : 'es',
		stars : 5,
		min : 0,
		max : 5,
		step: 1,
		size: 'md',
	};
	var $opcionesCustom = $a.data("valoracion");
	$opciones = $.extend($opciones, $opcionesCustom);
	$a.rating($opciones);
}
//</editor-fold>


//<editor-fold defaultstate="collapsed" desc="Inicialziar percircle">
function inicializarPercircle() {
	var $elements  = $("[data-percircle]");
	if ($elements.length === 0) {
		return;
	}
	var $opciones = {
		animate : true
	};

    var getColor = function (percent, colorOptions, inclusive) {
		//colorOptions es un array de objetos js
        for (var i = 0; i < colorOptions.length; i++) {
			var v = colorOptions[i];
            var from = v.from;
            var to = v.to;
            var color = v.color;
            if (inclusive === 'from') {
                if ((!from || from <= percent) && (!to || to > percent)) {
                    return color;
                }
            } else if (inclusive === 'to') {
                if ((!from || from < percent) && (!to || to >= percent)) {
                    return color;
                };
            }
        };
    };

	var $opcionesCustom = $elements.data("valoracion");
	$opciones = $.extend($opciones, $opcionesCustom);
    $elements.each(function () {
        $element = $(this);
        var percent = $element.data("percent");
        if (typeof $element.data("percent") === 'undefined') {
            throw new Error("Debe especificar un porcentaje a través de la configuracion de data-percircle o a traves de data-percent");
        }
        percent = eval($element.data("percent"));
        var inclusive = $element.data('inclusive');
        if (!inclusive) {
            inclusive = 'from';
        }
        var colorsOptions = $element.data('colors');
        if (!colorsOptions) {
            colorsOptions = [
                {
                    to: 30,
                    color: '#F1635F',
                },
                {
                    from: 30,
                    to: 60,
                    color: '#ffbc34',
                },
                {
                    from: 60,
                    to: 80,
                    color: '#1e88e5',
                },
                {
                    from: 80,
                    color: '#0FB795',
                },
            ];
        }
        var $progressBarColor = getColor(percent, colorsOptions, inclusive);
		var texto = $element.data("text");
		var config = {
            progressBarColor: $progressBarColor,
            percent: percent,
        };
		if (typeof texto !== 'undefined') {
			config.text = texto;
		}
        $element.percircle(config);
    });
}
//</editor-fold>


//<editor-fold defaultstate="collapsed" desc="Inicializar collapsable">
/**
 * Crea un elemento collapsable respecto a otro y agrega una flechita de ayuda.
 *
 * $this: Elemento colapsante (el que colapsa al target)
 *
 * Deben setearse los atributos:
 * scope : Para saber donde buscar, por defecto busca en el padre.
 * target: Selector del elemento a colapsar.
 *
 * @returns void
 */
function inicializarCollapsables() {

	function comprobarTieneContenido($target) {
		return $target.text() !== undefined && $target.text() !== ""
				|| $target.val() !== undefined && $target.val() !== "";
	}

	$('[data-toggle="collapse-relative"]').each(function () {
		var $this = $(this);
		if ($this.data("arreglado-collapse")) {
			return;
		}
		$this.data("arreglado-collapse", true);
		$this.append(' <i class="fa"></i>');
		var $scope = $this.parent();
		if ($this.data("scope") !== undefined) {
			$scope = $this.closest($this.data("scope"));
		}
		var dataTarget = $this.data("target");
		if (dataTarget === undefined) {
			console.error("Falta data-target en el elemento que tiene el data-toggle.");
			return;
		}
		var $target = $scope.find(dataTarget);
		var $arrow = $this.find("i");

		if (
				!( typeof $this.data('collapsed') !== 'undefined' && $this.data('collapsed'))
				&&
				comprobarTieneContenido($target)
				) {
			$target.slideDown();
			$arrow.addClass("fa-chevron-up");
		} else {
			$target.slideUp();
			$arrow.addClass("fa-chevron-down");
		}
		$this.on("click", function () {
			var options = {
				complete: function () {
					$arrow.toggleClass("fa-chevron-down fa-chevron-up");
				}
			};
			$target.slideToggle(options);
		});
	});
}
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Dependencias entre campos - Maestro / esclavo">
var maestroEsclavoEstadoActivoEsclavos = function ($esclavos, estado) {
	//Activo o desactiva los esclavos según el parametro estado.
	$esclavos.each(function () {
		var $esclavo = $(this);
		//Activa el esclavo
		if (estado) {
			if ($esclavo.is('[data-select-type="selectpicker"]')) {
				$esclavo.closest('.bootstrap-select').removeClass('esclavo-desactivar');
			} else {
				$esclavo.removeClass('esclavo-desactivar');
			}
		} else {
			if ($esclavo.is('[data-select-type="selectpicker"]')) {
				$esclavo.closest('.bootstrap-select').addClass('esclavo-desactivar');
			} else {
				$esclavo.addClass('esclavo-desactivar');
			}
		}
	});
};

var maestroEsclavoEstadoAjaxEsclavos = function ($esclavos, estado) {
	//Le agrega el estado en ajax a los esclavos o lo quita segun el parámetros estado.
	$esclavos.each(function() {
		$esclavo = $(this);
		if (estado) {
			if ($esclavo.is('[data-select-type="selectpicker"]')) {
				$esclavo.closest('.bootstrap-select').addClass('esclavo-ajax');
			} else {
				$esclavo.addClass('esclavo-ajax');
			}
		} else {
			if ($esclavo.is('[data-select-type="selectpicker"]')) {
				$esclavo.closest('.bootstrap-select').removeClass('esclavo-ajax');
			} else {
				$esclavo.removeClass('esclavo-ajax');
			}
		}
	});
};

var maestroEsclavoEstadoErrorEsclavos = function ($esclavos, estado) {
	// Agrega el estado de error a los esclavos según el parámetro estado.
	$esclavos.each(function () {
		$esclavo = $(this);
		if (estado) {
			if ($esclavo.is('[data-select-type="selectpicker"]')) {
				$esclavo.closest('.bootstrap-select').addClass('esclavo-error');
			} else {
				$esclavo.addClass('esclavo-error');
			}
		} else {
			if ($esclavo.is('[data-select-type="selectpicker"]')) {
				$esclavo.closest('.bootstrap-select').removeClass('esclavo-error');
			} else {
				$esclavo.removeClass('esclavo-error');
			}
		}
	});
};

var maestroEsclavoFiltrar = function($maestro, $esclavos, reiniciar) {
    var valores = [];
	if ($maestro.attr("type") === "checkbox" ) { //Entra por acá si es lista doble
		var $maestros = $('[name="' + $maestro.attr("name") + '"]:checked');
		$maestros.each(function () {
			var $option = $(this);
			valores.push($option.val());
		});
	} else {
		$maestro.find(':selected').each(function () {
			var $option = $(this);
			valores.push($option.val());
		});
	}
    valores = valores.filter(function (valor) {
        return valor !== "" && valor !== null && valor !== undefined;
    })
	var url		   = $maestro.data('maestro-filtrar-url') + '?params=' + valores;
	var $iconoAjax = $maestro.closest('.form-group').find('label').find('.maestro-ajax-icono');
	var esclavos   = $maestro.data('maestro-filtrar').split(';');
	var selector   = [];
	for (var i = 0, max = esclavos.length; i < max; i++) {
		selector.push('[data-esclavo="' + esclavos[i] + '"]');
	}
	var $esclavosFiltrar = $esclavos.filter(selector.join(','));

	if (valores.length === 0) {
		maestroEsclavoEstadoActivoEsclavos($esclavosFiltrar, false);
		return;
	}
    if (typeof variableName !== 'undefined') {
        xhrMaestroEsclavoFiltrar.abort();
        xhrMaestroEsclavoFiltrar = undefined;
    }
	xhrMaestroEsclavoFiltrar = $.ajax({
		url: url,
		beforeSend: function(jqXHR, settings) {
			$iconoAjax.addClass('mostrar');
			maestroEsclavoEstadoActivoEsclavos($esclavosFiltrar, false);
			maestroEsclavoEstadoAjaxEsclavos($esclavosFiltrar, true);
			maestroEsclavoEstadoErrorEsclavos($esclavosFiltrar, false);
		},
		success : function (data, textStatus, jqXHR) {
			try {
				maestroEsclavoActualizar($esclavos, data, reiniciar);
			} catch (err) {
				alert(err);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			maestroEsclavoEstadoErrorEsclavos($esclavosFiltrar, true);
		},
		complete: function(jqXHR, textStatus) {
			$iconoAjax.removeClass('mostrar');
			maestroEsclavoEstadoAjaxEsclavos($esclavosFiltrar, false);
		}
	});
};

var maestroEsclavoActualizar = function($esclavos, datos, reiniciar) {
	for (var clave in datos) {
		if (!datos.hasOwnProperty(clave)) {
			continue;
		}
		var $esclavo = $esclavos.filter('[data-esclavo="' + clave + '"]');
		if ($esclavo.hasClass('listaDoble-contenedor')) {
			if (reiniciar) {
				maestroEsclavoActualizarListaDobleReiniciar($esclavo);
			}
			maestroEsclavoActualizarListaDobleFiltrar($esclavo, datos[clave]);
		}
		if ($esclavo.is('select')) {
			if (reiniciar) {
				maestroEsclavoActualizarSelectReiniciar($esclavo);
			}
			maestroEsclavoActualizarSelectFiltrar($esclavo, datos[clave]);
		}
		maestroEsclavoEstadoActivoEsclavos($esclavo, true);
		$esclavo.trigger('esclavo-actualizado');
	}
};

var maestroEsclavoActualizarListaDobleReiniciar = function($contenedor) {
	//Movemos todas las opciones seleccionadas a la lista de disponibles
	var $listaCheckbox		= $contenedor.find('[data-contenedor="checkbox"]');
	var $listaDisponibles	= $contenedor.find('.listaDoble-disponibles');
	var $listaSeleccionadas = $contenedor.find('.listaDoble-seleccionadas');
	var $seleccionadas		= $listaSeleccionadas.find('.listaDoble-opcion').detach();
	$listaDisponibles.append($seleccionadas);
	$listaCheckbox.find('input[type="checkbox"]').prop('checked', false).removeAttr('checked');
};

var maestroEsclavoActualizarListaDobleFiltrar = function($contenedor, datos) {
	var $listaCheckbox		= $contenedor.find('[data-contenedor="checkbox"]');
	var $listaDisponibles	= $contenedor.find('.listaDoble-disponibles');
	var $listaSeleccionadas = $contenedor.find('.listaDoble-seleccionadas');

	//Escondemos todas las opciones primero
	$listaCheckbox.find('div.checkbox').hide();
	$listaDisponibles.find('.listaDoble-opcion').hide();
	$listaCheckbox.find('input[type="checkbox"]').data('esclavo-seleccionable', false);

	for (var i = 0; i < datos.length; i++) {
		var id = datos[i]['id'];
		$listaDisponibles.find('li[data-value="' + id +  '"]').show();
		$listaSeleccionadas.find('li[data-value="' + id +  '"]').show();
		var $checkboxHabilitado = $listaCheckbox.find('input[type="checkbox"][value="' + id +  '"]');
		$checkboxHabilitado.data('esclavo-seleccionable', true);
		$checkboxHabilitado.closest('div.checkbox').show();
	}
};

var maestroEsclavoActualizarSelectReiniciar = function ($select) {
	$select.find('option[selected]').removeAttr('selected');
    $select.val(undefined);
	if ($select.is('[data-select-type="selectpicker"]')) {
		$select.selectpicker('refresh');
	}
};

var maestroEsclavoActualizarSelectFiltrar = function($select, datos) {
	$select.find('option[value]')
		.hide()
		.attr('disabled', true)
		.data('esclavo-seleccionable', false);
	datos.forEach(function(dato) {
		var id = dato['id'];
		$select.find('option[value="' + id + '"]')
				.show()
				.data('esclavo-seleccionable', true)
				.removeAttr('disabled');
	});
	var esRequerido = $select.prop('required');
	var tieneValor  = !!$select.val();
	if (esRequerido && !tieneValor && datos.length === 1) {
		$select.val(datos[0]['id']);
	}
	if ($select.is('[data-select-type="selectpicker"]')) {
		$select.selectpicker('refresh');
	}
};

var maestroEsclavoEsconder = function($maestro, $esclavos) {
	var valor		= null;
	var $formulario = $maestro.closest('form');
	if ($maestro.is('input[type="radio"]')) {
		//Es un radio por lo que obtenemos el radio seleccionado
		var name = $maestro.attr('name');
		$maestro = $formulario.find('input[name="' + name + '"]:checked');
		if ($maestro.length === 0) {
			return;
		}
	}
	if ($maestro.is('select')) {
		valor = $maestro.find('option:selected').data('maestro-esconder');
	} else if($maestro.is('input[type="checkbox"]')) {
		if ($maestro.is(':checked')) {
			valor = 1;
		} else {
			valor = "";
		}
	} else {
		valor = $maestro.val();
	}
	var esconder = $maestro.data('maestro-esconder').split(';');
	for (var i = 0, max = esconder.length; i < max; i++) {
		var clave		  = esconder[i];
		var $esclavo	  = $esclavos.filter('[data-esclavo="' + clave + '"]');
		var $oculto		  = $formulario.find('input[name="maestro-esclavo-esconder-' + clave + '"]');
		var valorEsconder = $esclavo.data('esclavo-esconder');
		var negar		  = $esclavo.data('esclavo-negar');
		var accion		  = ((valorEsconder === valor && negar) || (valorEsconder !== valor && !negar)) ? "mostrar" : "ocultar";

		if (accion === "ocultar") {
			$esclavo.closest('.form-group, div.checkbox').slideUp('fast');
			$esclavo.selectpicker('val', '');
			$esclavo.removeProp('required');
			$esclavo.removeAttr('required');

			if ($esclavo.is('input[type="checkbox"]')) {
				$esclavo.prop('checked', $esclavo.data('maestro-esclavo-checked-original'));
			}

			try {
				//Lo hacemos dentro de un catch porque a veces falla el jquery validation
				$esclavo.prop("selected", false).trigger('change');
			} catch (err) {

			}
		} else {
			$esclavo.closest('.form-group, div.checkbox').slideDown('fast');
			if ($esclavo.data('maestro-esclavo-required-original') === 'required') {
				$esclavo.attr('required', 'required');
				$esclavo.prop('required', true);
			}
		}
		$oculto.val(valor);
	}
};

var maestroEsclavoInicializar = function($contenedores) {
	//Activa la funcionalidad de maestro / esclavo y asigna los eventos.
	$contenedores.each(function() {
		var $contenedor = $(this);
		if ($contenedor.data('maestro-esclavo-inicializado') === true) {
			return;
		}
		$contenedor.data('maestro-esclavo-inicializado', true);
		var $maestros		  = $contenedor.find('[data-maestro]');
		var $maestrosFiltrar  = $maestros.filter('[data-maestro-filtrar]');
		var $maestrosEsconder = $maestros.filter('[data-maestro-esconder]');
		var $esclavos		  = $contenedor.find('[data-esclavo]');

		$maestrosFiltrar.change(function(e) {
			var $maestro = $(this);
			maestroEsclavoFiltrar($maestro, $esclavos, true);
		});

		$maestrosEsconder.change(function(e) {
			var $maestro = $(this);
			maestroEsclavoEsconder($maestro, $esclavos);
		});

		$esclavos.each(function () {
			var $esclavo	 = $(this);
			var mensaje		 = '<p class="esclavo-mensaje alert alert-info">' + $esclavo.data('esclavo-mensaje') + '</p>';
			var mensajeAjax  = '<p class="esclavo-mensaje-ajax alert alert-warning"><i class="fa fa-spin fa-spinner"></i> Cargando...</p>';
			var mensajeError = '<p class="esclavo-mensaje-error alert alert-danger">Ha ocurrido un error, vuelva a intentar.</p>';
			if ($esclavo.is(':not(select)')) {
				maestroEsclavoEstadoActivoEsclavos($esclavo, false);
			}
			if ($esclavo.is('select')) {
				if (!$esclavo.is('[data-esclavo-esconder]')) {
					maestroEsclavoEstadoActivoEsclavos($esclavo, false);
				}
			}
			if ($esclavo.is('select') || $esclavo.is('input')) {
				$esclavo.after(mensaje);
				$esclavo.after(mensajeAjax);
				$esclavo.after(mensajeError);
			} else {
				$esclavo.prepend(mensaje);
				$esclavo.prepend(mensajeAjax);
				$esclavo.prepend(mensajeError);
			}
			$esclavo.data('maestro-esclavo-required-original', $esclavo.attr('required'));
			$esclavo.data('maestro-esclavo-valor-original', $esclavo.val());
			if ($esclavo.is('input[type="checkbox"]')) {
				$esclavo.data('maestro-esclavo-checked-original', $esclavo.prop('checked'));
			}
		});

		$maestrosFiltrar.each(function() {
			//Por cada maestro de filtrado, le ponemos un icono de ajax
			var $maestro  = $(this);
			var $etiqueta = $maestro.closest('.form-group').find('label:first');
			$etiqueta.append('<i class="fa fa-spin fa-spinner maestro-ajax-icono"></i>');
		});

		$maestrosEsconder.each(function() {
			//Por cada maestro de esconder, le ponemos un campo oculto que llevará
			//el valor elegido para esconder o no. De esta manera evitamos
			//complejidades del lado del servidor
			var $maestro	= $(this);
			var $formulario = $maestro.closest('form');
			var esclavos	= $maestro.data('maestro-esconder').split(';');
			for (var i = 0, max = esclavos.length; i < max; i++) {
				var esclavo = esclavos[i];
				var name    = "maestro-esclavo-esconder-" + esclavo;
				//Los campos radio se repiten y por tanto ya podría existir
				//el campo oculto
				if ($formulario.find('[name="' + name + '"]').length === 0) {
					$formulario.append('<input type="hidden" name="' + name + '"/>');
				}
			}
		});

		//Ahora ejecutamos sus funciones si tienen valor por defecto
		$maestros.each(function() {
			var $maestro = $(this);
			var valor	 = $maestro.val();
			var datos	 = $maestro.data('maestro-filtrar-datos');

			if (valor === null || valor === '') {
				return;
			}

			if ($maestro.is('[data-maestro-filtrar]')) {
				if (typeof datos !== 'undefined') {
					//Estamos en una edición y tenemos los datos, por lo tanto filtramos
					//las opciones
					maestroEsclavoActualizar($esclavos, datos, false);
				} else {
					//Estamos en una edición o volvimos al formulario y tenemos un valor
					//seleccionado, por lo tanto filtramos las opciones
					maestroEsclavoFiltrar($maestro, $esclavos, false);
				}
			}

			if ($maestro.is('[data-maestro-esconder]')) {
				maestroEsclavoEsconder($maestro, $esclavos);
			}
		});
	});
};
//</editor-fold>

function inicializarDurationPicker() {
	var dataSelector = 'data-duration';
	var $pickers = $('input[' + dataSelector + ']');
	if ($pickers.length === 0) {
		return;
	}
	var baseOptions = {
		translations: {
			day: 'día',
			hour: 'hora',
			minute: 'minuto',
			second: 'segundo',
			days: 'días',
			hours: 'horas',
			minutes: 'minutos',
			seconds: 'segundos',
		},
	};
	$pickers.each(function () {
		var $picker = $(this);
		var pickerOptions;
		try {
			var unparsedPickerOptions = $picker.attr(dataSelector);
			pickerOptions = JSON.parse(unparsedPickerOptions);
		} catch (e) {
			pickerOptions = {};
		}
		var options = $.extend({}, baseOptions, pickerOptions);
		$picker.durationPicker(options);
	});
}

/**
 * Esta función se ejecuta cuando se levanta una pantalla que tenga un form,
 * sea un alta o edición del módulo de abm y además cuando vuelve un ajax con
 * un formulario modal
 *
 * @returns void
 */
function inputsCrossBrowser() {
	typeDateCrossBrowser();
	typeTimeCrossBrowser();
    typeDateTimeLocalCrossBrowser();
	typeColorCrossBrowser();
	contadorTexto();
	autosizeTextArea();
	transformarSelect();
	tinyMce();
	agregarValidadorAgregables();
	inicializarUbicacionesEmbebibles();
	inicializarFontIconPicker();
	inicializarStarRating();
	inicializarPercircle();
	inicializarCollapsables();
	inicializarDurationPicker();
	maestroEsclavoInicializar($('.abm-formulario'));
	var $contenedoresListaDoble = $('.listaDoble-contenedor');
	if ($contenedoresListaDoble.length > 0) {
		inicializarListaDoble($contenedoresListaDoble);
	}
	var $contenedorOrdenable = $('[data-orden="contenedor"]');
	if ($contenedorOrdenable.length > 0) {
		inicializarOrdenable($contenedorOrdenable);
	}
	var $contenedorUploader = $('.uploadContainer');
	if ($contenedorUploader.length >0) {
		inicializarUploaders();
	}
	var $dataFormEtapas = $('[data-form-etapas]');

	formEtapas($dataFormEtapas);
}

//<editor-fold defaultstate="collapsed" desc="Funciones de fechas">

/**
 * A partir de una fecha, devuelve un texto legible de cuánto tiempo transcurrió
 * Por ejemplo: hace 5 meses
 *
 * @param string $tiempo
 * @returns string
 */
function tiempoTranscurrido(fechaEspanol) {
	var fecha = transformarFechaEspanol(fechaEspanol);
	var segundos = Math.floor((new Date() - fecha) / 1000);

	var intervalo = Math.floor(segundos / 31536000);

	if (intervalo > 1) {
		return intervalo + " años";
	}
	intervalo = Math.floor(segundos / 2592000);
	if (intervalo > 1) {
		return intervalo + " meses";
	}
	intervalo = Math.floor(segundos / 86400);
	if (intervalo > 1) {
		return intervalo + " días";
	}
	intervalo = Math.floor(segundos / 3600);
	if (intervalo > 1) {
		return intervalo + " horas";
	}
	intervalo = Math.floor(segundos / 60);
	if (intervalo > 1) {
		return intervalo + " minutos";
	}
	return Math.floor(segundos) + " segundos";
}

/**
 * Transforma las fechas del formato yyyy-mm-dd a un objeto Date
 *
 * @param string date
 * @returns Date
 */
function transformarFecha(fecha) {
	if (typeof fecha === "undefined" || fecha === null || fecha === "" ){
		return null;
	}
	var valueArr = fecha.split('-');
	valueArr[0] = parseInt(valueArr[0]);
	valueArr[1] = parseInt(valueArr[1]);
	valueArr[2] = parseInt(valueArr[2]);
	if (valueArr[2] == 0) {
		valueArr[1] =valueArr[1] + 1;
	}
	return new Date( valueArr[0], valueArr[1] - 1, valueArr[2]);
}

/**
 * Transforma las fechas del formato dd/mm/yyyy a un objeto Date
 *
 * @param string fecha
 * @returns Date
 */
function transformarFechaEspanol(fecha) {
	if (typeof fecha === "undefined" || fecha === null || fecha === "" ){
		return null;
	}
	var valueArr = fecha.split('/');
	return new Date( valueArr[2], valueArr[1] - 1, valueArr[0]);
}
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Validadores">

/**
 * Valida el step de los nros
 */
$.validator.addMethod("step", function( value, element, param ) {
	var type = $( element ).attr( "type" ),
		errorMessage = "Step attribute on input type " + type + " is not supported.",
		supportedTypes = [ "text", "number", "range" ],
		re = new RegExp( "\\b" + type + "\\b" ),
		notSupported = type && !re.test( supportedTypes.join() );

	// Works only for text, number and range input types
	// TODO find a way to support input types date, datetime, datetime-local, month, time and week
	if ( notSupported ) {
		throw new Error( errorMessage );
	}
	var globalizedValue = value.toString().replace(",", ".");
	param = param.toString().replace(",", ".");
	var exp = -Math.floor( Math.log(param) / Math.log(10) + 1) + 1;
	var potencia = Math.pow(10, exp);
	var mod = param * potencia;
	var div = potencia * potencia;
	var valorSepardo = globalizedValue.split('.');
	var cntDec = 0;
	if (valorSepardo[1]) {
		cntDec = valorSepardo[1].length;
	}
	globalizedValue = globalizedValue * potencia;
	globalizedValue = parseFloat(globalizedValue.toFixed(cntDec));
	return this.optional( element ) || ( (globalizedValue % mod) / div === 0 );
}, "Ingrese un múltiplo de {0}");

/**
 * Valida nro de teléfonos de Argentina
 */
$.validator.addMethod("phoneAR", function(phone_number, element) {
	phone_number = phone_number.replace(/\s+/g, "");
	return this.optional(element) || phone_number.length > 9 &&
		phone_number.match(/^\+?\d{1,3}?[- .]?\(?(?:\d{2,4})\)?[- .]?\(?(?:\d{2,4})\)?[- .]?\d{4}$/);
}, "Por favor ingresa un teléfono válido");

/**
 * Valida que el valor ingresado sea un dni válido.
 * Para activar validador agregar atributo: <b>data-rule-dni="dni"</b>
 */
$.validator.addMethod("dni", function(dni, element) {
	dni = dni.replace(/\s+/g, "");
	return this.optional(element) || dni.length > 6 &&
		dni.match(/^\+?\d{1,2}?[.]?\d\d\d[.]?\d\d\d$/);
}, "Por favor ingresa un D.N.I. válido");

/**
 * valida que un input no tenga el mismo valor que otro,
 * Para activar el input debe tener el attributo "data-rule-unico",
 * el valor que tome este data va a ser contra los elementos que va a comparar;
 * ej si un elemento tiene data-rule-unico="disertante", va a validar que el
 * resto de los elementos [data-rule-unico="disertante"] tengan un valor distinto.
 *
 * Para establecer un scope (alcance) para la verificación se utiliza
 * "data-context-unico" el valor que tome será el alcance, por defecto se usa "form"
 *
 * Para establecer un mensaje de error distinto del por defecto se usa:
 * "data-unico-mensaje": "Mensaje a mostrar".
 */
$.validator.addMethod("unico", function(value, element, params) {
    var prefix = params;
	var elementName = element.name;
	elementName = elementName.replace("modal-", "");
	elementName = elementName.replace("clon-", "");
	var $elementoOriginal = $('[name="' + elementName + '"]').not('[type="hidden"]');
	var contexto =  $elementoOriginal.data('context-unico');
	if (typeof contexto === 'undefined') {
		contexto = 'form';
	}
	var mensaje = $elementoOriginal.data('unico-mensaje');
	if (typeof mensaje !== 'undefined') {
		$.validator.messages["unico"] = mensaje;
	}
	var $contexto = $elementoOriginal.parents(contexto);
    var selector = $.validator.format(":not([name$='{0}'])[data-rule-unico='{1}']", elementName, prefix);
    var matches = new Array();
    var $camposEncontrados = $contexto.find(selector);
    $camposEncontrados.each(function(index, item) {
        if (value == $(item).val()) {
            matches.push(item);
        }
    });
    return matches.length == 0;
}, $.validator.format("El {0} ya fue ingresado"));

/**
 * valida que la suma de los imputs sea igual al parametro dado,
 * Para activar el input debe tener el attributo "data-rule-sum",
 * el valor que tome este data va a ser la suma total requerida;
 * ej si un elemento tiene data-rule-sum="100", va a validar que la suma de todos
 * los elementos [data-rule-sum="100"] sea 100.
 *
 * Para establecer un scope (alcance) para la verificación se utiliza
 * "data-sum-context" el valor que tome será el alcance, por defecto se usa "form"
 *
 * Para establecer un mensaje de error distinto del por defecto se usa:
 * "data-sum-mensaje": "Mensaje a mostrar".
 */
$.validator.addMethod(
    "sum",
    function (value, element, params) {
		var prefix = params;
		var elementName = element.name;
		var $elementoOriginal = $('[name="' + elementName + '"]:visible');
		if ($elementoOriginal.length === 0) {
			return true;
		}
		var contexto =  $elementoOriginal.data('sum-context');
		if (typeof contexto === 'undefined') {
			contexto = 'form';
		}
		var mensaje = $elementoOriginal.data('sum-mensaje');
		if (typeof mensaje !== 'undefined') {
			$.validator.messages["sum"] = mensaje;
		}
		var $contexto = $elementoOriginal.parents(contexto);
		var selector = $.validator.format("[data-rule-sum='{0}']", prefix);
        var sumaTotal = 0;
        var $camposEncontrados = $contexto.find(selector);
		$camposEncontrados.each(function(index, item) {
			sumaTotal += Number($(item).val());
		});
        if (sumaTotal == params) return true;
        return false;
    },
	$.validator.format("La suma debe ser {0}")
);

/**
 * valida que un input tenga un valor mayor a otro
 * Para activar el input debe tener el attributo "data-rule-mayorA",
 * el valor que tome este data va a ser contra el elemento (input) que va a comparar;
 * ej si un elemento tiene data-rule-mayorA="horaDesde", va a validar que el
 * input "horaDesde" que esté en su mismo contexto, tenga un valor menor.
 */
jQuery.validator.addMethod("mayorA", function(value, element, param) {
	function esValorMayorA(value1, value2) {
		if (value2 === "" || value2 === undefined) {
			return true;
		}

		if (!isNaN(value1) && !isNaN(value2)) {
			return Number(value1) > Number(value2);
		}

		var value1Moment = moment(value1);
		var value2Moment = moment(value2);

		if (value1Moment.isValid() && value2Moment.isValid()) {
			return value1Moment > value2Moment;
		}

		return value1 > value2;
	}


	var elementName = element.name;
	elementName = elementName.replace("modal-", "");
	elementName = elementName.replace("clon-", "");
	var $elementoOriginal = $('[name="' + elementName + '"]').not('[type="hidden"]');
	var contexto =  $elementoOriginal.data('context-mayora');
	if (typeof contexto === 'undefined') {
		contexto = 'form';
	}
	var $contexto = $elementoOriginal.parents(contexto);
	var valorComparar = $contexto.find(param).val();
	$.validator.messages["mayorA"] = 'Debe ingresar un valor mayor a ' + valorComparar;
  return esValorMayorA(value, valorComparar);
}, 'Erro debe ingresar un valor mayor a {1}');

/**
 * TODO: mejorar reglase de valicdacion de tipo menor-igual, mayorA.
 *
 * valida que un input tenga un valor menor o igual a otro
 * Para activar el input debe tener el attributo "data-rule-menor-igual",
 * el valor que tome este data va a ser contra el elemento (input) que va a comparar;
 * ej si un elemento tiene data-rule-menor-igual="horaDesde", va a validar que el
 * input "horaDesde" que esté en su mismo contexto, tenga un valor menor.
 *
 */
jQuery.validator.addMethod("menor-igual", function(value, element, param) {
	function esValorMenorIgualA(value1, value2) {
		if (value2 === "" || value2 === undefined) {
			return false;
		}

		if (!isNaN(value1) && !isNaN(value2)) {
			return Number(value1) <= Number(value2);
		}

		var value1Moment = moment(value1);
		var value2Moment = moment(value2);

		if (value1Moment.isValid() && value2Moment.isValid()) {
			return value1Moment <= value2Moment;
		}

		return value1 <= value2;
	}
	var elementName = element.name;
	elementName		= elementName.replace("modal-", "");
	elementName		= elementName.replace("clon-", "");
	var $elementoOriginal = $('[name="' + elementName + '"]').not('[type="hidden"]');
	var contexto =  $elementoOriginal.data('context-menor-igual');
	if (typeof contexto === 'undefined') {
		contexto = 'form';
	}
	var $contexto = $elementoOriginal.parents(contexto);
	var valorComparar = $contexto.find(param).val();
	$.validator.messages["menor-igual"] = 'Debe ingresar un valor menor o igual a ' + valorComparar;
	return esValorMenorIgualA(value, valorComparar);
}, 'Debe ingresar un valor menor o igual a {1}');

jQuery.validator.addMethod("starRating", function(value, element, params) {
	value = parseInt(value);
	if(params.comentario) {
		var requeridoHasta = params.comentario.requeridoHasta;
		var selector = params.comentario.selector;
		var scope = params.comentario.scope;
		if(value <= requeridoHasta) {
			$(element).closest(scope).find(selector).attr("required",true).slideDown();
		} else if(value > requeridoHasta) {
			var $scope = $(element).closest(scope);
			$scope.find(selector).removeAttr("required");
			$scope.find(".help-block").remove();
			$scope.find(".has-error").removeClass("has-error");
		}
	}
	var mensaje = "Debe ingresar una valoración";
	if (params.mensaje) {
		mensaje = params.mensaje;
	}
	$.validator.messages["starRating"] = mensaje;
	return value !== 0;
});

/*
 * Este metodo fue pisado del archivo original aditional.methods de la librería jquery.validation
 *
 * Lets you say "at least X inputs that match selector Y must be filled."
 *
 * The end result is that neither of these inputs:
 *
 *	<input class="productinfo" name="partnumber">
 *	<input class="productinfo" name="description">
 *
 *	...will validate unless at least one of them is filled.
 *
 * partnumber:	{require_from_group: [1,".productinfo"]},
 * description: {require_from_group: [1,".productinfo"]}
 *
 * Para pasar parámetros a la regla desde las anotaciones del formulario debemos
 * agregar a los campos a validar las sigguietnes anotaciones:
 * @Form\Attributes({
 * 		"required"		: false,
 *		"data-rule-require_from_group" : "[1,'.grupo1']",
 * 		"class" : "grupo1"
 * })
 * Si queremos pasar un mensaje personalizado, debemos transformar el array a json:
 * @Form\Attributes({
 * 		"required"		: false,
 *		"data-rule-require_from_group" : "'{
 *		 \'0\' : 1,
 *		 \'1\':\'.grupo1\',
 *		 \'mensaje\': \'Mesaje personalizado podemos usar: {0} se remplaza por el primer parámetro \'}'",
 * 		"class" : "grupo1"
 * })
 *
 * options[0]: number of fields that must be filled in the group
 * options[1]: CSS selector that defines the group of conditionally required fields
 */
$.validator.addMethod( "require_from_group", function( value, element, options ) {
	var mensajeTemplate = "Por favor complete al menos {0} de estos campos.";
	if (typeof options === 'string') {
		options = options.replace(/'/g,'"');
		options = JSON.parse(options);
		if (typeof options === 'string') {
			options = JSON.parse(options);
		}
	}
	if (options.mensaje) {
		var mensajeTemplate = options.mensaje;
	}
	$.validator.messages["require_from_group"] = $.validator.format(mensajeTemplate, options[0]);
	var $fields = $( options[ 1 ], element.form ),
		$fieldsFirst = $fields.eq( 0 ),
		validator = $fieldsFirst.data( "valid_req_grp" ) ? $fieldsFirst.data( "valid_req_grp" ) : $.extend( {}, this ),
		isValid = $fields.filter( function() {
			return validator.elementValue( this );
		} ).length >= options[ 0 ];

	// Store the cloned validator for future validation
	$fieldsFirst.data( "valid_req_grp", validator );

	// If element isn't being validated, run each require_from_group field's validation rules
	if ( !$( element ).data( "being_validated" ) ) {
		$fields.data( "being_validated", true );
		$fields.each( function() {
			validator.element( this );
		} );
		$fields.data( "being_validated", false );
	}
	return isValid;
}, $.validator.format( "Por favor complete al menos {0} de estos campos." ) );

/**
 * Agrega una mascara a los inputs con atributo:
 * <b>data-mask-dni</b>:
 * <b>data-mask-cuit</b>
 * <b>data-mask-telefono</b>: Para campo de teléfono (único) que incluya código
 *	de área + número, El campo debe soportar un string de 12 chars.
 * @returns {undefined}
 */
function agregarMascaras() {
	var TelefonoAr = function (val) {
		var val = val.replace(/\D/g, '');
		if (val.length < 10) {
			return '9999999999999';
		}
		if (val.length === 10) {
			/**códigos de área de 2 dígitos*/
			var codDos = [11];
			var codDosStr = codDos.join('|');
			var regExCf	= new RegExp('^(?:' + codDosStr +')');
			var match	= regExCf.test(val);
			if (match) {
				return '99-9999-9999'
			}
			/**códigos de área de 3 dígitos*/
			var codTres = [220,221,223,230,236,237,249,260,261,263,264,266,280,291,294,297,298,299,336,341,342,343,345,348,351,353,358,362,364,370,376,379,380,381,383,385,387,388];
			var codTresStr = codTres.join('|');
			var regExCf	= new RegExp('^(?:' + codTresStr +')');
			var match	= regExCf.test(val);
			if (match) {
				return '999-999-9999';
			}
			return '9999-99-9999';
		}
	};

	var	telefonoArMaskOptions = {
		onKeyPress: function (val, e, field, options) {
			field.mask(TelefonoAr.apply({}, arguments), options);
		}
	};
	if ($.mask) {
		$('[data-mask-dni]').mask("99.999.999", {reverse: true});
		$('[data-mask-cuit]').mask("99-99999999-9", {});
		$('[data-mask-telefonoar]').mask(TelefonoAr, telefonoArMaskOptions);
	}
}
var templateElementoOculto =
			'<div class="form-group">'
			+ '	<input type="number" name="[__nombre__]" min="1" step="1" [__atributo__] class="form-control hidden" value="[__valor__]">'
			+ '</div>';

/**
 * agrega un validador de requerido a los fielset contenedores de los elementos Agregables
 * para activar el elemento agregable debe tener uno de estos attributos con sus valores:
 * * data-validar="requerido-condicional"
 * * data-validar="requerido"
 * @returns {undefined}
 */
function agregarValidadorAgregables($context){
	$('[data-agregable="contenedor"][data-validar="requerido-condicional"], \n\
		[data-agregable="contenedor"][data-validar="requerido"]'
	).not('[data-validador-agregado="agregado"]').each(function(){
		var $this = $(this);
		if ($this.parents('[data-template="true"]').length > 0) {
			return true;
		}
		var atributo = '';
		var nombre = '';
		if ($this.data('validar') === "requerido-condicional"){
			atributo += 'data-validar="requerido-condicional"';
		}
		if ($this.data('validar') === "requerido"){
			atributo += ' required="required"';
		}
		var cantidad = $this.find('[data-agregable="elemento"]').length;
		if (cantidad === 0){
			cantidad = '';
		}
		nombre = 'cantidad-' + $this.data('tipo-objeto');
		var copiaTemplate = templateElementoOculto;
		copiaTemplate = copiaTemplate.replace('[__nombre__]', nombre);
		copiaTemplate = copiaTemplate.replace('[__atributo__]', atributo);
		copiaTemplate = copiaTemplate.replace('[__valor__]', cantidad);
		$this.prepend(copiaTemplate);
		$this.attr("data-validador-agregado", "agregado");
	});
};

/**
 * Actualiza el valor del campo oculto de los fielset contenedores de los elementos agregables
 * @param {type} form
 * @returns {undefined}
 */
function validarAgregables($form){
	$form.find('[data-agregable="contenedor"][data-validar="requerido-condicional"], \n\
		[data-agregable="contenedor"][data-validar="requerido"]'
	).each(function(){
		var $this = $(this);
		var nombre = '';
		var cantidad = $this.find('[data-agregable="elemento"]').length;
		if (cantidad === 0){
			cantidad = '';
		}
		nombre = 'cantidad-' + $this.data('tipo-objeto');
		var $oculto = $this.find('[name="'+ nombre +'"]');
		$oculto.attr('value', cantidad);
		$oculto.valid();
	});
}
//</editor-fold>

function validarForm($form) {
	validarAgregables($form);

	//Validamos los condicionales
	$form.find('[data-validar="requerido-condicion"]').each(function() {
		var $this = $(this);
		validarCondicional($this);
	});

	//Actualizo los textarea relaconados a los tinyMCE antes de guardar
	if ($form.attr('data-tinymce-inicializado') == 'true') {
		tinyMCE.triggerSave();
	}
}

function validarCondicional($this) {
	var scope, valorCondicion, operadorBinario;
	scope = $this.data("validar-scope");
	valorCondicion = $this.data("validar-valor");
	operadorBinario = $this.data("validar-operador"); // esta variable puede tomar los valores '==', '>=', <=, '<', '>'
	if (typeof scope === 'undefined') {
		scope = 'fieldset';
		if ($this.closest(scope).length === 0){
			scope = 'form';
		}
	}
	if (typeof valorCondicion === 'undefined') {
		valorCondicion = 'notEmpty';
	}
	if (typeof operadorBinario === 'undefined') {
		operadorBinario = '==';
	}

	var $scope = $this.closest(scope);
	var scopeSelector = $this.data('validar-scope-campos');
	if (typeof scopeSelector !== 'undefined') {
		if (scopeSelector === '*') {
			scopeSelector = 'select,input,textarea';
		}
		var $campos = $scope.find(scopeSelector)
							.not('[data-agregable="contenedor"]');
	} else {
		var $campos = $scope.find('[data-validar="requerido-condicional"]')
							.not('[data-agregable="contenedor"]');
	}
	$campos.not($this).removeAttr('required');
	if (verificarCondicion($this, valorCondicion, operadorBinario)) {
		$campos.attr('required', 'required');
	}

	$campos.valid();
};

function verificarCondicion($objeto, valorCondicion, operadorBinario){
	var salida = false;
	var objetoName = '[name="' + $objeto.attr('name') + '"]';
	var valorObjeto = $(objetoName).val();
	if (valorObjeto === null) {
		return salida;
	}
	var tipoCondicion = typeof valorCondicion;
	if (tipoCondicion !== 'string') {
		valorCondicion = valorCondicion.toString();
	}
	if (valorCondicion !== 'notEmpty'){
		valorCondicion = valorCondicion.split(';');
	}
	var tipo = (typeof $objeto.attr('multiple') === 'undefined') ? 'single' : 'multiple';

	if (tipo ===  'multiple') {
		if (valorObjeto.length > 0 && valorCondicion === 'notEmpty'){
			salida = true; //si el select tiene algo seleccionado y la condicion es que no sea vacío
		}
		valorCondicion.forEach(function(valorCond){
			if (!Array.isArray(valorObjeto)) {
				return;
			}
			valorObjeto.forEach(function(valorObj){
				if (valorCond == valorObj){
					salida = true;
				}
			});
		});
		var textos = [];
		$(objetoName).find(':selected').each(function(i, selected){
			textos[i] = $(selected).val();
		});
		$(objetoName).filter(':checked').each(function(i, selected){
			textos[i] = $(selected).val();
		});
		valorCondicion.forEach(function(valorCond){
			textos.forEach(function(valorObj){
				if (valorCond == valorObj){
					salida = true;
				}
			});
		});
	} else {
		if (valorObjeto !== '' && valorCondicion === 'notEmpty') {
			salida = true;
		}
		if (valorCondicion !== 'notEmpty') {
			var textos = [];
			textos[0] = valorObjeto;
			$objeto.find(':selected').each(function(i, selected){
				textos[i] = $(selected).val();
			});
			$objeto.filter(':checked').each(function(i, selected){
				textos[i] = $(selected).val();
			});
			valorCondicion.forEach(function(valorCond){
				textos.forEach(function(valorObj){
					switch(operadorBinario) {
						case '==':
							if (valorCond == valorObj){
								salida = true;
							}
							break;
						case '!=':
							if (valorCond != valorObj){
								salida = true;
							}
							break;
						case '>=':
							if (valorObj >= valorCond){
								salida = true;
							}
							break;
						case '<=':
							if (valorObj <= valorCond){
								salida = true;
							}
							break;
						case '<':
							if (valorObj < valorCond){
								salida = true;
							}
							break;
						case '>':
							if (valorObj > valorCond){
								salida = true;
							}
							break;
						default:
							if (valorCond == valorObj){
								salida = true;
							}
							break;
					}

				});
			});
		}
	}
	return salida;
}

function agregarFuncionalidadModal($agregableModalForms) {
	inputsCrossBrowser();
	agregarMascaras();
	if (typeof inicializarUploaders === "function") {
		inicializarUploaders();
	}

	$agregableModalForms.on( "click", "button[data-action='validarForm']", function() {
		var $boton = $(this);
		var context = $boton.data('context');
		var $context = $boton.closest('#' + context );

		var $form = $context.find('form');
		$form.validate({
			ignore: '.moxie-shim input'
		});
		if ($form.valid()) {
			$context.attr('evento', 'guardar');
			copiarDatos($context);
		}
	});

	$agregableModalForms.find('.modal').on( "hide.bs.modal", function(e) {
		var $modal = $(this);
		var evento = $modal.attr('evento');
		var id = $modal.attr('id');
		if (evento === 'crear') {
			var $renglon = $('.agregable-contenedor').find('[data-renglon="' + id + '"]');
			eliminarElemento($renglon);
			$modal.parent().modal('hide');
		}
	});
	$agregableModalForms.find('.modal').on( "hidden.bs.modal", function(e) {
		var $modal = $(this);
		var id = $modal.attr('id');
		var $renglon = $('.agregable-contenedor').find('[data-renglon="' + id + '"]');
		var $form = $renglon.closest('form');
		validarAgregables($form);
	});
}

/**
 * Abre una ventana en la url indicada junto a la ventana de impresión del
 * navegador. Una vez impreso o cancelado cierra automáticamente la ventana.
 *
 * @param string url
 * @param int ancho
 * @param int alto
 * @returns {undefined}
 */
function imprimirUrl(url, ancho = 950, alto = 500) {
	var left	= (screen.width/2)-(ancho/2);
    var top		= (screen.height/2)-(alto/2);
    var ventana = window.open( url, 'Print', 'left=' + left + ', top=' + top + ', width=' + ancho + ', height=' + alto + ', toolbar=0, resizable=0');
    ventana.addEventListener('load', function() {

		if (Boolean(ventana.chrome)) {
			//Estamos en Chrome cuya ventana de impresión no es la del sistema
			//operativo y por tanto requiere otro trato.
			//Primero debe agrandarse la ventana y luego armarse un timeout que
			//correrá después de la función "print".
			ventana.print();
			setTimeout(function(){
				ventana.close();
			}, 500);
		} else {
			ventana.print();
			ventana.close();
		}
    }, true);
}

$(document).ready(function() {
	var $document = $(document);

	$('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
		var $this = $(this);
		event.preventDefault();
		event.stopPropagation();
		$this.parent().siblings().removeClass('open');
		$this.parent().toggleClass('open');
	});

	$('ul .dropdown-submenu').hover(
		function() {
		  $( this ).addClass( "hover" );
		}, function() {
		  $( this ).removeClass( "hover" );
		}
	);

	$('[data-toggle="popover"]').popover();
	$('[data-toggle="tooltip"]').tooltip();

	if ($.datepicker) {
		var optionsDP = $.extend(
			{},
			$.datepicker.regional["es"]
		);
		$.datepicker.setDefaults(optionsDP);
	}

	//<editor-fold defaultstate="collapsed" desc="Filtrado rápido de html">
	var filtrados = $('[data-filtrado]');
	if (filtrados.length > 0) {
		filtrados.keyup(function(e) {
			var campo			 = $(this);
			var texto			 = campo.val();
			var selectorMostrar  = campo.data('filtrado') + ':contiene(' + texto + ')';
			var selectorOcultar  = campo.data('filtrado') + ':not(:contiene(' + texto + '))';
			var mostrar			 = $(selectorMostrar);
			var ocultar			 = $(selectorOcultar);
			mostrar.slideDown('fast');
			ocultar.slideUp('fast');
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Enlace entre campos de formulario">
	/**
	 * Filtra los valores de un campo, respecto a la seleccion que se hizo en otro.
	 * ej Proyecto Fantastico campo proyecto filtra requerimiento
	 */
	var $enlazarA = $('[data-enlazar-a]');
	$enlazarA.change(function(e) {
		var $campo		= $(this);
		var id			= $campo.val();
		var $objetivos	= $($campo.data('enlazar-a'));
		$objetivos.each(function() {
			var $objetivo = $(this);
			switch ($objetivo.prop("tagName").toLowerCase()) {
				case "select":
					var $opciones = $objetivo.find('option');
					if (id !== "") {
						$objetivo.removeAttr('disabled');
						$opciones.hide();
						$opciones.filter('[data-valor="' + id + '"]').show();
						$opciones.eq(0).show();
					} else {
						$opciones.show();
						$objetivo.attr('disabled', 'disabled');
					}
					break;
			}
		});
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Botones Ajax">
	$document.on("click", "[data-ajax]", function(e) {
		var $boton	= $(this);
		var id			= $boton.data('id');
		var url			= $boton.attr('href').replace('/0/', '/' + id + '/');
		var modulo		= $boton.data('modulo');
		var operacion	= $boton.data('ajax');
		var $icono		= $boton.find('i:first');
		var iconoAnt	= $icono.attr('class');
		if ($icono.length === 1) {
			$icono.attr('class', 'fa fa-spin fa-spinner');
		} else {
			$boton.prepend('<i class="fa fa-spin fa-spinner"></i> ');
		}
		$boton.attr('disabled', 'disabled');

		$.ajax({
			url: url
		}).done(function (data, textStatus, jqXHR) {
			try {
				var funcion = "ajax" + ucFirst(modulo) + ucFirst(operacion);
				if (window[funcion] !== undefined) {
					window[funcion](data);
				}
			} catch (err) {
				alert(err);
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
			alert(textStatus);
		}).complete(function(jqXHR, textStatus) {
			if ($icono.length === 1) {
				if ($icono.data('original') !== undefined) {
					$icono.attr('class', $icono.data('original'));
				} else {
					$icono.attr('class', iconoAnt);
				}
			} else {
				$boton.find('i.fa-spin').remove();
			}
			$boton.removeAttr('disabled');
		});
		e.preventDefault();
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Evitar submit de formulario en campos de busqueda">
	$( '[data-funcion="buscar"]').each(function(){
			$(this).bind('keypress keydown keyup', function(e){
				if(e.keyCode === 13) {
					e.preventDefault();
					e.stopPropagation();
				}
			})
    });
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="validacion formularios">
	$.validator.setDefaults(
			(function () {
				var getControlledElement = function (element) {
					if (element.hasAttribute('name')) {
						return element;
					}
					var $element = $(element);
					var $controlledElement = $element.closest('.form-group').find('[name]');
					return $controlledElement.length ? $controlledElement.get(0) : element;
				};
				var config = {
					ignore: '.moxie-shim input, div.moxie-shim, [data-validator="ignorar"]',
					onfocusout: function (element, event) {
						/**
						* Si queremos que un elemento de formulario solo se valide al momento de hacer
						* el submit, agregamos el atributo: "validate-on-submit". *
						*/
						if ($(element).data("validate-on-submit")) return;
						this.element(getControlledElement(element));
					},
					highlight: function (element) {
						if (!element.hasAttribute('name')) {
							return;
						}
						$(element).closest('.form-group').addClass('has-error');
					},
					unhighlight: function (element) {
						if (!element.hasAttribute('name')) {
							return;
						}
						$(element).closest('.form-group').removeClass('has-error').find('span.help-block').remove();
					},
					errorElement: 'span',
					errorClass: 'help-block formulario-error',
					errorPlacement: function (error, element) {
						if (element.hasClass('listaDoble-checkbox')) {
							error.appendTo(element.closest('.form-group'));
						} else if (element.parents('.input-group').length) {
							element.parents('.input-group').after(error);
						} else if (element.attr('type') === 'radio') {
							element.parents('.form-group').after(error);
						} else if (element.hasClass('hidden')
								|| !$(element).is(":visible")) {
							element.parent().append(error);
						} else {
							element.parents('.form-group').append(error);
						}
					},
					invalidHandler: function (form, validator) {
						var errors = validator.numberOfInvalids();
						if (errors) {
							if ($(validator.errorList[0].element).is(":visible")) {
								$('html, body').animate({
									scrollTop: $(validator.errorList[0].element).offset().top - 100
								}, 1000);
							} else {
								var $element = $('[name="' + $(validator.errorList[0].element).attr("name") + '"]');
								var $tab = $element.parents('.form-etapa');
								if ($tab.length > 0) {
									var idTab = $tab.attr('id');
									$('[href="#' + idTab + '"]').tab('show');
								}
								$('html, body').animate({
									scrollTop: $element.parent().offset().top - 100
								}, 1000);
							}
						}
					},
					submitHandler: function (form) {
						var $formulario = $(form);
						var iconoBotones = [];
						if ($formulario.data('submit') !== false) {
							formSubmitting = true;
							form.submit();
							if ($(this.submitButton).data('descargar')) {
								alerta("La descarga comenzará en unos instantes", 'info', $formulario);
								setTimeout(function () {
									$botones.each(function (index) {
										$(this).find('.fa').replaceWith(iconoBotones[index]);
										$(this).removeAttr('disabled');
									});
								}, 3000);
							}
						}
						if ($formulario.data('deshabilitar') !== false) {
							var $botones = $formulario.find('button[type="submit"],input[type="submit"]');
							$botones.attr('disabled', 'disabled');
							$botones.each(function (index) {
								iconoBotones[index] = $(this).find('.fa').clone();
							});
							$botones.find('.fa').remove();
							$botones.find('.zmdi').remove();
							$botones.prepend('<i class="fa fa-spin fa-spinner"></i> ');
						}
					}
				};
				return config;
			}.bind(this))()
	);
	$('form').not('[data-validator="ignorar"]').each(function(){
		var $form = $(this);
		$form.on('change', ':hidden, [data-validator="forzar"]', function(){
			var $this = $(this);
			if ($this.hasClass("moxie-shim")) {
				return true;
			}
			$this.valid();
		});
		var validator = $form.validate();
		$form.find('select').on('change', function () {
			validator.element($(this));
		});
	});

	$('[type="submit"]')
			.not('[data-validator="ignorar"]')
			.not('formnovalidate').click(function() {
		var $form = $(this).parents('form').eq(0);
		validarForm($form);
	});

	function validarGrupo(element) {
		var $this = $(element);
		var scope = $this.data("validar-scope");
		if (typeof scope === 'undefined') {
			scope = 'form';
		}
		var $campos = $this.parents(scope).eq(0).find('[data-validar="grupo-opcional"]');
		var encontrado = false;
		$campos.each(function() {
			var $campo = $(this);
			var valor  = $campo.val();
			if (valor !== "") {
				encontrado = true;
				return false;
			}
		});
		if (encontrado) {
			$campos.attr('required', 'required');
		} else {
			$campos.removeAttr('required');
			$campos.valid();
		}
	};
	$(document).on('change', 'form [data-validar="grupo-opcional"]', function(){
		validarGrupo(this);
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Input type date cross browser y validador">
	inputsCrossBrowser();
	//</editor-fold>

	agregarMascaras();

	$(document).on("click dblclick mousedown mouseup select keydown keypress keyup", 'fieldset[disabled="disabled"] *, input[readonly="readonly"]' , function(e){
		e.stopPropagation();
		e.preventDefault();
		return false;
	});

	$(document).on("reset", "form", function(e){
		setTimeout(function() {
			$('[data-selectpicker-iniciado="1"]',this).selectpicker('refresh');
		});
	});
	if (typeof Modernizr !== 'undefined') {
		if (!Modernizr.inputtypes.time) {
			$('input[type="time"]').each(function(){
				var $this = $(this);
				$this.datetimepicker({
					format: 'HH:mm'
				});
			});
		}
	}

	$('.abm-formulario').on('focusout', '.bootstrap-select', function() {
		var $bootstrapSelect = $(this);
		var $formulario		 = $bootstrapSelect.closest('form');

		if ($formulario.attr('data-validator') !== "ignorar") {
			$bootstrapSelect.find('select').valid();
		}
	});

});
