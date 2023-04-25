function ticketTitle(id) {
    const iframe                 = document.getElementById(id);
    window.parent.document.title = iframe.contentDocument.title;
}

function verTicket(url, urlEnvio, title, onConfirmRecargar, onCloseRecargar) {
    if (!title) {
        title = 'Ticket';
    }
    const tagTitle = document.title;
    const iframe   = 'punto-de-venta-ticket-iframe';
    const type     = 'success';
    const html     = '<iframe onload="ticketTitle(\'punto-de-venta-ticket-iframe\')" src="' + url + '" id="' + iframe + '" class="ticket-iframe punto-de-venta-ticket-iframe"></iframe>';
    const agrandar = url.indexOf("/a4/") !== -1;

    const opciones = {
        type: type,
        title: title,
        html: html,
        agrandar: agrandar,
        showDenyButton: true,
        confirmButtonText: '<i class="fa fa-print"></i> Imprimir',
        denyButtonText: '<i class="fa fa-envelope-o"></i> Enviar',
        denyButtonColor: '#39a1f4',
        cancelButtonText: '<i class="fa fa-times"></i> Cerrar',
        cancelButtonColor: "#a5a5a5",
        onCloseRecargar: onCloseRecargar,
        onConfirmRecargar: onConfirmRecargar,
        preConfirm: function () {
            document.getElementById("punto-de-venta-ticket-iframe").contentWindow.print();
            const $pedido = $("#punto-de-venta-ticket-iframe").contents().find("#ticket-tabla-pedido");
            if ($pedido.length > 0) {
                document.getElementById("punto-de-venta-ticket-iframe").contentWindow.print();
            }
            document.title = tagTitle;
            return true;
        },
        onDenyCallback: function () {
            //Mostramos el alerta de envío de correo
            enviarTicketSolicitarCorreo(urlEnvio);
            document.title = tagTitle;
        },
        onCancelCallback: function () {
            document.title = tagTitle;
        }
    };

    if (!urlEnvio) {
        //Si no se envía agregamos la opción de imprimir.
        //A futuro pasar a Sweet Alert 11 y poner las dos opciones, imprimir y
        //enviar
        opciones.confirmButtonText = '<i class="fa fa-print"></i> Imprimir';
        opciones.onConfirmCallback = function () {
            document.title = tagTitle;
        };
        opciones.preConfirm        = function () {
            document.getElementById(iframe).contentWindow.print();
            return true;
        };
    }
    return Alerta(opciones);
}

/**
 *  Solicita la dirección de correo electrónico a la cual enviar el ticket.
 *
 * @param {string} url Url encargada de enviar el correo.
 * @param {string} enviado Valor por defecto del correo.
 * @param {string} title Título del modal.
 * @param {string} texto Texto aclaratorio luego del título.
 * @param {string} concepto Concepto del objeto que se le envía.
 * @param {function} postEnviarCallback Función que se ejecuta luego de enviar el correo.
 * @param {function} cancelCallback Función que se ejecuta al cancelar el modal.
 * @param {string} textoBotonCancelar Texto del botón cancelar
 * @returns {void}
 */
function enviarTicketSolicitarCorreo(
    url,
    enviado            = "",
    title              = "Enviar comprobante por correo",
    texto              = "",
    concepto           = 'ticket',
    postEnviarCallback = function () {
    },
    cancelCallback     = function () {
    },
    textoBotonCancelar = 'Cancelar'
) {
    Alerta({
        title: title,
        text: texto,
        input: 'email',
        inputValue: enviado,
        inputPlaceholder: 'Ingrese correo destinatario',
        validationMessage: 'El correo ingresado no es correcto',
        confirmButtonText: '<i class="fa fa-envelope-o"></i> Enviar',
        confirmButtonColor: '#39a1f4',
        cancelButtonText: '<i class="fa fa-times"></i> ' + textoBotonCancelar,
        cancelButtonColor: "#bfbfbf",
        onConfirmCallback: function () {
            //Hacemos la petición mediante ajax
            const correo = swal.getInput().value;
            enviarTicket(url, correo, title, texto, concepto, postEnviarCallback, cancelCallback, textoBotonCancelar);
        },
        onCancelCallback: function () {
            if (typeof cancelCallback === "function") {
                cancelCallback();
            }
        }
    });
}

/**
 * Efectiviza el envío del ticket mediante correo electrónico.
 *
 * @param {string} url Url encargada de enviar el correo.
 * @param {string} correo Dirección de correo a enviar el correo.
 * @param {string} title Título del modal.
 * @param {string} texto Texto aclaratorio luego del título.
 * @param {string} concepto Concepto del objeto que se le envía.
 * @param {function} postEnviarCallback Función que se ejecuta luego de enviar el correo.
 * @param {function} cancelCallback Función que se ejecuta al cancelar el modal.
 * @param {string} textoBotonCancelar Texto del botón cancelar
 * @returns {void}
 */
function enviarTicket(url, correo, title, texto, concepto, postEnviarCallback, cancelCallback, textoBotonCancelar) {

    const mensaje = 'Enviando ' + concepto + ' a ' + correo + ".";
    Notificacion(mensaje, 'info');

    const data     = {correo: correo};
    const opciones = getAjaxOpciones({
        url: url,
        data: data,
        async: false,
        success: function (data, textStatus, jqXHR) {
            if (typeof data.exito === 'undefined' || !data.exito) {
                Notificacion('Ha ocurrido un error al intentar enviar el correo.', 'error');
                enviarTicketSolicitarCorreo(url, correo, title, texto, concepto, postEnviarCallback, cancelCallback, textoBotonCancelar);
                return;
            }
            Notificacion('Correo enviado a ' + correo + ' éxitosamente.', 'success');
            if (typeof postEnviarCallback === "function") {
                postEnviarCallback();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            let mensaje = "Ha ocurrido un error, vuelva a intentar";
            if (typeof jqXHR.responseJSON !== "undefined") {
                var data = jqXHR.responseJSON;
                if (Array.isArray(data.errores)) {
                    mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" : "";
                    mensaje += data.errores.join("<br/>");
                } else if (typeof data.error !== "undefined") {
                    mensaje = "Ha ocurrido el siguiente error: " + data.error;
                }
            }
            Notificacion(mensaje, 'error');
            enviarTicketSolicitarCorreo(url, correo, title, texto, concepto, postEnviarCallback, cancelCallback, textoBotonCancelar);
        }
    });

    setTimeout(function () {
        $.ajax(opciones);
    }, 500);
}

const ajaxOpciones = {
    method: 'POST',
    beforeSend: function (jqXHR, settings) {

    },
    error: function (jqXHR, textStatus, errorThrown) {
        var mensaje = "Ha ocurrido un error, vuelva a intentar";
        if (typeof jqXHR.responseJSON !== "undefined") {
            var data = jqXHR.responseJSON;
            if (Array.isArray(data.errores)) {
                mensaje = data.errores.length > 1 ? "Han ocurrido los siguientes errores:<br/>" : "";
                mensaje += data.errores.join("<br/>");
            } else if (typeof data.error !== "undefined") {
                mensaje = "Ha ocurrido el siguiente error: " + data.error;
            }
        }
        Notificacion(mensaje, 'error');
    },
    complete: function (jqXHR, settings) {

    }
}

function getAjaxOpciones(opciones) {
    if (typeof opciones === 'undefined') {
        opciones = {};
    }
    return jQuery.extend({}, ajaxOpciones, opciones);
}


$(document).ready(function () {
    $("body").on("click", ".mostrar-ticket-venta", function (evento) {
        const boton     = evento.currentTarget;
        const url       = boton.dataset.url;
        const titulo    = boton.dataset.titulo;
        const urlEnviar = boton.dataset.urlEnvio;
        verTicket(url, urlEnviar, titulo);
    });
});