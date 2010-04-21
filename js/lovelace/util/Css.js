/*
	Function: GetCSSValueInUnits
	Attempts to find a property of an element's style in a specified unit.
	
	Parameters:
		elem -
		value - 
		unit -
*/
GetCSSValueInUnits=function(elem,property,unit){
	var style=elem.ownerDocument.defaultView.getComputedStyle(elem);
	return style.getPropertyCSSValue(property).getFloatValue(CSSPrimitiveValue.CSS_PX);
}
CopyCSS=function(elem,fromElem,properties) {
	var style=fromElem.ownerDocument.defaultView.getComputedStyle(fromElem);
	for(var i=0;i < properties.length;i++) {
		elem.style[properties[i]]=style.getPropertyValue(properties[i])
	}
}