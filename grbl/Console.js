(function(exports) {
	var statusText = {
			 Idle : '<i class="fa fa-check-circle-o"></i> '+t("status.flying.Idle"),
			 Queue : '<i class="fa fa-pause"></i> '+t("status.flying.Queue"),
			 Run : '<i class="fa fa-cogs"></i> '+t("status.flying.Run"),
			 Hold : '<i class="fa fa-pause"></i> '+t("status.flying.Hold"),
			 Home : '<i class="fa fa-home"></i> '+t("status.flying.Home"),
			 Alarm : '<i class="fa fa-exclamation-triangle"></i> '+t("status.flying.Alarm"),
			 Check : '<i class="fa fa-eye-slash"></i> '+t("status.flying.Check")
	};
	
	var Console = {
		_enabled : true,
		History : {
			_val : [],
			_pos : 0,
			_limit : 1000,
			add : function(cmd) {
				if (Console.History._val[Console.History._val.length - 1] != _.str.trim(cmd)) {
					Console.History._val.push(_.str.trim(cmd));
					if (Console.History._val.length >= Console.History._limit) {
						Console.History._val.shift();
					}
					localStorage.console_history = JSON.stringify(Console.History._val);
					Console.History._pos = Console.History._val.length;
					Console.History._tmp = "";
				}
			},
			up : function() {
				if (Console.History._pos == Console.History._val.length) {
					Console.History._tmp = $("#cmd").val();
				}
				if (Console.History._pos > 0) {
					Console.History._pos--;
					$("#cmd").val(Console.History._val[Console.History._pos]);
				}
			},
			down : function() {
				if (Console.History._pos < Console.History._val.length) {
					Console.History._pos++;
					if (Console.History._pos == Console.History._val.length) {
						$("#cmd").val(Console.History._tmp);
						Console.History._tmp = "";
					} else {
						$("#cmd").val(Console.History._val[Console.History._pos]);
					}
				}
			}
		},
		show : function(){
			$('#tab-console').tab('show');
			Console.focus();
		},
		focus : function() {
			if (Console._enabled) {
				$("#cmd").focus();
				Console.trigger('focus');
			} else {
				$("#cmd").blur();
			}
		},
		enable : function() {
			if (!Console._enabled) {
				Console._enabled = true;
				$("#cmd, #console button").removeAttr('disabled');
				$("#console").removeClass("disabled");
				$("#cmd").focus();
				Console.trigger("enabled");
			}
		},
		disable : function() {
			if (Console._enabled) {
				Console._enabled = false;
				$("#cmd, #console button").attr('disabled', 'disabled');
				$("#console").addClass("disabled");
				Console.trigger('disabled');
			}
		},
		bottom : function(){
			$("#console .out").scrollTo($("#console .out div:last"),{duration:0,axis:'y'});
		},
		run : function(cmd) {
			var cmdLine = Grbl.send(cmd);
			
		},
		info : function(str,icon){
			icon = icon ? icon : 'fa-info-circle';
			$("#console .out").append('<div class="cmdInfo"><i class="fa '+icon+'"></i> '+str+'</div>');
			Console.bottom();
		},
		error : function(str,icon){
			icon = icon ? icon  : 'fa-exclamation-triangle';
			$("#console .out").append('<div class="cmdError"><i class="fa '+icon+'"></i> '+str+'</div>');
			Console.bottom();
			Console.show();
		},
		warning : function(str,icon){
			icon = icon ? icon  : 'fa-exclamation-triangle';
			$("#console .out").append('<div class="cmdWarning"><i class="fa '+icon+'"></i> '+str+'</div>');
			Console.bottom();
		}		
	};
	$.observable(Console);
	Console.disable();


	$(function() {

		// Get history from local storage
		if (localStorage.console_history) {
			try {
				Console.History._val = JSON.parse(localStorage.console_history);
				Console.History._pos = Console.History._val.length;
			} catch (e) {
				console.log("Unable to deserialize history", e);
			}
		}$("#flyingStatus")
		_pos: (localStorage.console_history ? localStorage.console_history.length : 0), windowResize();

		$("#cmdForm").submit(function(e) {
			e.preventDefault();
			var cmd = $("#cmd").val();
			if(_.str.trim(cmd).length >0){
				Console.History.add(cmd);
				Console.run(cmd);
			}
		});

		$("#console").click(function() {
			Console.focus();
		});
		$("#cmd").focus().on('keydown', function(e) {
			if (e.keyCode == KEYS.up_arrow) {
				Console.History.up();
				e.preventDefault();
			}
			if (e.keyCode == KEYS.down_arrow) {
				Console.History.down();
				e.preventDefault();
			}
			if (e.keyCode == KEYS.enter) {
				e.preventDefault();
				var cmd = $("#cmd").val();
				if(_.str.trim(cmd).length >0){
					Console.History.add(cmd);
					Console.run(cmd);
				}
			}
		});
		
		$('#left-component a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			if(e.target.href.indexOf("#console")>-1){
				Console.focus();
			}
		});

	});

	Grbl.on('initialized', function(o) {
		Console.enable();
		Console.info(t("grbl.initialized",o),'fa-bolt');
	});


	Grbl.on('cmd.comment', function(cmdLine) {
		Console.info(cmdLine.line);
	});

	Grbl.on('error', function(str) {
		Console.error(str);
	});
	
	Grbl.on('disconnected', function() {
		Console.disable();
	});

	Grbl.on("cmd.cached", function(cmdLine) {
		
	});
	Grbl.on("cmd.abort", function(cmdLine) {
		$("#cmdLine" + cmdLine.id + " .status").text(t('aborted'));
		$("#cmdLine" + cmdLine.id).addClass("done").addClass("done_aborted");
		$("#console .out").scrollTo("#cmdLine" + cmdLine.id,{duration:0,axis:'y'});
	});
	Grbl.on("cmd.ok", function(cmdLine) {
		$("#cmdLine" + cmdLine.id + " .status").text(t('ok'));
		$("#cmdLine" + cmdLine.id).addClass("done").addClass("done_ok");
		$("#console .out").scrollTo("#cmdLine" + cmdLine.id,{duration:0,axis:'y'});
	});
	Grbl.on("cmd.ko", function(cmdLine, output) {
		$("#cmdLine" + cmdLine.id).append("<li>" + output + "</li>");
		$("#cmdLine" + cmdLine.id + " .status").text(t('ko'));
		$("#cmdLine" + cmdLine.id).addClass("done").addClass("done_ko");
		$("#console .out").scrollTo("#cmdLine" + cmdLine.id,{duration:0,axis:'y'});
	});
	Grbl.on("cmd.sent", function(cmdLine) {
		$("#console .out").append('<div class="cmdLine" id="cmdLine' + cmdLine.id + '"><div class="cmd"><i class="fa fa-angle-double-right"></i> ' + cmdLine.line + ' <strong class="status">'+t('sending')+'</strong></div></div>');
		$("#cmd").val("");
		$("#console .out").scrollTo("#cmdLine" + cmdLine.id,{duration:10,axis:'y'});
		$("#cmdLine" + cmdLine.id + " .status").text('sent');
	});
	Grbl.on("cmd.output", function(cmdLine, output) {
		$("#cmdLine" + cmdLine.id).append("<li>" + output + "</li>");
	});
	Grbl.on("cmd.error", function(cmdLine) {
	});
	Grbl.on("cmd.warning", function(data) {
		Console.warning(data);
	});
	Grbl.on("streaming.start",function(){
		Console.disable();
		Console.show();
	});
	Grbl.on("streaming.end",function(duration){
		Console.info(t('streaming.end',{duration:duration}),'fa-clock-o');
		Console.enable();
	});
	Grbl.on("status",function(status){
		if(status.status =='Idle'){
			$("#flyingStatus").hide();
		}else{
			$("#flyingStatus").html(statusText[status.status]).show();
			$("#console .cmdLine.done_ok:last .cmd").append($("#flyingStatus"));
		}
		
	});

	exports.Console = Console;
})(this);