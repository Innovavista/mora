(function() {

	$(document).ready(function() {
		$('[data-c-preloader]').each(function() {
			var $this = $(this);
			var target = $this.data('c-preloader-for');
			var $target = $('[data-c-preloader-target=' + target + ']');
			$this.fadeOut(300, function() {
				$target.removeClass('hidden');
			});
		});
	});

})();