var Notificacion = function(texto, tipo) {
	new Noty({
		text: texto,
		timeout: 5000,
		callbacks: {
			onTemplate: function() {
				var template = '';
				switch (tipo) {
					case 'success':
						template = $("#noty-success").html();
						break;
					case 'info':
						template = $("#noty-info").html();
						break;
					case 'error':
						template = $("#noty-error").html();
						break;
				}
				var html = Mustache.render(template, { text: this.options.text });
				this.barDom.innerHTML = html;
			}
		}
	}).show();
};

