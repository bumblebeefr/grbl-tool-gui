(function(exports) {
	var statusText = {
		unknown : '<strong class="red"><i class="fa fa-minus-circle"></i> ' + t("status.panel.Idle") + '</strong>',
		Disconnected : '<strong class="red"><i class="fa fa-minus-circle"></i> ' + t("status.panel.Idle") + '</strong>',
		Idle : '<i class="fa fa-moon-o"></i> ' + t("status.panel.Idle"),
		Queue : '<strong class="yellow"><i class="fa fa-pause"></i> ' + t("status.panel.Queue") + '</strong>',
		Run : '<strong class="green"><i class="fa fa-cogs"></i> ' + t("status.panel.Run") + '</strong>',
		Hold : '<strong class="yellow"><i class="fa fa-pause"></i> ' + t("status.panel.Hold") + '</strong>',
		Home : '<strong class="green"><i class="fa fa-home"></i> ' + t("status.panel.Home") + '</strong>',
		Alarm : '<strong class="red"><i class="fa fa-exclamation-triangle"></i> ' + t("status.panel.Alarm") + '</strong>',
		Check : '<strong class="blue"><i class="fa fa-eye-slash"></i> ' + t("status.panel.Check") + '</strong>'
	};

	Grbl.on('status', function(status) {
		_.each([ 'x', 'y', 'z' ], function(axe, i) {
			$("#machine-" + axe).text(numeral(status.MPos[i]).format("0.000"));
			$("#work-" + axe).text(numeral(status.WPos[i]).format("0.000"));
		});
		$("#grb-status").html(statusText[status.status] || statusText[status.unknown]);
	});
	Grbl.on('disconnected', function() {
		$('#serial-status').html('<strong class="red"><i class="fa fa-minus-circle"></i> ' + t("grbl.disconnected") + '</strong>')
	});
	Grbl.on('initialized', function(o) {
		$('#serial-status').html('<div class="cmdInfo"><i class="fa fa-bolt"></i> ' + t("grbl.connected", o) + '</div>');
	});

	Grbl.on('streaming.start', function(pct, duration) {
		var html = '<div id="streamingProgress">' + t("streaming.on") + '</div>';
		html += '<div class="progress progress-striped active">';
		html += '<div id="streamingProgressBar" class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%;">';
		html += '</div>';
		html += '</div>';
		$("#streaming").html(html);
	});
	Grbl.on('streaming.end', function(pct, duration) {
		$("#streaming").text(t("streaming.off"));
	});
	Grbl.on('streaming.abort', function(pct, duration) {
		$("#streaming").text(t("streaming.abort"));
	});
	Grbl.on('streaming.update', function(pct, duration) {
		var d = moment.duration(duration, 'seconds');
		$("#streamingProgress").text(t('streaming.status', {
			percent : numeral(pct).format('0.0'),
			h : _.pad(d.hours(), 2, '0'),
			m : _.pad(d.minutes(), 2, '0'),
			s : _.pad(d.seconds(), 2, '0')
		}));
		$("#streamingProgressBar").css('width', pct + "%");
	});

	Grbl.on('gcode.status', function(gcodeStatus) {
		$("#gcode-position").text(t('gcode.status.'+gcodeStatus.position));
		$("#gcode-units").text(t('gcode.status.'+gcodeStatus.units));
		$("#gcode-speed").text(gcodeStatus.speed);
	});

})(this);