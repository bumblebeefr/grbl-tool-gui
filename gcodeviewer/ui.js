function error(msg) {
	alert('Error: ' + msg);
}

var scene = null;
var object = new THREE.Object3D();

function openGCodeFromText(gcode) {
	if (object) {
		scene.remove(object);
	}
	object = createObjectFromGCode(gcode);
	scene.add(object);
	localStorage.setItem('last-imported', gcode);
	localStorage.removeItem('last-loaded');
	$('textarea#gcode').html(gcode);
}

function resize() {
	$('#renderArea').height($(window).innerHeight());
	$('#renderArea').width($(window).innerWidth());
}
$(function() {
	resize();
	$(window).resize(resize);
	var halfinfo = $('#info').width() / 2;
	$('#info').css("left", ((410 + ((window.innerWidth - 410) / 2)) - halfinfo) + "px");
	createScene($('#renderArea'));
	scene.add(object);
	render();
	animate();

});