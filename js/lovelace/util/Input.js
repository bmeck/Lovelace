Loader.Require("Location")
Loader.Require("../data/mime/DefaultConverter")
Loader.OnLoaded(function(){
DefaultKeyDown = function(evt) {
	if(evt.crtlKey||evt.metaKey)return;
    var keycode = evt.which;
    switch(keycode) {
        case 8: //Backspace;
            evt.preventDefault();
            evt.returnValue = false;
            this.DeleteData(-1);
			this.cursor.ScrollIntoView();
            return false;
        case 12: //Clear - only remove selection
            this.selection.deleteContents();
            break;
        case 33: //PageUp;
            {
                var cursor=this.cursor;
                var scrollParent=GetScrollingParent(cursor);
                scrollParent.scrollTop=scrollParent.scrollTop-scrollParent.clientHeight;
            }
            evt.preventDefault();
            return;
        case 34: //PageDown;
            {
                var cursor=this.cursor;
                var scrollParent=GetScrollingParent(cursor);
                scrollParent.scrollTop=scrollParent.scrollTop+scrollParent.clientHeight;
            }
            evt.preventDefault();
            return;
        case 35: //End;
			this.cursor.MoveToBottom();
			break;
        case 36: //Home;
			this.cursor.MoveToTop();
			break;
        case 37: //Left;
            this.cursor.MoveBy(-1);
            //scroll into view
            {
                this.cursor.ScrollIntoView();
            }
            evt.preventDefault();
            return;
        case 38: //Up;
            this.cursor.MoveUp();
            //scroll into view
            {
                this.cursor.ScrollIntoView();
            }
            evt.preventDefault();
            return;
        case 39: //Right;
            this.cursor.MoveBy(1);
            //scroll into view
            {
                this.cursor.ScrollIntoView();
            }
            evt.preventDefault();
            return;
        case 40: //Down;
            this.cursor.MoveDown();
            //scroll into view
            {
                this.cursor.ScrollIntoView();
            }
            evt.preventDefault();
            return;
        case 46: //Delete;
            this.DeleteData(1);
			this.cursor.ScrollIntoView();
            evt.preventDefault();
            return;
    }
    
    /*TODO KEY BINDINGS*/
    var txt = DefaultConverter.ConvertToMime("dom/document-fragment",evt);
	//Log.log(txt)
	//Log.log(txt.data)
    if(txt&&txt.data) {
        evt.preventDefault();
        this.InsertData(txt);
		this.cursor.ScrollIntoView();
    }
}
DefaultDeleteData = function(toOffset,editor) {
	var direction = toOffset < 0? -1 : 1;
    toOffset = Math.abs(toOffset);
    var elem = direction == -1?editor.cursor.previousSibling:editor.cursor.nextSibling;
    var scrollParent = GetScrollingParent(editor.cursor)||editor.cursor.ownerDocument.body;
    while(toOffset > 0) {
        if(!elem) return;
        //Log.log(elem)
        if (elem) {
            if(elem.nodeType == 3 /*TEXT_NODE*/) {
                if(elem.nodeValue.length > 0) {
                    //Log.log(elem.nodeValue.charCodeAt(0),"?")
                    elem.nodeValue = direction==-1?elem.nodeValue.slice(0,-1):elem.nodeValue.substring(1);
                    toOffset--;
                }
                else {
                    var emptyTextElem = elem;
                    elem = direction == -1?elem.previousSibling:elem.nextSibling;
                    emptyTextElem.parentNode.removeChild(emptyTextElem)
                    //Log.log(elem,"76")
                    if(!elem) return;
                    continue;
                }
            }
            else{
                //Log.log(elem)
                if(elem.nodeType == 1 && elem.nodeName=="BR") {
                    var brElem = elem;
                    elem = direction == -1?elem.previousSibling:elem.nextSibling;
                    brElem.parentNode.removeChild(brElem)
                    toOffset--;
                    if(!elem) return;
                    continue;
                }
            }
        }
        else {
            if(direction == -1) {
                editor.cursor.NudgeLeft();
            }
            else {
                editor.cursor.NudgeRight();
            }
            //toOffset--;//how should it be?
        }
        elem = direction == -1?elem.previousSibling:elem.nextSibling;
    }
}

});