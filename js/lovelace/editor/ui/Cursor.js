Loader.Require("../../util/Location");

Loader.OnLoaded(function(){
//@start cursor
//Need to make a false cursor to help with events in our rich text editor
var second = 1000;
//second in terms of interval argument
Cursor = function() {
    var cursor = document.createElement("rtf:cursor");
	//var blinker=document.createElement("span");
	//cursor.appendChild(blinker)
	//var spacer=document.createElement("span");
	//spacer.appendChild(document.createTextNode(" "))
	//spacer.style.display="none";
	//cursor.appendChild(spacer)
    var blinking = true;
    cursor.Hide = function() {
        //Log.log("Hide called by",cursor.Hide.caller)
        blinking = false;
        cursor.style.visibility = "hidden";
    }
    cursor.Show = function() {
        blinking = true;
        cursor.style.visibility = "visible";
    }
    //style the cursor
    $(cursor).css({
        display: "inline-block",
		borderLeft: "1px solid black",
		position:"absolute",
		height:"1em",
		width:"1px",
		verticalAlign: "top"
    });
    //make the cursor blink
    setInterval(function(){
        if (!blinking) {
            return;
        }
        switch (cursor.style.visibility) {
            case "hidden":
                cursor.Show();
                break;
            default:
                cursor.style.visibility = "hidden";
                break;
        }
    },0.5*second);
    //Move offset number of characters (negative is left, positive is right)
    cursor.MoveBy = function(offset) {
        var direction = offset > 0 ? 1 : -1;
        offset = Math.abs(offset);
        
        var elemPointer = cursor;
        var body = cursor.ownerDocument.body;
        while(offset > 0) {
            if((direction==-1 && body.firstChild==cursor) ||
                (direction==1 && body.lastChild==cursor)) {
                return;
            }
            else {
                var consumed = direction==-1?cursor.NudgeLeft():cursor.NudgeRight();
                if(isNaN(consumed) == false) offset -= 1;
            }
        }
    }
    cursor.MoveTo = function(elem,offset) {
        var range = cursor.ownerDocument.createRange();
        range.setStart(elem,offset);
        range.insertNode(cursor);
    }
    //Attempts to move 1 element or character to the left (innermost traversal)
    //@return true if a character was consumed
    cursor.NudgeLeft = function() {
        cursor.parentNode.normalize();
        var elemPointer = cursor.previousSibling;
        var offset = 0;
        var body = cursor.ownerDocument.body;
        while(true) {
            switch (elemPointer?elemPointer.nodeType:null) {
                case 3:/*TEXT_NODE*/
                    if(elemPointer.length > 0) {
                        cursor.MoveTo(elemPointer,elemPointer.length-1);
                        return true;
                    } else {
                        elemPointer.parentNode.insertBefore(cursor,elemPointer);
                        //return;//Skip over empty text nodes, dont count them as a nudge
                    }
                    break;
                case 1:/*ELEMENT_NODE*/
                    switch(elemPointer.tagName) {
                        //List of singleton tags (cannot have children)
						case "IMG":
						case "HR":
                        case "BR":
                            elemPointer.parentNode.insertBefore(cursor,elemPointer);
                            return true;
                    }
                    elemPointer.appendChild(cursor);
                    return;
                case null:
                    if(cursor.parentNode != body) {
                        cursor.parentNode.parentNode.insertBefore(cursor.parentNode,cursor);
                    }
                    return;
            }
            elemPointer = cursor.previousSibling;
        }
    }
    //Attempts to move 1 element or character to the right (innermost traversal)
    //@return true if a character was consumed
    cursor.NudgeRight = function() {
        cursor.parentNode.normalize();
        var elemPointer = cursor.nextSibling;
        var offset = 0;
        var body = cursor.ownerDocument.body;
        while(true) {
            switch (elemPointer?elemPointer.nodeType:null) {
                case 1:/*ELEMENT_NODE*/
                    //Log.log("ELEMENT_NODE")
                    switch(elemPointer.tagName) {
                        //List of singleton tags (cannot have children)
						case "IMG":
						case "HR":
                        case "BR":
                            if(cursor.nextSibling.nextSibling != null) {
                                cursor.parentNode.insertBefore(cursor,cursor.nextSibling.nextSibling);
                            }
                            else {
                                cursor.parentNode.appendChild(cursor);
                            }
                            return true;
                    }
                    if (elemPointer.childCount > 0) {
                        elemPointer.insertBefore(cursor,elemPointer.firstChild);
                    }
                    else {
                        //Log.log(elemPointer)
                        elemPointer.appendChild(cursor);
                    }
                    return;
                case null:
                    //Log.log("NULL")
                    if(cursor.parentNode != body) {
                        if(cursor.parentNode.nextSibling != null) {
                            cursor.parentNode.parentNode.insertBefore(cursor,cursor.parentNode.nextSibling);
                        }
                        else {
                            cursor.parentNode.parentNode.appendChild(cursor);
                        }
                    }
                    return;
                case 3:/*TEXT_NODE*/
                    if(elemPointer.length > 0) {
                        //Log.log("TEXT_NODE '",elemPointer.data.charCodeAt(0),"'")
                        cursor.MoveTo(elemPointer,1);
                        return true;
                    } else {
                        elemPointer.parentNode.insertBefore(elemPointer,cursor);
                        //return;//Skip over empty text nodes, dont count them as a nudge
                    }
            }
            elemPointer = cursor.nextSibling;
        }
    }
    
    cursor.MoveToTop = function() {
        var scrollParent=GetScrollingParent(cursor);
Log.log(168,scrollParent,cursor)
        scrollParent.insertBefore(cursor,scrollParent.firstChild)
    }
    
    cursor.MoveToBottom = function() {
        var scrollParent=GetScrollingParent(cursor);
        scrollParent.appendChild(cursor)
    }
    
    //Attempts to move the cursor... up
    //Gathers the element at the points above the cursor currently that is a parent of the cursor
    //Finds this parent as the first parentNode that has getBoundingClientRect() that is different than ours
    //TODO: how to deal with containers? --use nudgeup
    cursor.MoveUp = function() {  
        var cursorBounds = cursor.getBoundingClientRect();      
        var x = cursorBounds.left;
        var y = cursorBounds.top;
        var body = cursor.ownerDocument.body;
        var i=0;
        do {
            cursor.MoveBy(-1);
            cursorBounds = cursor.getBoundingClientRect();
            //Log.log(++i,cursorBounds.left,x," : ",cursorBounds.top,y);
            if(cursor == body.firstChild) {
                return;
            }
        } while(cursorBounds.left > x || cursorBounds.top >= y)
    }
    cursor.MoveDown = function() {  
        var cursorBounds = cursor.getBoundingClientRect();      
        var x = cursorBounds.left;
        var y = cursorBounds.top+cursor.offsetHeight;
        var body = cursor.ownerDocument.body;
        var i=0;
        do {
            cursor.MoveBy(1);
            cursorBounds = cursor.getBoundingClientRect();
            //Log.log(++i,cursorBounds.left,x," : ",cursorBounds.top,y);
            if(cursor == body.lastChild) {
                return;
            }
        } while(cursorBounds.left < x || cursorBounds.top <= y)
    }
	cursor.ScrollIntoView=function() {
		var cursorBounds=cursor.getBoundingClientRect();
        var scrollingParent = GetScrollingParent(cursor)||cursor.ownerDocument.body;
        ScrollIntoHorizontal(scrollingParent,cursorBounds);
        ScrollIntoVertical(scrollingParent,cursorBounds);
	}
    return cursor;
}


//@end cursor
});