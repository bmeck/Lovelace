Loader.Require("Parser.js")
Loader.OnLoaded(function(){
var space=/[\t\f\r\n\ ]/;
var spaces=/[\t\f\r\n\ ]+/
var eatSpace=/[\t\f\r\n\ ]*/
var eatlineSpaceOnly=/(?:\t\f[ ])*/;
var eatline=/[^\n]*/;
var identifier=/[0-9a-zA-Z_\-]+/
css=RegexCombination();
/*css.lex("\n",function(){
	...
})*/


var metaOperator="@";
var meta=RegexCombination.concat(
	metaOperator
	,identifier
	,eatlineSpaceOnly
	,RegexCombination.any(
		";"
		,"\n"
	)
);

var directChildCombinator=RegexCombination.concat(eatSpace,">",eatSpace).callback(function(result){
	var str=result[1][0][0];
	return {
		combinator:str
		,lastIndex:str.length
	};
});
var nextSiblingCombinator=RegexCombination.concat(eatSpace,"+",eatSpace).callback(function(result){
	var str=result[1][0][0];
	return {
		combinator:str
		,lastIndex:str.length
	};
});
var followingSiblingCombinator=RegexCombination.concat(eatSpace,"~",eatSpace).callback(function(result,input){
	var str=result[1][0][0];
	return {
		combinator:str
		,lastIndex:str.length
	};
});
var descendantCombinator=RegexCombination.concat(space,eatSpace).callback(function(result,input){
	var str=result[0][0][0];
	return {
		combinator:str
		,lastIndex:str.length
	};
});
//var reverseCombinator="&";
var combinator=RegexCombination.any(
	directChildCombinator
	,nextSiblingCombinator
	,followingSiblingCombinator
	,descendantCombinator
).callback(function(result){
	console.log(result)
	return result;
});
var tag=RegexCombination.any(
	"*"
	,identifier
).callback(function(result){
	var str=result[0][0][0];
	return {
		tag:str
		,lastIndex:str.length
	};
});
var id=RegexCombination.concat(
	"#"
	,identifier
);
var className=RegexCombination.concat(
	"."
	,identifier
).callback(function(result) {
	var str=result[1][0][0];
	return {
		className:str
		,lastIndex:str.length+1
	};
});
var pseudoClass=RegexCombination.concat(":"
	,RegexCombination.any(
		identifier
		//,functionCall
	)
);
var pseudoElement=RegexCombination.concat("::"
	,RegexCombination.any(
		identifier
		//,functionCall
	)
);

var selector=RegexCombination.any(
	combinator
	,tag
	,id
	,className
	,pseudoClass
	,pseudoElement
).repetition(1);
var selectorList=RegexCombination.concat(
	selector
	,RegexCombination.concat(
		","
		,selector
	).repetition()
).callback(function(result){
	//console.log(result);
	return result;
});


var arbitrary=RegexCombination(identifier).clone()
var number=/\d+[.]?\d*|[.]\d+/;
var em=RegexCombination.concat(number,"em");
var ex=RegexCombination.concat(number,"em");
var px=RegexCombination.concat(number,"em");
var percent=RegexCombination.concat(number,"em");
var ch=RegexCombination.concat(number,"ch");
var magnitude=RegexCombination.any(
	em
	,ex
	,px
	,percent
	,number
	,ch
);
var string=/'(?:\\.|[^'])*'|"(?:\\.|[^"])*"/
var hexColor=/[#]\d{3}(?:\d{3})?/
var rgbColor=RegexCombination.concat(
	"rgb("
	,number
	,RegexCombination.concat(
		","
		,number
	).repetition(2)
	,")"
)
var rgbaColor=RegexCombination.concat(
	"rgba("
	,number
	,RegexCombination.concat(
		","
		,number
	).repetition(3)
	,")"
)
var color=RegexCombination.any(
	hexColor
	,rgbColor
	,rgbaColor
	,arbitrary
)
var value=RegexCombination.any(
	arbitrary
	,magnitude
	,string
	,color
);
var valueList=RegexCombination.concat(
	eatSpace
	,value
	,RegexCombination.concat(
		RegexCombination(spaces).repetition(0,1)
		,RegexCombination(",").repetition(0,1)
		,eatSpace
		,value
	).repetition()
)

var modifierOperator="!";
var modifier=RegexCombination.concat(
	modifierOperator
	,identifier
);

var mappingOperator=":";
var mapping=RegexCombination.concat(
	identifier
	,mappingOperator
	,valueList
	,modifier.clone().repetition()
);
var mappingList=RegexCombination.concat(
	mapping
	,RegexCombination.concat(
		";"
		,mapping
	).repetition()
);

var block=RegexCombination.concat(
	"{"
	,mappingList
	,"}"
);
var selectorBlock=RegexCombination.concat(selectorList,block);


css.any(
	//meta
	/*,*/selectorBlock
).repetition()//.optimize()
console.log(css)
});