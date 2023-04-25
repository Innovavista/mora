const Alerta = function (opciones) {
    const version = parseInt(swal.version.split('.')[0]);
    const defecto = {
        type: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#58db83',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#bfbfbf',
        showCancelButton: true,
        animation: true,
        background: '#fff'
    };

    const agrandar = opciones.agrandar ? opciones.agrandar : false;
    const onConfirmCallback = opciones.onConfirmCallback;
    const onConfirmRecargar = opciones.onConfirmRecargar ? opciones.onConfirmRecargar : false;
    const onCloseRecargar = opciones.onCloseRecargar ? opciones.onCloseRecargar : false;
    const onCancelCallback = opciones.onCancelCallback ? opciones.onCancelCallback : function () {
    };
    const onDenyCallback = opciones.onDenyCallback ? opciones.onDenyCallback : function () {
    };

    delete opciones.agrandar;
    delete opciones.onConfirmCallback;
    delete opciones.onConfirmRecargar;
    delete opciones.onCancelCallback;
    delete opciones.onDenyCallback;

    const config = $.extend({}, defecto, opciones);

    if (version >= 11 && typeof config.icon === 'undefined') {
        config.icon = config.type;
    }

    if (agrandar) {
        const clase = 'swal-ancho';
        const onOpen = version >= 11 ? 'didOpen' : 'onOpen';
        const onClose = version >= 11 ? 'didClose' : 'onClose';
        config[onOpen] = function () {
            $('body').addClass(clase);
        };
        config[onClose] = function () {
            $('body').removeClass(clase);
        };
    }

    const resultado = function (resultado) {
        let valor = resultado.value;
        if (valor && onConfirmRecargar) {
            window.location.reload();
            return;
        }
        if (valor && typeof onConfirmCallback === "function") {
            onConfirmCallback();
            return;
        }
        if (onCloseRecargar
            && (typeof resultado.isDismissed !== "undefined" || typeof resultado.dismiss !== "undefined")
        ) {
            window.location.reload();
            return;
        }
        if (typeof resultado.isDenied !== "undefined" && resultado.isDenied) {
            onDenyCallback();
            return;
        }
        onCancelCallback();
    };

    if (version >= 11) {
        delete config.type;
        delete config.animation;
        return swal.fire(config).then(resultado);
    } else {
        return swal(config).then(resultado);
    }
};

