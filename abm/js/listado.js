/* global listadoGlobal */
/* global buscadorGeneral */
/* global operacionesIconos */
function readyTable($tabla) {
	var dataOn, dataOff;

	$tabla.find('[data-toggle="toggle"]').each(function(){
		var $this = $(this);
		dataOn = $this.data('on');
		dataOff = $this.data('off');

		if (typeof dataOn !== 'undefined' && typeof dataOff !== 'undefined'){
			$this.bootstrapToggle({
				on: dataOn,
				off: dataOff
			});
		}
	});

	$tabla.find('[data-toggle="material-wrap"]').each(function(){
		var $this = $(this);
		$.material.togglebutton($this);
	});

	$tabla.find('.dataTable [data-toggle="toggle"]').click(function(event) {
		var $toggle	= $(this);
		var $input	= $(this).find('input');
		var $faSpin = $toggle.parent().find('.fa-spin');
		var url = $input.data('url');

		event.preventDefault();
		event.stopPropagation();

		$toggle.addClass('disabled');
		$faSpin.removeClass('hidden');

		$.ajax({
			url: url,
            method: 'get',
            dataType: 'json',
            success: function (data) {
                if (!data.error) {
                    $input.bootstrapToggle(data.campoValor ? 'on' : 'off');
                    //Lógica necesaria para sincronizar el toggle en el listado responsive y no responsive.
                    var $element = $input.data('bs.toggle')['$element'];
                    if (!$element.is($input)) {
                        var scope = $.extend(
                                $input.data('bs.toggle'),
                                {$element: $input, $toggle: $toggle}
                        );
                        var Toggle = $.fn.bootstrapToggle.Constructor.prototype;
                        if (data.campoValor) {
                            Toggle['on'].apply(scope);
                        } else {
                            Toggle['off'].apply(scope);
                        }
                    }
                } else {
                    alerta('Ha ocurrido un error, vuelva a intentar', 'danger', $('body'));
                }
            },
			complete: function(){
				$toggle.removeClass('disabled');
				$faSpin.addClass('hidden');
			}
		});
	});
	$tabla.find('.dataTable [data-toggle="material-wrap"]').click(function(event) {
		var $input	 = $(this);
		var $palanca = $input.siblings('.toggle');
		var url		 = $input.data('url');

		$palanca.addClass('ajax');

		$.ajax({
			url: url,
            method: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.error) {
					event.preventDefault();
					event.stopPropagation();
					alerta('Ha ocurrido un error, vuelva a intentar', 'danger', $('body'));
                }
            },
			complete: function(){
				$palanca.removeClass('ajax');
			}
		});
	});

	$tabla.find('.dataTable [data-toggle="dore"]').click(function(event) {
		var $checkbox	= $(this).find("input");
		var url			= $checkbox.data('url');

		$checkbox.prop("checked", !$checkbox.prop("checked"));

		$.ajax({
			url: url,
            method: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.error) {
					event.preventDefault();
					event.stopPropagation();
					alerta('Ha ocurrido un error, vuelva a intentar', 'danger', $('body'));
                }
            }
		});
	});

	var $pestanas = $('#buscador-general-tablas a[data-toggle="tab"]');
	if ($pestanas.length > 0) {
		var pestanaId	  = $tabla.closest('.tab-pane').attr('id');
		var $pestanaBadge = $pestanas.filter('[href="#' + pestanaId + '"]').find('.badge');
		var total		  = $tabla.find('.itemPerPage').closest('label').siblings('span:last').text();
		var partes		  = total.split(' ');
		if ($.isNumeric(partes[0])) {
			$pestanaBadge.text(partes[0]);
		}
	}
    inicializarOperacionesListadoModal();
    inicializarDataTable($tabla);
}

function inicializarDataTable($tabla) {
    var renderer = function (api, rowIdx, columns) {
        var data = $.map(columns, function (col, i) {
            var cell = api.cell(rowIdx, col.columnIndex);
            var $cell = $(cell.node());
            if (col.hidden) {
                var $contents = $cell.contents();
                var $data = $contents.clone(true, true);
                var $li = $('<li data-dtr-index="' + col.columnIndex + '" data-dt-row="' + col.rowIndex + '" data-dt-column="' + col.columnIndex + '">' +
                        '<span class="dtr-title">' +
                        col.title +
                        '</span> ' +
                        '<span class="dtr-data">' +
                        '</span>' +
                        '</li>');
                $li.find('.dtr-data').append($data);
                return $li;
            }
            return false;
        }).filter(function (e, i) {
            return e !== false;
        });
        return data.length > 0 ?
                $('<ul data-dtr-index="' + rowIdx + '"/>').append(data) :
                false;
    };

    var eventoResize = function (columns, $tabla) {
        var $filtros = $tabla.find('thead>tr td');
        $filtros.each(function (index) {
            $filtro = $(this);
            if (columns[index]) {
                $filtro.show();
            } else {
                $filtro.hide();
            }
        });
    };
    var opciones = {//Default
        searching: false,
        ordering: false,
        paging: false,
        info: false,
        language : {
            emptyTable: "No se encontraron registros"
        },
        responsive: {
            details: {
                renderer: renderer
            }
        },
        columnDefs: [
            {responsivePriority: 1, targets: 0},
            {responsivePriority: 2, targets: -1}
        ],
        drawCallback: function (settings) {
            if (settings.responsive) {
                eventoResize(settings.responsive.s.current, $tabla);
            }
        }
    };
    if (typeof listadoGlobal !== 'undefined' && listadoGlobal.dataTable) {
        $.extend(true, opciones, listadoGlobal.dataTable);
    }

    var $dataTable = $tabla.find('.dataTable');
    if (opciones.responsive) {
        opciones.drawCallback = function (settings) {
            eventoResize(settings.responsive.s.current, $tabla);
        };
    }
    var $table = $dataTable.DataTable(opciones);
    if (opciones.responsive) {
        $table.on('responsive-resize', function (e, datatable, columns) {
            eventoResize(columns, $tabla);
        });
    }
}

function inicializarOperacionesListadoModal() {
    /**
     * Inicializa los eventos de los botones en operaciones para hacerlo en modal.
     *
     * @returns void
     */
    eventoOperacionEnModal = function () {
        var $this = $(this);
        var target = $this.data('target');
        var tituloModal = $this.data('titulo-modal');
        var src = $this.data('src');

        var $target = $(target).eq(0);
        var $modalTitle = $target.find('.modal-title');
        var $modalBody = $target.find('.modal-body');

        $modalTitle.html(tituloModal);
        $modalBody.html('<div class="modal-esperar text-center"><i class="fa fa-spinner fa-spin fa-4x"></i></div>');
        $modalBody.load(src, function () {
            modalForm({}, $target);
        });
        $target.modal({show: true});
    };

    $('a[data-action="operacionesListado-modal"]:not([data-arreglado])').on('click ejecutar-click', eventoOperacionEnModal).attr('data-arreglado', true);
}

$(document).ready(function(){
	prepararTablas();
	var $botonSubmit = $("div[data-tabla-contenedor] #additionalParams");
	if ($botonSubmit.length > 0) {
		var $botonSubmit = $botonSubmit.find('[type="submit"]');
		var $grupo = $botonSubmit.parent();
		$botonSubmit.removeClass('pull-right');
		$grupo.addClass('btn-group pull-right').prepend($('[data-accion]'));
	}

	if (typeof operacionesIconosGlobal !== 'undefined' && operacionesIconosGlobal) {
		var $operaciones = $(".tabla-operaciones-icono").find("a");
		$operaciones.tooltipster({
			theme: 'tooltipster-shadow',
			animation: 'grow',
			delay:	200,
			side: 'top',
			contentCloning: true
		});
	}
});

function prepararTablas() {

	buscadorGeneral = typeof buscadorGeneral !== 'undefined' ? buscadorGeneral : false;

	//<editor-fold defaultstate="collapsed" desc="Tablas">
	//true para que en el load de la pagina no haga otra llamda ajax
	var onInitReturn = true;

	function tablaFuncion(tabla, url) {
		tabla.zfTable(url, {
			beforeSend: function() {
				 $('.processing').show();
			},
			sendAdditionalParams: function() {
				var data = $('#additionalParams').find('input,select,textarea').each(function(){
					return $(this).val();
				}).serialize();
				return '&' + data;
			},
			onInit: function() {
				if (onInitReturn) {
					return false;
				}
			},
            success: function() {
                $('.form-inline').removeClass('form-inline')
                        .addClass('form')
                        .find('.filter').addClass('input-sm');
                        readyTable(tabla);
            },
            error: function(e) {
              alert('Ha ocurrido un error al aplicar los filtros en el listado.');
            },
			complete: function(){
                $('.processing').hide();
				inputsCrossBrowser();
			}
		});
	}

	var $tablas = $('[data-tabla-contenedor]');
	$tablas.each(function() {
		var $tabla = $(this).find('[data-tabla]');
		var url = $tabla.data('tabla');
		if (!buscadorGeneral) {
			$("#additionalParams").find('[type="submit"]').on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				var $boton = $(this);
				onInitReturn = false; //lo paso a false para que devuleva el contenido de la tabla
				if (!$boton.parents('form').eq(0).valid()) {
					return;
				}
				tablaFuncion($tabla, url);
			});
		}

		tablaFuncion($tabla, url);
		readyTable($tabla);
	});

	if (buscadorGeneral) {
		//Para el buscador general, el formulario es uno solo y el "params-wrap"
		//con los input ocultos de cada tabla se repiten, por lo que fallan
		//las paginaciones y cantidad de ítems por página de todas las pestañas
		//a excepción de la última (el valor del post queda siempre en el
		//último enviado).
		//Además, no lo ponemos bajo la condición "buscadorGeneral" porque solo
		//será true cuando hagamos una búsqueda y false cuando cambiemos la
		//paginación
		var $pestanas = $('#buscador-general-tablas a[data-toggle="tab"]');
		$pestanas.click(function(e) {
			var $pestana	= $(this);
			var $tabla		= $($pestana.attr('href'));
			var selectores	= [
				'input[name="zfTablePage"]',
				'input[name="zfTableColumn"]',
				'input[name="zfTableItemPerPage"]',
				'input[name="zfTableOrder"]'
			];

			for (var i = 0; i < selectores.length; i++) {
				var selector = selectores[i];
				var $todos	 = $(selector);
				var $actual	 = $tabla.find(selector);

				$todos.prop("disabled", true);
				$actual.prop("disabled", false);
			}
		});
		$pestanas.eq(0).click();
	}

	$('#limpiarFiltros').click(function(e){
		$('form[name="additionalParams"]').each(function(){
			$(':input',this).val('');
			$('[data-selectpicker-iniciado="1"]',this).selectpicker('val', '');
		});
		$tablas.each(function(){
			var tabla = $(this).find('[data-tabla]');
			var url = tabla.data('tabla');
			url += '?limpiarParametrosFiltrado=true';
			tabla.find('.processing').show();
            jQuery.ajax({
                url: url,
                type: 'GET',
                success: function(data) {
                    tabla.html('');
                    tabla.html(data);
                    tabla.find('.processing').hide();
					tablaFuncion(tabla, url);
					readyTable(tabla);
					$('#limpiarFiltros,.limpiarFiltrosEsconder').remove();
                },
                dataType: 'html'
            });

		});
	});

	$(document).on('change', 'input.quick-search', function(){
		$('input[name="zfTableQuickSearch"]').attr('value' , $(this).val());
		$('input[name="zfTableQuickSearch"]').val($(this).val());
	});
	//</editor-fold>

	$('[data-accion]').click(function(e){
		var href = this.getAttribute("href");
		var params = '';
		if ($('#additionalParams').length > 0) {
			var data = $('#additionalParams').find('input,select,textarea').filter(function(){
					return $(this).val();
			}).serialize();
			var filtrosTabla = $('.dataTable .filters').filter(function(){
				return $(this).val();
			}).serialize();
			var otrosDatos = $('.params-wrap').find('input').not('[name="zfTablePage"]').filter(function(){
				return $(this).val();
			}).serialize();
			params = '?' + data + '&' + filtrosTabla + '&' + otrosDatos;
		}
		if(href) {
			location.href = href + params;
			e.preventDefault();
		}
	});

	var $listadoTextoBusqueda = $('#dataTable_filter > label');
	if ($listadoTextoBusqueda.length > 0) {
		$listadoTextoBusqueda.get(0).firstChild.nodeValue = "Buscar: ";
	}
}