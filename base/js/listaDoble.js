/* global listaDobleModalOptions */

function resizeIframe(obj) {
	obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
}
var listaDobleModalOptions;

function inicializarEventosModal($listaDobleContenedor) {
	var $opcionesFormModal = {
		"modo" : '',
		"template" : '',
		"contenedorCheckbox" : '',
		"listaSeleccionados" : '',
		"checkboxTemplate" : '',
		"opcionEditar" : '',
		"checkboxEditar" : '',
		"funcionNuevo" : function($objeto, checked) {
			checked = typeof checked !== 'undefined' ? checked : true;

			var datasTemplate		 = this.template.data();
			var $template			 = this.template.clone();
			var $selectTemplate		 = this.checkboxTemplate.clone();
			var strToReplace		 = 'getId';
			var $selectTemplateInput = $selectTemplate.find('input');

			for (var i in datasTemplate) {
				$template.attr('data-' + i, $objeto[datasTemplate[i]]);
				if (i === 'value'){
					$selectTemplateInput.attr(i, $objeto[datasTemplate[i]]);
					strToReplace = datasTemplate[i];
				}
			}

			var metodo = this.template.children('span').text();
			$template.children('span').text($objeto[metodo]);
			$template.find('button').each(function(){
				var $this = $(this);
				var src = $this.data('src').replace(strToReplace, $objeto[strToReplace]);
				$this.attr('data-src', src);
			});
			$selectTemplate.find('span').text($objeto[metodo]);
			if (checked) {
				$selectTemplateInput.prop("checked", true);
				$selectTemplateInput.attr("checked", "checked");
			}
			this.contenedorCheckbox.append($selectTemplate);
			this.listaSeleccionados.append($($template[0].outerHTML));
		},
		"funcionEditar" : function($objeto) {
			var datasTemplate = this.template.data();
			var dataTxt;
			for(var i in datasTemplate){
				if (i !== 'value') {
					dataTxt = 'data-' + i;
					this.opcionEditar.data(i, $objeto[datasTemplate[i]]);			//edito en li
					this.opcionEditar.attr(dataTxt, $objeto[datasTemplate[i]]);		//edito en li
					this.opcionEditar.prop(dataTxt, $objeto[datasTemplate[i]]);		//edito en li
					this.checkboxEditar.data(i, $objeto[datasTemplate[i]]);			//edito en input
					this.checkboxEditar.attr(dataTxt, $objeto[datasTemplate[i]]);	//edito en input
					this.checkboxEditar.prop(dataTxt, $objeto[datasTemplate[i]]);	//edito en input
				}
			}
			var metodo = this.template.children('span').text();
			this.opcionEditar.children('span').text($objeto[metodo]);
			this.checkboxEditar.siblings('span').text($objeto[metodo]);
		}
	};

	$listaDobleContenedor.on('click', 'button[data-action="listaDoble-modal"]' ,function(){
		var $this = $(this);
		var target = $this.data("target");
		var $target = $(target);
		var src = $this.data("src");
		var $modalBody = $target.find(".modal-body");
		var $modalTitle = $target.find(".modal-title");
		var $contenedor = $this.parents('.listaDoble-contenedor').eq(0);
		$opcionesFormModal.modo = $this.data('modo');
		$opcionesFormModal.template = $($contenedor.find('[data-opcion="li"]').data('template'));
		$opcionesFormModal.checkboxTemplate = $($contenedor.find('[data-opcion="select"]').data('template'));
		$opcionesFormModal.contenedorCheckbox = $contenedor.find('[data-contenedor="checkbox"]');
		$opcionesFormModal.listaSeleccionados = $contenedor.find('.listaDoble-seleccionadas');
		var textoAdicional = '';
		if ($opcionesFormModal.modo === 'alta') {
			textoAdicional = 'Alta de ' + $this.data("concepto");
		} else {
			$opcionesFormModal.opcionEditar = $this.parents('li').eq(0);
			$opcionesFormModal.checkboxEditar = $contenedor.find('input[value="' + $opcionesFormModal.opcionEditar.data('value') + '"]');
			textoAdicional = $opcionesFormModal.modo.capitalizeFirstLetter() + ' ' + $opcionesFormModal.opcionEditar.text();
		}

		$modalTitle.html($this.find('.fa')[0].outerHTML + ' ' + textoAdicional);
		$modalBody.html('<div class="modal-esperar text-center"><i class="fa fa-spinner fa-spin fa-4x"></i></div>');
		$modalBody.load(src, function() {
				modalForm($opcionesFormModal, $target);
				agregarMascaras();
			});
		var defaultModalOptions = { show : true };
		var parametrosModal =  $.extend(defaultModalOptions, listaDobleModalOptions);
		$target.modal(parametrosModal);
	});
}

function inicializarListaDoble($contenedores) {
	$contenedores.each(function(){
		var $this = $(this);
		var inicializada = $this.data('listaDobleInicializada');
		if (inicializada) {
			return;
		}
		$this.data('listaDobleInicializada', true);
		var $listaDisponible	= $this.find('.listaDoble-disponibles');
		var $listaSeleccionadas = $this.find('.listaDoble-seleccionadas');
		var $inputOculto		= $this.find('.listaDoble-checkbox');
		var $buscador			= $this.find('.listaDoble-busqueda');
		var $opcionesMax		= $listaDisponible.attr('data-opciones-max');
		var soloLectura			= $this.attr("data-readonly") === "readonly";
		var desactivado			= $this.attr("data-disabled") === "disabled";

		if (soloLectura || desactivado) {
			//Si es de solo lectura o está desactivado el campo, entonces no
			//activamos ningún evento
			return;
		}

		function marcarSeleccionado(valor){
			var $input = $inputOculto.filter('input[value="' + valor + '"]');
			$input.prop("checked", true);
			$input.attr("checked", "checked");
			$input.trigger('change', ['listaDoble']);
		}
		function quitarSeleccion(valor){
			var $input = $inputOculto.filter('input[value="' + valor + '"]');
			$input.prop("checked", false );
			$input.removeAttr("checked");
			$input.trigger('change');
		}
		function seleccionarItem($li, $listaSeleccionadas) {
			var $item = $li.clone();
			marcarSeleccionado($item.data('value'));
		}
		function quitarItem($li) {
			var $item = $li.clone();
			quitarSeleccion($item.data('value'));
		}
		function comprobarOpcionesMax(sumar) {
			var valido = true;
			var seleccionados	= $listaSeleccionadas.find(".listaDoble-opcion").length;
			if (sumar) {
				seleccionados += 1;
			}
			if ($opcionesMax != 0 && $opcionesMax && (seleccionados > $opcionesMax)) {
				valido = false;
			}
			return valido;
		}
		function toggleMensajeOpcionesMax() {
			var seleccionados = $listaSeleccionadas.find(".listaDoble-opcion").length;
			if ($opcionesMax != 0 && seleccionados == $opcionesMax) {
				agregarMensajeOpcionesMax();
			} else {
				borrarMensajeOpcionesMax();
			}
		}
		function agregarMensajeOpcionesMax() {
			if ($(".lista-doble-mensaje-max").length === 0) {
				$listaSeleccionadas.after("<p class='lista-doble-mensaje-max'>Ha seleccionado el máximo de opciones disponibles.</p>");
			}
		}
		function borrarMensajeOpcionesMax() {
			$mensaje = $(".lista-doble-mensaje-max");
			if ($mensaje.length !== 0) {
				$mensaje.remove();
			}
		}

		var typeWatchOptions = {
			callback: function(value){
				$listaDisponible.find( "li" ).addClass('hidden');
				$listaDisponible.find( "li:contiene('" + value + "')" ).removeClass('hidden');
				$listaDisponible.find( "li" ).filter(function(){
						var datas = $(this).data();
						for(var i in datas){
							if (datas[i].toString().indexOf(value.toString()) >= 0) {
								return true;
							}
						}
						return false;
					}).removeClass('hidden');
			},
			wait: 0,
			highlight: true,
			captureLength: 0
		};
		$listaDisponible.sortable({
			connectWith : $listaSeleccionadas,
			helper: "clone"
		}).disableSelection();
		$listaSeleccionadas.sortable({
			connectWith : $listaDisponible,
			helper: "clone",
			receive: function( event, ui ){
				var valor = ui.item.data('value');
				if (comprobarOpcionesMax() === false) {
					$listaDisponible.sortable('cancel');
					agregarMensajeOpcionesMax();
				} else {
					marcarSeleccionado(valor);
				}
			},
			remove: function( event, ui ){
				var valor = ui.item.data('value');
				quitarSeleccion(valor);
			},
			update: function ( event, ui ) {
				toggleMensajeOpcionesMax();
			}
		}).disableSelection();
		$listaDisponible.on("dblclick", "li", function(e){
			e.stopImmediatePropagation();
			e.stopPropagation();
			if (comprobarOpcionesMax(true)) {
				seleccionarItem($(this), $listaSeleccionadas);
			}
			toggleMensajeOpcionesMax();
		});
		$listaSeleccionadas.on("dblclick", "li", function(e){
			e.stopImmediatePropagation();
			e.stopPropagation();
			quitarItem($(this), $listaDisponible);
			toggleMensajeOpcionesMax();
		});
		$this.on("click", '[data-action="listaDoble-seleccionar"]', function(e) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			$listaDisponible.find("li").not(':hidden').each(function(){
				seleccionarItem($(this), $listaSeleccionadas);
			});
		});
		$this.on("click", '[data-action="listaDoble-quitar"]', function(e) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			$listaSeleccionadas.find("li").each(function(){
				quitarItem($(this), $listaDisponible);
			});
		});
		$this.on("change", 'input.listaDoble-checkbox', function(e) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			var $checbox = $(this);
			var value = $checbox.val();
			if ($checbox.prop('checked')) {
				var $li = $listaDisponible.find('li[data-value="' + value + '"]');
				if (!$li) {
					return;
				}
				var $item = $li.clone();
				$item.appendTo($listaSeleccionadas);
				$li.remove();
			} else {
				var $li = $listaSeleccionadas.find('li[data-value="' + value + '"]');
				if (!$li) {
					return;
				}
				var $item = $li.clone();
				$item.appendTo($listaDisponible);
				$li.remove();
			}

		});
		$buscador.typeWatch(typeWatchOptions);

		$this.find('[disabled]').find('.listaDoble-opcion').on("dblclick click", function(e){
			e.stopPropagation();
			e.preventDefault();
			return false;
		});
		$this.find('[disabled]').find('.listaDoble-disponibles, .listaDoble-seleccionadas').sortable("disable");

		inicializarEventosModal($this);

		$this.on('click', 'a[data-modal]', function(e) {
			e.preventDefault();
			var $opcion		= $(this);
			var tipo		= $opcion.attr('data-modal');
			var href		= $opcion.attr("href") ? $opcion.attr("href") : "";
			var contenido	= "Contenido no disponible";

			if (tipo === 'imagen' && href) {
				contenido = '<img class="img-responsive" src="' + href + '" />';
			}

			if (tipo === 'video' && href) {
				contenido = '<iframe src="' + href + '"></iframe>';
			}

			bootbox.dialog({
				message: contenido,
				className: 'lista-doble-modal',
				onEscape: true
			});
		});

	});
}

$(document).ready(function() {
	inicializarListaDoble($('.listaDoble-contenedor'));
});