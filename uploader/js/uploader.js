/* global plupload, mOxie */

var globalUploaders = new Array();
var globalUploaderListenerQuitado = false;	//Esta variable determia si fue
											//inicializado el listener que se ejecuta
											//al quitar un elemento de un agregable

/**
 * Inicializa los elementos uploader
 *
 * @param {Object} element
 * @returns {plupload.Uploader|inicializarUploader.uploader}
 */
function inicializarUploader(element) {
	var $element = $(element);
	if ($element.attr('data-uploader-inicializado')) {
		return;
	}
	var $enTemplate = $element.closest('[data-template="true"]');
	if ($enTemplate.length > 0) {
		return;
	}
	var settings				= $element.data('settings');
	var $button					= $element.find('.' + settings.browse_button);
	var $thumbnail				= $element.find('.uploader-thumbnail');
	var $botonDescargar			= $element.find('button.uploader-btn-descargar');
	var $botonCancelar			= $element.find('.uploader-btn-cancelar');
	var $botonEliminar			= $element.find('button.uploader-btn-eliminar');
	var $botonesSubmit			= $('[type="submit"], [data-action="validarForm"]').not('.uploadBrowse');
	var $uploaderCampoOculto	= $element.find('input.uploader-campo-oculto');
	var $uploaderCampoNomOrig	= $('[name="' + $uploaderCampoOculto.data('campo-nombre-original') + '"]');//Campo que contiene el Nombre original del archivo
	var nombreOriginal = '';
	if ($uploaderCampoNomOrig) {
		nombreOriginal = $uploaderCampoNomOrig.val();
		if (nombreOriginal !== '') {
			$element.find('#uploader-fileName').text(nombreOriginal);
		}
	}
	inicializarBotonDescarga($botonDescargar, nombreOriginal);
	inicializarBotonEliminar($botonEliminar, $botonDescargar);
	if ($element.closest('.agregable-elemento')) {
		$element.closest('.agregable-elemento').find('.agregable-btn-group').prepend($botonCancelar).prepend($botonDescargar);
	}
	if (settings.sistema_archivos === 'local') {
		settings.multipart_params.campoNombre			= settings.campo_nombre;
		settings.multipart_params.anchoMinimo			= settings.ancho_minimo;
		settings.multipart_params.altoMinimo			= settings.alto_minimo;
		settings.multipart_params.carpetaDefinitiva		= settings.carpeta_definitiva; // $inputOculto.data('archivo-carpeta');
		settings.multipart_params.nombreBase			= settings.nombre_base; // $inputOculto.data('nombre-base');
		settings.multipart_params.archivoGuardarEn		= settings.archivo_guardar_en; //$inputOculto.data('archivo-guardar-en');
		settings.multipart_params.sistemaArchivoDestino	= settings.sistema_archivos;
		settings.multipart_params.objetoTipo			= settings.objeto_tipo;
	}
	settings.browse_button							= $button.get(0);
	settings.container								= $element.get(0);
	settings.drop_element							= $thumbnail.get(0);
	var uploader									= new plupload.Uploader(settings);
	uploader.init();
	uploader.bind('FilesAdded', function(up, files) {
		var $uploader = $(up.settings.container);
		var totalSize = 0;
		$.each(files, function(index, file) {
			totalSize += file.size;
			var html = '<div id="' + file.id + '" class="uploader-archivo">'
				+ '<div class="uploader-texto text-center">'
				+ '<i class="fa fa-file-o fa-4x"></i><br>'
				+ '<span id="uploader-fileName">' + file.name + '</span><br><span id="uploader-fileSize"> ' + plupload.formatSize(file.size) + '</span></div></div>';
			if (file.type.match('image.*')) {
				var preloader = new mOxie.Image();
				preloader.onload = function() {
					//preloader.downsize(320, 150, true);
					ancho		= preloader.width;
					height		= preloader.height;
					preloader.crop(ancho, height, false);
					var html = '<img class="uploader-imagen" src="' + preloader.getAsDataURL() + '" class="subida-ajax-imagen" alt="Previsualización"/>';
					$thumbnail.html(html);
				};
				preloader.onembedded = function () {
					this.destroy();
				};

				preloader.onerror = function () {
					this.destroy();
				};
				preloader.load( file.getSource() );
			} else {
				$thumbnail.html(html);
			}
		});
		$uploader.find('.uploader-progreso').removeClass('hidden');
		$uploader.find('.uploader-alert').remove();
		uploader.start();
	});
	uploader.bind('BeforeUpload', function(up, file){
		if (up.settings.sistema_archivos === 'local') {
			up.settings.multipart_params.archivoNombreOriginal = file.name;
		}
		var $uploader = $(up.settings.container);
		$uploader.removeClass('has-error');
		$uploader.find('.uploader-error').hide().text('');
		$botonesSubmit.prop( "disabled", true );
		$botonCancelar.show();
		$botonDescargar.hide();
		var $barraProgreso = $uploader.find('.uploader-progreso').find('.progress-bar');
		aumentarBarra($barraProgreso, 0);
		$botonCancelar.click(function(){
			up.stop();
			$uploaderCampoOculto.val(null);
			$botonesSubmit.prop( "disabled", false );
			up.removeFile(file);
			var $barraProgreso = $uploader.find('.uploader-progreso').find('.progress-bar');
			aumentarBarra($barraProgreso, 0);
			$thumbnail.find('img').remove();
			$uploader.find('#uploader-fileName').text('Cancelado');
			$uploader.find('#uploader-fileSize').text('');
			up.refresh();
			$botonCancelar.hide();
		});
	});
	uploader.bind('Error', function(up, err){
		var file = err.file, message;
		if (file) {
			message = err.message;
			if (err.details) {message += ' (' + err.details + ')';}
			if (err.code === 1001) {alert(err.message);}
			if (err.code === plupload.FILE_SIZE_ERROR) {alert(err.message + ' ' + file.name);}
			if (err.code === plupload.FILE_EXTENSION_ERROR) {alert(err.message + ' ' + file.name);}
			var $uploader = $(up.settings.container);
			$uploader.find('.uploader-error').text(err.message).show();
			$uploader.addClass('has-error');
		}
	 });
	uploader.bind('UploadProgress', function(up, file){
		var $uploader = $(up.settings.container);
		var $barraProgreso = $uploader.find('.uploader-progreso').find('.progress-bar');
		aumentarBarra($barraProgreso, file.percent);
	});
	uploader.bind('FileUploaded', function(up, file, info){
		var $uploader = $(up.settings.container);
		var $uploaderCampoOculto = $uploader.find('input.uploader-campo-oculto');
		var $barraProgreso = $uploader.find('.uploader-progreso').find('.progress-bar');
		aumentarBarra($barraProgreso, file.percent);
		var data;
		var error = {};
		var fileName;
		var fileTmpName;
		if (up.settings.sistema_archivos === 'local') {
			data = JSON.parse(info.response);
			fileName = data.name;
			fileTmpName = data.tmp_name;
			error = data.error;
		}
		if (up.settings.sistema_archivos === 'amazon') {
			data				= $.parseXML(info.response);
			error.menssage		= 'Ha ocurrido un error intente más tarde';
			var $data			= $(data);
			fileName = $data.find('Key').text();
			fileTmpName = $data.find('Key').text();
		}
		$uploaderCampoOculto.val(fileName);
		$uploaderCampoOculto.attr('value', fileName).trigger('change');
		var datosArchivos	= {};
			datosArchivos.tmp_name					= fileTmpName;
			datosArchivos.name						= fileName;
			datosArchivos.type						= file.type;
			datosArchivos.archivoRutaDefinitiva		= $uploaderCampoOculto.data('archivo-carpeta');
			datosArchivos.archivoNombreBase			= $uploaderCampoOculto.data('nombre-base');
			datosArchivos.archivoGuardarEn			= up.settings.archivo_guardar_en; //$uploaderCampoOculto.data('archivo-guardar-en');
			datosArchivos.archivoNombreOriginal		= file.name;
			datosArchivos.archivoTamano 			= file.size;
			datosArchivos.sistemaArchivoDestino		= up.settings.sistema_archivos;
			datosArchivos.campoNombre				= up.settings.campo_nombre;
			datosArchivos.anchoMinimo				= up.settings.ancho_minimo;
			datosArchivos.altoMinimo				= up.settings.alto_minimo;
			datosArchivos.carpetaDefinitiva			= up.settings.carpeta_definitiva; // $inputOculto.data('archivo-carpeta');
			datosArchivos.nombreBase				= up.settings.nombre_base; // $inputOculto.data('nombre-base');
			datosArchivos.objetoTipo				= up.settings.objeto_tipo;
		if  (data.success === 0 ) {
			if (!$uploaderCampoOculto.hasAttr('required')) {
				$uploaderCampoOculto.attr('required', 'required');
				$uploaderCampoOculto.attr('quitar-requied', true);
			}
			$uploaderCampoOculto.val('').trigger('change');
			up.trigger('Error', data.error);
			up.removeFile(file);
			up.stop();
			up.start();
			$botonesSubmit.prop( "disabled", false );
			return;
		}
		$.ajax({
			type: "POST",
			url: up.settings.base_path + '/uploader/subidaFinalizada',
			data: datosArchivos,
			dataType: 'json'
		});
		$botonesSubmit.prop( "disabled", false );
		$botonCancelar.hide();
	});
	uploader.bind('ChunkUploaded', function(up, file, info){
		var $uploader = $(up.settings.container);
		var data = JSON.parse(info.response);
		var $barraProgreso = $uploader.find('.uploader-progreso').find('.progress-bar');
		var $uploaderCampoOculto = $uploader.find('input.uploader-campo-oculto');
		aumentarBarra($barraProgreso, file.percent);
		$botonesSubmit.prop( "disabled", true);
		if  (info.status >= 300 || (data && !data.success)) {
			//alert(data.error);
			$uploaderCampoOculto.val('').trigger('change');
			if (!$uploaderCampoOculto.hasAttr('required')) {
				$uploaderCampoOculto.attr('required', 'required');
				$uploaderCampoOculto.attr('quitar-requied', true);
			}
			up.trigger('Error', data.error);
			up.removeFile(file);
			up.stop();
			up.start();
			return;
		}
	});
	$element.attr('data-uploader-inicializado', "true");
	globalUploaders.push(uploader);
	return uploader;
};

function aumentarBarra($barra, porcentaje) {
	$barra.attr('aria-valuenow', porcentaje)
				.css('width', porcentaje + '%')
				.html('<b>' + porcentaje + ' %</b>');
}

function eliminarUploader($uploaderContainer, $botonEliminar, $botonDescargar){
	var $inputOculto	= $uploaderContainer.find('input.uploader-campo-oculto');
	var $uploaderEspera	= $uploaderContainer.find('.uploader-espera');
	var $uploaderAlert	= $uploaderContainer.find('.uploader-alert');
	var settings		= $uploaderContainer.data('settings');
	$uploaderEspera.show();
	$.ajax({
		type: "POST",
		url: settings.base_path + "/uploader/eliminar",
		context: $uploaderContainer,
		data: {
			campoNombre:		settings.campo_nombre,
			carpeta:			settings.carpeta_definitiva,
			archivoOriginal:	$inputOculto.data('archivo-archivo-original'),
			carpetaOriginal:	settings.archivo_guardar_en,
			archivo:			$inputOculto.val(),
			objetoTipo:			settings.objeto_tipo,
			objetoCampoNombre:	settings.objeto_campo_nombre
		},
		success: function(data, status, jqXHR) {
			$inputOculto.val(null);
			$uploaderContainer.find('.uploader-archivo').remove();
			$uploaderAlert.hide();
			if (data.imagen !== '') {
				$uploaderContainer.find('.thumbnail').append(data.imagen);
				$inputOculto.val($inputOculto.data('archivo-archivo-original'));
			}
		},
		complete: function(jqXHR, status) {
			$uploaderEspera.hide();
		}
	});
}

function descargarUploader($uploaderContainer, nombreDescarga) {
	var $inputOculto = $uploaderContainer.find('input.uploader-campo-oculto');
	var urlDescarga = $inputOculto.data('url-descarga');
	if (typeof nombreDescarga === 'undefined' || nombreDescarga === "") {
		nombreDescarga = $inputOculto.data('nombreDescarga');
	}
	var nuevaUrl = urlDescarga.replace('valorNombreDescarga', nombreDescarga);
	window.location = nuevaUrl;
}

/**
 * Inicializa todos los uploaders no inicializados
 * @returns {undefined}
 */
function inicializarUploaders() {
	$('.uploadContainer').not('[data-uploader-inicializado="true"]').each(function(index, element){
		inicializarUploader(element);
	});
	if (!globalUploaderListenerQuitado) {
		$('body').on("quitado", 'fieldset[data-agregable="contenedor"]', function(event, $objeto){
			var $uploaderContainer = $objeto.find('.uploadContainer');
			if ($uploaderContainer.length === 0) {
				return;
			}
			eliminarUploader($uploaderContainer, false, false);
		});
		globalUploaderListenerQuitado =	true;
	}
}

function inicializarBotonEliminar($boton, $botonDescargar) {
	$boton.data('parent', $boton.parents('.uploadContainer'));
	$boton.data('botonDescargar', $botonDescargar);
	$boton.on( "click", function(e) {
		e.preventDefault();
		var $boton = $(this);
		var $uploaderContainer = $boton.data('parent');
		var $botonDescargar = $boton.data('botonDescargar');
		eliminarUploader($uploaderContainer, $boton, $botonDescargar);
	});
}

function inicializarBotonDescarga($boton, nombreOriginal) {
	$boton.data('parent', $boton.parents('.uploadContainer'));
	$boton.on( "click", function(e) {
		e.preventDefault();
		var $boton = $(this);
		var $uploaderContainer = $boton.data('parent');
		descargarUploader($uploaderContainer, nombreOriginal);
	});
}

$(document).ready(function() {
	inicializarUploaders();
});