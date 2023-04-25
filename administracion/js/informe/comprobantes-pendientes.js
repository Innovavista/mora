$(document).ready(() => {
    const $tabla                = $("#informe-comprobantes-pendientes");
    const $filas                = $tabla.find('tr');
    const $celdasPendienteTotal = $tabla.find("td:contains('Pendiente total') + td");

    $celdasPendienteTotal.addClass('font-weight-bold');

    $filas.each(function () {
        const $fila   = $(this);
        const $celdas = $fila.find('td');
        const texto   = $fila.text().trim();

        if (texto !== ""
            && texto !== "Sin comprobantes pendientes"
            && $celdas.eq(1).is(':empty')
            && $celdas.eq(2).not(':empty')
            && $celdas.eq(3).is(':empty')
            && $celdas.eq(4).is(':empty')
        ) {
            $fila.addClass('table-active');
        }
    });

});