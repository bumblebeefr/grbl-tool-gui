(function(exports) {
	var Pad = {
		enabled : false,
		enable : function() {
			$("#control-pad").addClass("enabled");
			Pad.enabled = true;
		},
		disable : function() {
			$("#control-pad").removeClass("enabled");
			Pad.enabled = false;
		},
		autoEnableDisable : function(){
			if(Grbl.initialized && !Grbl.streaming.started){
				Pad.enable();
			}else{
				Pad.disable();
			}
		}

	};

	Grbl.on('disconnected streaming.start initialized streaming.end streaming.abort', function() {
		console.log("pad status changed ?");
		Pad.autoEnableDisable();
	});
	$(function(){
		$(window).resize(windowResize);
		$('div.split-pane').splitPane();
		Serial.autoConnect();
		
		$("#control-pad").load("pad-svg.html",function(){
			//Pad buttons
			$.each([ 'x', 'y', 'z' ], function(k, axis) {
				$.each({
					"01" : 0.1,
					"1" : 1,
					"10" : 10,
					"100" : 100
				}, function(j, value) {
					$("#bt_" + axis + "_p" + j).click(function(e) {
						e.preventDefault();
						if(Pad.enabled && Grbl.status.status == 'Idle'){
							Grbl.send("G01 " + axis + value);
						}
					});
					$("#bt_" + axis + "_m" + j).click(function(e) {
						e.preventDefault();
						if(Pad.enabled && Grbl.status.status == 'Idle'){
							Grbl.send("G01 " + axis + "-" + value);
						}
					});
				});
			});
		});
		$("#control-pad").on("click","",function(e){
			e.preventDefault();
			if(Pad.enabled){
				
			}
		});
	});

	exports.Pad = Pad;
})(this);