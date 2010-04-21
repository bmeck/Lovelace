Loader.Require("../../util/Css");
/*
	Package: TextArea
	Some common but hard to achieve functions attached to a *TextArea* element's prototype.

	Function: scrollToLine
	Attempt to move the TextArea's view port to have the specified line at the top.
	And yes the w3c is trying to ruin this, just like half the interfaces that allow complex calculation.

	Parameter:
		line - Line to scroll to based upon a 0 index system.
*/
HTMLTextAreaElement.prototype.scrollToLine=function(line) {
	var style=this.ownerDocument.defaultView.getComputedStyle(this);

	var lineHeight=style.getPropertyCSSValue('font-size').getFloatValue(CSSPrimitiveValue.CSS_PX);

	var lineHeightAdjust=style.getPropertyCSSValue('line-height')
	lineHeightAdjust=lineHeightAdjust.cssText=='normal'?1:lineHeightAdjust.getFloatValue(CSSPrimitiveValue.CSS_PX);

	var paddingAdjust=style.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX);

	this.scrollTop=line*lineHeight*lineHeightAdjust-paddingAdjust*2;
}
/*
	Function: scrollToChar
	Attempt to move the TextArea's view port to have the character index (0 based) at the top.
	And yes the w3c is trying to ruin this, just like half the interfaces that allow complex calculation.

	Parameter:
		line - Line to scroll to based upon a 0 index system.
*/
HTMLTextAreaElement.prototype.scrollToChar=function(index) {
	var container=document.createElement('div')
	var style=container.style
	style.margin='0'
	//style.left='10px';
	//style.top='10px';
	style.width=GetCSSValueInUnits(this,"width","px")+'px'//this.clientWidth-GetCSSValueInUnits(this,"padding-left","px")-GetCSSValueInUnits(this,"padding-right","px")+'px'
	style.height=GetCSSValueInUnits(this,"height","px")+'px'//this.clientHeight-GetCSSValueInUnits(this,"padding-top","px")-GetCSSValueInUnits(this,"padding-bottom","px")+'px'
	CopyCSS(container,textarea,[
		'line-height',
		'line-wrap',
		'line-spacing',

		'letter-spacing',

		'text-align',
		'text-indent',
		'text-wrap',

		'font-weight',
		'font-family',
		'font-size',

		'padding-top',
		'padding-left',
		'padding-right',
		'padding-bottom',

		'border-top-width',
		'border-left-width',
		'border-right-width',
		'border-bottom-width',

		'word-break',
		'word-wrap',

		'white-space',
		'overflow'
	])
	style.borderStyle="solid"
	style.overflow="hidden"
	style.position='fixed';

	var text=this.value.substring(0,index>this.value.length-1?this.value.length:index+1);
	container.appendChild(document.createTextNode(text.slice(0,-1)))

	var span=document.createElement('span');
	container.appendChild(span)
	this.parentNode.appendChild(container);

	span.innerText="a"
	var bounds = span.getClientRects()[0];

	span.innerText=text.slice(-1)

	this.scrollTop=span.offsetTop
	this.scrollLeft=span.offsetLeft
	this.parentNode.removeChild(container)
}
/*
	Function: find
	Attempt to find a pattern in this TextArea and highlight it.

	Parameter:
		pattern - Pattern to look for regular expressions will be treated as such, anything else besides *undefined* will be converted to a String.
		wrap - if after reaching the end it should try from the top
*/
HTMLTextAreaElement.prototype.find=function(pattern,wrap) {
	if(pattern===undefined) return;
	if(pattern instanceof RegExp) {
		var oldLastIndex=pattern.lastIndex;
		pattern.lastIndex=this.selectionEnd
		var match=pattern.exec(this.value);
		if(match){
			this.selectionStart=match.index;
			this.selectionEnd=match.index+match[0].length;
		}
		else if (wrap) {
			pattern.lastIndex=0
			match=pattern.exec(this.value.substring(0,this.selectionStart));
			if(match){
				this.selectionStart=match.index;
				this.selectionEnd=match.index+match[0].length;
			}
		}
		pattern.lastIndex=oldLastIndex;
	}
	else {
		pattern=String(pattern);
		var start=this.value.indexOf(pattern,this.selectionStart);
		if(start!=-1) {
			this.selectionStart=start;
			this.selectionEnd=start+pattern.length;
		}
		else if (wrap) {
			start=this.value.substring(0,this.selectionStart).indexOf(pattern);
			if(start!=-1) {
				this.selectionStart=start;
				this.selectionEnd=start+pattern.length;
			}
		}
	}
}
/*
	Function: replace
	Attempt to replace the current selection with a given text and highlight the replacement.

	Parameter:
		txt - Text to put in place of the current selection.
*/
HTMLTextAreaElement.prototype.replace=function(txt) {
	var oldSelectionStart=this.selectionStart;
	this.value=this.value.substring(0,this.selectionStart)+txt+this.value.substring(this.selectionEnd+1)
	this.selectionStart=oldSelectionStart;
	this.selectionEnd=oldSelectionStart+txt.length
}