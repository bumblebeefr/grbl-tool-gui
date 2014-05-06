(function(exports) {
	var sp = require("serialport");
	var SerialPort = sp.SerialPort;

	/**
	 * Events :
	 * <li>connected(connectionObject,baudrate) : when a serial connection is
	 * established</li>
	 * <li>disconnected : when a serial connection is closed or when
	 * autoconnection failed</li>
	 * <li>data(dataStr) : when a row of data is red from the serial connection</li>
	 */
	var Serial = {
		defaultBaudrate : 115200,
		connection : null,
		connected : false,
		listPorts : function(then) {
			if (typeof then === 'function') {
				sp.list(function(err, ports) {
					if (ports) {
						ports.forEach(function(port) {
							console.debug(port.comName + " : " + port.pnpId + ", " + port.manufacturer);
						});
						then(ports);
					} else {
						console.debug("Aucun port detecté");
						then([]);
					}
				});
			}
		},
		disconnect : function(then) {
			if (Serial.connection != null) {
				Serial.connection.close(function(error) {
					if (error) {
						console.warn("On closing connection", error);
					}
					if (typeof then === 'function') {
						then(error);
					}
				});
			} else {
				if (typeof then === 'function') {
					then();
				}
			}
		},
		connect : function(port, baudrate, then) {
			baudrate = baudrate ? baudrate : Serial.defaultBaudrate;
			Serial.disconnect(function() {
				var serialPort = new SerialPort(port, {
					baudRate : baudrate,
					parser : sp.parsers.readline("\r\n", "ascii")
				}, false);
				serialPort.on('close', function() {
					Serial.connected = false;
					Serial.trigger("disconnected", Serial.connection);
				});
				serialPort.on('data', function(data) {
					Serial.trigger("data", data);
				});
				serialPort.open(function(error) {
					if (error) {
						console.warn('On connection : ', error);
					} else {
						Serial.connection = serialPort;
						Serial.connected = true;
						Serial.baudrate = baudrate;
						Serial.trigger("connected", Serial.connection, baudrate);
					}
					if (typeof then === 'function') {
						then(error);
					}
				});
			});
		},
		autoConnect : function(baudrate, then, _ports) {
			if (typeof _ports === 'undefined') {
				Serial.listPorts(function(ports) {
					Serial.autoConnect(baudrate, then, ports);
				});
			} else {
				if (_ports.length === 0) {
					console.warn('Unable to autoconnect');
					Serial.trigger("disconnected");
					if (typeof then === 'function') {
						then("Error : unable to autoconnect");
					}
				} else {
					var port = _ports.shift();
					Serial.connect(port.comName, baudrate, function(error) {
						if (error) {
							console.warn("On autoconnect", error);
							Serial.autoConnect(baudrate, then, _ports);
						} else {
							if (typeof then === 'function') {
								then();
							}
						}
					});
				}
			}
		},
		print : function(str, then) {
			Serial.connection.write(str, function(err, results) {
				if (err) {
					console.error('Serial write error ', err);
					Serial.disconnect();
				}
				if (typeof then === 'function') {
					then(err, results);
				}
			});
		}
	};
	$.observable(Serial);

	exports.Serial = Serial;
})(this);
