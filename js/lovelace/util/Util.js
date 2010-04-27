ScrollIntoVertical = function(elem,bounds) {
    if(!elem) return;
//Log.log(Object(elem),bounds)
    if (bounds.top < 0) {
        elem.scrollTop+=bounds.top
    }
    else if (bounds.bottom > elem.clientHeight) {
        elem.scrollTop+=bounds.bottom-elem.clientHeight;
    }
}

ScrollIntoHorizontal = function(elem,bounds) {
    if(!elem) return;
    if (bounds.left < 0) {
        elem.scrollLeft+=bounds.left;
    }
    //Wrapped
    else if (bounds.right > elem.clientWidth - 20) {
        elem.scrollLeft = elem.scrollLeft + bounds.right - elem.clientWidth + 20;//Scroll a lil extra to see whats past it
    }
}

ProxyCall = function(thisObj,func) {
    return function(){
        func.apply(thisObj,arguments)
    }
}

WrappedBoundingRect = function(elem) {
    var range = elem.ownerDocument.createRange();
    //yes... we need all of this...
    var wrapper = elem.ownerDocument.createElement("span");
    wrapper.style.margin = "0";
    wrapper.style.padding = "0";
    wrapper.style.display = "inline";
    wrapper.style.position = "relative";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = "";
    wrapper.style.height = "";

    range.selectNode(elem);
    range.surroundContents(wrapper);
    var bounds = wrapper.getBoundingClientRect()

    range.selectNodeContents(wrapper);
    elem = range.extractContents();
    range.selectNode(wrapper);
    range.insertNode(elem);
    wrapper.parentNode.removeChild(wrapper);

    return bounds;
}

