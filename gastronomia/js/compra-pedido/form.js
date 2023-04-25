$(document).ready(function() {

	var $form	  = $("#compra-pedido-alta");
	var $deposito = $form.find("select.select-deposito");
	
	var $formComedor = $('.form-comedor');
	var $comedor	 = $formComedor.find(".input-comedor");
	var $spiner		 = $formComedor.find(".zmdi-spinner").hide();

	$deposito.change(function() {
		var id = $(this).val();
		if (!id) {
			$comedor.val("");
			return;
		}
		var opciones = getAjaxOpciones({
			url		: URL_DEPOSITO_ARRAY + '/' + id,
			success : function (data, textStatus, jqXHR) {
				if (data && data.exito && data.deposito) {
					var deposito = data.deposito;
					if (deposito.id && deposito.comedor !== null && deposito.comedor.nombre) {
						var nombre = deposito.comedor.nombre;
						$comedor.val(nombre);
						return;
					}
					$comedor.val('Sin comedor');
				}
			}
		});
		$.ajax(opciones);
	});

	//<editor-fold defaultstate="collapsed" desc="Ajax">
	var ajaxOpciones = {
		method	   : 'POST',
		beforeSend : function(jqXHR, settings) {
			$comedor.val('');
			$spiner.show();
		},
		error	   : function(jqXHR, textStatus, errorThrown) {
			$comedor.val('');
			$spiner.hide();
		},
		complete   : function(jqXHR, settings) {
			$spiner.hide();
		}
	};
	var getAjaxOpciones = function(opciones) {
		if (typeof opciones === 'undefined') {
			opciones = {};
		}
		return jQuery.extend(true, opciones, ajaxOpciones);
	};
	//</editor-fold>

});