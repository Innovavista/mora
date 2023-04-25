$(window).load(function() {
	$preloader = $("#preloader-full-page");
	if(!$preloader.length) {
		return;
	}
	$preloader.hide();
});
$(document).ready(function() {
	//<editor-fold defaultstate="collapsed" desc="Buscador del menú lateral">
	function omitirAcentos(text) {
		var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
		var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
		for (var i=0; i<acentos.length; i++) {
			text = text.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
		}
		return text;
	}

	var $buscadorMenu			= $("#sidebar-search");
	var $menuLateral			= $("#app_main-menu-wrapper .nav");
	var $opcionesMenu			= $menuLateral.children("li");
	var claseOpcionEncontrado	= 'sidebar-result-found';

	var optionsTypewatch = {
		callback: function() {
			huboResultado	= false;
			textoBusqueda	= omitirAcentos($buscadorMenu.val().toLowerCase());

			if (textoBusqueda === '') {
				resetearEstadoMenu();
				$menuLateral.find("li").show();
				removerClaseOpcionEncontrado();
				return;
			}

			$menuLateral.find("li").hide();
			resetearEstadoMenu();
			removerClaseOpcionEncontrado();
			$opcionesMenu.each(function() {
				$opcion = $(this);
				recorrerOpcionHija($opcion);
			});

			if (!huboResultado) {
				$(".sidebar-no-results").remove();
				$menuLateral.append("<p class='sidebar-no-results'>No se encontraron resultados</p>");
			}
		},
		wait: 400,
		highlight: true,
		allowSubmit: false,
		captureLength: 0
	};

	function resetearEstadoMenu() {
		$opcionesMenu.find(".nav-sub").hide();
		$(".sidebar-no-results").remove();
	}

	function removerClaseOpcionEncontrado() {
		$menuLateral.find("." + claseOpcionEncontrado).removeClass(claseOpcionEncontrado);
	}

	function recorrerOpcionHija($opcion) {
		var nombre				= omitirAcentos($opcion.children("a").text().toLowerCase());
		var $opcionPadres		= $opcion.parents("li");
		var $submenuesPadres	= $opcion.parents(".nav-sub");
		var $submenuHijo		= $opcion.children(".nav-sub");
		var $opcionesHijas		= $opcion.children(".nav-sub").children("li");
		if (nombre.indexOf(textoBusqueda) > -1) {
			$opcion.children("a").addClass(claseOpcionEncontrado);
			$opcionPadres.show();
			$opcion.show();
			$submenuesPadres.show();
			$submenuHijo.show();
			$opcionesHijas.show();
			huboResultado = true;
		}
		if ($opcionesHijas.length > 0) {
			$opcionesHijas.each(function() {
				$opcion = $(this);
				recorrerOpcionHija($opcion);
			});
		}
	}

	$buscadorMenu.typeWatch(optionsTypewatch);
	//</editor-fold>

});