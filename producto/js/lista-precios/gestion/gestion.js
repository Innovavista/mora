/* global MODO_SIN_ADVERTENCIAS, MODO_IGNORAR_ADVERTENCIAS, ko, parseFloat, moment, opcionesPantalla, json */

//<editor-fold defaultstate="collapsed" desc="Selectpicker">
ko.bindingHandlers.selectPicker = {
    after: ['options'], /* KO 3.0 feature to ensure binding execution order */
    init: function (element, valueAccessor, allBindingsAccessor) {
        $(element).addClass('selectpicker').selectpicker();
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        /* KO 3.3 will track any bindings we depend on automagically and call us on changes */
        allBindingsAccessor.get('options');
        allBindingsAccessor.get('value');
        allBindingsAccessor.get('selectedOptions');

        $(element).selectpicker('refresh');
    }
};

var formateadorMoneda = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'ARS'
});

var formatearMoneda = function (valor) {
    var salida = formateadorMoneda.format(valor);
    var partes = salida.split(',');
    if (partes.length === 1) {
        salida += ',00';
    } else if (partes.length > 1) {
        var decimales = partes[partes.length - 1];
        if (decimales.length === 1) {
            salida += '0';
        }
    }
    return salida;
};

ko.bindingHandlers.moneda = {
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var valor = ko.utils.unwrapObservable(valueAccessor());
        var tipo = typeof valor;
        if ((tipo !== 'number' && isNaN(valor))
            || valor === null
        ) {
            $(element).html('');
            return;
        }
        var final = formatearMoneda(valor);
        $(element).html(final);
    }
};

var formateadorNumero = new Intl.NumberFormat(undefined, {
    style: 'decimal'
});

var formatearNumero = function (valor) {
    var salida = formateadorNumero.format(valor);
    var partes = salida.split(',');
    if (partes.length === 1) {
        salida += ',00';
    } else if (partes.length > 1) {
        var decimales = partes[partes.length - 1];
        if (decimales.length === 1) {
            salida += '0';
        }
    }
    return salida;
};

ko.bindingHandlers.cantidad = {
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var valor = ko.utils.unwrapObservable(valueAccessor());
        var tipo = typeof valor;
        if ((tipo !== 'number' && isNaN(valor))
            || valor === null
        ) {
            $(element).html('');
            return;
        }
        var final = formatearNumero(valor);
        $(element).html(final);
    }
};
//</editor-fold>

//<editor-fold defaultstate="collapsed" desc="Tooltipster">
ko.bindingHandlers['tooltipster'] = {
    init: function (element, valueAccessor) {
        $(element).tooltipster({
            theme: 'tooltipster-shadow',
            animation: 'grow',
            delay: 200,
            side: 'top',
            contentCloning: true
        });
    }
};

//</editor-fold>

function koPantalla(js, opciones) {
    ko.mapping.fromJS(js, opciones, this);
    var self = this;

    /**
     * Actualiza los datos de la tabla, ver si conviene actualizar el
     * arreglo de precios
     *
     * @param {koProducto} producto
     * @param {float} precioNuevo
     * @param {string} fecha
     * @returns {undefined}
     */
    self.actualizarProductoTabla = function (producto, precioNuevo, fecha) {
        var conFechas = self.conFechas;
        var precioFormateado = parseFloat(precioNuevo).toFixed(2);
        if (conFechas) {
            producto.precioVigente().precio(precioFormateado);
            producto.fechaPrecioVigente(moment(fecha, "YYYY-MM-DD").format("DD/MM/YYYY"));
        } else {
            producto.precio(precioFormateado);
        }
    };

    /**
     * Actualiza la bandera que indica que se esta modificado/quitando un
     * producto
     *
     * @param {string} ajax
     * @param {int} idProducto
     * @param {bool} valor
     * @returns {undefined}
     */
    self.actualizarAjaxProducto = function (ajax, idProducto, valor) {
        var encontrado = ko.utils.arrayFirst(self.productosFiltrados(), function (producto) {
            return idProducto === producto.id;
        });
        if (encontrado) {
            if (ajax === 'ajaxCrearPrecio') {
                encontrado.ajaxCrearPrecio(valor);
            }
            if (ajax === 'ajaxQuitarPrecio') {
                encontrado.ajaxQuitarPrecio(valor);
            }
        }
    };

    //<editor-fold defaultstate="collapsed" desc="Filtrado de productos">

    self.filtradoCategoria = ko.observableArray([]);
    self.filtradoNombre = ko.observable("");
    self.filtradoFechaDesde = ko.observable("");
    self.filtradoFechaHasta = ko.observable("");

    self.filtrosActivos = ko.pureComputed(function () {
        let nombre = self.filtradoNombre();
        let categoria = self.filtradoCategoria();
        let fechaDesde = self.filtradoFechaDesde();
        let fechaHasta = self.filtradoFechaHasta();
        if (nombre !== "" || fechaDesde !== "" || fechaHasta !== "" || categoria.length > 0) {
            return true;
        }
        return false;
    });

    self.limpiarFiltros = function () {
        self.filtradoNombre("");
        self.filtradoCategoria([]);
        self.filtradoFechaDesde("");
        self.filtradoFechaHasta("");
    };

    /**
     * Comprueba que coincida el filtro de las categorias con la categoria
     * del producto, si el filtro es vacío devuelve siempre true
     *
     * @param {koProducto} producto
     * @returns {boolean}
     */
    self.comprobarCategoria = function (producto) {
        var categoria = ko.utils.arrayFirst(self.filtradoCategoria(), function (item) {
            return item.idCategoria === producto.idCategoria;
        });
        return self.filtradoCategoria().length === 0
            || (typeof categoria !== "undefined" && categoria.idCategoria === producto.idCategoria);
    };

    /**
     * Reemplaza las letras que llevan acentos por las mismas letras sin
     * acento
     *
     * @param {string} text
     * @returns {boolean}
     */
    self.omitirAcentos = function (text) {
        var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
        var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
        for (var i = 0; i < acentos.length; i++) {
            text = text.replace(new RegExp(acentos.charAt(i), 'g'), original.charAt(i));
        }
        return text;
    };

    /**
     * Comprueba que coincida el filtro del nombre con el nombre del producto,
     * si el texto es vacío devuelve siempre true
     *
     * @param {koProducto} producto
     * @returns {boolean}
     */
    self.comprobarNombre = function (producto) {
        var busquedaTextoLimpio = self.filtradoNombre().toLowerCase();
        busquedaTextoLimpio = self.omitirAcentos(busquedaTextoLimpio);

        var nombre = producto.nombre;
        nombre = nombre.toLowerCase();
        nombre = self.omitirAcentos(nombre);

        return self.filtradoNombre() === ""
            || (self.filtradoNombre() !== "" && nombre.indexOf(busquedaTextoLimpio) > -1);
    };

    /**
     * Comprueba que la fecha del precio del producto sea mayor a la fecha desde
     * del filtro, si la fecha esta vacía devuelve siempre true
     *
     * @param {koProducto} producto
     * @returns {boolean}
     */
    self.comprobarFechaDesde = function (producto) {
        var fechaPrecioProducto = moment(producto.precioVigente().fecha(), "YYYY-MM-DD");
        var busquedaFechaDesde = self.filtradoFechaDesde() !== "" ? moment(self.filtradoFechaDesde(), "YYYY-MM-DD") : "";
        return self.filtradoFechaDesde() === ""
            || (self.filtradoFechaDesde() !== "" && fechaPrecioProducto.isSameOrAfter(busquedaFechaDesde));
    };

    /**
     * Comprueba que la fecha del precio del producto sea menor a la fecha hasta
     * del filtro, si la fecha esta vacía devuelve siempre true
     *
     * @param {koProducto} producto
     * @returns {boolean}
     */
    self.comprobarFechaHasta = function (producto) {
        var fechaPrecioProducto = moment(producto.precioVigente().fecha(), "YYYY-MM-DD");
        var busquedaFechaHasta = self.filtradoFechaHasta() !== "" ? moment(self.filtradoFechaHasta(), "YYYY-MM-DD") : "";

        return self.filtradoFechaHasta() === ""
            || (self.filtradoFechaHasta() !== "" && fechaPrecioProducto.isSameOrBefore(busquedaFechaHasta));
    };

    self.productosFiltrados = ko.computed(function () {
        var salida = [];
        ko.utils.arrayForEach(self.productos(), function (producto) {
            if (
                self.comprobarCategoria(producto)
                && self.comprobarNombre(producto)
                && self.comprobarFechaDesde(producto)
                && self.comprobarFechaHasta(producto)
            ) {
                salida.push(producto);
            }
        });
        return salida;
    });

    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Modificar precio">

    /**
     * Se encarga levantar un modal para modificar el precio de  un producto
     * en caso de confirmar realiza una petición ajax
     *
     * @param {koProducto} producto
     * @param {jQuery.Event} evento
     * @returns {undefined}
     */
    self.modalCrearPrecio = function (producto, evento) {
        var today = moment().format("YYYY-MM-DD");
        var conFechas = self.conFechas;
        var titulo = `Agregar nuevo precio al producto '${producto.nombre}'`;
        var aceptar = 'Agregar';
        var enfocar = '#input-lista-precios-fecha';
        var anterior = typeof producto.precio !== 'undefined' ? producto.precio() : producto.precioVigente().precio();
        var htmlPrecio = formatearMoneda(anterior);
        var htmlFecha = `<div class="d-flex flex-column align-items-start form-group mt-3" style="width: 250px;">
								<label id="label-lista-precios-fecha" class="text-nowrap">Fecha precio</label>
								<input
									id="input-lista-precios-fecha"
									value="${today}"
									min="${today}"
									type="date"
									class="swal2-input input-lista-precios-fecha m-0"
								/>
							</div>`;
        if (!conFechas || producto.comprobarEsNuevo) {
            titulo = 'Modificar precio';
            aceptar = 'Modificar';
            enfocar = '#input-lista-precios-precio';
            htmlFecha = `<input id="input-lista-precios-fecha" value="${today}" type="hidden" />`;
        }
        if (evento !== undefined) {
            evento.stopPropagation();
        }
        Swal.fire({
            title: titulo,
            icon: 'warning',
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: aceptar,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#58db83',
            cancelButtonColor: '#bfbfbf',
            allowEnterKey: true,
            focusConfirm: false,
            html: `
				<div class="d-flex flex-column align-items-center justify-content-center">
						Precio anterior: ` + htmlPrecio + `<br/>
						` + htmlFecha + `
					<div class="d-flex flex-column align-items-start form-group mt-0" style="width: 250px;">
						<label id="label-lista-precios-precio">Precio</label>
						<input
							id="input-lista-precios-precio"
							value="${anterior}"
							type="number"
							step="0.01"
							min="0"
							class="swal2-input input-lista-precios-precio m-0"
						/>
					</div>
				</div>`,
            onOpen: () => {
                $(enfocar).focus().select();
            },
            preConfirm: () => {
                var fecha = document.getElementById("input-lista-precios-fecha").value;
                var precio = document.getElementById("input-lista-precios-precio").value;
                var valido = self.comprobarPrecioValido(fecha, precio, true);
                var esNuevo = producto.comprobarEsNuevo;
                if (valido && !esNuevo) {
                    self.crearPrecioProductoAjax(producto, fecha, precio);
                }
                var fechaMoment = moment(fecha, "YYYY-MM-DD").startOf('day');
                if (valido && esNuevo) {
                    let textoFecha = fechaMoment.format("DD/MM/YYYY");
                    let fechaMysql = fechaMoment.format("YYYY-MM-DD");
                    producto.precioVigente().precio(precio);
                    producto.fechaPrecioVigente(textoFecha);
                    producto.fechaMysql = fechaMysql;
                }
                return valido;

            }
        });
    };

    /**
     * Valida que el precio y la fecha del producto sea válido, de no serlo
     * y si mostrar es true muestra el mensaje de error
     *
     * @param {string} fecha
     * @param {string} precio
     * @param {bool} mostrar
     * @returns {Boolean}
     */
    self.comprobarPrecioValido = function (fecha, precio, mostrar) {
        var hoy = moment().startOf('day');
        var fechaMoment = moment(fecha, "YYYY-MM-DD").startOf('day');
        var fechaValida = fechaMoment.isValid();
        var precioFloat = parseFloat(precio);
        var errores = [];

        if (isNaN(precioFloat) || precioFloat <= 0) {
            errores.push('Debe ingresar un precio mayor a cero.');
        }
        if (!fechaValida) {
            errores.push('La fecha no es válida.');
        }
        if (fechaValida && fechaMoment.isBefore(hoy)) {
            errores.push('La fecha no puede ser pasada.');
        }
        if (mostrar) {
            errores.forEach(error => {
                Notificacion(error, "error");
            });
        }
        return errores.length === 0;
    };

    /**
     * Realiza la petición de ajax para crear el nuevo precio vigente
     *
     * @param {koFeriado} producto
     * @param {string} fecha
     * @param {string} precio
     * @param {string} modo constantes MODO_SIN_ADVERTENCIAS o MODO_IGNORAR_ADVERTENCIAS.
     * @returns {undefined}
     */
    self.crearPrecioProductoAjax = function (producto, fecha, precio, modo = MODO_SIN_ADVERTENCIAS) {
        var url = producto.acciones.crearPrecio;
        var data = {
            fecha: fecha,
            modo: modo,
            lista: self.lista.id,
            precio: precio,
            producto: producto.id
        };
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (data.success) {
                    Notificacion(data.success.mensaje, 'success');
                    var vigente = data.success.datos.vigente;
                    self.agregarPrecioLista(data.success.datos, vigente);
                    return;
                }
                if (typeof data.resultado !== "undefined"
                    && typeof data.resultado.mensajes !== "undefined"
                    && data.resultado.mensajes.length > 0
                    && modo
                ) {
                    var html = "<p>Los siguientes servicios incluyen el producto <strong>"
                        + producto.nombre + "</strong> y verán afectados sus precios:</p>"
                        + data.resultado.mensajes.join("<br/>")
                        + "<br/><br/>¿Está seguro que desea cambiar el precio?";
                    Alerta({
                        title: 'Confirmar cambio de precio',
                        html: html,
                        confirmButtonText: 'Si, cambiar precio',
                        confirmButtonColor: '#F44336',
                        onConfirmCallback: function () {
                            self.crearPrecioProductoAjax(producto, fecha, precio, MODO_IGNORAR_ADVERTENCIAS);
                        }
                    });
                    return;
                }
                if (data.error && data.error.length > 0) {
                    ko.utils.arrayForEach(data.error, function (error) {
                        Notificacion(error, 'error');
                    });
                    return;
                }
                return Notificacion('Ha ocurrido un error', 'error');
            },
            beforeSend: function (jqXHR, settings) {
                self.actualizarAjaxProducto('ajaxCrearPrecio', producto.id, true);
            },
            complete: function (jqXHR, settings) {
                self.actualizarAjaxProducto('ajaxCrearPrecio', producto.id, false);
            }
        });
        $.ajax(opciones);
    };

    /**
     * Agrega el precio a la lista de precios y actualiza los otros precios
     * si es vigente
     *
     * @param {object} datos
     * @param {bool} vigente
     * @returns {undefined}
     */
    self.agregarPrecioLista = function (datos, vigente) {
        const conFechas = self.conFechas;
        const productos = self.productosFiltrados();
        const idProducto = datos.idProducto;
        const producto = productos.find(p => parseInt(p.id) === parseInt(idProducto));
        if (producto === undefined) {
            return;
        }

        if (conFechas) {
            const fecha = datos.fecha;
            const precio = datos.precio;
            const margen = datos.margen;
            const margenMonto = datos.margenMonto;
            producto.actualizarPrecioVigente(precio, fecha, vigente, margen, margenMonto);
        }
    };

    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Edición masiva de precios">

    self.seleccionarTodos = ko.observable(false);
    self.comprobarHaySeleccionados = ko.observable(false);
    self.porcentajeEdicion = ko.observable("0.00");


    /**
     * Productos seleccionados para la edición masiva.
     */
    self.productosSeleccionados = ko.pureComputed(function () {
        var salida = [];
        var productos = self.productos();
        for (var i = 0; i < productos.length; i++) {
            var producto = productos[i];
            if (producto.seleccionado()) {
                salida.push(producto);
            }
        }
        return salida;
    });

    /**
     * Texto de selección de productos para editar los precios en forma masiva.
     */
    self.productosSeleccionadosTexto = ko.computed(function () {
        var total = self.productos().length;
        var seleccionados = self.productosSeleccionados().length;
        switch (seleccionados) {
            case 0:
                return "Sin productos seleccionados";

            case 1:
                return "1/" + total + " producto seleccionado";

            default:
                return seleccionados + "/" + total + " productos seleccionados";
        }
    });

    /**
     * Selecciona o deselecciona todos los productos, retorna verdadero
     * para que funcione correctamente el checkbox de seleccionarTodos
     *
     * @param {this} objetos
     * @param {jQuery.Event} evento
     * @returns {Boolean}
     */
    self.seleccionarProductos = function (objetos, evento) {
        evento.stopPropagation();
        ko.utils.arrayForEach(self.productosFiltrados(), function (producto) {
            producto.seleccionado(self.seleccionarTodos());
        });
        self.comprobarHaySeleccionados(self.seleccionarTodos());
        return true;
    };

    /**
     * Al seleccionar un producto setea en false el seleccionar todos,
     * retorna verdadero para que funcione correctamente el checkbox. También
     * verifico si hay algún producto seleccionado
     *
     * @param {koProducto} producto
     * @param {jQuery.Event} evento
     * @returns {Boolean}
     */
    self.seleccionarUnProducto = function (producto, evento) {
        evento.stopPropagation();
        self.seleccionarTodos(false);
        var encontrado = ko.utils.arrayFirst(self.productosFiltrados(), function (prod) {
            return prod.seleccionado();
        });
        self.comprobarHaySeleccionados(typeof encontrado === "object");

        var deseleccionado = ko.utils.arrayFirst(self.productosFiltrados(), function (prod) {
            return !prod.seleccionado();
        });
        self.seleccionarTodos(typeof deseleccionado === "undefined");
        return true;
    };

    /**
     * Se encarga levantar un modal para preguntar si desea editar los precios
     * en forma masiva
     *
     * @param {this} objetos
     * @param {jQuery.Event} evento
     * @returns {undefined}
     */
    self.modalEditarPrecios = function (objetos, evento) {
        if (!self.comprobarHaySeleccionados()) {
            Notificacion('No ha seleccionado ningún producto', 'error');
            return null;
        }
        var enfocar = '#input-lista-precios-fecha';
        var today = moment().format("YYYY-MM-DD");
        var conFechas = self.conFechas;
        var htmlFecha = `<div class="d-flex flex-column align-items-start form-group mt-0" style="width: 250px;">
							<label id="label-lista-precios-fecha" class="text-nowrap">Fecha precio</label>
							<input
								id="input-lista-precios-fecha"
								value="${today}"
								min="${today}"
								type="date"
								class="swal2-input input-lista-precios-fecha m-0"
								style="width: 225px;"
							/>
						</div>`;
        if (!conFechas) {
            enfocar = '#input-lista-porcentaje-masivo';
            htmlFecha = `<input id="input-lista-precios-fecha" value="${today}" type="hidden" />`;
        }

        evento.stopPropagation();
        Swal.fire({
            title: 'Modificar precio masivamente',
            icon: 'warning',
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: 'Aplicar porcentaje',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#58db83',
            cancelButtonColor: '#bfbfbf',
            allowEnterKey: true,
            focusConfirm: false,
            html:
                `<div class="d-flex flex-column justify-items-center align-items-center">
						` + htmlFecha + `
						<div class="d-flex flex-column align-items-start form-group mt-0" style="width: 250px;">
							<label id="label-lista-precios-masicos-precio">Porcentaje</label>
							<input
								id="input-lista-porcentaje-masivo"
								value="${self.porcentajeEdicion()}"
								type="number"
								step="0.01"
								min="-100.00"
								class="swal2-input input-lista-precios-precio m-0"
							/>
						</div>
						<div class="container" style="width: 250px;">
							<div class="row" style="text-align: left;">
								<div class="form-check col-7">
									<input id="input-lista-no-redondear" value="0" type="radio" name="multiplo" class="form-check-input" checked>
									<label class="form-check-label text-nowrap" for="input-lista-no-redondear">
									  No redondear
									</label>
								</div>
								<div class="form-check col-5">
									<input id="input-lista-multiplo-uno" value="1" type="radio" name="multiplo" class="form-check-input">
									<label class="form-check-label" for="input-lista-multiplo-1">
									  $ 1
									</label>
								</div>
							</div>
							<div class="row" style="text-align: left;">
								<div class="form-check col-7">
									<input id="input-lista-multiplo-cinco" value="5" type="radio" name="multiplo" class="form-check-input">
									<label class="form-check-label" for="input-lista-multiplo-5">
									  $ 5
									</label>
								</div>
								<div class="form-check col-5">
									<input id="input-lista-multiplo-diez" value="10" type="radio" name="multiplo" class="form-check-input">
									<label class="form-check-label" for="input-lista-multiplo-10">
									  $ 10
									</label>
								</div>
							</div>
						</div>
					</div>`,
            onOpen: () => {
                $(enfocar).focus().select();
            },
            preConfirm: () => {
                var errores = [];
                var fecha = document.getElementById("input-lista-precios-fecha").value;

                var fechaMoment = moment(fecha, 'YYYY-MM-DD');
                var fechaValida = fechaMoment.isValid();
                if (!fechaValida) {
                    errores.push('La fecha no es válida.');
                }

                var hoy = moment().startOf('day');
                var pasada = fechaMoment.isBefore(hoy);
                if (fechaValida && pasada) {
                    errores.push('La fecha no puede ser pasada.');
                }

                var porcentaje = document.getElementById("input-lista-porcentaje-masivo").value;
                if (!porcentaje || parseFloat(porcentaje) === 0) {
                    errores.push('El porcentaje no puede ser 0.');
                }

                var valido = errores.length === 0;
                if (valido) {
                    var multiplo = self.getValorRedondeoModalModificacionMasiva();
                    self.modificarPreciosAjax(fecha, porcentaje, MODO_SIN_ADVERTENCIAS, multiplo);
                } else {
                    errores.forEach(e => Notificacion(e, 'error'));
                }

                return valido;

            }
        });
    };

    /**
     * Devuelve el valor de multiplo del modal de edición masiva de precios.
     *
     * @returns {int}
     */
    self.getValorRedondeoModalModificacionMasiva = function () {
        var redondearUno = document.getElementById("input-lista-multiplo-uno").checked;
        if (redondearUno) {
            return 1;
        }

        var redondearDiez = document.getElementById("input-lista-multiplo-diez").checked;
        if (redondearDiez) {
            return 10;
        }

        var redondearCinco = document.getElementById("input-lista-multiplo-cinco").checked;
        if (redondearCinco) {
            return 5;
        }

        return 0;
    };

    /**
     * Busca y retorna los productos seleccionados. Si se le indica nuevos como
     * true busca los productos nuevos seleccionados sino los de la lista
     *
     * @param {bool} nuevos
     * @returns {Array|koPantalla.buscarProductosSeleccionados.salida}
     */
    self.buscarProductosSeleccionados = function (nuevos) {
        var salida = [];
        var productos = nuevos ? self.nuevos() : self.productosFiltrados();
        var seleccionados = productos.filter(producto => producto.seleccionado());
        return seleccionados;
    };

    /**
     * Recorre los productos y actualiza sus precios si el precio nuevo
     * es vigente. Recorro dos arrays porque el primero son los productos de
     * la tabla y el segundo son los productos que vienen del servidor con
     * sus nuevos precios y necesito datos de los dos arrays.
     *
     * @param {object} datos
     * @returns {undefined}
     */
    self.actualizarPreciosNuevos = function (datos) {
        ko.utils.arrayForEach(self.productosFiltrados(), function (productoFiltrado) {
            ko.utils.arrayForEach(datos.productos, function (productoModificado) {
                if (productoFiltrado.id == productoModificado.id) {
                    self.actualizarProductoTabla(productoFiltrado, productoModificado.precioModificado, datos.fecha);
                }
            });
        });
    };

    /**
     * Realiza la petición al servidor para modificar los precios de los
     * productos seleccionados
     *
     * @param {string} fecha
     * @param {float} porcentaje
     * @param {string} modo constantes MODO_SIN_ADVERTENCIAS o MODO_IGNORAR_ADVERTENCIAS.
     * @param {int} multiplo que debe cumplir el precio.
     * @returns {undefined}
     */
    self.modificarPreciosAjax = function (fecha, porcentaje, modo = MODO_SIN_ADVERTENCIAS, multiplo = 0) {
        var url = self.urls.modificarPrecios;

        var productos = self.buscarProductosSeleccionados(false);
        var data = {
            modo: modo,
            fecha: fecha,
            lista: self.lista.id,
            multiplo: multiplo,
            productos: ko.mapping.toJSON(productos),
            porcentaje: porcentaje
        };
        Notificacion('Actualizando precios...', 'info');
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (typeof data.resultado !== "undefined"
                    && typeof data.resultado.mensajes !== "undefined"
                    && data.resultado.mensajes.length > 0
                    && modo
                ) {
                    var html = "<p>Los siguientes servicios incluyen uno o más "
                        + "productos y verán afectados sus precios:</p>"
                        + data.resultado.mensajes.join("<br/>")
                        + "<br/><br/>¿Está seguro que desea cambiar los precios?";
                    Alerta({
                        title: 'Confirmar cambio de precio',
                        html: html,
                        confirmButtonText: 'Si, cambiar precio',
                        confirmButtonColor: '#F44336',
                        onConfirmCallback: function () {
                            self.modificarPreciosAjax(fecha, porcentaje, MODO_IGNORAR_ADVERTENCIAS, multiplo);
                        }
                    });
                    return;
                }
                if (data.success) {
                    Notificacion(data.success.mensaje, 'success');
                    window.location.reload();
                    return;
                }
                if (data.error && data.error.length > 0) {
                    ko.utils.arrayForEach(data.error, function (error) {
                        Notificacion(error, 'error');
                    });
                    return;
                }
                return Notificacion('Ha ocurrido un error', 'error');
            },
            beforeSend: function (jqXHR, settings) {
                self.ajaxModificarPrecios(true);
            },
            complete: function (jqXHR, settings) {
                self.ajaxModificarPrecios(false);
            }
        });
        $.ajax(opciones);
    };

    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Quitar producto">

    /**
     * Se encarga levantar un modal para preguntar si desea borrar un producto,
     * en caso de que confirme realiza la petición al servidor
     *
     * @param {koProducto} producto
     * @param {jQuery.Event} evento
     * @returns {undefined}
     */
    self.modalQuitarPreciosProducto = function (producto, evento) {
        evento.stopPropagation();
        Alerta({
            title: 'Borrar producto',
            html: `¿Está seguro de borrar todos los precios del producto: "${producto.nombre}"?`,
            confirmButtonColor: '#F44336',
            onConfirmCallback: function () {
                self.quitarPreciosProductoAxaj(producto);
            }
        });
    };

    /**
     * Realiza la petición al servidor para quitar los precios de un producto
     * en la lista actual
     *
     * @param {koProducto} producto
     * @returns {undefined}
     */
    self.quitarPreciosProductoAxaj = function (producto) {
        var url = producto.acciones.quitar;
        var data = {
            producto: producto.id,
            lista: self.lista.id
        };
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (data.success) {
                    Notificacion(data.success.mensaje, 'success');
                    self.quitarProductoLista(data.success.idProducto);
                    return;
                }
                if (data.error && data.error.length > 0) {
                    ko.utils.arrayForEach(data.error, function (error) {
                        Notificacion(error, 'error');
                    });
                    return;
                }
                return Notificacion('Ha ocurrido un error', 'error');
            },
            beforeSend: function (jqXHR, settings) {
                self.actualizarAjaxProducto('ajaxQuitarPrecio', producto.id, true);
            },
            complete: function (jqXHR, settings) {
                self.actualizarAjaxProducto('ajaxQuitarPrecio', producto.id, false);
            }
        });
        $.ajax(opciones);
    };

    /**
     * Quita el producto ya borrado de la tabla
     *
     * @param {int} idProducto
     * @returns {undefined}
     */
    self.quitarProductoLista = function (idProducto) {
        var productos = self.productos();
        var producto = productos.find(p => parseInt(p.id) === parseInt(idProducto));
        if (producto !== undefined) {
            self.productos.remove(producto);
        }
    };

    //</editor-fold>

    //<editor-fold defaultstate="collapsed" desc="Añadir productos">
    self.nuevos = ko.observableArray([]);
    self.seleccionarNuevosTodos = ko.observable(false);
    self.selectNuevosTodosDisabled = ko.observable(true);

    self.ajaxGuardarPrecios = ko.observable(false);
    self.ajaxBuscarProductos = ko.observable(false);

    self.mostrarAgregar = ko.observable(false);

    /**
     * Suscriber del checkbox de "Añadir productos" que abre y cierra el panel.
     *
     * Necesario para que no repita la búsqueda de productos al hacer click
     * en el checkbox de "Añadir todos" sucesivas veces y sólo busque los
     * productos una vez.
     */
    self.mostrarAgregar.subscribe(function (mostrar) {
        let hayNuevos = self.nuevos().length > 0;
        if (mostrar && !hayNuevos) {
            self.buscarProductosAjax();
        }
    });

    /**
     * Suscriber del select "Inicializar desde" de la sección "Añadir productos".
     *
     * Necesario para verificar si hay que deshabilitar el checkbox "Seleccionar
     * todos" de la sección "Añadir productos". Además si está abierto el panel
     * de "Añadir productos" y cambia la opción del select tiene que buscar
     * los productos de la opción seleccionada.
     */
    self.opcion.subscribe(function (opcion) {
        let mostrar = self.mostrarAgregar();
        let deshabilitar = opcion.id === 0;
        self.selectNuevosTodosDisabled(deshabilitar);
        if (mostrar) {
            self.buscarProductosAjax();
        }
    });

    self.comprobarNuevosVacios = ko.computed(function () {
        let cantidad = self.nuevos().length;
        let buscando = self.ajaxBuscarProductos();
        return cantidad === 0 && !buscando;
    });

    self.comprobarListaSeleccionada = ko.computed(function () {
        let opcion = self.opcion();
        if (opcion === 0) {
            return false;
        }
        let idOpcion = opcion.id;
        return idOpcion !== 0;
    });

    self.seleccionarProductosNuevos = function (objetos, evento) {
        evento.stopPropagation();
        ko.utils.arrayForEach(self.nuevos(), function (producto) {
            producto.seleccionado(self.seleccionarNuevosTodos());
        });
        return true;
    };

    self.nuevosSeleccionadosTexto = ko.computed(function () {
        var todos = self.nuevos();
        var total = todos.length;
        var productos = self.buscarProductosSeleccionados(true);
        var seleccionados = productos.length;
        switch (seleccionados) {
            case 0:
                return "Sin productos seleccionados";

            case 1:
                return "1/" + total + " producto seleccionado";

            default:
                return seleccionados + "/" + total + " productos seleccionados";
        }
    });

    /**
     * Busca los productos dependiendo de la opción seleccionada del select
     * para "Inicializar desde" de la sección agregar productos. Puede buscar
     * por lista o todos los productos
     *
     * @param {koProducto} producto
     * @returns {undefined}
     */
    self.buscarProductosAjax = function () {
        self.nuevos([]);
        var url = self.urls.buscarProductos;
        var data = {
            lista: self.opcion().id
        };
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (data.success) {
                    var nuevos = ko.mapping.fromJS(data.nuevos, opcionesPantalla.productos);
                    self.nuevos(nuevos());
                    return;
                }
                if (data.errores && data.errores.length > 0) {
                    data.errores.forEach(error => {
                        Notificacion(error, 'error');
                    });
                    return;
                }
                return Notificacion('Ha ocurrido un error al buscar los productos', 'error');
            },
            beforeSend: function (jqXHR, settings) {
                self.ajaxBuscarProductos(true);
            },
            complete: function (jqXHR, settings) {
                self.ajaxBuscarProductos(false);
            }
        });
        $.ajax(opciones);
    };

    /**
     * Guarda los precios de los productos que no se encuentran en la lista
     * actual.
     *
     * @returns {void}
     */
    self.guardarPrecios = function () {
        let productos = self.buscarProductosSeleccionados(true);
        if (productos.length === 0) {
            Notificacion("Debe seleccionar productos para guardar sus precios", "error");
            return;
        }
        let validos = self.validarPreciosProductos(productos);
        if (!validos) {
            return;
        }
        self.guardarPreciosAjax(productos);
    };

    /**
     * Valida que los productos tengan fecha y precios válidos
     *
     * @param {array} productos
     * @returns {Boolean}
     */
    self.validarPreciosProductos = function (productos) {
        var valido = true;
        var listaSeleccionada = self.comprobarListaSeleccionada();
        if (listaSeleccionada) {
            return valido;
        }
        productos.forEach(producto => {
            var fecha = producto.precioVigente().fecha();
            var precio = producto.precioVigente().precio();
            var fechaString = moment(fecha).format('YYYY-MM-DD');
            var productoValido = self.comprobarPrecioValido(fechaString, precio, true);
            if (!productoValido) {
                valido = false;
            }
            //Formateo la fecha para que no tenga hora ye evitar errores
            producto.precioVigente().fecha(fechaString);
        });
        return valido;
    };

    self.guardarPreciosAjax = function (productos) {
        var url = self.urls.guardarPrecios;
        var data = {
            nuevos: ko.mapping.toJSON(productos),
            lista: self.opcion().id
        };
        var opciones = self.getAjaxOpciones({
            url: url,
            data: data,
            success: function (data, textStatus, jqXHR) {
                if (data.success) {
                    Notificacion("Los precios de los productos fueron agregados con éxito", "success");
                    window.location.reload();
                    return;
                }
                if (data.errores && data.errores.length > 0) {
                    data.errores.forEach(error => {
                        Notificacion(error, 'error');
                    });
                    return;
                }
                return Notificacion('Ha ocurrido un error al guardar los precios', 'error');
            },
            beforeSend: function (jqXHR, settings) {
                self.ajaxGuardarPrecios(true);
            },
            complete: function (jqXHR, settings) {
                self.ajaxGuardarPrecios(false);
            }
        });
        $.ajax(opciones);
    };

    //</editor-fold>

    /**
     * Abre el modal con los precios futuros del producto.
     *
     * @param {koProducto} producto
     * @returns {void}
     */
    self.modalPreciosFuturos = function (producto) {
        var precios = producto.getPreciosFuturos();
        var html = "No hay precios futuros cargados.";
        if (precios.length > 0) {
            html = '<div class="table-responsive" style="overflow-y: auto !important; height: 300px;">';
            html += '<table class="table"><thead><tr>';
            html += '<th>Fecha</th>';
            html += '<th class="text-right">Precio</th>';
            html += '</tr></thead>';
            html += '<tbody>';
            precios.forEach(precio => {
                html += '<tr>';
                html += '<td>';
                html += `${precio.fechaTexto()}`;
                html += '</td>';
                html += '<td class="text-right">';
                html += `${precio.precioFormateado()}`;
                html += '</td>';
                html += `</tr>`;
            });
            html += '</tbody>';
            html += '</table></div>';
        }
        Swal.fire({
            title: `Precios futuros del producto '${producto.nombre}'`,
            html: html,
            icon: 'info',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#58db83'
        });
    };

    //<editor-fold defaultstate="collapsed" desc="Ajax">

    self.ajaxModificarPrecios = ko.observable(false);
    self.ajaxOpciones = {
        method: 'POST',
        error: function (jqXHR, textStatus, errorThrown) {
            Notificacion('Ha ocurrido el siguiente error: ' + textStatus, 'error');
        }
    };
    self.getAjaxOpciones = function (opciones) {
        if (typeof opciones === 'undefined') {
            opciones = {};
        }
        return jQuery.extend(true, opciones, self.ajaxOpciones);
    };
    //</editor-fold>
}

$(document).ready(function () {
    var $seccion = $('#lista-precios-gestionar');
    ko.options.deferUpdates = true;
    koGestionarLista = new koPantalla(json, opcionesPantalla);
    ko.applyBindings(koGestionarLista, $seccion.get(0));
    ko.tasks.runEarly();

    $(window).load(function () {
        $(".preloader-container").fadeOut('slow', function () {
            $(this).remove();
        });
    });
});

