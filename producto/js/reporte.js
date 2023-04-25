function enviarPost(data) {
	$('#btn-crear-reporte').button('loading');
	$('#reporte').html("<div class='preloader'></div>");
	url = "";
	var tipoReporte = $('input[name=tipoReporte]:checked', '#formulario').val();
	if (typeof tipoReporte === 'undefined') {
		$('#mensajes').text('Debe especicar el tipo de reporte.');
	}
	var options = {
		method: 'POST',
		url: '/reporte/' + tipoReporte,
		data: data,
		success: function(data, textStatus) {
			$('#reporte').html(data);
		},
		error: function(jqXHR, textStatus, error) {
			console.log(error);
		},
		complete: function() {
			console.log("complete");
			$('#btn-crear-reporte').button('reset');
		}
	};
	$.ajax(options);
}


$(function () {
    $('.list-group.checked-list-box .list-group-item').each(function () {
        // Settings
        var $widget = $(this),
            $checkbox = $('<input type="checkbox" class="hidden" />'),
            color = ($widget.data('color') ? $widget.data('color') : "primary"),
            style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
            settings = {
                on: {
                    icon: 'glyphicon glyphicon-check'
                },
                off: {
                    icon: 'glyphicon glyphicon-unchecked'
                }
            };
        $widget.css('cursor', 'pointer')
        $widget.append($checkbox);

        // Event Handlers
        $widget.on('click', function () {
            $checkbox.prop('checked', !$checkbox.is(':checked'));
            $checkbox.triggerHandler('change');
            updateDisplay();
        });
        $checkbox.on('change', function () {
            updateDisplay();
        });

        // Actions
        function updateDisplay() {
            var isChecked = $checkbox.is(':checked');

            // Set the button's state
            $widget.data('state', (isChecked) ? "on" : "off");

            // Set the button's icon
            $widget.find('.state-icon')
                .removeClass()
                .addClass('state-icon ' + settings[$widget.data('state')].icon);

            // Update the button's color
            if (isChecked) {
                $widget.addClass(style + color + ' active');
            } else {
                $widget.removeClass(style + color + ' active');
            }
        }
        // Initialization
        function init() {

            if ($widget.data('checked') == true) {
                $checkbox.prop('checked', !$checkbox.is(':checked'));
            }

            updateDisplay();

            // Inject the icon if applicable
            if ($widget.find('.state-icon').length == 0) {
                $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
            }
        }
        init();
    });

	$('#btn-crear-reporte').on('click', function(event) {
		var $mensajes = $('#mensajes');
		$mensajes.text("");
		var fechaDesde = $('#fecha-desde').val();
		var fechaHasta = $('#fecha-hasta').val();

		var ids = [];
		var id;
		var counter = 0;
		$("#list-box li.active").each(function(idx, li) {
			id = $(li).attr('data-id');
            ids.push(id) ;
            counter++;
        });
		if (counter === 0) {
			$mensajes.text("Debe seleccionar al menos un cliente.");
			return;
		}
		var data = {
			'fechaDesde' : fechaDesde,
			'fechaHasta' : fechaHasta,
			'ids' : ids
		};
		enviarPost(data);
	});
});

