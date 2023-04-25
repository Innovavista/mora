// Js usado por ViewHelper MapaGoogle
/* global google, mapaGoogleOptions */

/**
 * Función llamada por callback en js de google maps
 * 
 * @returns {undefined}
 */
function initMap() {

	var EVENTO_MAPA_CREADO = "mapagoogle.mapa.creado";
	var EVENTO_MAPA_MARCADOR_CREADO = "mapagoogle.marcador.creado";

	var contenedorGoogleMaps = getContenedorGoogleMaps();
	var $contenedorGoogleMaps = $(contenedorGoogleMaps);


	function getContenedorGoogleMaps() {
		return document.getElementById('contenedor-google-maps');
	}

	function getBoundFromMarkers(markers) {
		var bounds = new google.maps.LatLngBounds();
		markers.forEach(function (marker) {
			bounds.extend(marker.position);
		});
		return bounds;
	}



	var configObservable = ko.observable();
	configObservable.subscribe(function (options) {
		var customConfig = options.customConfig;
		var mapOptions = options.map;
		var markersOptions = options.markers;
		var mapa = new google.maps.Map(contenedorGoogleMaps, mapOptions);



		if (markersOptions) {
			var markers = markersOptions.map(function (markerOptions) {
				var markerConfig = $.extend({map: mapa}, markerOptions);
				if (markerOptions.icon && markerOptions.icon.path && markerOptions.icon.path.includes('google.maps.SymbolPath')) {
					markerOptions.icon.path = eval("(" + markerOptions.icon.path + ")");
				}
				var marker = new google.maps.Marker(markerConfig);
				$contenedorGoogleMaps.trigger(EVENTO_MAPA_MARCADOR_CREADO, [marker, markerOptions]);
				return marker;
			});
		}

		if (markers && !mapOptions.center) {

			var bounds = getBoundFromMarkers(markers);
			mapa.fitBounds(bounds);

		}

		if (markers && customConfig.clusterMarkers) {
			var markerCluster = new MarkerClusterer(mapa, markers, {
				imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
			}
			);
		}

		$contenedorGoogleMaps.trigger(EVENTO_MAPA_CREADO, [mapa, mapOptions, markerCluster]);

	});
	configObservable(mapaGoogleOptions);
}