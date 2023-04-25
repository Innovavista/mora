$(document).ready(function() {

	var $selects		= $("select.select-categoria, select.select-facultad, select.select-carrera, select.select-preferencia");
	var $categorias		= $("select.select-categoria");
	var $facultades		= $("select.select-facultad");
	var $carreras		= $("select.select-carrera");
	var $preferencias	= $("select.select-preferencia");

	//<editor-fold defaultstate="collapsed" desc="Mensaje vacío">
	function selectMensajeVacio() {
		$selects.each(function() {
			var $select		= $(this);
			var $dropdown	= $select.parent();
			if ($select.val() === null) {
				if ($dropdown.find(".mensaje-vacio").length === 0) {
					$dropdown.find(".filter-option").append("<span class='mensaje-vacio'>--- Seleccionar ---</span>");
				}
			} else {
				$dropdown.find(".mensaje-vacio").remove();
			}
		});
	}
	selectMensajeVacio();
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Eventos select">
	$categorias.change(function() {
		selectMensajeVacio();
	});

	$facultades.change(function() {
		selectMensajeVacio();
	});

	$carreras.change(function() {
		selectMensajeVacio();
	});

	$preferencias.change(function() {
		selectMensajeVacio();
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Gráficos">
	Chart.NewLegend = Chart.Legend.extend({
		afterFit: function () {
			this.height = this.height + 50;
		},
	});

	var opcionesChart = {
		legend: {
			position: 'bottom',
			align: 'start',
			fullWidth: true,
			labels: {
				padding: 10,
				boxWidth: 15,
				fontFamily: "'Roboto', sans-serif",
				fontSize: 12
			}
		},
		tooltips: {
			callbacks: {
				label: function(tooltipItem, data) {
					var label = data.labels[tooltipItem.index];
					return ' ' + label ;
				}
			}
		},
		plugins: {
			labels: {
				render: 'percentage',
				fontColor: ['#5f5f5f', '#5f5f5f', '#5f5f5f', '#5f5f5f'],
				fontSize: 12,
				position: 'outside',
				textMargin: 4,
				fontFamily: "'Roboto', sans-serif",
				textShadow: true,
				shadowBlur: 8,
				shadowColor: 'rgba(0,0,0,.3)',
				precision: 2,
				overlap: true
			}
		}
	};

	//<editor-fold defaultstate="collapsed" desc="Activos/Inactivos">
	var $graficoActivosInactivos	= $("#tablero-comensal-activos-inactivos");
	var coloresActivosInactivos		= ['#9cf196', '#696464'];
	if ($graficoActivosInactivos.length > 0) {
		var id	= $graficoActivosInactivos.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataActivoInactivo']['labels'],
				datasets: [{
						backgroundColor: coloresActivosInactivos,
						borderColor: coloresActivosInactivos,
						lineTension: 0,
						data: window['dataActivoInactivo']['data']
					}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Categorías">
	var $graficoCategoria	= $("#tablero-comensal-categoria");
	var coloresCategoria	= ['#a4d1c8', '#537d91', '#f77754', '#584b42'];
	if ($graficoCategoria.length > 0) {
		var id	= $graficoCategoria.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataCategoria']['labels'],
				datasets: [{
					backgroundColor: coloresCategoria,
					borderColor: coloresCategoria,
					lineTension: 0,
					data: window['dataCategoria']['data']
				}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Categorías">
	var $graficoPreferencia	= $("#tablero-comensal-preferencia");
	var coloresPreferencia	= ['#464159', '#6c7b95', '#8bbabb', '#c7f0db'];
	if ($graficoPreferencia.length > 0) {
		var id	= $graficoPreferencia.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataPreferencia']['labels'],
				datasets: [{
					backgroundColor: coloresPreferencia,
					borderColor: coloresPreferencia,
					lineTension: 0,
					data: window['dataPreferencia']['data']
				}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="DataTable">
	var $tabla = $(".tablero-comensal-tabla");
	if ($tabla.length > 0) {
		$tabla.DataTable({
			paging: false,
			searching: false,
			select: false,
			info: false,
			columnDefs: [
				{ sortable: false, targets: [5] }
			]
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Tooltip">
	$(".tablero-comensal-info").tooltipster({
		theme: 'tooltipster-shadow',
		animation: 'grow',
		content: '<small>Se considera ‘Activo’ a todo comensal que haya realizado<br/>al menos una reserva en la plataforma</small>',
		contentAsHTML: true,
		delay:	200,
		side: 'top',
		contentCloning: true
	});

	$(".tablero-comensales-operaciones a").tooltipster({
		theme: 'tooltipster-shadow',
		animation: 'grow',
		delay:	200,
		side: 'top',
		contentCloning: true
	});
	//</editor-fold>

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});

});
