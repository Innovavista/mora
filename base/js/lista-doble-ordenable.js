/* global listaDobleModalOptions */

function resizeIframe(obj) {
	obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
}
var listaDobleModalOptions;

function inicializarListaDobleOrdenable($contenedores) {
	$contenedores.each(function(){
		var $this = $(this);
		var inicializada = $this.data('listaDobleInicializada');
		if (inicializada) {
			return;
		}
		$this.data('listaDobleInicializada', true);
		var $listaDisponible = $this.find('.listaDoble-disponibles');
		var $listaSeleccionadas = $this.find('.listaDoble-seleccionadas');

		var $buscador = $this.find('.listaDoble-busqueda');
		var $opcionesMax = $listaDisponible.attr('data-opciones-max');
		function marcarSeleccionado($li){
			var inputs = $li.find('fieldset, input, select, checkbox');
			inputs.each(function() {
				var $item = $(this);
				$item.removeAttr('disabled');
			});
		}
		function quitarSeleccion($li){
			var inputs = $li.find('fieldset, input, select, checkbox');
			inputs.each(function() {
				var $item = $(this);
				$item.attr('disabled', 'disabled');
			});
		}
		function seleccionarItem($li, $listaSeleccionadas) {
			var $item = $li.clone();
			marcarSeleccionado($item);
			$item.appendTo($listaSeleccionadas);
			establecerOrden($listaSeleccionadas);
			$li.remove();
		}
		function quitarItem($li) {
			var $item = $li.clone();
			quitarSeleccion($item);
			$item.appendTo($listaDisponible);
			$li.remove();
			establecerOrden($listaSeleccionadas);
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
				var valor = ui.item;
				if (comprobarOpcionesMax() === false) {
					$listaDisponible.sortable('cancel');
					agregarMensajeOpcionesMax();
				} else {
					marcarSeleccionado(valor);
					establecerOrden($listaSeleccionadas);
				}
			},
			remove: function( event, ui ){
				var valor = ui.item;
				quitarSeleccion(valor);
				establecerOrden($listaSeleccionadas);
			},
			update: function ( event, ui ) {
				toggleMensajeOpcionesMax();
				establecerOrden($listaSeleccionadas);
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
	inicializarListaDobleOrdenable($('.listaDobleOrdenable-contenedor'));
});