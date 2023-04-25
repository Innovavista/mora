$(document).ready(function() {

	//<editor-fold defaultstate="collapsed" desc="Waves">
	if (typeof Waves !== "undefined") {
		Waves.attach(".btn:not([type='hidden'])", ['waves-light', 'waves-float']);
		Waves.attach(".waves", ['waves-light']);
		Waves.init();
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Perfect Scrollbar">
	if (typeof jQuery().perfectScrollbar !== "undefined") {
		$('.sidebar-wrapper').perfectScrollbar({
			swipeEasing: false
		});
		$(".scrollbar").perfectScrollbar({
			swipeEasing: false
		});
		$(".listaDoble-panel ul").perfectScrollbar({
			swipeEasing: false
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Menú lateral">
	var menuLateralExpandido = true;

	$(".nav a").on("click", function () {
		$(this).next(".nav").slideToggle({
			duration: 150
		});
		$(this).parent().toggleClass("active");
	});

	$(".sidebar").find("li.active").children(".nav").toggle();

	var $toggle = $(".navbar-toggle");
	var $layer  = $('<div class="close-layer"></div>');
	$toggle.click(function(){
		$(this).addClass("toggled");
		$("body").addClass("nav-open");

		var main_panel_height = $('.main-panel')[0].scrollHeight;
		$layer.css('height', main_panel_height + 'px');
		$layer.appendTo(".main-panel");

		setTimeout(function(){
			$layer.addClass('visible');
		}, 100);
	});

	$(document).on('click', ".close-layer", function() {
		$('body').removeClass('nav-open');
		$(".close-layer").removeClass('visible');

		setTimeout(function () {
			$(".close-layer").remove();
			$toggle.removeClass('toggled');
		}, 400);
	});

	function cambiarEstadoNav() {
		$btn = $(".navbar-minimize .btn");
		menuLateralExpandido = !menuLateralExpandido;
		$(".sidebar .nav .nav").slideUp().parent("li").removeClass("active");
		setTimeout(function(){
			$("body").toggleClass("sidebar-mini");
			$btn.toggleClass("toggled");
		}, 320);
		if (typeof (Storage) !== "undefined") {
			localStorage.menuLateralExpandido = menuLateralExpandido;
		}
	}

	$(".navbar-minimize .btn").click(function() {
		cambiarEstadoNav();
	});

	$(document).on("mouseover", ".sidebar-mini .sidebar", function() {
		$(this).addClass("sidebar-hover");
	});
	$(document).on("mouseleave", ".sidebar-mini .sidebar", function() {
		var $sidebar = $(this);
		$(".sidebar .nav .nav").slideUp().parent("li").removeClass("active");
		setTimeout(function(){
			$sidebar.removeClass("sidebar-hover");
		}, 320);
	});

	if (typeof (Storage) !== "undefined") {
		if (typeof (localStorage.menuLateralExpandido) !== "undefined" & localStorage.menuLateralExpandido === "false") {
			cambiarEstadoNav();
		}
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Tooltip">
	if (typeof jQuery().tooltipster !== "undefined") {
		$('[data-toggle="tooltip"]').tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay:	100,
			side: 'top',
			contentCloning: true
		});
	}
	//</editor-fold>

	$(".checkbox label input[type='checkbox']").after("<span class='checkbox-material'><span class='check'></span></span>");
	$(".radio label, .radio label .btn").append('<span class="circle"></span><span class="check"></span>');

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
	var $menuLateral			= $(".sidebar-wrapper > .nav");
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
				$menuLateral.last().append("<p class='sidebar-no-results'>No se encontraron resultados</p>");
			}
		},
		wait: 400,
		highlight: true,
		allowSubmit: false,
		captureLength: 0
	};

	function resetearEstadoMenu() {
		$opcionesMenu.find(".nav").hide();
		$(".sidebar-no-results").remove();
	}

	function removerClaseOpcionEncontrado() {
		$menuLateral.find("." + claseOpcionEncontrado).removeClass(claseOpcionEncontrado);
	}

	function recorrerOpcionHija($opcion) {
		var nombre				= omitirAcentos($opcion.children("a").text().toLowerCase());
		var $opcionPadres		= $opcion.parents("li");
		var $submenuesPadres	= $opcion.parents(".nav");
		var $submenuHijo		= $opcion.children(".nav");
		var $opcionesHijas		= $opcion.children(".nav").children("li");
		if (nombre.indexOf(textoBusqueda) > -1) {
			$opcion.children("a").addClass(claseOpcionEncontrado);
			$opcionPadres.show();
			$opcion.show();
			$submenuesPadres.show();
			$submenuHijo.show();
			$opcionesHijas.show();
			huboResultado = true;
			$(".sidebar-wrapper").scrollTop(0);
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

