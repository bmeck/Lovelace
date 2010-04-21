//@start required
Loader.Require("../util/EventQueue");
Loader.Require("../util/Input");
Loader.Require("../util/Location");
Loader.Require("../util/Util");

Loader.Require("../event/Event");

Loader.Require("../formatter/PlainText");

Loader.Require("ui/Cursor");
//@end required

//@start collision wrapper
Loader.OnLoaded(function(){
//@start csseditor
//Queues up some editors using the selector
//@return container that will be populated
//use @return.ready(func) to hook a callback
CSSEditor = function(sel,config) {
    var editors = [];
    $().ready(function(){
        var selectedElements = $(sel)
        selectedElements.each(function(index,value){
           editors.push(
                CSSEditor_Init(value,config)
           );
        });
    });
    return editors;
}
CSSEditor.config = {};
CSSEditor.config.formatter = PlainTextFormatter;

function CSSEditor_Init(elem,config) {
    if (!config) {
        config = jQuery.extend({}, CSSEditor.config);
    }
    Log.log("CSSEditor forming around ",elem);
    
    var eventQueue = new EventQueue();
    var snapshots = [];
    var dirty = true;
    var editor = {
        element: elem,
        config: config
    };
    config.formatter = config.formatter(editor)
    
    //@this editor
    editor.InsertData = function(data) {
        //editor.SaveSnapshot();
        var formatter = config.formatter;
        eventQueue.PushEvent({
            callbackFunction: function(data,editor){
				var evt=new Event("insert",data);
				editor.dispatchEvent(evt);
				if(!evt.isPrevented()){
					editor.cursor.parentNode.insertBefore(data.data,editor.cursor);
				}
			},
            thisObject: formatter,
            argumentsArray: [formatter.FormatData(data,editor),editor],
            //log: ["Insert of '",data,"' data to editor."]
        });
		eventQueue.Flush();
    }
    
    editor.DeleteData = function(toOffset) {
        editor.SaveSnapshot();
        var formatter = config.formatter;
        eventQueue.PushEvent({
            callbackFunction: function(toOffset,editor){
				DefaultDeleteData(toOffset,editor);
				formatter.DeleteData(toOffset,editor);
			},
            thisObject: formatter,
            argumentsArray: [toOffset,editor],
            //log: ["Delete of '",toOffset,"' data from editor."]
        });
        eventQueue.Flush();
    }
    
    editor.Dirty = function() {
        dirty = true;
    }

    //warning - not an event!
    editor.SaveSnapshot = function() {
        snapshots.push(editor.GetValue());
    }

    editor.UpdateValue = function() {
		var data=config.formatter.ToValue(editor);
		var evt=new Event("update",data);
		dirty=false;
		editor.dispatchEvent(evt);
		if(!evt.isPrevented()) {
			elem.value=evt.detail;
		}
        return elem.value;
    }
    
    editor.GetValue = function(t) {
        if (dirty) {
            return editor.UpdateValue();
        }
        else {
			//Log.log(elem.parentNode.innerHTML)
            return elem.value;
        }
    }
    
    elem.cssEditor = editor;
    $(elem).hide().after(function(index){
        var editorFrame = document.createElement("iframe");
        $(editorFrame).css({
            border: "1px solid rgba(0,50,100,0.5)",
			padding: "3px",
			"border-radius": "2px",
			"-webkit-box-shadow": "rgb(0,50,100) 0px 0px 5px"
        });
        editorFrame.addEventListener("load",function() {
            var editorDocument = editor.document = editorFrame.contentWindow.document;
            var cursor = editor.cursor = Cursor();
            $(editorDocument.body).css({
                padding: 0,
                margin: 0
            })
            editorDocument.body.appendChild(cursor);
            CSSEditor_Document_Init.call(editor);
            config.formatter.Init(editor);
            //Only call the ready callback once init is done!
            if (config.callback) {
                config.callback.call(elem,editor);
            }
        });
        return editorFrame;
    });
	//make the editor bindable
	Bindable.call(editor,{});
    return editor;
}
//The setup of the document
//@this editor
function CSSEditor_Document_Init() {
    var editor = this;
    var editorDocument = editor.document;
    editorDocument.addEventListener("paste", function(evt) {
        editor.InsertData(evt);
        evt.stopPropagation();
        evt.preventDefault();
    });
	editorDocument.defaultView.addEventListener("focus",function() {
        editor.cursor.Show();
        //Log.log("editor focus")
    })
    editorDocument.defaultView.addEventListener("blur",function() {
        editor.cursor.Hide();
		editor.UpdateValue();
        //Log.log("editor blur")
    })
    editorDocument.onkeydown=ProxyCall(editor.config.formatter,editor.config.formatter.OnKeyDown);
    //editorDocument.onkeyup=ProxyCall(editor.config.formatter,editor.config.formatter.OnKeyUp);
    editorDocument.onmousedown=ProxyCall(editor.config.formatter,editor.config.formatter.OnMouseDown);
    editorDocument.onmouseup=ProxyCall(editor.config.formatter,editor.config.formatter.OnMouseUp);
    editorDocument.onmouseover=ProxyCall(editor.config.formatter,editor.config.formatter.OnMouseOver);
    editorDocument.onclick=ProxyCall(editor.config.formatter,editor.config.formatter.OnClick);
    editor.cursor.Hide();
}
//@end csseditor
});
//@end collision wrapper