(function () {
	
	var modal = function($modal, action) {
		$modal.modal(action);
	};
	
	$(document).ready(function () {
		
		
		
		$('[data-c="modal"]').each(function () {
			var $this = $(this);
			var options = $this.data('c-options');
			var triggers = options.triggers;
			triggers.forEach(function(trigger) {
				var action = trigger.action || 'show';
				var target = trigger.target;
				var events = trigger.events || ['click'];
				var eventsString = events.join(' ');
				$(target).on(eventsString, function() {modal($this, action);});
			});
		});


	});



})();