Loader.Require("../util/Input");
Loader.Require("../util/Location");
Loader.Require("../util/Util");
Loader.Require("../data/mime/DefaultConverter")

PlainTextFormatter = function(editor) {
    return {
        Init: function(editor) {
            editor.document.body.style.whiteSpace = "pre";
			editor.document.body.style.fontFamily = "monospace";
        },

        FromValue: function(data,editor) {
            editor.document.body.innerText = "";
            editor.InsertData(data);
        },
        
        ToValue: function(editor) {
            //Log.log(editor.document.body.innerText);
            return editor.document.body.innerText;
        },
        
        FormatData: function(data,editor) {
			data=new Data(data)
			if(!data.data) {
				return;
			}
            data=new Data(data).ConvertToMime("dom/document-fragment");
			return data;
        },
        
        DeleteFormatData: function(editor) {
			//?
        },
        OnKeyDown: function(evt) {
			DefaultKeyDown.call(editor,evt)
		},
        OnMouseDown: function(evt) {
            if(evt.button==0) {
                editor.cursor.Hide();
				MoveElemToViewPoint(editor.cursor,evt.clientX,evt.clientY);
			}
        },
        OnMouseUp: function(evt) {
            editor.cursor.Show();
        },
        OnMouseOver: function(evt) {
            editor.cursor.Show();
        },
        OnClick: function (evt) {
            MoveElemToViewPoint(editor.cursor,evt.clientX,evt.clientY);
        }
    }
}