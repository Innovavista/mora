//<editor-fold defaultstate="collapsed" desc="ViewModel Knockout">
function koLinea(id, producto, cantidad, precio) {
	var self			= this;
	self.id				= id;
	self.producto		= ko.observable(producto);
	self.cantidad		= ko.observable(cantidad);
	self.precio			= ko.observable(precio);
	self.precioTexto	= ko.computed(function() {
		var precio = self.precio();
		if (precio != null || parseFloat(precio) === 0) {
			return '';
		} else {
			return '$ ' + precio.toString();
		}
	});
}

function koProducto(id, nombre, link, codigo, idCategoria) {
	var self		 = this;
	self.id			 = id;
	self.nombre		 = nombre;
	self.link		 = link;
	self.codigo		 = codigo;
	self.idCategoria = idCategoria;
}
function koPedido() {
	var self = this;
	self.lineas = ko.observableArray();

	self.addLinea = function(id, producto, cantidad, precio) {
		var agregar = true;
		var lineas = self.lineas();
		for (var contador = 0, max = lineas.length; contador < max; contador++) {
			if (lineas[contador].producto().id === producto.id) {
				agregar = false;
				lineas[contador].cantidad(cantidad);
				lineas[contador].precio(precio);
				return;
			}
		}
		if (agregar) {
			self.lineas.push(new koLinea(id, producto, cantidad, precio));
		}
    };

	self.removeLinea = function(id) {
		var lineas = self.lineas();
		id = parseInt(id);
		for (var contador = 0, max = lineas.length; contador < max; contador++) {
			if (lineas[contador].id === id) {
				self.lineas.remove(lineas[contador]);
				return;
			}
		}
    };

	/**
	 * Devuelve el producto asociado a la línea de id dado
	 *
	 * @param int id el identificador de la línea
	 * @returns null|object
	 */
	self.getProductoDeLinea = function(id) {
		var lineas = self.lineas();
		id = parseInt(id);
		for (var contador = 0, max = lineas.length; contador < max; contador++) {
			if (lineas[contador].id === id) {
				return lineas[contador].producto();
			}
		}
	};
}

var koPedido = new koPedido();
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Operaciones Ajax">
var ajaxProductoAgregar = function (lineas) {
	$.each(lineas, function(i, linea) {
		koPedido.addLinea(
			linea.id,
			new koProducto(
				linea.producto.id,
				linea.producto.nombre,
				linea.producto.link,
				linea.producto.codigo
			),
			linea.cantidad,
			linea.precio
		);
	});
};

var ajaxProductoQuitar = function (data) {
	koPedido.removeLinea(
		data.id
	);
};

var ajaxProductoFavorito = function (data) {
	var $boton = $('[data-id="' + data.id + '"] .pedido-favorito');
	var $icono = $boton.find('i:first');
	var href   = $boton.attr('href');
	if (data.favorito) {
		$icono.data('original', 'pedido-favorito-icono fa fa-star');
		$boton.attr('title', 'Quitar pedido de Favoritos');
		$boton.attr('href', href.replace('favorito', 'favorito-quitar'));
	} else {
		$icono.data('original', 'pedido-favorito-icono fa fa-star-o');
		$boton.attr('title', 'Marcar pedido como Favorito');
		$boton.attr('href', href.replace('favorito-quitar', 'favorito'));
	}
};
//</editor-fold>