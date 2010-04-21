Loader.Require("Util")
Loader.OnLoaded(function(){
//@param rect = {left:#,top:#,width:#,height:#}
PointInRect = function(x,y,rect){
    return (x - rect.left >= rect.width) && (y - rect.top >= rect.height);
}

//@return {
//  x: #//the offset of our point from the top-left of our view elem
//  y: #//the offset of our point from the top-left of our view elem
//  view: $//the scrollable elem that we found (might be a parent!)
//  oldX: #//scrollLeft previous to this function
//  oldY: #//scrollTop previous to this function
//}
ScrollViewToPoint = function (viewBase,x,y){
    var scrollParent = GetScrollingParent(viewBase)||viewBase.ownerDocument.body;
    
    var clientHeight = scrollParent.clientHeight;
    var clientWidth = scrollParent.clientWidth;
    
    //save old position
    var scrollTop = scrollParent.scrollTop;
    var scrollLeft = scrollParent.scrollLeft;
    var offX;//where in the client area the point is
    var offY;//where in the client area the point is
    
    //TODO: onscroll event stop?
    //TODO: nested scrolled views? {
    //    would mean recursive of this essentially up untild viewBase.ownerDocument.body is the scrollParent
    //}
    
    //@start scroll point into view
    //point is above view
    if (scrollTop > y) {
        scrollParent.scrollTop = y;
    }
    //point is bellow view
    else if (scrollTop + clientHeight < y) {
        scrollParent.scrollTop = y;
    }
    offX = x-scrollParent.scrollLeft;
    
    //point is left of view
    if (scrollLeft > x) {
        //Log.log("scrollLeft to ",x);
        scrollParent.scrollLeft = x;
    }
    //point is right of view
    else if (scrollLeft + clientWidth < x) {
        //Log.log("scrollLeft to ",x);
        scrollParent.scrollLeft = x;
    }
    offY = y-scrollParent.scrollTop;
    //@end scroll point into view
    
    return {
        x: offX,
        y: offY,
        view: scrollParent,
        oldX: scrollLeft,
        oldY: scrollTop
    }
}

UnscrollViews = function(scrollViews) {
    var scrollOff;
    while(scrollOff = scrollViews.pop()) {
        //Log.log("scrollLeft to ",scrollOff.oldX);    
        scrollOff.view.scrollLeft = scrollOff.oldX;
        scrollOff.view.scrollTop = scrollOff.oldY;
    }
}

//Get element in the currently scrollable area at the scrollable area's
//position x,y (can be outside of viewable area)
//@param preventUnscroll - do not scroll back to original view changes the
//  @return to {elem:$,scrollStack:[ScrollViewToPoint#return,]}
//  preventUnscroll can help keep scrolling to a minimum if you have lots of test of the element in some functions, but
//  be SURE to undo it if you mean to using UnscrollViews
ElementAtViewPoint = function (viewBase,x,y,preventUnscroll) {
    var scrollViews = [];//Array to save where our views are/how off our point is
    var body = viewBase.ownerDocument.body;
    var html = body.parentNode;
    
    var scrollOff;
    var view = GetScrollingParent(viewBase);
    do {
        if(!view) {
            view=html;
        }
        //Log.log(">>",view==html)
        scrollOff = scrollViews[scrollViews.length] = ScrollViewToPoint(view,x,y);
        var viewBoundingRect = view.getBoundingClientRect()
        x=viewBoundingRect.left+scrollOff.x;
        y=viewBoundingRect.top+scrollOff.y;
        if(view == html) {
            break;
        }
        view = GetScrollingParent(scrollOff.view.parentNode);
        
    } while (true)
    
    var scrollParentBoundingRect = view.getBoundingClientRect();
    //Log.log(getComputedStyle(view).marginTop);
    //Log.log(scrollOff,scrollParentBoundingRect);
    var element = viewBase.ownerDocument.elementFromPoint(
        scrollParentBoundingRect.left+scrollOff.x-getComputedStyle(view).marginLeft,
        scrollParentBoundingRect.top+scrollOff.y-getComputedStyle(view).marginTop);
    
    if(preventUnscroll) {
        return {elem:element,scrollStack:scrollViews};
    }
    
    //undo our havoc
    UnscrollViews(scrollViews);
    
    //easy no?
    return element;
}

//Grabs the first parent of elem that has clipped content
GetScrollingParent = function(elem) {
    if(!elem&&!elem.ownerDocument&&!elem.body) {
		//Log.log("?")
        return;
    }
    var body = elem.body?elem.body:elem.ownerDocument.body;
    var html = body.parentNode;
    do {
        if (elem == html) {
            if (HasScrolling(elem)) {
                return elem;
            }
            else {
                //Log.log("found HTML but not scrolling");
                return;
            }
        }
        else if (!elem.parentNode) {
            return html;
        }
        elem = elem.parentNode;
        if (!elem) {
            console.error("Node outside of a html document.");
            return html;
        }
    }
    while ( !HasScrolling(elem) )
    return elem;
}

//Determines if this element has overflow that is clipped
HasScrolling = function(elem) {
    if(!elem||!elem.ownerDocument) {
        Log.log("__FILE__")
        console.warn("Given no element.");
        return;
    }
    return elem.clientHeight != elem.scrollHeight || elem.clientWidth != elem.scrollWidth;
}

MoveElemToViewPoint = function(cursor,x,y,target) {
    var insertPoint = target?target:ElementAtViewPoint(cursor,x,y);
	if(cursor == insertPoint) return;//lol
    var body = insertPoint.ownerDocument.body;
    var html = body.parentNode;
    
    if (insertPoint == html) {
        insertPoint=body
    }
    
    var probableElem;//Since we might click to the right of an element and want that line be ready to save it
    //Log.log(insertPoint)
    insertPoint.normalize();//want it to be clutterless if possible multiline
    for (var i = 0; i < insertPoint.childNodes.length; i++) {
        var elem = insertPoint.childNodes[i];
        if (elem.nodeType == 3/*TEXT_NODE*/) {
            
            var bounds = WrappedBoundingRect(elem);
            //Log.log(bounds,y)
            if (bounds.top <= y && bounds.bottom >= y) {
                //Log.log("FOUND TEXT_NODE");
                probableElem = elem;
                if (bounds.left <= x && bounds.right >= x) {
                    //Log.log("FOUND FULL CONTAINER");
                    break;
                }
            }
            else if(probableElem) {
                break;
            }  
        }
        else if (elem.nodeName=="BR"
        && ((!elem.previousSibling) || (elem.previousSibling && elem.previousSibling.nodeName == "BR"))) {
            elem.parentNode.insertBefore(cursor,elem);
            bounds = cursor.getBoundingClientRect();
            if (bounds.top <= y && bounds.bottom >= y) {
                //Log.log("FOUND PROPER BREAK");
                return;
            }
        }
    }
    if (probableElem) {
        //elem.parentNode.insertBefore(editor.cursor,elem);
        //do it char by char... oh yea...
        while (probableElem.length >= 1) {
            probableElem=probableElem.splitText(1);
            bounds = WrappedBoundingRect(probableElem.previousSibling);
            //Log.log(probableElem.previousSibling.nodeValue,bounds,evt.cliendX,evt.clientY)
            if (bounds.top <= y && bounds.bottom >= y
            && bounds.left <= x && bounds.right >= x) {
                //Log.log("FOUND CHAR");
                insertPoint.insertBefore(cursor,probableElem.previousSibling);

                return;
            }
        }
        if (probableElem.parentNode.lastChild==probableElem) {
            probableElem.parentNode.appendChild(cursor);
        }
        else {
            probableElem.parentNode.insertBefore(cursor,probableElem.nextSibling)
        }
    }
	else {
		insertPoint.appendChild(cursor);
	}
}
});