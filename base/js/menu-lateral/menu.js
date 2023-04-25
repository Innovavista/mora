$(document).ready(function () {
	var menuLateralExpandido = true;

	var menuLateralCambiarEstado = function () {
		menuLateralExpandido = !menuLateralExpandido;
		$(".nav-menu-lateral-boton-esconder").toggleClass("is-active");
		$(".nav-menu-lateral").toggleClass("nav-menu-lateral-escondido");
		$("body").toggleClass("body-menu-lateral-expandido body-menu-lateral-escondido");
		if (typeof (Storage) !== "undefined") {
			localStorage.menuLateralExpandido = menuLateralExpandido;
		}
	};

	$(".menu-lateral-toggle").click(function() {
		$(".nav-menu-lateral").toggleClass("escondido");
		$("body").toggleClass("body-menu-lateral-expandido body-menu-lateral-escondido");
	});

	$(".usuario-toggle").on("click", function () {
		$(this).next("ul").slideToggle();
		$(this).toggleClass("active");
	});

	$(".nav-menu-lateral-menu a").on("click", function () {
		$(this).next("ul").slideToggle();
		$(this).toggleClass("active");
	});

	$(".nav-menu-lateral-boton-esconder").click(function () {
		menuLateralCambiarEstado()
	});

	$(".nav-menu-lateral").hover(function () {
		$(this).addClass("is-hover");
	}, function () {
		$(this).removeClass("is-hover");
	});

	$(".nav-menu-lateral-scroll").slimScroll({
		position: 'right',
		size: "5px",
		color: '#98a6ad',
		height: 'auto',
		wheelStep: 5,
		alwaysVisible: false
	});

	$('.nav-menu-lateral-menu a[href="#"]').on('click', function (e){
		if (e.ctrlKey)
        return false;
	});

	var ajustarAltura = function () {
		var h = $(window).height() - 70;
		$('.nav-menu-lateral-scroll').height(h);
		$('.slimScrollDiv').height(h);
	};

	ajustarAltura();

	if (typeof (Storage) !== "undefined") {
		if (typeof (localStorage.menuLateralExpandido) !== "undefined" & localStorage.menuLateralExpandido === "false") {
			menuLateralCambiarEstado();
		}
	}

	$(window).resize(function () {
		ajustarAltura();
	});

	//<editor-fold defaultstate="collapsed" desc="Buscador">
	function omitirAcentos(text) {
		var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
		var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
		for (var i=0; i<acentos.length; i++) {
			text = text.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
		}
		return text;
	}

	var $buscadorMenu			= $("#nav-menu-lateral-buscador");
	var $menuLateral			= $(".nav-menu-lateral-contenido");
	var $opcionesMenu			= $menuLateral.children("li");
	var claseOpcionEncontrado	= 'nav-menu-lateral-encontrado';

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
				$(".nav-menu-lateral-vacio").remove();
				$menuLateral.last().append("<p class='nav-menu-lateral-vacio'>No se encontraron resultados</p>");
			}
		},
		wait: 400,
		highlight: true,
		allowSubmit: false,
		captureLength: 0
	};

	function resetearEstadoMenu() {
		$opcionesMenu.find(".nav-menu-lateral-sub-menu").hide();
		$(".nav-menu-lateral-vacio").remove();
	}

	function removerClaseOpcionEncontrado() {
		$menuLateral.find("." + claseOpcionEncontrado).removeClass(claseOpcionEncontrado);
	}

	function recorrerOpcionHija($opcion) {
		var nombre				= omitirAcentos($opcion.children("a").text().toLowerCase());
		var $opcionPadres		= $opcion.parents("li");
		var $submenuesPadres	= $opcion.parents("ul");
		var $submenuHijo		= $opcion.children("ul");
		var $opcionesHijas		= $opcion.children("ul").children("li");
		if (nombre.indexOf(textoBusqueda) > -1) {
			$opcion.children("a").addClass(claseOpcionEncontrado);
			$opcionPadres.show();
			$opcion.show();
			$submenuesPadres.show();
			$submenuHijo.show();
			$opcionesHijas.show();
			huboResultado = true;
			$(".nav-menu-lateral-scroll").scrollTop(0);
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