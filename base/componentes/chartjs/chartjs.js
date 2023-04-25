//<editor-fold defaultstate="collapsed" desc="Funciones">
function getMaxLabelsConfigExtension(maxLabels) {
	return {
		options: {
			legend: {
				labels: {
					generateLabels: function (chart) {
						var originalData = chart.data;
						if (originalData.datasets && originalData.datasets[0].data.length > 0) {
							var labels = originalData.labels;
							var data = originalData.datasets[0].data;
							var dataLabelsIndexed = data.map(function (value, i) {
								return [i, value, labels[i]];
							});
							var dataLabelsIndexedSortedSliced = dataLabelsIndexed.sort(function (a, b) {
								return b[1] - a[1];
							}).slice(0, maxLabels);
							var newLabels = dataLabelsIndexedSortedSliced.map(function (v) {
								return v[2];
							});
						}
						var defaultGenerateLabels = Chart.defaults.doughnut.legend.labels.generateLabels;
						var labelsObject = defaultGenerateLabels(chart);
						var salida = labelsObject.filter(function (labelObject) {
							return newLabels.includes(labelObject.text);
						});
						return salida;
					}
				}
			}
		}
	};
}

var componenteChartJsCrear = function(objeto) {
	var ctx = objeto.getContext('2d');
	var id = objeto.id;
	var configs = window[id];
	var chartjsConfig = configs['chartjsConfig'];
	var customConfig = configs['customConfig'];
	var customConfigExtension = {};
	if (customConfig['maxLabels']) {
		var maxLabels = customConfig['maxLabels'];
		$.extend(true, customConfigExtension, getMaxLabelsConfigExtension(maxLabels));
	}
	var config = $.extend(true, {}, chartjsConfig, customConfigExtension);
	configs.chart = new Chart(ctx, config);
};
//</editor-fold>

$('canvas[data-c-chartjs]').each(function () {
	componenteChartJsCrear(this);
});