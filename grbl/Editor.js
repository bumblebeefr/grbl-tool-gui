(function(exports){
	var fs = require('fs');
	var Editor = {
		editor : CodeMirror(document.getElementById("gcode-editor"), {lineNumbers: true,value : "% No file loaded"}),
		setSize : function(){
			Editor.editor.setSize("100%",$("#gcode-editor").height() - $("#gcode-editor>.btn-group").height());
			Editor.editor.refresh();
		},
		openFile : function(){
			$("#gcodeFileInput").trigger("click");
		},
		loadFile : function() {
			if (document.getElementById("gcodeFileInput").files.length === 0) {
				console.log("nothing :(");
				return;
			}
			

			fs.readFile(document.getElementById("gcodeFileInput").files[0].path, {"encoding" : "utf-8"},function (err, data) {
				if (err) {
					console.error(err);
					alert(t('editor.error.loading_file'),{path : document.getElementById("gcodeFileInput").files[0].path});
				}else{
					Editor.editor.setValue(data);
					Editor.show();
				}
				$("#gcodeFileInput").val("");
			});
			
		},
		show : function(){
			$('#tab-editor').tab('show');
		}
	};
	
	
	
	$(function(){
		$(window).resize(Editor.setSize);
		
		$('#left-component a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			if(e.target.href.indexOf("#gcode-editor")>-1){
				Editor.setSize();
			}
		});
		
		$("#gcodeFileInput").change(function(){
			Editor.loadFile();
		});

		$("#btn-open-file").click(function(){
			Editor.openFile();
		});
		$("#btn-search-in-file").click(function(){
			CodeMirror.commands.find(Editor.editor);
		});
		$("#btn-replace-in-file").click(function(){
			CodeMirror.commands.replace(Editor.editor);
		});
		$("#btn-stream-file").click(function(){
			Grbl.streaming.start(Editor.editor.getValue('\n'));
		});
		
	});
	
	exports.Editor = Editor;
})(this);