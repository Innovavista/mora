/* global ko */
/*

	Se complementa con view/componentes-ko/tabla/tabla.phtml
*/
ko.components.register('tabla', {
    viewModel: function (params) {
        const self = this;

        self.clase             = params.clase;
        self.claseFila         = params.claseFila ? params.claseFila : '';
        self.claseCabecera     = params.claseCabecera;
        self.animada           = params.animada ? params.animada : false;
        self.campos            = params.campos;
        self.acciones          = params.acciones ? params.acciones : [];
        self.data              = params.data;
        self.filtrado          = params.filtrado;
        self.colspan           = self.campos.length + self.acciones.length;
        self.seleccionMultiple = params.seleccionMultiple ? params.seleccionMultiple : false;

        if (Array.isArray(self.data)) {
            //Es un array, lo convertimos en observable
            self.data = ko.observableArray(self.data);
        }

        self.porPagina = typeof params.paginar !== "undefined" ? params.paginar : self.data().length;
        self.pagina    = ko.observable(1);

        self.comprobarFilasVacias = ko.pureComputed(function () {
            return self.data().length === 0;
        });

        if (self.animada) {
            self.claseFila += ' animated fadeInUp';
        }

        //<editor-fold desc="Inicialización de campos y acciones">
        ko.utils.arrayForEach(self.campos, function (campo) {
            if (!campo.hasOwnProperty('textoInicial')) {
                campo.textoInicial = null;
            }
            if (!campo.hasOwnProperty('focusClave')) {
                campo.focusClave = null;
            }
            if (!campo.hasOwnProperty('animada')) {
                campo.animada = false;
            }
            if (!campo.hasOwnProperty('evento')) {
                campo.evento = function () {
                    return true;
                };
            }
        });
        ko.utils.arrayForEach(self.acciones, function (accion) {
            if (!accion.hasOwnProperty('texto')) {
                accion.texto = "";
            }
        });
        //</editor-fold>

        //<editor-fold desc="Filtrado">
        self.paginacionTotalPaginas = ko.observable(0);
        if (self.filtrado) {
            self.filtro      = typeof params.filtro === "undefined" ? ko.observable("") : params.filtro;
            self.filtroClase = typeof params.filtro === "undefined" ? "" : params.filtroClase;

            if (ko.isObservable(self.filtro)) {
                self.filtro.extend({rateLimit: 500, method: "notifyWhenChangesStop"});
            }

            self.filas = ko.pureComputed(function () {
                const filas = self.filasFiltradas();
                const total = filas.length;

                if (total <= self.porPagina) {
                    //No hay que paginar, devolvemos directamente todas las filas
                    return filas;
                }
                //Debemos paginar
                const porPagina = self.porPagina;
                const inicio    = self.paginacionInicio();

                return filas.slice(inicio, inicio + porPagina);
            });

            self.filasFiltradas = ko.pureComputed(function () {
                let i;
                const filtro = self.filtro().toLowerCase();
                const filas  = self.data();
                const salida = [];
                if (filtro === "") {
                    return filas;
                }

                //La búsqueda la hacemos por palabra
                const partes   = filtro.split(' ');
                const palabras = [];
                for (i = 0; i < partes.length; i++) {
                    const palabra = partes[i].normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                    palabras.push(palabra);
                }

                for (i = 0; i < filas.length; i++) {
                    const fila = filas[i];

                    //Juntamos en un array todos los valores para luego buscar
                    //por palabras que pueden estar todas en diferentes columnas
                    const valores = [];
                    for (let j = 0; j < self.campos.length; j++) {
                        const campo = self.campos[j];
                        const clave = campo.clave;
                        let valor   = typeof fila[clave] === "function" ? fila[clave]() : fila[clave];
                        const tipo  = typeof valor;

                        if (tipo === "string") {
                            valor = valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                        } else if (typeof valor === "number") {
                            valor = valor.toString();
                        } else {
                            valor = "";
                        }

                        valores.push(valor);
                    }

                    const encontrado = self.filtrarPorPalabras(valores, palabras);
                    if (encontrado) {
                        salida.push(fila);
                    }

                }

                return salida;
            });

            /**
             * Devuelve true si el array de valores dado incluye todas las
             * palabras indicadas en el parámetro.
             *
             * @param {array} valores
             * @param {array} palabras
             * @returns {boolean}
             */
            self.filtrarPorPalabras = function (valores, palabras) {
                for (let i = 0; i < palabras.length; i++) {
                    const palabra = palabras[i].trim();
                    if (palabra === '') {
                        //Palabras vacías no se busca
                        continue;
                    }

                    let encontrado = false;
                    for (let j = 0; j < valores.length; j++) {
                        const valor = valores[j];
                        if (valor.indexOf(palabra) !== -1) {
                            //Palabra encontrada, no hace falta buscar más
                            //en los otros valores
                            encontrado = true;
                            break;
                        }
                    }

                    if (!encontrado) {
                        //No se encontró la palabra en ninguna de los valores,
                        //no debemos mostrar el registro
                        return false;
                    }
                }

                return true;
            };

            self.comprobarFiltradoVacio = ko.pureComputed(function () {
                const filas = self.filas();
                return filas.length === 0;
            });

            //<editor-fold desc="Paginación">
            self.paginacionTotalPaginas = ko.pureComputed(function () {
                const total     = self.filasFiltradas().length;
                const porPagina = self.porPagina;

                return Math.ceil(total / porPagina);
            });

            self.paginacionInicio = ko.pureComputed(function () {
                const pagina    = self.pagina();
                const porPagina = self.porPagina;

                return (pagina - 1) * porPagina;
            });

            self.textoPaginas = ko.pureComputed(function () {
                const total  = self.paginacionTotalPaginas();
                const pagina = self.pagina();

                if (total <= 1) {
                    return "";
                }

                return "Página " + pagina + " de " + total;
            });

            self.paginacionPuedeVolver = ko.pureComputed(function () {
                const pagina = self.pagina();
                return pagina > 1;
            });

            self.paginacionPuedeAvanzar = ko.pureComputed(function () {
                const pagina = self.pagina();
                const total  = self.paginacionTotalPaginas();
                return pagina < total;
            });

            self.paginacionVolver = function () {
                const pagina    = self.pagina();
                const permitido = self.paginacionPuedeVolver();

                if (permitido) {
                    self.pagina(pagina - 1);
                }
            };

            self.paginacionAvanzar = function () {
                const pagina    = self.pagina();
                const permitido = self.paginacionPuedeAvanzar();

                if (permitido) {
                    self.pagina(pagina + 1);
                }
            };
            //</editor-fold>

        } else {
            self.filas = self.data;
        }
        //</editor-fold>

        //<editor-fold desc="Selección múltiple">
        self.seleccionMultipleHabilitada = ko.isObservableArray(self.seleccionMultiple);
        self.seleccionMultipleTodos      = ko.pureComputed({
            read: function () {
                const filas        = self.filas();
                const seleccionado = self.seleccionMultiple();
                return filas.length === seleccionado.length;
            },
            write: function (value) {
                const filas = self.filas();
                if (value) {
                    //No pasamos "filas" directamente porque sino manipula el array al deseleccionar
                    const seleccionados = [];
                    for (let i = 0; i < filas.length; i++) {
                        seleccionados.push(filas[i]);
                    }
                    self.seleccionMultiple(seleccionados);
                } else {
                    self.seleccionMultiple([]);
                }
            }
        });
        if (self.seleccionMultipleHabilitada) {
            self.clase += ' table-hover';
            self.claseFila += ' cursor-pointer';
        }
        self.clickFila = function (fila, event) {
            if (!self.seleccionMultipleHabilitada
                || event.target.tagName === 'INPUT'
            ) {
                return true;
            }
            const $fila     = $(event.target);
            const $checkbox = $fila.closest('tr').find('input[type="checkbox"]');
            $checkbox.click();
        };
        //</editor-fold>


    },
    template: {element: 'componente-tabla'}
});
