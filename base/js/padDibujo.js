(function () {

	function resizeCanvas(canvas, signaturePad) {
		var ratio = Math.max(window.devicePixelRatio || 1, 1);
		canvas.width = canvas.offsetWidth * ratio;
		canvas.height = canvas.offsetHeight * ratio;
		canvas.getContext("2d").scale(ratio, ratio);
		signaturePad.clear();
	}
	function openPad(id, onSave) {
		var templateOverlay =
				'<div id="pad-dibujo-overlay-' + id + '"class="pad-dibujo-overlay">' +
				'<div class="pad-dibujo-pad">' +
				'<button class="btn btn-xs btn-default pad-dibujo-pad--btn-close" data-pad-dibujo-accion="cerrar">X</button>' +
				'<div class="pad-dibujo-pad--body">' +
				'<canvas></canvas>' +
				'</div>' +
				'<div class="pad-dibujo-pad--footer">' +
				'<div class="pull-left">' +
				'<button type="button" class=" btn btn-default" data-pad-dibujo-accion="limpiar">Limpiar</button>' +
				'</div>' +
				'<div class="pull-right">' +
				'<button type="button" class="btn btn-success" data-pad-dibujo-accion="guardar">Guardar</button>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>';
		var $templateOverlay = $('#pad-dibujo-overlay-' + id);
		if ($templateOverlay.length === 0) {


			$templateOverlay = $(templateOverlay);
			$('body').append($templateOverlay);


			var $canvas = $templateOverlay.find('canvas');
			var canvas = $canvas.get(0);
			var pad = new SignaturePad(canvas, {
				backgroundColor: "rgb(255,255,255)"
			});

			var cerrar = function () {
				$templateOverlay.css({visibility: 'hidden'});
				pad.clear();
			};

			$templateOverlay.on('click', function (e) {
				if (e.target !== $templateOverlay.get(0))
					return;
				cerrar();
			});

			var $btnLimpiar = $templateOverlay.find('[data-pad-dibujo-accion="limpiar"]');
			var $btnGuardar = $templateOverlay.find('[data-pad-dibujo-accion="guardar"]');
			var $btnCerrar = $templateOverlay.find('[data-pad-dibujo-accion="cerrar"]');


			window.addEventListener('resize', resizeCanvas.bind(null, canvas, pad));
			resizeCanvas(canvas, pad);
			$btnLimpiar.on('click', function () {
				pad.clear();
			});
			$btnGuardar.on('click', function () {
				if (pad.isEmpty()) {
					alert('Primero debes firmar');
				} else {
					//                    window.open(pad.toDataURL());
					onSave(pad.toDataURL('image/jpeg'));
					cerrar();
				}
			});
			$btnCerrar.on('click', cerrar);
		}
		$templateOverlay.css({visibility: 'visible'});
	}

	function inicializarPadDibujo() {
		var $padsDibujo = $('.pad-dibujo-control');
		if ($padsDibujo.length === 0) {
			return;
		}

		$padsDibujo.not('[data-arreglado="arreglado"]').each(function () {
			var $control = $(this);
			var inputName = $control.data('pad-dibujo-for');
			var $input = $('[name="' + inputName + '"]');
			var $btnAbrir = $control.find('[data-pad-dibujo-accion="abrir"]');
			$btnAbrir.on('click', function (e) {
				openPad(inputName, function (dibujo) {
					$input.val(dibujo);
					$control.find('.pad-dibujo-dibujo').html('<img src="' + dibujo + '"/>');
				});
				e.preventDefault();
				e.stopPropagation();
			});
			$control.attr('data-arreglado', 'arreglado');
		});
	}

	$(document).ready(function () {

		inicializarPadDibujo();

	});

})();