$(document).ready(function() {

	//<editor-fold defaultstate="collapsed" desc="Checkboxs">
	var $checkboxs = $(".checkbox");
	$checkboxs.each(function() {
		var $checkbox	= $(this);
		var $label		= $checkbox.find("label");
		var texto		= $label.text();
		var $input		= $label.find('input');
		$input.addClass('custom-control-input');
		$label.text('');
		$label.addClass('custom-control custom-checkbox');
		$label.append($input);
		$label.append('<span class="custom-control-label">' + texto + '</span>');
	});
	//</editor-fold>

	//<editor-fold defaultstate="collapsed" desc="Radios">
	var $radios = $(".radio");
	$radios.each(function() {
		var $radio	= $(this);
		var $label	= $radio.find("label");
		var texto	= $label.text();
		var $input	= $label.find('input');
		$input.addClass('custom-control-input');
		$label.text('');
		$label.addClass('custom-control custom-radio');
		$label.append($input);
		$label.append('<span class="custom-control-label">' + texto + '</span>');
	});
	//</editor-fold>

});

