/* global agregableModalOptions */
var agregableModalOptions;
function copiarAgregables($fieldsetContenedor) {
	var copiarA		= $fieldsetContenedor.data('copiar-a');
	var idMoldalpadre = $fieldsetContenedor.parents('.modal').eq(0).attr('id');
	var $fieldsetBase = $('[data-renglon=' + idMoldalpadre + '] [data-name="' + copiarA + '"]');
	var $botones = $fieldsetBase.find('fieldset.agregable-btn-group').eq(0);
	$fieldsetBase.html('');
	$fieldsetContenedor.children().each(function() {
		var $this = $(this);
		$fieldsetBase.append($this.clone(true, true));
	});
	$fieldsetBase.append($botones);
}

function copiarDatos($context) {

	$context.find('[data-copiar="copiar"]').each(function() {
		var $original	= $(this);
		var name		= $original.attr('name');
		var copiarA		= $original.data('copiar-a');
		if (typeof name !== "undefined") { //si es undefined es un fieldset
			name = name.replace('clon-modal-', 'clon-'); //lo hago porque los datepicker tienen el nombre clon-modal-
		}
		//Verifico si es un fieldset agregable
		if ($original.is("fieldset") && $original.data('agregable') === 'contenedor') {
			copiarAgregables($original);
			//continue
			return true;
		}
		var valorCopiar = $original.val();
		var $objeto = $('[name="' + name + '"][data-name="' + copiarA + '"]:first')
							.closest('fieldset,form')
							.find('[data-name="' + copiarA + '"]');
		$objeto.each(function() {
			var $this = $(this);
			if ($this.attr('type') === 'checkbox') {
				$this.prop('checked', $original.prop('checked'));
			} else {
				$this.val(valorCopiar);
				$this.attr('value', valorCopiar);
			}
			if ($this.attr("data-copiar") === "copiar") {
				var $parent = $objeto.parent();
				copiarDatos($parent);
			}
		});
	});
	$context.modal('hide');
}

function eliminarElemento($elemento) {
	var $form = $elemento.closest('form');
	var renglonID = '#' + $elemento.data('renglon');
	var $modales = $(renglonID + '.modal'); //busco si el renglón que estoy quitando tiene modales relacionados
	$elemento.slideUp('slow', function() {
		$elemento.remove();
		$modales.remove();
	});
	validarAgregables($form);
	return false;
}

$(document).ready(function() {
	var elementosContext = {};

	function inicializarContadores() {
		elementosContext = {};
		$('[data-template-ph]').each(function() {
			var $this = $(this);
			var tph = $this.data('template-ph'); //TemplatePlaceHolder
			$this.children('fieldset').each(function() {
				if (typeof elementosContext[tph] !== 'undefined') {
					elementosContext[tph] += 1;
				} else {
					elementosContext[tph] = 0;
				}
			});
		});
	}

	var $agregableModalForms = $('#agregable-modalForm');
	$( 'body').on("click", "button.agregable-btn-eliminar", function(e) {
		e.preventDefault();
		var $boton = $(this);
		var $contenedor = $boton.closest('fieldset[data-agregable="elemento"]');
		var $context = $contenedor.closest('fieldset[data-agregable="contenedor"]');
		$context.trigger('quitado', [$contenedor] );
		eliminarElemento($contenedor);
		var target = $boton.siblings('[name="editar"]').attr('data-target');
		$(target).remove();
	});

	$('fieldset[data-agregable="contenedor"]').each(function() {
		var $this = $(this);
		var context = $this.data('context');
		var $elementos = $this.find('fieldset[data-agregable="elemento"]');
		var $spanTemplate = $('span#' + context);
		//var template = $spanTemplate.data('template').replace('&#x20;', '[').replace('&#x5D;', ']');
		var template = $spanTemplate.data('template');
		var $template = $('<div>' + template + '</div>');

		//<editor-fold defaultstate="collapsed" desc="Busca elementos uploaders y modales, si existen cambia de lugar el boton que activa el modal">
		var encontroUlpadersyModal = false;
		$elementos.each(function() {
			var $this = $(this);
			var $botonModal = $this.find('button[data-toggle="modal"]');
			var $controlesUploader = $this.find('div.uploader-controles');
			if ($controlesUploader.length > 0 && $botonModal.length > 0) {
				encontroUlpadersyModal = true;
				//$controlesUploader.append($botonModal);
			}
		});
		if (encontroUlpadersyModal) {
			var $botonModal = $template.find('button[data-toggle="modal"]');
			var $controlesUploader = $template.find('div.uploader-controles');
			if ($controlesUploader && $botonModal) {
				encontroUlpadersyModal = true;
				//$controlesUploader.append($botonModal);
			}
		}
		//</editor-fold>

		//<editor-fold defaultstate="collapsed" desc="Busca elementos ordenables y les quita el modal de adentro">
		var $elementosOdenables = $this.find('fieldset[data-orden="elemento"]');
		$elementosOdenables.each(function() {
			var $this = $(this);
			var $modal = $this.find('div.modal');
			if ($modal.length > 0) {
				$agregableModalForms.append($modal);
			}
		});
		//</editor-fold>

		$spanTemplate.data('template', $template.html());

		var maximoAgregablePorAltaEdicion = $this.data('maximo-agregable-por-alta-edicion');
		if (maximoAgregablePorAltaEdicion) {
			var agregados = $this.data('agregados');
			habilitarDeshablitarBotonesAgregable($this, maximoAgregablePorAltaEdicion, agregados);
		}

	});

	$( "body" ).on( "click",  "button.boton-agregar", function(e) {
		e.preventDefault();
		inicializarContadores();
		var $boton			= $(this);
		var context			= $boton.data('target-context');
		var $context		= $boton.closest('fieldset[data-context="' + context + '"]');
		//Obtengo el modal que uso de Template
		var $modalTemplate	= $('div.modal[data-template-context="' + context + '"][data-template="true"]', 'div#agregable-modalForm');
		var template		= $('span#' + context).data('template').replace(/&#x20;/g, ' ').replace(/&#x5D;/g, ']').replace(/&#x5B;/g, '[');
		var tph				= $context.data('template-ph');
		if (typeof elementosContext[tph] === 'undefined') {
			elementosContext[tph] = 0;
		}
		var regExp		= new RegExp(tph + ']', "g");
		var regExp4		= new RegExp(tph + '-', "g");
		var reemplazo1	= elementosContext[tph] + ']';
        template		= template.replace(regExp, reemplazo1);
		template		= template.replace(regExp4, elementosContext[tph] + '-');
		for(var key in elementosContext) {
			var regExp2		= new RegExp( key + ']', "g");
			var reemplazo2	= elementosContext[key] - 1 + ']';
			template		= template.replace(regExp2, reemplazo2);
		}

		var $template = $(template);
		$template.hide();
		var $ultimoElementoVisible = $context.children('fieldset[data-agregable="elemento"]:visible:last,legend:visible:last').last();
		if ($ultimoElementoVisible.length > 0) {
			$ultimoElementoVisible.after($template);
		} else {
			$context.prepend($template);
		}
		$template.slideDown('slow');
		$context.trigger('agregado', [$template] );

		if ($context.hasClass('orden-contenedor')) {
			establecerOrden($context); //declarada en base\public\js\ordenable.js
		}
		//var $modal = $template.find('div.modal');
		if ($modalTemplate.length > 0 ) {
			var $modal = $modalTemplate.clone(true, true);
			$modal.html(function(index, html) {
				var html = html.replace(regExp,  elementosContext[tph] + ']' );
				var regExp3 = new RegExp( tph + '-', "g");
				html = html.replace(regExp3, elementosContext[tph] + '-');
				for(var key in elementosContext) {
					var regExp2 = new RegExp( key + ']' , "g");
					var reemplazo2 = elementosContext[key] - 1 + ']';
					html = html.replace(regExp2, reemplazo2);
				}
				return html;
			});
			var id = $modal.attr('id');
			var ariaLabelledBy  = $modal.attr('aria-labelledby');
			var regExp = new RegExp( tph + '-', "g");
			id = id.replace(regExp, elementosContext[tph] + '-');
			ariaLabelledBy = ariaLabelledBy.replace(regExp, elementosContext[tph] + '-');
			$modal.attr('id', id);
			$modal.attr('aria-labelledby', ariaLabelledBy);
			$modal.removeAttr('data-template');
			if ($agregableModalForms.length !== 0) {
				$agregableModalForms.append($modal);
			} else {
				$modalTemplate.parent().append($modal);
			}
			var showModal = false;
			if ($context.data('modal-automatico')) {
				$modal.attr('evento', 'crear');
				showModal = true;
			}
			var defaultModalOptions = { show : showModal };
			var parametrosModal =  $.extend(defaultModalOptions, agregableModalOptions);
			$modal.modal(parametrosModal);
			agregarFuncionalidadModal($modal);
		}
		if (typeof inicializarUploaders === "function") {
			inicializarUploaders();
		}
		inputsCrossBrowser();

		if (typeof $.material !== "undefined") {
			var $checkbox = $(".checkbox > label > input[type=checkbox], label.checkbox-inline > input[type=checkbox]", $context);
			$.material.checkbox($checkbox);
		}

		elementosContext[tph] += 1;
		$template.enfocarFormulario();
	});

	$( "body" ).on( "click",  "button.boton-quitar", function(e) {
		e.preventDefault();
		var $boton = $(this);
		var context = $boton.data('target-context');
		var $context = $boton.closest('fieldset[data-context="' + context + '"]');
		$context.children('fieldset[data-agregable="elemento"]:visible:last').each(function() {
			var $this = $(this);
			$context.trigger('quitado', [$this] );
			eliminarElemento($this);
		});
	});

	$( "body" ).on( "click",  '.agregable-contenedor button[name="editar"]', function(e) {
		e.preventDefault();
		e.stopPropagation();
		var $boton = $(this);
		var $modal = $($boton.data('target'));
		$modal.attr('evento', 'editar');
		agregarFuncionalidadModal($modal);
		var defaultModalOptions = { show : true };
		var parametrosModal =  $.extend(defaultModalOptions, agregableModalOptions);
		$modal.modal(parametrosModal);
	});

	function notificacionAgregable($fechaEnvio) {
		var $fieldset = $fechaEnvio.closest('fieldset');
		var value     = $fechaEnvio.attr("value");
		if (value !== "" && value !== null && typeof value !== "undefinded") {
			readonlyFieldset($fieldset);
			return true;
		}
		$fechaEnvio.hide().parents('.form-group').hide();
	}

	function chequearAgregable($contenedor) {
		var maximoAgregablePorAltaEdicion = $contenedor.data('maximo-agregable-por-alta-edicion');
		if (maximoAgregablePorAltaEdicion) {
			var agregados = $contenedor.data('agregados') + 1;
			$contenedor.data('agregados', agregados);
			habilitarDeshablitarBotonesAgregable($contenedor, maximoAgregablePorAltaEdicion, agregados);
		}
	}

	function habilitarDeshablitarBotonesAgregable($contenedor, $cntMax, $cntActual) {
		var $btnNuevaRepeticion  = $contenedor.find('[name="nueva-repeticion"]');
		var $btnQuitarRepeticion = $contenedor.find('[name="quitar-repeticion"]');
		var $btnsQuitarElemento	 = $contenedor.find('[name="quitarElemento"]');
		$btnNuevaRepeticion.removeAttr("disabled");
		$btnQuitarRepeticion.removeAttr("disabled");
		$btnsQuitarElemento.removeAttr("disabled");
		if ($cntMax === $cntActual) {
			$btnNuevaRepeticion.attr("disabled", "disabled");
		}
		if (0 === $cntActual) {
			$btnQuitarRepeticion.attr("disabled", "disabled");
			$btnsQuitarElemento.attr("disabled", "disabled");
		}

	}

	$('[data-notificacion-envio="1"]').each(function(){
		notificacionAgregable($(this));
	});

	$('fieldset[data-agregable="contenedor"]').on("agregado", function(event, $objeto){
		var $this = $(this);
		var $fechaEnvio = $objeto.find('[data-notificacion-envio="1"]').eq(0);
		if ($fechaEnvio) {
			notificacionAgregable($fechaEnvio);
		}
		var maximoAgregablePorAltaEdicion = $this.data('maximo-agregable-por-alta-edicion');
		if (maximoAgregablePorAltaEdicion) {
			var agregados = $this.data('agregados') + 1;
			$this.data('agregados', agregados);
			habilitarDeshablitarBotonesAgregable($this, maximoAgregablePorAltaEdicion, agregados);
		}
	});

	$('fieldset[data-agregable="contenedor"]').on("quitado", function(event, $objeto){
		var $this = $(this);
		var maximoAgregablePorAltaEdicion = $this.data('maximo-agregable-por-alta-edicion');
		if (maximoAgregablePorAltaEdicion) {
			var agregados = $this.data('agregados') - 1;
			$this.data('agregados', agregados);
			habilitarDeshablitarBotonesAgregable($this, maximoAgregablePorAltaEdicion, agregados);
		}
	});

	agregarFuncionalidadModal($agregableModalForms);
});

