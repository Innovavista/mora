$(document).ready(function() {
	
	/**
	 * Representa el tiempo de transición entre el modo gráfico y modo texto
	 * de una tarjeta.
	 * 
	 * @type Number
	 */
	const TIEMPO_TRANSICION = 400;
	
	const ICONO_TEXTO   = "fa-th";
	const ICONO_GRAFICO = "fa-bar-chart";
	
	moment.locale('es-es');
	
	//<editor-fold defaultstate="collapsed" desc="Formato número">
	var formateadorNumero = new Intl.NumberFormat(undefined, {
		style: 'decimal'
	});

	var formatearNumero = function(valor, conComa = true) {
		var salida = formateadorNumero.format(valor);
		var partes = salida.split(',');
		if (partes.length === 1 && conComa) {
			salida += ',00';
		} else if (partes.length > 1 && conComa) {
			var decimales = partes[partes.length - 1];
			if (decimales.length === 1) {
				salida += '0';
			}
		}
		if (!conComa) {
			return partes[0];
		}
		return salida;
	};
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Configuración de chart.js">
	Chart.NewLegend = Chart.Legend.extend({
		afterFit: function () {
			this.height = this.height + 50;
		}
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
	//</editor-fold>
	
	/**
	 * Devuelve el título de un tooltip.
	 * 
	 * @param {Array} tooltipItem
	 * @param {Object} data
	 * @returns {String}
	 */
	function callbackTitle(tooltipItem, data) {
		var fecha   = moment(tooltipItem[0].xLabel);
		var periodo = window['dataTotalesBrutos']['config']['intervalo'];
		switch (periodo) {
			case 'month':
				var texto = fecha.format('MMMM YYYY');
				return capitalize(texto);
			
			case 'week':
				var inicio = fecha.format('DD/MM/YYYY');
				var fin	   = fecha.add(1, 'week').format('DD/MM/YYYY');
				var texto  = `Semana del ${inicio} al ${fin}`;
				return texto;
			
			case 'day':
				return 'Día ' + fecha.format('DD/MM/YYYY');
		}
		return "";
	}
	
	/**
	 * Devuelve el label para cada dato del eje x.
	 * 
	 * @param {Array} tooltipItem
	 * @param {Object} data
	 * @returns {String}
	 */
	function callbackLabelEjeX(label, index, labels) {
		var fecha   = moment(label);
		var periodo = window['dataTotalesBrutos']['config']['intervalo'];
		switch (periodo) {
			case 'month':				
				var texto = fecha.format('MMMM');
				return capitalize(texto);
			
			case 'week':				
				var inicio = fecha.format('DD/MM/YYYY');
				return inicio;
			
			case 'day':				
				return fecha.format('DD/MM/YYYY');
		}
		return label;
	}
	
	/**
	 * Devuelve la cadena de texto con la primer letra mayúscula.
	 * 
	 * @param {String} texto
	 * @returns {String}
	 */
	function capitalize(texto) {
		return texto.charAt(0).toUpperCase() + texto.slice(1);
	}
	
	//<editor-fold defaultstate="collapsed" desc="Paleta de colores">
	var paletaColoresVerde  = [
		'#1E5128',	
		'#4E9F3D',
		'#9CC094',
		'#D8E9A8'
	];
	
	var paletaColoresClaros  = [
		'#FEF1E6',	
		'#F9D5A7',
		'#FFB085',
		'#90AACB'
	];
	
	var paletaColoresAzules  = [
		'#091353',
		'#9D84B7',
		'#D5D5D5',
		'#B2F9FC'
	];
	
	var paletaColoresMixtos  = [
		'#CEE5D0',
		'#F3F0D7',
		'#E0C097',
		'#FF7878'
	];
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráficos de ventas">
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de ventas brutas en el tiempo">
	// TODO refactorear código repetido.
	var $graficoTotalesBrutos = $("#grafico-totales-brutos");	
	if ($graficoTotalesBrutos.length > 0) {
		var id	= $graficoTotalesBrutos.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		
		var opciones			  = window['dataTotalesBrutos']['config'];
		opciones.options.tooltips = {};
		opciones.options.tooltips.callbacks = {
			title: callbackTitle,
			label: function(tooltipItem, data) {
				return "Total: $ " + formatearNumero(tooltipItem.yLabel, true);
			}
        };
		opciones.options.scales.xAxes[0].ticks.callback = callbackLabelEjeX;
		new Chart(ctx, opciones);
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoTotalesBrutos = $("#tabla-grafico-totales-brutos");
	$seccionTextoTotalesBrutos.hide();
	$('#icono-grafico-totales-brutos').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoTotalesBrutos.show(TIEMPO_TRANSICION);
			$graficoTotalesBrutos.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoTotalesBrutos.hide(TIEMPO_TRANSICION);
			$graficoTotalesBrutos.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de ventas netas en el tiempo">
	// TODO refactorear código repetido.
	var $graficoTotalesNetos = $("#grafico-totales-netos");	
	if ($graficoTotalesNetos.length > 0) {
		var id	= $graficoTotalesNetos.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		
		var opciones			  = window['dataTotalesNetos']['config'];
		opciones.options.tooltips = {};
		opciones.options.tooltips.callbacks = {
			title: callbackTitle,
			label: function(tooltipItem, data) {
				return "Total: $ " + formatearNumero(tooltipItem.yLabel, true);
			}
        };
		opciones.options.scales.xAxes[0].ticks.callback = callbackLabelEjeX;
		new Chart(ctx, opciones);
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoTotalesNetos = $("#tabla-grafico-totales-netos");
	$seccionTextoTotalesNetos.hide();
	$('#icono-grafico-totales-netos').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoTotalesNetos.show(TIEMPO_TRANSICION);
			$graficoTotalesNetos.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoTotalesNetos.hide(TIEMPO_TRANSICION);
			$graficoTotalesNetos.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas brutas por lista">	
	var $graficoVentasBruto = $("#total-bruto-vendido-grafico");
	if ($graficoVentasBruto.length > 0) {
		var id	= $graficoVentasBruto.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasBruto']['labels'],
				datasets: [{
					backgroundColor: paletaColoresVerde,
					borderColor: paletaColoresVerde,
					lineTension: 0,
					data: window['dataVentasBruto']['data']
				}]
			},
			options: opcionesChart
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoBruto = $("#tabla-total-bruto-vendido");
	$graficoVentasBruto.hide();
	$('#icono-total-bruto-vendido').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoBruto.show(TIEMPO_TRANSICION);
			$graficoVentasBruto.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoBruto.hide(TIEMPO_TRANSICION);
			$graficoVentasBruto.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas netas por lista">	
	var $graficoVentasNeto = $("#total-neto-vendido-grafico");
	if ($graficoVentasNeto.length > 0) {
		var id	= $graficoVentasNeto.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasNeto']['labels'],
				datasets: [{
					backgroundColor: paletaColoresAzules,
					borderColor: paletaColoresAzules,
					lineTension: 0,
					data: window['dataVentasNeto']['data']
				}]
			},
			options: opcionesChart
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoNeto = $("#tabla-total-neto-vendido");
	$graficoVentasNeto.hide();
	$('#icono-total-neto-vendido').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoNeto.show(TIEMPO_TRANSICION);
			$graficoVentasNeto.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoNeto.hide(TIEMPO_TRANSICION);
			$graficoVentasNeto.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por caja">	
	var $graficoVentasCaja = $("#total-vendido-caja-grafico");
	if ($graficoVentasCaja.length > 0) {
		var id					= $graficoVentasCaja.attr("id");
		var ctx					= document.getElementById(id).getContext('2d');
		var datosVentasCajas    = window['dataVentasCaja']['data'];
		var mostrarLeyendaCajas = datosVentasCajas.length <= 4;
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasCaja']['labels'],
				datasets: [{
					backgroundColor: paletaColoresVerde,
					borderColor: paletaColoresVerde,
					lineTension: 0,
					data: datosVentasCajas
				}]
			},
			options: {
				legend: {
					display: mostrarLeyendaCajas,
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
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoCaja = $("#tabla-total-vendido-caja");
	$seccionTextoVendidoCaja.hide();
	$('#icono-total-vendido-caja').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoCaja.show(TIEMPO_TRANSICION);
			$graficoVentasCaja.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoCaja.hide(TIEMPO_TRANSICION);
			$graficoVentasCaja.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por tipo de comprobante">	
	var $graficoVentasTipo = $("#total-vendido-tipo-grafico");
	if ($graficoVentasTipo.length > 0) {
		var id	= $graficoVentasTipo.attr("id");
		var ctx	= document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasTipoComprobante']['labels'],
				datasets: [{
					backgroundColor: paletaColoresMixtos,
					borderColor: paletaColoresMixtos,
					lineTension: 0,
					data: window['dataVentasTipoComprobante']['data']
				}]
			},
			options: opcionesChart
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoTipo = $("#tabla-total-vendido-tipo");
	$seccionTextoVendidoTipo.hide();
	$('#icono-total-vendido-tipo').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoTipo.show(TIEMPO_TRANSICION);
			$graficoVentasTipo.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoTipo.hide(TIEMPO_TRANSICION);
			$graficoVentasTipo.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por medio de pago">	
	var $graficoVentasMedioDePago = $("#total-vendido-medio-de-pago-grafico");
	if ($graficoVentasMedioDePago.length > 0) {
		var id						   = $graficoVentasMedioDePago.attr("id");
		var ctx						   = document.getElementById(id).getContext('2d');
		var datosMedioDePago		   = window['dataVentasMedioDePago']['data'];
		var mostrarLeyendaMediosDePago = datosMedioDePago.length <= 4;
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasMedioDePago']['labels'],
				datasets: [{
					backgroundColor: paletaColoresClaros,
					borderColor: paletaColoresClaros,
					lineTension: 0,
					data: datosMedioDePago
				}]
			},
			options: {
				legend: {
					display: mostrarLeyendaMediosDePago,
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
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoMedioDePago = $("#tabla-total-vendido-medio-de-pago");
	$seccionTextoVendidoMedioDePago.hide();
	$('#icono-total-vendido-medio-de-pago').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoMedioDePago.show(TIEMPO_TRANSICION);
			$graficoVentasMedioDePago.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoMedioDePago.hide(TIEMPO_TRANSICION);
			$graficoVentasMedioDePago.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por condición">	
	var $graficoVentasCondicion = $("#total-vendido-condicion-grafico");
	if ($graficoVentasCondicion.length > 0) {
		var id	= $graficoVentasCondicion.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasCondicion']['labels'],
				datasets: [{
					backgroundColor: paletaColoresClaros,
					borderColor: paletaColoresClaros,
					lineTension: 0,
					data: window['dataVentasCondicion']['data']
				}]
			},
			options: opcionesChart
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoCondicion = $("#tabla-total-vendido-condicion");
	$seccionTextoVendidoCondicion.hide();
	$('#icono-total-vendido-condicion').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoCondicion.show(TIEMPO_TRANSICION);
			$graficoVentasCondicion.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoCondicion.hide(TIEMPO_TRANSICION);
			$graficoVentasCondicion.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por categoría de producto">	
	var $graficoVentasCategoria = $("#ranking-categorias-grafico");
	if ($graficoVentasCategoria.length > 0) {
		var id						 = $graficoVentasCategoria.attr("id");
		var ctx						 = document.getElementById(id).getContext('2d');
		var datosCategorias			 = window['dataCategoriaRanking']['data'];
		var mostrarLeyendaCategorias = datosCategorias.length <= 4;
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataCategoriaRanking']['labels'],
				datasets: [{
					backgroundColor: paletaColoresMixtos,
					borderColor: paletaColoresMixtos,
					lineTension: 0,
					data: datosCategorias
				}]
			},
			options: {
				legend: {
					display: mostrarLeyendaCategorias,
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
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoCategorias = $("#tabla-ranking-categorias");
	$graficoVentasCategoria.hide();
	$('#icono-ranking-categorias').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoCategorias.show(TIEMPO_TRANSICION);
			$graficoVentasCategoria.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoCategorias.hide(TIEMPO_TRANSICION);
			$graficoVentasCategoria.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por clientes">	
	var $graficoVentasClientes = $("#ranking-clientes-grafico");
	if ($graficoVentasClientes.length > 0) {
		var id					   = $graficoVentasClientes.attr("id");
		var ctx					   = document.getElementById(id).getContext('2d');
		var datosClientes		   = window['dataClientesRanking']['data'];
		var mostrarLeyendaClientes = datosClientes.length <= 4;
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataClientesRanking']['labels'],
				datasets: [{
					backgroundColor: paletaColoresVerde,
					borderColor: paletaColoresVerde,
					lineTension: 0,
					data: datosClientes
				}]
			},
			options: {
				legend: {
					display: mostrarLeyendaClientes,
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
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVendidoClientes = $("#tabla-ranking-clientes");
	$graficoVentasClientes.hide();
	$('#icono-ranking-clientes').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVendidoClientes.show(TIEMPO_TRANSICION);
			$graficoVentasClientes.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVendidoClientes.hide(TIEMPO_TRANSICION);
			$graficoVentasClientes.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de ventas por tipo">	
	var $graficoVentasTipos = $("#ventas-tipo-grafico");
	if ($graficoVentasTipos.length > 0) {
		var id					     = $graficoVentasTipos.attr("id");
		var ctx					     = document.getElementById(id).getContext('2d');
		var datosVentasTipo		     = window['dataVentasTipo']['data'];
		var mostrarLeyendaVentasTipo = datosVentasTipo.length <= 4;
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataVentasTipo']['labels'],
				datasets: [{
					backgroundColor: paletaColoresVerde,
					borderColor: paletaColoresVerde,
					lineTension: 0,
					data: datosVentasTipo
				}]
			},
			options: {
				legend: {
					display: mostrarLeyendaVentasTipo,
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
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoVentasTipo = $("#tabla-ventas-tipo");
	$seccionTextoVentasTipo.hide();
	$('#icono-ventas-tipo').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoVentasTipo.show(TIEMPO_TRANSICION);
			$graficoVentasTipos.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoVentasTipo.hide(TIEMPO_TRANSICION);
			$graficoVentasTipos.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráficos de descuentos">
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de descuentos en el tiempo">
	// TODO refactorear código repetido.
	var $graficoDescuentos = $("#grafico-descuentos");	
	if ($graficoDescuentos.length > 0) {
		var id	= $graficoDescuentos.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		
		var opciones			  = window['dataDescuento']['config'];
		opciones.options.tooltips = {};
		opciones.options.tooltips.callbacks = {
			title: callbackTitle,
			label: function(tooltipItem, data) {
				return "Descuento: $ " + formatearNumero(tooltipItem.yLabel, true);
			}
        };
		opciones.options.scales.xAxes[0].ticks.callback = callbackLabelEjeX;
		new Chart(ctx, opciones);
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoDescuentos = $("#tabla-grafico-descuentos");
	$seccionTextoDescuentos.hide();
	$('#icono-grafico-descuentos').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoDescuentos.show(TIEMPO_TRANSICION);
			$graficoDescuentos.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoDescuentos.hide(TIEMPO_TRANSICION);
			$graficoDescuentos.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de descuentos por descuento">
	var $graficoDescuentosDiscriminados = $("#total-descontado-discriminado");
	if ($graficoDescuentosDiscriminados.length > 0) {
		var id			   = $graficoDescuentosDiscriminados.attr("id");
		var ctx			   = document.getElementById(id).getContext('2d');
		var datos		   = window['dataDescuentos']['data'];
		var mostrarLeyenda = datos.length <= 4;
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataDescuentos']['labels'],
				datasets: [{
						backgroundColor: paletaColoresAzules,
						borderColor: paletaColoresAzules,
						lineTension: 0,
						data: datos
					}]
			},
			options: {
				legend: {
					display: mostrarLeyenda,
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
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoDescontadoDescuento = $("#tabla-total-descontado-discriminado");
	$seccionTextoDescontadoDescuento.hide();
	$('#icono-total-descontado-discriminado').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoDescontadoDescuento.show(TIEMPO_TRANSICION);
			$graficoDescuentosDiscriminados.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoDescontadoDescuento.hide(TIEMPO_TRANSICION);
			$graficoDescuentosDiscriminados.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta de descuentos por lista">
	var $graficoDescuentosLista = $("#total-descontado-grafico");
	if ($graficoDescuentosLista.length > 0) {
		var id	= $graficoDescuentosLista.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataDescuentosLista']['labels'],
				datasets: [{
					backgroundColor: paletaColoresClaros,
					borderColor: paletaColoresClaros,
					lineTension: 0,
					data: window['dataDescuentosLista']['data']
				}]
			},
			options: opcionesChart
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoDescontado   = $("#tabla-total-descontado");
	$graficoDescuentosLista.hide();
	$('#icono-total-descontado').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoDescontado.show(TIEMPO_TRANSICION);
			$graficoDescuentosLista.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoDescontado.hide(TIEMPO_TRANSICION);
			$graficoDescuentosLista.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráficos de cantidades">
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de cantidades en el tiempo">
	var $graficoCantidades = $("#grafico-cantidades");	
	if ($graficoCantidades.length > 0) {
		var id	= $graficoCantidades.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		
		var opciones			  = window['dataCantidades']['config'];
		opciones.options.tooltips = {};
		opciones.options.tooltips.callbacks = {
			title: callbackTitle,
			label: function(tooltipItem, data) {
				return "Cantidad: " + formatearNumero(tooltipItem.yLabel, false);
			}
        };
		opciones.options.scales.xAxes[0].ticks.callback = callbackLabelEjeX;
		new Chart(ctx, opciones);
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoCantidadTiempo = $("#tabla-grafico-cantidades");
	$seccionTextoCantidadTiempo.hide();
	$('#icono-grafico-cantidades').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoCantidadTiempo.show(TIEMPO_TRANSICION);
			$graficoCantidades.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoCantidadTiempo.hide(TIEMPO_TRANSICION);
			$graficoCantidades.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Gráfico de torta ranking de productos">
	var $graficoCantidadesLista = $("#cantidad-vendida-grafico");
	if ($graficoCantidadesLista.length > 0) {
		var id	= $graficoCantidadesLista.attr("id");
		var ctx = document.getElementById(id).getContext('2d');
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: window['dataCantidadesRanking']['labels'],
				datasets: [{
					backgroundColor: paletaColoresMixtos,
					borderColor: paletaColoresMixtos,
					lineTension: 0,
					data: window['dataCantidadesRanking']['data']
				}]
			},
			options: {
				legend: {
					display: false
				},
				tooltips: {
					callbacks: {
						label: function (tooltipItem, data) {
							var label = data.labels[tooltipItem.index];
							return ' ' + label;
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
			}
		});
	}
	
	//<editor-fold defaultstate="collapsed" desc="Transición modo texto - modo gráfico">
	var $seccionTextoCantidad = $("#tabla-cantidad-vendida");
	$graficoCantidadesLista.hide();
	$('#icono-cantidad-vendida').click(function() {
		var $icono	   = $(this);
		var $esGrafico = $icono.hasClass(ICONO_GRAFICO);
		if ($esGrafico) {
			$seccionTextoCantidad.show(TIEMPO_TRANSICION);
			$graficoCantidadesLista.hide(TIEMPO_TRANSICION);
			$icono.removeClass(ICONO_GRAFICO);
			$icono.addClass(ICONO_TEXTO);
		} else {
			$seccionTextoCantidad.hide(TIEMPO_TRANSICION);
			$graficoCantidadesLista.show(TIEMPO_TRANSICION);
			$icono.addClass(ICONO_GRAFICO);
			$icono.removeClass(ICONO_TEXTO);
		}
	});
	//</editor-fold>
	
	//</editor-fold>
		
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Centrado de checkboxs">
	var $tarjeta   = $(".card-filtros");
	var $form	   = $tarjeta.find("form");
	var $checkboxs = $form.find(".checkbox");
	$checkboxs.addClass('m-4');
	//</editor-fold>
	
	//<editor-fold defaultstate="collapsed" desc="Configuración de selects">
	var $selectProductos  = $("select[name='productos[]']");
	var $incluirProductos = $("[name='incluir-productos']");
	var $selectCategorias = $("select[name='categoria-productos[]']");
	$incluirProductos.change(function() {
		var incluye			  = $(this).is(":checked");	
		if (!incluye) {
			$selectProductos.val('');
			$selectProductos.prop('disabled', true);
			$selectProductos.selectpicker('refresh');
			
			$selectCategorias.val('');
			$selectCategorias.prop('disabled', true);
			$selectCategorias.selectpicker('refresh');
		} else {
			$selectProductos.prop('disabled', false);
			$selectProductos.selectpicker('refresh');
			
			$selectCategorias.prop('disabled', false);
			$selectCategorias.selectpicker('refresh');
		}
	});
	
	$selectCategorias.change(function() {
		var opciones   = $selectProductos.find("option");
		var categorias = $(this).val();
		if (categorias === null) {
			opciones.removeClass("hidden");
			$selectProductos.selectpicker("refresh");
			return;
		}
		
		opciones.addClass("hidden");
		for (var i = 0; opciones.length > i ; i++) {
			var agregar		    = true;
			var $opcion		    = $(opciones[i]);
			var opcionCategoria = $opcion.attr("data-categoria");
			if (categorias !== null) {
				agregar = categorias.indexOf(opcionCategoria) > -1;
			}
			if (agregar) {
				$opcion.removeClass("hidden");
			} else {
				$opcion.prop("selected", false);
			}
		}
		$selectProductos.selectpicker("refresh");
	});
	//</editor-fold>
	
	$(window).load(function() {
		$(".preloader-container").fadeOut('slow',function(){$(this).remove();});
	});
});