//<editor-fold defaultstate="collapsed" desc="DataTable - Ordenamiento fecha">
function formatearFecha(string) {
	return moment(string, "DD/MM/YYYY");
}
$.fn.dataTableExt.oSort["date-custom-desc"] = function (x, y) {
	return formatearFecha(x) < formatearFecha(y) ? 1 : -1;
};
$.fn.dataTableExt.oSort["date-custom-asc"] = function (x, y) {
    return formatearFecha(x) > formatearFecha(y) ? 1 : -1;
};
//</editor-fold>

$(document).ready(function() {

	var $selects	= $("select.select-comedor, select.select-tipo, select.select-servicio");
	var $comedores	= $("select.select-comedor");
	var $tipos		= $("select.select-tipo");
	var $servicios	= $("select.select-servicio");

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
	$comedores.change(function() {
		selectMensajeVacio();
	});

	$tipos.change(function() {
		selectMensajeVacio();
	});

	$servicios.change(function() {
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
		maintainAspectRatio: false,
		legend: {
			position: 'bottom',
			align: 'start',
			fullWidth: true,
			labels: {
				padding: 7,
				boxWidth: 10,
				fontFamily: "'Roboto', sans-serif",
				fontSize: 11
			}
		},
		tooltips: {
			callbacks: {
				label: function(tooltipItem, data) {
					var total = 0;
					var dataArr = data.datasets[0].data;
					var valor = dataArr[tooltipItem.index];
					var label = data.labels[tooltipItem.index];
					for (var i = 0; i < dataArr.length; i++) {
						total += dataArr[i];
					}
					return label.split(':')[0] + ': ' + (valor * 100 / total).toFixed(2) + "%";
				}
			}
		},
		plugins: {
			labels: {
				render: function (args) {
					if (args.percentage < 2) {
						return '';
					} else {
						return args.percentage.toFixed(2) + '%';
					}
				},
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

	//<editor-fold defaultstate="collapsed" desc="Estados">
	var $graficoEstados	= $("#consumos-estado");
	var coloresEstados	= ['#f38181', '#a9eec2', '#fad284', '#705772'];
	if ($graficoEstados.length > 0) {
		var id	= $graficoEstados.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataEstado']['labels'],
				datasets: [{
					backgroundColor: coloresEstados,
					borderColor: coloresEstados,
					lineTension: 0,
					data: window['dataEstado']['data']
				}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Comedores">
	var $graficoComedor	= $("#consumos-comedor");
	var coloresComedor	= ['#594a4e', '#e78fb3', '#ffc0ad', '#6fc1a5', '#fa877f', '#bd574e', '#dedef0', '#4b8e8d', '#f6c89f', '#96d1c7'];
	if ($graficoComedor.length > 0) {
		var id	= $graficoComedor.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataComedor']['labels'],
				datasets: [{
					backgroundColor: coloresComedor,
					borderColor: coloresComedor,
					lineTension: 0,
					data: window['dataComedor']['data']
				}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Tipo de servicio">
	var $graficoServicioTipo	= $("#consumos-servicio-tipo");
	var coloresServicioTipo		= ['#f1d4d4', '#ddb6c6', '#ac8daf', '#484c7f', '#bd83ce', '#e5b0ea'];
	if ($graficoServicioTipo.length > 0) {
		var id	= $graficoServicioTipo.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataServicioTipo']['labels'],
				datasets: [{
					backgroundColor: coloresServicioTipo,
					borderColor: coloresServicioTipo,
					lineTension: 0,
					data: window['dataServicioTipo']['data']
				}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Tipo de platos">
	var $graficoPlatoTipo	= $("#consumos-plato-tipo");
	var coloresPlatoTipo		= ['#f77754', '#ffd692', '#a0cc78', '#a4d1c8', '#6e2142', '#943855', '#e16363', '#ffd692'];
	if ($graficoPlatoTipo.length > 0) {
		var id	= $graficoPlatoTipo.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataPlatoTipo']['labels'],
				datasets: [{
					backgroundColor: coloresPlatoTipo,
					borderColor: coloresPlatoTipo,
					lineTension: 0,
					data: window['dataPlatoTipo']['data']
				}]
			},
			options: opcionesChart
		});
	}
	//</editor-fold>

	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="DataTable">
	var $tabla = $(".informe-tabla");
	if ($tabla.length > 0) {
		$tabla.DataTable({
			paging: false,
			searching: false,
			select: false,
			info: false,
			columnDefs: [
				{ type: "date-custom", orderDataType: "date-custom", sortable: true, targets: [0] }
			]
		});
	}
	//</editor-fold>

	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});

});
