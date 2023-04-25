/* global listaDobleModalOptions */

function resizeIframe(obj) {
	obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
}
var listaDobleModalOptions;

function actualizarTemplateGeneral($objeto, $datoTemplate) {
	var tipoSelect = '[data-tipo-select=' + $objeto.data('tipo-select') + ']';
	var contexto = $objeto.closest('[data-template-context]').attr('data-template-context');
	if (typeof contexto === "undefined") {
		contexto = $objeto.closest('[data-context]').attr('data-context');
	}
	var idTemplate = '#' + contexto;
	var $contenedorTemplate = $(idTemplate);
	var templateString = $contenedorTemplate.attr('data-template');
	var $objetoTemplate = $(templateString);
	$objetoTemplate.find(tipoSelect).append($datoTemplate);
	var templateActualizado = $objetoTemplate.outerHTML();
	$contenedorTemplate.attr('data-template', templateActualizado);
	$contenedorTemplate.data('template', templateActualizado);
};

var $opcionesFormModal = {
		"modo" : '',
		"template" : '',
		"select" : '',
		"selectTemplate" : '',
		"opcionEditar" : '',
		"funcionNuevo" : function($objeto) {
			var datasTemplate = this.selectTemplate.data();
			var $selectTemplate = this.selectTemplate.clone();
			var strToReplace = 'getId';
			var metodo = this.selectTemplate.data('metodo-principal');
			var buscarMetodoPrincipal = new RegExp(metodo, 'g');
			var buscarGetId = new RegExp('getId', 'g');
			var metodoSubText = this.selectTemplate.data('metodo-subtext');
			var buscarMetodoSubText = new RegExp(metodoSubText, 'g');
			for(var i in datasTemplate){
				$selectTemplate.attr('data-' + i, $objeto[datasTemplate[i]]);
				if (i === 'value'){
					$selectTemplate.attr('data-' + i, $objeto['getId']);
					$selectTemplate.attr(i, $objeto['getId']);
					strToReplace = datasTemplate[i];
				}
			}
			if (typeof  $selectTemplate.attr('data-content') !== "undefined") {
				var content = $selectTemplate.attr('data-content').replace(buscarGetId, $objeto['getId']);
				content = content.replace(buscarMetodoSubText, $objeto[metodoSubText]);
				content = content.replace(buscarMetodoPrincipal, $objeto[metodo]);
				var $content = $(content);
				$selectTemplate.attr('data-content', $content[0].outerHTML);
			}
			var textoContenido = $selectTemplate.text();
			textoContenido = textoContenido.replace(buscarMetodoPrincipal, $objeto[metodo]);
			$selectTemplate.text(textoContenido);
			$selectTemplate.find('button').each(function() {
				var $this = $(this);
				var src = $this.data('src').replace(strToReplace, $objeto[strToReplace]);
				$this.attr('data-src', src);
			});

			if (this.select.length === 0) {
				return;
			}
			var tipoSelect = '[data-tipo-select=' + this.select.data('tipo-select') + ']';
			$(tipoSelect).not(this.select).append($selectTemplate.clone());
			actualizarTemplateGeneral(this.select, $selectTemplate.clone());

			$selectTemplate.prop("selected", true);
			$selectTemplate.attr("selected", "selected");
			this.select.append($selectTemplate.clone());
			this.select.trigger('change');
			this.select.valid();

			if (this.select.data('select-type') === "selectpicker"){
				this.select.selectpicker('refresh');
			}
			$(tipoSelect).not(this.select).filter('[data-select-type="selectpicker"]').selectpicker('refresh');
			if (this.select.data('copiar') === "copiar"){
				var copiarA = this.select.data('copiar-a');
				var $copiarA = $('select[name="' + copiarA + '"]');
				$copiarA.append($selectTemplate.clone());
				if ($copiarA.data('copiar') === "copiar") {
					copiarA = $copiarA.data('copiar-a');
					$copiarA = $('select[name="' + copiarA + '"]');
					$copiarA.append($selectTemplate.clone());
				}
			}
		},
		"funcionEditar" : function($objeto) {
			var datasTemplate = this.selectTemplate.data();
			var $selectTemplate = this.selectTemplate.clone();
			var strToReplace = 'getId';
			var metodo = this.selectTemplate.data('metodo-principal');
			var buscarMetodoPrincipal = new RegExp(metodo, 'g');
			var metodoSubText = this.selectTemplate.data('metodo-subtext');
			var buscarMetodoSubText = new RegExp(metodoSubText, 'g');
			var buscarGetId = new RegExp('getId', 'g');
			for(var i in datasTemplate){
				$selectTemplate.attr('data-' + i, $objeto[datasTemplate[i]]);
				if (i === 'value'){
					$selectTemplate.attr('data-' + i, $objeto['getId']);
					$selectTemplate.attr(i, $objeto['getId']);
					strToReplace = datasTemplate[i];
				}
			}
			if (typeof  $selectTemplate.attr('data-content') !== "undefined") {
				var content = $selectTemplate.attr('data-content').replace(buscarGetId, $objeto['getId']);
				content = content.replace(buscarMetodoSubText, $objeto[metodoSubText]);
				content = content.replace(buscarMetodoPrincipal, $objeto[metodo]);
				var $content = $(content);
				$selectTemplate.attr('data-content', $content[0].outerHTML);
			}
			var textoContenido = $selectTemplate.text();
			textoContenido = textoContenido.replace(buscarMetodoPrincipal, $objeto[metodo]);
			$selectTemplate.text(textoContenido);
			$selectTemplate.find('button').each(function(){
				var $this = $(this);
				var src = $this.data('src').replace(strToReplace, $objeto[strToReplace]);
				$this.attr('data-src', src);
			});

			var tipoSelect = '[data-tipo-select=' + this.select.data('tipo-select') + ']';
			$(tipoSelect).not(this.select).append($selectTemplate.clone());
			actualizarTemplateGeneral(this.select, $selectTemplate.clone());

			$selectTemplate.prop("selected", true);
			$selectTemplate.attr("selected", "selected");
			this.select.find("option[value='" + $objeto['getId'] + "']").remove();
			this.select.append($selectTemplate.clone());
			this.select.trigger('change');
			this.select.valid();

			if (this.select.data('select-type') === "selectpicker"){
				this.select.selectpicker('refresh');
			}
			$(tipoSelect).not(this.select).filter('[data-select-type="selectpicker"]').selectpicker('refresh');
			if (this.select.data('copiar') === "copiar"){
				var copiarA = this.select.data('copiar-a');
				var $copiarA = $('select[name="' + copiarA + '"]');
				$copiarA.append($selectTemplate.clone());
				if ($copiarA.data('copiar') === "copiar") {
					copiarA = $copiarA.data('copiar-a');
					$copiarA = $('select[name="' + copiarA + '"]');
					$copiarA.append($selectTemplate.clone());
				}
			}
		}
	};

function eventoObjectSelect(boton) {
	var $this = $(boton);
	var target = $this.data("target");
	if ($this.parents('#objectSelectModal').length > 0) {
		var $target = $(target, $this.parents('.modal-body').eq(0)).eq(0);
	} else {
		var $target = $(target).eq(0);
	}
	var src = $this.data("src");
	var $modalBody = $target.find(".modal-body").eq(0);
	var $modalTitle = $target.find(".modal-title").eq(0);
	var $contenedor = $this.parents('.objectSelect-contenedor').eq(0);
	var opciones = $this.data('opciones');
	if (typeof opciones !== 'undefined') {
		opciones = JSON.parse(opciones);
	} else {
		opciones = {};
	}
	var $opcionesFormModalLocal = $.extend(true, $opcionesFormModal, opciones);
	$opcionesFormModalLocal.modo = $this.data('modo');
	$opcionesFormModalLocal.listado = $this.data('listado');
	$opcionesFormModalLocal.opcionEditar = $this.parents('option').eq(0);
	$opcionesFormModalLocal.selectTemplate = $($contenedor.find('[data-opcion="select"]').data('template'));
	$opcionesFormModalLocal.select = $contenedor.find('select');
	var textoAdicional = '';
	var tituloModal;
	if ($this.data("tituloModal") !== '') {
		tituloModal = $this.data("tituloModal");
	} else {
		tituloModal = $this.data("concepto");
	}

	if ($opcionesFormModalLocal.modo === 'alta') {
		textoAdicional = 'Alta de ' + tituloModal;
	} else {
		textoAdicional = $opcionesFormModalLocal.modo.capitalizeFirstLetter() + ' ' + $opcionesFormModalLocal.opcionEditar.text();
	}

	$modalTitle.html($this.find('.fa')[0].outerHTML + ' ' + textoAdicional);
	$modalBody.html('<div class="modal-esperar text-center"><i class="fa fa-spinner fa-spin fa-4x"></i></div>');
	$modalBody.load(src, function (response, status, xhr) {
		if (status === 'error') {
			$target.modal('hide');
			if (xhr.status === 401 & xhr.statusText === 'Unauthorized') {
				alerta('Ud no tiene permiso para realizar esta acción.', 'danger', $this.closest('form'));
			}
			return;
		}
		modalForm($opcionesFormModalLocal, $target);
	});
	var defaultModalOptions = {show: true};
	var parametrosModal = $.extend(defaultModalOptions, listaDobleModalOptions);
	$target.modal(parametrosModal);
};

$(document).ready(function() {

	$(document).on('ejecutar-click', '[data-action="objectSelect-modal"]' , function(event){
		event.stopImmediatePropagation();
		event.stopPropagation();
		event.preventDefault();
		eventoObjectSelect(this);
		return false;
	});

});