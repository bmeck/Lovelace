Loader.Require("Parser.js")
Loader.OnLoaded(function(){
var space=/\t\f\r\n[ ]/;
var eatlineSpaceOnly=/\t\f[ ]/;
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

var descendantCombinator=RegexCombination(space).clone();
var directChildCombinator=">";
var nextSiblingCombinator="+";
var followingSiblingCombinator="~";
//var reverseCombinator="&";
var combinator=RegexCombination.any(
	descendantCombinator
	,directChildCombinator
	,nextSiblingCombinator
	,followingSiblingCombinator
);
var tag=RegexCombination(identifier).clone();
var id=RegexCombination.concat(
	"#"
	,identifier
);
var className=RegexCombination.concat(
	"."
	,identifier
);
var pseudoClass=RegexCombination(":"
	,RegexCombination.any(
		identifier
		//,functionCall
	)
);
var pseudoElement=RegexCombination("::"
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
).repetition();
var selectorList=RegexCombination.concat(
	selector
	,RegexCombination.concat(
		","
		,selector
	).repetition()
);


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
	value
	,RegexCombination.concat(
		RegexCombination.any(",",space)
		,value
	)
)

var modifierOperator="!";
var modifier=RegexCombination.concat(
	modifierOperator
	,identifier
);

var mappingOperator=":";
var mapping=RegexCombination(
	identifier
	,mappingOperator
	,valueList
	,modifier.repetition()
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


css.any(meta,selectorBlock).repetition()
css.optimize();
});