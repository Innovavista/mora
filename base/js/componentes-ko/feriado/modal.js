/**
 * Representa el componente KO de modal de feriados para una determinada 
 * entidad. Tener en cuenta que la entidad debe tener un arreglo de feriados
 * los cuales son los que fueron elegidos en el modal.
 * 
 * @param {Observable} entidad			 | Observable donde se almacenará la entidad que posee los feriados.
 * @param {Observable} feriadosOficiales | Observable donde se encuentra los feriados oficiales posibles.
 * @param {String} descripcionDefecto	 | String que posee la descripción por defecto de un feriado no oficial.
 * 
 * @return {void}
 */
ko.components.register('feriados-modal', {
	viewModel: function (params) {
		var self = this;

		self.cerrar				= params.cerrar;
		self.entidad			= params.entidad;
		self.feriadosOficiales  = params.feriadosOficiales;
		self.descripcionDefecto	= params.descripcionDefecto ? params.descripcionDefecto : ko.observable('Feriado adicional');
		
		if (!ko.isObservable(self.descripcionDefecto)) {
			self.descripcionDefecto = ko.observable(params.descripcionDefecto);
		}
		
		/**
		 * Agrega una fecha seleccionada del datepicker a los feriados,
		 * quitándolo de los feriadosOficiales si corresponde. Si no corresponde
		 * a un feriado oficial crea un nuevo feriado.
		 * 
		 * @param {string} fecha
		 * @returns {undefined}
		 */
		self.agregarFechaCalendario = function (fecha) {
			var objeto = null;
			var feriado = self.getFeriado(fecha, self.feriadosOficiales());
			if (feriado) {
				self.feriadosOficiales.remove(feriado);
				objeto = feriado;
			} else {
				objeto = self.crearFecha(null, fecha, self.descripcionDefecto());
			}
			self.agregarFecha(objeto, self.entidad.feriados);
		};

		/**
		 * Agrega un feriado oficial a los feriados de la entidad, quitándolo del
		 * arreglo de feriados oficiales.
		 * 
		 * @param {Object} feriado
		 * @returns {void}
		 */
		self.seleccionarFeriado = function (feriado) {
			self.agregarFecha(feriado, self.entidad.feriados);
			self.feriadosOficiales.remove(feriado);
		};

		/**
		 * Busca un feriado dentro del array enviado como parámetro y lo 
		 * devuelve
		 * 
		 * @param {string} fecha
		 * @param {array} arrayFeriados
		 * @returns {Object}
		 */
		self.getFeriado = function (fecha, arrayFeriados) {
			var fechaFormateada = moment(fecha).format('DD/MM/YYYY');
			var feriado = ko.utils.arrayFirst(arrayFeriados, function (feriadoO) {
				return feriadoO.fecha.fecha() === fechaFormateada;
			});
			return feriado;
		};

		/**
		 * Agrega la fecha al array, siempre y cuando no esté repetida dentro
		 * del array, luego los ordena.
		 * 
		 * @param {Object} fecha
		 * @param {array} array
		 * @returns {void}
		 */
		self.agregarFecha = function (fecha, array) {
			if (!self.validarFechaRepetida(fecha, array)) {
				array.push(fecha);
				self.ordenarPorFecha(array);
			} else {
				Notificacion('El feriado ya se encuentra cargado', 'error');
			}
		};

		/**
		 * Verifica que el feriado no esté repetido al intentar agregarlo
		 * a la lista de feriados de la entidad
		 * 
		 * @param {Object} feriadoNuevo
		 * @param {array} array
		 * @returns {boolean}
		 */
		self.validarFechaRepetida = function (feriadoNuevo, array) {
			var bandera = false;
			ko.utils.arrayForEach(array(), function (feriado) {
				if (feriado.fecha.fecha() === feriadoNuevo.fecha.fecha()) {
					bandera = true;
				}
			});
			return bandera;
		};

		/**
		 * Ordena el array de feriados enviado como parametro por fecha en 
		 * orden ascendente.
		 * 
		 * @param {array} array
		 * @returns {void}
		 */
		self.ordenarPorFecha = function (array) {
			array.sort(function (a, b) {
				var fecha1 = a.fecha.fechaMysql();
				var fecha2 = b.fecha.fechaMysql();
				var orden = fecha1 === fecha2 ? 0
						: fecha1 < fecha2 ? -1
						: 1;
				return orden;
			});
		};

		/**
		 * Crea un nuevo feriado en el formato requerido por el componente y 
		 * lo devuelve.
		 * 
		 * @param {string} fechaNueva
		 * @param {string} descripcion
		 * @returns {Object}
		 */
		self.crearFecha = function (id, fechaNueva, descripcion) {
			fecha = moment(fechaNueva).format('DD/MM/YYYY');
			fechaMysql = moment(fechaNueva).format('YYYY-MM-DD');
			var fechaServicio = {};
			fechaServicio.fecha = {};
			fechaServicio.fecha.fecha = ko.observable(fecha);
			fechaServicio.fecha.fechaMysql = ko.observable(fechaMysql);
			fechaServicio.fechaTexto = fechaServicio.fecha.fecha();
			if (descripcion) {
				fechaServicio.descripcion = ko.observable(descripcion);
			}
			return fechaServicio;
		};

		/**
		 * Selecciona todos los feriados de la lista de feriados oficiales
		 * y los agrega a la lista de feriados de la entidad
		 * 
		 * @returns {void}
		 */
		self.agregarTodosFeriados = function () {
			var arrayFeriados = self.feriadosOficiales().slice(0);
			for (var i = 0, max = arrayFeriados.length; i < max; i++) {
				var feriado = arrayFeriados[i];
				self.seleccionarFeriado(feriado);
			}
		};

		/**
		 * Quita todos los feriados de la lista de feriados de la entidad
		 * y si son feriados oficiales los agrega a la lista de feriados 
		 * oficiales.
		 * 
		 * @returns {void}
		 */
		self.quitarTodosFeriados = function () {
			var arrayFeriados = self.entidad.feriados().slice(0);
			for (var i = 0, max = arrayFeriados.length; i < max; i++) {
				var feriado = arrayFeriados[i];
				self.borrarFecha(feriado);
			}
		};

		/**
		 * Quita el feriado de los feriados de la entidad y si pertenece a los
		 * feriados oficiales lo agrega a ese array, luego ordena 
		 * los feriados del array por fecha.
		 * 
		 * @param {Object} valor
		 * @returns {undefined}
		 */
		self.borrarFecha = function (feriado) {
			self.entidad.feriados.remove(feriado);
			if (feriado.descripcion() !== self.descripcionDefecto()) {
				self.feriadosOficiales.push(feriado);
				self.ordenarPorFecha(self.feriadosOficiales);
			}
		};

		//<editor-fold defaultstate="collapsed" desc="Data bind: Datepicker">
		ko.bindingHandlers['datepicker'] = {
			init: function (element, valueAccessor) {
				var year = moment().year();
				$(element).datepicker({
					onSelect: function (fecha) {
						self.agregarFechaCalendario(fecha);
					},
					dateFormat: 'yy-mm-dd',
					minDate: year + "-01-01"
				});
			}
		};
		//</editor-fold>

	},
	template: {element: 'componente-feriados-modal'}
});