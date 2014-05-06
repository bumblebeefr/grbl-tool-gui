(function(exports) {
	function CommandLine(line, options) {
		this.options = options ? options : {};
		this.line = line;
		this.status = "waiting"; // waiting sent ok ko
		this.id = Grbl._uid++;
		this.output = [];
	}

	function parsePosition(s) {
		return s.split(",").map(function(o) {
			return parseFloat(o);
		});
	}
	
	var gcodeStatuses ={
		plane : ['G17','G18','G19'],
		units : ['G20','G21'],
		position : ['G90','G91'],
		spindle : ['M3','M4','M5'],
		coordinate : ['G54','G55','G56','G57','G58','G59']
	};

	/**
	 * Events :
	 * <li>status(oldstatus,newStatus): when grbl statu is updated</li>
	 * <li>status.[Status] : when status code of the machine changes</li>
	 * 
	 * <li>cmd.cached(commandLineObject): when a commend line to send to grbl is added to cache (1step of sending a command)</li>
	 * <li>cmd.sent(commandLineObject): when a comment is sent to grbl via serial</li>
	 * <li>cmd.output(commandLineObject,outputLineStr): when grbl sendback a line of string for this command</li>
	 * <li>cmd.error(commandLineObject): when Serial trigger an error on sending command</li>
	 * <li>cmd.comment(commandLineObject): when the command to send is not a command but a comment</li>
	 * <li>cmd.ok(commandLineObject): when grbl return OK for a command</li>
	 * <li>cmd.ko(commandLineObject): when grbl return error for a command</li>
	 * <li>cmd.abort(commandLineObject): when comand are aboted (reset, disconnection, ...)</li>
	 * 
	 * <li>streaming.start(): when starting the streaming of multiple commands</li>
	 * <li>streaming.update(percent,timeInSeconds): when a new line is streamed</li>
	 * <li>streaming.end(timeInSeconds): when all lines are streamed</li>
	 * <li>streaming.abort: when streaming is aborded</li>
	 */
	var Grbl = {
		_uid : 0,
		bufferMax : 2, // nombre de lignes max dans le buffer
		initialized : false,
		commandQueue : [], // Queue of commandLine to be sent to grbl board
		commandBuffer : [], // CommandLines sent to grbl board buffer, but not
		// yet completed
		commandMap : {},
		statusTimeout : null,
		status : {
			status : null,
			MPos : [ 0, 0, 0 ],
			WPos : [ 0, 0, 0 ]
		},
		_parseData : function(data) {
			if (data && _.str.trim(data).length > 0) {
				if (data.indexOf('Grbl') === 0) {
					Grbl.initialized = true;
					console.log(data);
					Grbl.trigger('initialized', {
						port : Serial.connection.path,
						baudrate : Serial.baudrate,
						version : data.replace(/Grbl ([^ ]*) .*/, '$1'),
						str : data
					});

				} else if (m = data.match(/^<(Idle|Queue|Run|Hold|Home|Alarm|Check),MPos:(.*),WPos:(.*)>$/i)) {
					console.debug("Status : ", m, data);
					var _tmpStatus = {
						status : m[1],
						MPos : parsePosition(m[2]),
						WPos : parsePosition(m[3])
					};
					if (!_.isEqual(_tmpStatus, Grbl.status)) {
						var _oldStatus = Grbl.status;
						Grbl.status = _tmpStatus;
						Grbl.trigger("status", _tmpStatus, _oldStatus);

						if (_oldStatus.status != _tmpStatus.status) {
							Grbl.trigger("status." + _tmpStatus.status);
						}
					}
					if (Grbl.status.status == 'Idle' || Grbl.status.status == 'Alarm') {
						clearTimeout(Grbl.statusTimeout);
					}

				} else if (Grbl.commandBuffer.length > 0) {
					if (data.indexOf('ok') === 0) {
						var cmdLine = Grbl.commandMap[Grbl.commandBuffer.shift()];
						cmdLine.status = "ok";
						Grbl.trigger("cmd.ok", cmdLine);
						delete (Grbl.commandMap[cmdLine.id]);

					} else if (data.indexOf('error') === 0) {
						var cmdLine = Grbl.commandMap[Grbl.commandBuffer.shift()];
						cmdLine.output.push(data);
						cmdLine.status = "ko";
						Grbl.trigger("cmd.ko", cmdLine, data);
						delete (Grbl.commandMap[cmdLine.id]);

					} else {
						var cmdLine = Grbl.commandMap[Grbl.commandBuffer[0]];
						cmdLine.output.push(data);
						Grbl.trigger("cmd.output", cmdLine, data);
					}
				} else {
					Grbl.trigger("cmd.warning", data);
					console.error("Grbl send us lost data : ", data);
				}

			}
		},
		_processCommandBuffer : function() {
			if (Grbl.commandBuffer.length < Grbl.bufferMax && Grbl.commandQueue.length > 0) {
				var cmdId = Grbl.commandQueue.shift();
				var cmdLine = Grbl.commandMap[cmdId];
				if (_(cmdLine.line).startsWith("%") || _(cmdLine.line).startsWith("(")) {
					Grbl.trigger("cmd.comment", cmdLine);
					Grbl._processCommandBuffer();
				} else {
					Grbl.commandBuffer.push(cmdId);

					Serial.print(cmdLine.line + "\n", function(err, result) {
						if (err) {
							Grbl.commandBuffer = _.without(Grbl.commandBuffer, cmdId);
							delete (Grbl.commandMap[cmdLine.id]);
							Grbl.trigger("cmd.error", cmdLine);
						} else {
							Grbl.commandMap[cmdLine.id].status = "sent";
							Grbl.trigger("cmd.sent", cmdLine);
						}
					});
				}
			}
			Grbl._getStatus();
		},
		_getStatus : function() {
			clearTimeout(Grbl.statusTimeout);
			Grbl.statusTimeout = setTimeout(Grbl._getStatus, 100);
			Grbl.specialCommand("?");
		},
		send : function(line, options) {
			if (Grbl.initialized) {
				var cmd = _.str.trim(line);
				var cmdLine = new CommandLine(cmd, options);
				Grbl.commandMap[cmdLine.id] = cmdLine;
				Grbl.commandQueue.push(cmdLine.id);
				Grbl.trigger("cmd.cached", cmdLine);
				Grbl._processCommandBuffer();
				return cmdLine;
			}
		},
		specialCommand : function(char) {
			Serial.print(char);
		},
		start : function() {
			Grbl.specialCommand('~');
		},
		hold : function() {
			Grbl.specialCommand('!');
		},
		reset : function() {
			Grbl.specialCommand(String.fromCharCode(0x18));
		},
		clearBufferAndCache : function() {
			if (Grbl.commandBuffer.length > 0 || Grbl.commandQueue.length > 0) {
				if (Grbl.commandBuffer.length > 0) {
					for ( var i in Grbl.commandBuffer) {
						Grbl.trigger("cmd.abort", Grbl.commandBuffer[i]);
					}
					Grbl.commandBuffer.length = 0;
				}
				if (Grbl.commandQueue.length > 0) {
					Grbl.commandQueue.length = 0;
				}
				Grbl.trigger("buffer.cleared");
			}
		},
		streaming : {
			_uid : 0,
			started : false,
			startDate : null,
			length : 0,
			done : 0,
			start : function(gcode) {
				if (Grbl.streaming.started) {
					console.error("A streaming is running, can't start e new one for now");
					Grbl.trigger("error", t('grbl.error.newstreaming'));
				} else {
					Grbl.streaming.started = true;
					Grbl.streaming.startDate = moment();
					if (typeof gcode === "string") {
						gcode = gcode.split('\n');
					}
					gcode = _.filter(gcode, function(str) {
						return !_(str).isBlank();
					});
					Grbl.streaming.length = gcode.length;
					Grbl.streaming.done = 0;
					Grbl.trigger("streaming.start");
					for ( var k in gcode) {
						Grbl.send(gcode[k], {
							stream : true
						});
					}
				}
			},
			abort : function() {
				if(Grbl.streaming.started){
					Grbl.streaming.started = false;
					Grbl.trigger("streaming.abort");
					Grbl.clearBufferAndCache();
				}
			}
		}

	};
	$.observable(Grbl);

	Grbl.on("cmd.ok cmd.ko", function() {
		Grbl._processCommandBuffer();
	});
	Grbl.on("initialized", function() {
		Grbl._getStatus();
	});
	Grbl.on("initialized disconnected", function(e) {
		$("body").attr("class", e);
		Grbl.streaming.abort();
		Grbl.clearBufferAndCache();
	});

	// Streaming management
	Grbl.on("cmd.ok cmd.ko cmd.comment", function(evt, cmdLine) {
		if (cmdLine.options.stream) {
			Grbl.streaming.done++;
			Grbl.trigger("streaming.update", Grbl.streaming.done / Grbl.streaming.length * 100, moment().diff(Grbl.streaming.startDate, 'seconds'));
		}
	});
	Grbl.on("status.Idle", function() {
		if (Grbl.streaming.started && Grbl.streaming.done >= Grbl.streaming.length) {
			Grbl.trigger("streaming.end", moment().diff(Grbl.streaming.startDate, 'seconds'));
			Grbl.streaming.started = false;
		}
		//Get the GCODE status of the machine
		if(Grbl.commandQueue.length == 0){
			Grbl.send("$G",{gcodeStatus:true,system:true});
		}
	});
	
	//Get gcode status
	Grbl.on("cmd.output",function(cmdLine,out){
		if(cmdLine.options.gcodeStatus){
			var gcodeStatusArray = out.replace("[","").replace("]","").split(" ");
			var gcodeStatus = {};
			for(var i in gcodeStatusArray){
				if(_(gcodeStatusArray[i]).startsWith('F')){
					gcodeStatus.speed = parseFloat(gcodeStatusArray[i].substring(1));
				}
				for( var k in gcodeStatuses){
					if(_.contains(gcodeStatuses[k],gcodeStatusArray[i])){
						gcodeStatus[k]=gcodeStatusArray[i];
						break;
					}
				}
			}
			Grbl.trigger("gcode.status",gcodeStatus);
			console.log(gcodeStatus);
		}
	});
	
	Serial.on('disconnected', function() {
		Grbl.initialized = false;
		Grbl.trigger('disconnected');
	});
	Serial.on('data', Grbl._parseData);

	exports.Grbl = Grbl;
})(this);

/*
 * send => met dans la file d'attente et demande le traiteement de la file
 * traitement => la la queue de buffer n'est pas pleine je prend un element de
 * la file d'attente je l'envoie sur le port et je le met dans le buffer, sinon
 * je fait rien quand j'ai un retour ok ou ko, je traite la file d'attente
 * 
 * 
 */
