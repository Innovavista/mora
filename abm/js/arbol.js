/**
 * Esta función se ejecuta justo después de la creación del arbolModelo y antes
 * de ejecutar ko.applyBindings.
 * Permite personalizar por sitio el modelo.
 *
 * @param arbolModelo modelo
 * @returns void
 */
var arbolModeloCreado = function (modelo) {};

/**
 * Esta función se ejecuta justo después de la actualización de arbolModelo
 * Permite personalizar por sitio el modelo.
 *
 * @param arbolModelo modelo
 * @returns void
 */
var arbolModeloActualizado = function (modelo) {};

/**
 * Esta función se ejecuta justo después de la creación de arbolTipoHijo
 * Permite personalizar por sitio el modelo.
 *
 * @param arbolTipoHijo modelo
 * @returns void
 */
var arbolTipoHijoCreado = function (modelo) {};

/**
 * Esta función se ejecuta justo después de la actualización de arbolTipoHijo.
 * Permite personalizar por sitio el modelo cuando se actualiza.
 *
 * @param arbolTipoHijo modelo
 * @returns void
 */
var arbolTipoHijoActualizado = function (modelo) {};

/**
 * Esta función se ejecuta al momento de recibir el formulario luego de la llamada
 * ajax, el fomulario puede estar en modo editar o nuevo.
 *
 * @param jQuery $formulario
 * @param string objeto
 * @returns void
 */
var formularioRecibido = function ($formulario, objeto) {}

/**
 * Procesa los errores Ajax y crea mensaje de error
 * @param {type} jqXHR
 * @param {type} textStatus
 * @param {type} errorThrown
 * @param {type} $contenedorAlertas
 * @returns {undefined}
 */
var procesarErrorAjax = function (jqXHR, textStatus, errorThrown, $contenedorAlertas) {
	var mensaje;
	if (jqXHR.responseText !== '') {
		mensaje = jqXHR.responseText.replace(/['"]+/g, '').replace(/\.+$/g, '');
	} else {
		mensaje = 'Ha ocurrido el siguiente error: "' + textStatus + ' - ' + errorThrown + '". Vuelva a intentar';
	}
	alerta(mensaje, 'danger', $contenedorAlertas);
};

/**
 * Representa el modelo general del árbol y el modelo de cada elemento.
 * En un contexto de un proyecto con planos que tienen hojas, sería además del
 * proyecto, cada uno de los planos y hojas.
 * Cada elemento puede tener "hijos" que representan una relación con otra
 * entidad. A su vez cada "hijo" tiene "elementos" que son objetos arbolModelo.
 * En el contexto anterior, proyecto tiene en sus "hijos" a "plano" y el
 * "hijo plano" tiene en sus "elementos" a todos los planos.
 *
 * El modelo es el encargado de la edición y borrado de un elemento (él mismo).
 *
 * @param json json
 * @param object opciones
 * @returns void
 */
var arbolModelo = function (json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.ajax = ko.observable(false);
	self.editando = ko.observable(false);
	self.editandoObjeto = ko.observable(null);
	self.editandoTitulo = ko.observable('Edición');

	self.editandoComenzar = function (objeto, titulo) {
		objeto.editando(true);
		self.editando(true);
		self.editandoObjeto(objeto);
		self.editandoTitulo(titulo);
	};

	self.editandoCancelar = function () {
		var objeto = self.editandoObjeto();
		self.editando(false);
		self.editandoObjeto(null);
		objeto.editando(false);
		self.editandoTitulo('Edición');
	};

	self.todosLosHijos = function () {
		if (typeof self.hijos === "undefined") {
			return [];
		}
		return self.hijos();
	};

	self.hijosTotal = ko.computed(function () {
		return self.todosLosHijos().length;
	});

	self.elementosTotal = ko.computed(function () {
		return self.todosLosHijos().length;
	});

	self.textoTotalHijos = ko.computed(function () {
		var textos = [];
		if (typeof self.hijos === "undefined") {
			return '';
		}
		ko.utils.arrayForEach(self.hijos(), function (hijo) {
			var texto = '';
			var total = hijo.elementosTotal();
			if (total === 0) {
				texto = 'sin ' + hijo.plural();
			} else if (total === 1) {
				texto = '1 ' + hijo.singular();
			} else {
				texto = total + ' ' + hijo.plural();
			}
			textos.push(texto);
		});
		return textos.join('; ').toLowerCase();
	});

	self.getFormularioId = function () {
		return 'arbol-formulario';
	};

	self.getFormulario = function () {
		var form = $('#' + self.getFormularioId());
		return form;
	};

	self.editar = function (boton) {
		var url = boton.url();
		var $formularioContenedor = self.getFormulario();
		var ajaxDatos = arbolAjaxDatos(self);
		ajaxDatos.layout = 'iframe';
		var titulo = 'Editar';
		if (boton.titulo() !== '') {
			titulo = boton.titulo();
		}
		var opcionesEditar = {
			method: "GET",
			url: url,
			data: ajaxDatos,
			beforeSend: function (jqXHR, settings) {
				$formularioContenedor.empty();
				self.ajax(true);
				modelo.ajax(true);
			},
			success: function (data, textStatus, jqXHR) {
				if (jqXHR.getResponseHeader('X-Innova-Login') === '1') {
					alerta('Se ha perdido la sesión. Le recomendamos abrir una nueva pestaña, iniciar sesión ahí y volver a intentar.', 'danger', $formularioContenedor);
					return;
				}
				modelo.editandoComenzar(self, titulo + ' ' + self.singular().toLowerCase() + ' "' + self.__toString() + '"');
				$formularioContenedor.html(data);
				arbolFormulario($formularioContenedor, url, self);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				procesarErrorAjax(jqXHR, textStatus, errorThrown, $formularioContenedor);
			},
			complete: function (jqXHR, textStatus) {
				modelo.ajax(false);
				self.ajax(false);
			}
		};
		$.ajax(opcionesEditar);
	};

	self.borrar = function () {
		var mensajeBorrar = '¿Está seguro que desea borrar ';
		if (self.masculino()) {
			mensajeBorrar += 'el ';
		} else {
			mensajeBorrar += 'la ';
		}
		mensajeBorrar += self.singular().toLowerCase() + ' "' + self.nombre() + '"';
		var url = self.urlBorrar();
		var $mensajes = $('#mensajes');
		var opcionesBorrar = {
			method: "POST",
			url: url,
			data: arbolAjaxDatos(self),
			beforeSend: function (jqXHR, settings) {
				modelo.ajax(true);
				self.ajax(true);
			},
			success: function (data, textStatus, jqXHR) {
				if (jqXHR.getResponseHeader('X-Innova-Login') === '1') {
					alerta('Se ha perdido la sesión. Le recomendamos abrir una nueva pestaña, iniciar sesión ahí y volver a intentar.', 'danger', $formulario);
					return;
				}
				ko.mapping.fromJS(data, arbolOpciones, modelo);
				arbolModeloActualizado(modelo);
				alerta(self.nombre() + ' ha sido eliminado éxitosamente', 'success', $mensajes);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				procesarErrorAjax(jqXHR, textStatus, errorThrown, $mensajes);
			},
			complete: function (jqXHR, textStatus) {
				modelo.ajax(false);
				self.ajax(false);
			}
		};
		bootbox.confirm({
			title: "Alerta:",
			message: mensajeBorrar,
			className: 'modal-danger',
			callback: function (rta) {
				if (rta === true) {
					$.ajax(opcionesBorrar);
				}
			}
		});

	};

	self.ejecutarAccion = function (boton) {
		//La funcion ejecutar accion recibe como parametro el botón que fue clickeado
		var objeto = self;
		var accion = boton.click();
		objeto[accion](boton);
	};

	self.cancelar = function () {
		arbolFormularioCancelar(self);
	};

	self.plantillaBoton = function (boton) {
		return boton.plantilla();
	};

	self.plantillaUtilizar = function (hijo) {
		return hijo.template();
	};

	//Funciones que sirven para añadir funcionalidad luego de la llamada Ajax
	//que envía datos de un formulario
	self.formularioBeforeSend = function () {};
	self.formularioSuccess = function () {};
	self.formularioError = function () {};
	self.formularioComplete = function () {};


};

/**
 * Representa un tipo de hijo. Ver más detalles en comentarios de arbolModelo.
 *
 * El hijo es el encargado de crear un nuevo elemento.
 *
 * @param json json
 * @param object opciones
 * @returns void
 */
var arbolTipoHijo = function (json, opciones) {
	ko.mapping.fromJS(json, opciones, this);
	var self = this;

	self.expandido = ko.observable(false);
	self.editando = ko.observable(false);
	self.ajax = ko.observable(false);

	self.elementos = ko.computed(function () {
		var clave = self.elementosClave();
		var salida = self[clave]();
		return salida;
	});

	self.todosLosHijos = function () {
		if (!self.agrupador()) {
			return self.elementos();
		}
		var salida = new Array();
		for (var i = 0; i < self.elementos().length; i++) {
			var elemento = self.elementos()[i];
			for (var j = 0; j < elemento.hijos().length; j++) {
				var hijo = elemento.hijos()[j];
				salida.push(hijo);
			}
		}
		return salida;
	};

	self.elementosTotal = ko.computed(function () {
		return self.todosLosHijos().length;
	});

	self.hijosTotal = ko.computed(function () {
		return self.todosLosHijos().length;
	});

	self.textoTotalHijos = ko.computed(function () {
		var texto = '';
		var total = self.elementosTotal();
		if (total === 0) {
			texto = 'sin ' + self.plural();
		} else if (total === 1) {
			texto = '1 ' + self.singular();
		} else {
			texto = total + ' ' + self.plural();
		}
		return texto;
	});

	self.textoSinElementos = ko.computed(function () {
		var total = self.elementosTotal();
		if (total === 0) {
			if (self.masculino()) {
				return 'No has cargado ningún ' + self.singular();
			} else {
				return 'No has cargado ninguna ' + self.singular();
			}
		}
	});

	self.getFormularioId = function () {
		return 'arbol-formulario';
	};

	self.getFormulario = function () {
		var form = $('#' + self.getFormularioId());
		return form;
	};

	self.nuevo = function (boton) {
		var url					  = boton.url();
		var $formularioContenedor = self.getFormulario();
		var titulo				  = '';
		var opcionesNuevo = {
			method: "GET",
			url: url,
			data: arbolAjaxDatos(self),
			beforeSend: function (jqXHR, settings) {
				$formularioContenedor.empty();
				modelo.ajax(true);
				self.ajax(true);

			},
			success: function (data, textStatus, jqXHR) {
				if (jqXHR.getResponseHeader('X-Innova-Login') === '1') {
					alerta('Se ha perdido la sesión. Le recomendamos abrir una nueva pestaña, iniciar sesión ahí y volver a intentar.', 'danger', $formularioContenedor);
					return;
				}
				titulo = boton.titulo();
				if (self.masculino()) {
					titulo = 'Nuevo';
				}
				modelo.editandoComenzar(self, titulo + ' ' + self.singular().toLowerCase());
				$formularioContenedor.html(data);
				arbolFormulario($formularioContenedor, url, self);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				procesarErrorAjax(jqXHR, textStatus, errorThrown, $formularioContenedor);
			},
			complete: function (jqXHR, textStatus) {
				modelo.ajax(false);
				self.ajax(false);
			}
		};
		$.ajax(opcionesNuevo);
	};

	self.ejecutarAccion = function (boton) {
		//La funcion ejecutar accion recibe como parametro el botón que fue clickeado
		var objeto = self;
		var accion = boton.click();
		objeto[accion](boton);
	};

	self.cancelar = function () {
		arbolFormularioCancelar(self);
	};

	self.expandirIcono = ko.computed(function () {
		var expandido = self.expandido();
		var clase = 'fa arbol-hijos-expandir ';
		if (expandido) {
			clase += 'fa-minus-square-o';
		} else {
			clase += 'fa-plus-square-o';
		}
		return clase;
	});

	self.expandir = function () {
		if (self.expandido()) {
			self.expandido(false);
		} else {
			self.expandido(true);
		}
	};

	self.plantillaBoton = function (boton) {
		return boton.plantilla();
	};

	self.plantillaUtilizar = function (hijo) {
		return hijo.template();
	};

	//Funciones que sirven para añadir funcionalidad luego de la llamada Ajax
	//que envía datos de un formulario
	self.formularioBeforeSend = function () {};
	self.formularioSuccess = function () {};
	self.formularioError = function () {};
	self.formularioComplete = function () {};
};

/**
 * Devuelve un json con datos comunes para las llamadas ajax
 *
 * @returns json
 */
var arbolAjaxDatos = function (objeto) {
	var id = modelo.id();
	var tipo = modelo.clave();
	var padre = tipo;
	var padreId = id;
	if (typeof objeto.padre !== "undefined") {
		padre = objeto.padre();
		padreId = objeto.padreId();
	}

	return {
		'original-id': id,
		'original-tipo': tipo,
		'padre-tipo': padre,
		'padre-id': padreId
	};
};

var arbolFormulario = function ($formularioContenedor, url, objeto) {
	var $formulario = $formularioContenedor.find('form').not('.modal-body');
	var $boton		= $formulario.find('[type="submit"]');
	var $icono		= $boton.find('.fa');
	var iconoClase  = $icono.attr('class');
	var $mensajes   = $('#mensajes');
	var datos		= arbolAjaxDatos(objeto);
	var queryString = $.param(datos);
	var delimitador = '?';
	if (url.indexOf('?') >= 0) {
		delimitador = '&';
	}
	var $agregableModalForms = $formularioContenedor.find('#agregable-modalForm');
	if ($agregableModalForms.length > 0) {
		agregarFuncionalidadModal($agregableModalForms);
	}

	url += delimitador + queryString;
	//Inicializamos js de elementos de formularios, como lista doble, tinyMce, etc.
	inputsCrossBrowser();
	var opcionesForm = {
		url: url,
		resetForm: true,
		data: datos,
		beforeSend: function (jqXHR, settings) {
			$boton.attr('disabled', 'disabled');
			$icono.attr('class', 'fa fa-spinner fa-spin');
			objeto.formularioBeforeSend();
		},
		success: function (data, textStatus, jqXHR) {
			if (jqXHR.getResponseHeader('X-Innova-Login') === '1') {
				alerta('Se ha perdido la sesión. Le recomendamos abrir una nueva pestaña, iniciar sesión ahí y volver a intentar.', 'danger', $formulario);
				return;
			}
			if (data === false) {
				alerta('Ha ocurrido un error, verifique los campos y vuelva a intentar.', 'warning', $mensajes);
			} else {
				var modalFormOptions = {
					error: false
				};
				if ($(data).find('#modalFormOptions').length > 0) {
					modalFormOptions = JSON.parse($(data).find('#modalFormOptions').text());
				}
				if (modalFormOptions.error === true) {
					$formularioContenedor.html(data);
					arbolFormulario($formularioContenedor, url, objeto);
					return true;
				}
				alerta('Se ha guardado éxitosamente', 'success', $mensajes);
				ko.mapping.fromJS(data, arbolOpciones, modelo);
				arbolModeloActualizado(modelo);
				objeto.cancelar();
				objeto.formularioSuccess();
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			procesarErrorAjax(jqXHR, textStatus, errorThrown, $mensajes);
			objeto.formularioError();
		},
		complete: function (jqXHR, textStatus) {
			$boton.removeAttr('disabled');
			$icono.attr('class', iconoClase);
			$formulario.find(':disabled').removeAttr('disabled', 'disabled');
			objeto.formularioComplete();
		}
	};

	if (typeof objeto.clave === 'undefined') {
		var selectorPadre = '[name="' + objeto.padre() + '"]';
		var $padre = $formulario.find(selectorPadre);
		if ($padre.is('select')) {
			var padreTexto = $padre.find('option:selected').text();
			var padreClase = $padre.attr('class');
			$padre.hide();
			$padre.siblings('.dropdown-toggle').hide();
			$padre.after('<input type="text" readonly="readonly" value="' + padreTexto + '" class="' + padreClase + '"/>');
		} else {
			$padre.attr('readonly', 'readonly');
		}
	}

	$formulario.enfocarFormulario();

	formularioRecibido($formulario, objeto);

	$formulario.validate({
		ignore: '.moxie-shim input'
	});
	$boton.removeAttr('disabled');
	$formulario.unbind("submit");
	$formulario.submit(function (e) {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		validarForm($formulario);
		if ($formulario.valid()) {
			$formulario.ajaxSubmit(opcionesForm);
			$formulario.find('input,select,textarea,button').attr('disabled', 'disabled');
		}
		return false;
	});
};

var arbolFormularioCancelar = function (objeto) {
	var $formulario = $('.arbol-formulario');
	$formulario.html('');
	modelo.editandoCancelar();
};