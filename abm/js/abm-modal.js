/* global modalFormOptions, formModalAjaxOptions */

/**
 *
 * @param {type} $parametros necesita un objeto JSon minimamente definido igual que defaultOptions
 * defaultOptions
 * @param {type} $emergente Se puede pasar el modal que lo esta utilizando
 * @returns {undefined}
 */
function modalForm($parametros, $emergente) {
	var modalFormDefaultOptions = {
		"modo" : "visualizar",
		"agregarBotonesCancelar" : true,
		"cerrarAutmatico" : true,
		"multipleForm" : false,
		"formSelector" : '',
		"funcionEditar" : function(){},
		"funcionNuevo" : function(){},
		"funcionSiemprePirmero" : function(){},
		"funcionSiempreUltima" : function(){},
	};
	var selectorFocus  = 'input:visible:not([disabled]),select:visible:not([disabled]),textarea:visible:not([disabled])';
	var $mergedOptions = $.extend(modalFormDefaultOptions, $parametros);
	var modalFomrOptionsText = $('#modalFormOptions', $emergente).text();
	var modalFormOptions;
	if (modalFomrOptionsText === '') {
		modalFormOptions = {"objeto": {}, "formUrl": ""}; //si no hay configuración definida, creo una por defecto
	} else {
		modalFormOptions = JSON.parse(modalFomrOptionsText);
		modalFormOptions.formUrl = decodeURIComponent(modalFormOptions.formUrl);
		modalFormOptions.objeto = JSON.parse(modalFormOptions.objeto);
	}
	if ($mergedOptions.multipleForm) {
		var form = $mergedOptions.formSelector;
	} else {
		var form = 'form[name="' + modalFormOptions.formName + '"]';
	}

	var botonCanelar = '<button type="button" name="botones[botonCancelar]" data-dismiss="modal" class="btn"><span class="fa fa-times"></span> Cancelar</button>'
	var $formulario = $(form);
	if ($mergedOptions.agregarBotonesCancelar) {
		$formulario.find('[name="botones[botonEnviar]"]:visible')
			.removeClass('pull-right')
			.parent()
				.prepend(botonCanelar)
				.removeClass('form-group')
				.addClass('btn-group pull-right');
	}
	if (typeof $emergente === 'undefined') {
		$emergente = $formulario.parents('[data-modal-tipo="form-modal"]').eq(0);
	}
	var botones = $formulario.find('button[type="submit"]').not('.uploadBrowse');
	$formulario.validate();
	if ($mergedOptions.modo === 'visualizar'){
		$formulario.find('input,select,textarea,button').attr('disabled', 'disabled');
		$formulario.find('.btn-group').remove();
	}
	$( document ).trigger( "formulario.modal.cargado", [ $formulario ] );
	var opcionesForm = {
		url			: decodeURIComponent(modalFormOptions.formUrl),
		success		: function(data, textStatus, jqXHR) {
			if ($(data).find('script').length > 0) {
				modalFormOptions = JSON.parse($(data).find('#modalFormOptions').text());
				modalFormOptions.formUrl = decodeURIComponent(modalFormOptions.formUrl);
				modalFormOptions.objeto = JSON.parse(modalFormOptions.objeto);
			}
			$emergente.find('.modal-body').html(data);
			agregarFuncionalidadModal($emergente);
			var $formulario = $emergente.find(form);
			$mergedOptions.funcionSiemprePirmero(modalFormOptions.objeto, $emergente, modalFormOptions);
			if (modalFormOptions.error === true) {
				//modalForm($mergedOptions);
				$formulario.find('input,select,textarea,button').not('[data-readonly="readonly"]').removeAttr('disabled');
			} else {
				if ($mergedOptions.modo === 'editar'){
					$mergedOptions.funcionEditar(modalFormOptions.objeto, $emergente, modalFormOptions);
				}
				if ($mergedOptions.modo === 'alta'){
					$mergedOptions.funcionNuevo(modalFormOptions.objeto, $emergente, modalFormOptions);
				}
				if ($mergedOptions.cerrarAutmatico) {
					alerta('Se ha guardado éxitosamente', 'success', $formulario);
					$emergente.modal('hide');
				}
			}
			$mergedOptions.funcionSiempreUltima(modalFormOptions.objeto, $emergente, modalFormOptions);
			//vuelvo asignar funcionalidad a los botones para que envíe el form por ajax
			var botones = $emergente.find('button[type="submit"]').not('.uploadBrowse');
			botones.on('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if ($mergedOptions.multipleForm) {
					var $formSubmit = $(this).closest('form');
				} else {
					var $formSubmit = $formulario;
				}
				if ($formSubmit.valid()){
					$formSubmit.ajaxSubmit(opcionesForm);
					$formSubmit.find('input,select,textarea,button').attr('disabled', 'disabled');
				}
			});
		},
		error	: function(jqXHR, textStatus, errorThrown) {
			alerta('Ha ocurrido un error, vuelva a intentar', 'danger', $formulario);
		}

	};
	if (typeof formModalAjaxOptions !== 'undefined') {
		opcionesForm =  $.extend(opcionesForm, formModalAjaxOptions);
	}
	agregarFuncionalidadModal($formulario);
	botones.on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		if ($mergedOptions.multipleForm) {
			var $formSubmit = $(this).closest('form');
		} else {
			var $formSubmit = $formulario;
		}
		if ($formSubmit.valid()){
			$formSubmit.ajaxSubmit(opcionesForm);
			$formSubmit.find('input,select,textarea,button').attr('disabled', 'disabled');
		}
	});

	//Enfocamos el primer campo de formulario habilitado
	$formulario.find(selectorFocus).eq(0).focus();

};
