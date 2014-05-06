(function(exports) {
	var Menu = {
		tree : {
			grbl : {
				type : 'normal',
				submenu : {
					disconnect : {
						click : function() {
							Serial.disconnect();
						}
					},
					autoConnect : {
						click : function() {
							Serial.autoConnect();
						}
					},
					sp1 : {
						type: 'separator'
					},
					quit : {
						click : function() {
							require('nw.gui').Window.get().close();
						}
					}

				}
			},
			file : {
				type : 'normal',
				submenu : {
					"new" : {
						enabled : false
					},
					"open" : {
						click : function(){
							Editor.openFile();
						}
					},
					"save" : {
						enabled : false
					},
					"save_as" : {
						enabled : false
					}
				}
			},
			control : {
				type : 'normal',
				submenu : {
					"start" : {
						type : "normal",
						enabled : false,
						click : function() {
							Grbl.start();
						}
					},
					"hold" : {
						type : "normal",
						enabled : false,
						click : function() {
							Grbl.hold();
						}
					},
					"reset" : {
						type : "normal",
						enabled : false,
						click : function() {
							Grbl.reset();
						}
					}
				}
			},
			dev : {
				type : 'normal',
				submenu : {
					console : {
						click : function() {
							require('nw.gui').Window.get().showDevTools();
						}
					},
					reload : {
						click : function() {
							require('nw.gui').Window.get().reload(3);
						}

					}
				}
			}
		},
		menus : {

		},

	};

	function recusive_create(tree, prefix) {
		var menus = {};
		prefix = (prefix ? prefix : "menu.");
		for ( var k in tree) {
			var menu = _.clone(tree[k]);
			delete (menu.submenu);
			if (tree[k].submenu) {
				menu.label = t(prefix + k + '.name');
			} else {
				menu.label = t(prefix + k);
			}
			menus[k] = new gui.MenuItem(menu);
			if (tree[k].submenu) {
				var subMenu = new gui.Menu();
				var subMenus = recusive_create(tree[k].submenu, prefix + k + ".");
				for ( var sm in subMenus) {
					subMenu.append(subMenus[sm]);
				}
				menus[k].submenu = subMenu;
				menus[k].sub = subMenus;
			}
		}
		return menus;
	}

	var gui = require('nw.gui');
	if (typeof gui.Window.get().menu === 'undefined') {
		var main__menu = new gui.Menu({
			type : 'menubar'
		});
		gui.Window.get().menu = main__menu;
		Menu.menus = recusive_create(Menu.tree);
		for ( var k in Menu.menus) {
			main__menu.append(Menu.menus[k]);
		}
	}
	// Menu.menus.control.sub.hold.enabled = false;

	Grbl.on('initialized', function() {
		for ( var k in Menu.menus.control.sub) {
			Menu.menus.control.sub[k].enabled = true;
		}
	});
	Grbl.on('disconnected', function() {
		for ( var k in Menu.menus.control.sub) {
			Menu.menus.control.sub[k].enabled = false;
		}
	});

})(this);