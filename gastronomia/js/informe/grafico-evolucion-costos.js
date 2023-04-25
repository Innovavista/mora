(function () {
	function labelCallback(tooltipItem, data) {
		var dataset = data.datasets[tooltipItem.datasetIndex];
		return dataset.label + ": $" + tooltipItem.yLabel;
	}


	$("[data-grafico-evolucion-costos]").each(function () {
		var id = this.id;
		var config = window[id];
		var ticks = config
				.chartjsConfig
				.options
				.scales
				.yAxes[0]
				.ticks;
		ticks.callback = function (value) {
			return  "$" + value;
		};
		$.extend(true, config, {
			chartjsConfig: {
				options: {
					tooltips: {
						callbacks: {
							label: labelCallback
						}
					},
					scales: {
						yAxes: [{
								ticks: ticks
							}]
					}
				}
			}
		});
	});
})();