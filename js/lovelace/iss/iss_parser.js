var debug={
	block:{open:false,close:false,tokens:false}
	,mapping:false
}

function iss(src) {
	var index=0,token;
	var str=src;
	do {
		token=readToken(str,index);
		console.log(token);
		if(!token) {
			break;
		}
		index+=token.length;
		str=str.substring(token.length)
	} while(true)
}

function readToken(str,index) {
	return readWhitespace(str,index)
	|| readComment(str,index)
	|| readMapping(str,index)
	|| readBlock(str,index)
	|| readSelector(str,index)
	|| readMeta(str,index)
}

var whitespace_matcher=/^[\n\r\t\f\s]+/
function readWhitespace(str,index) {
	var match=whitespace_matcher.exec(str)
	//console.log(str,match)
	if(match) {
		return {
			start: index
			,length: match[0].length
			,match: match
			,type: "whitespace"
		}
	}
}

//(1) = comment text
var comment_matcher=/^\/\*((?:[\*][^\/]|.|\n)*)\*\//
function readComment(str,index) {
	var match=comment_matcher.exec(str);
	if(match) {
		return {
			start: index
			,length: match[0].length
			,match: match
			,type: "comment"
		}
	}
}

//CSS does not force identifiers to not have 0 in the front
var identifier_matcher=/^[\d\w_-]+/
function readIdentifier(str,index) {
	var match=identifier_matcher.exec(str);
	if(match) {
		return {
			start: index
			,length: match[0].length
			,match: match
			,type: "identifier"
		}
	}
}

function readBlockOpen(str,index) {
	if(debug.block.open) console.log(str)
	if(str.charAt(0)=="{") {
		return {
			start: index
			,length: 1
			,match: ["{"]
			,type: "block-open"
		}
	}
}

function readBlockClose(str,index) {
	if(debug.block.close) console.log(str)
	if(str.charAt(0)=="}") {
		return {
			start: index
			,length: 1
			,match: ["}"]
			,type: "block-close"
		}
	}
}

function readBlock(str,index) {
	var token=readBlockOpen(str,index);
	if(!token) {
		return;
	}
	var match=[token];
	var looking_index=token.length;
	do {
		token=readToken(str.substring(looking_index),index+looking_index)
		if(debug.block.tokens) console.log(token)
		if(!token) {
			token=readBlockClose(str.substring(looking_index),index+looking_index);
			if(!token) {
				return;
			}
			looking_index+=token.length;
			match.push(token);
			break;
		}
		looking_index+=token.length;
		match.push(token);
	} while(true)


	match.unshift(str.substring(0,looking_index))
	return {
		start: index
		,length: looking_index
		,match: match
		,type: "block"
	}
}


function readMappingOperator(str,index) {
	if(debug.mapping) console.log(str)
	if (str.charAt(0)==":") {
		return {
			start: index
			,length: 1
			,match: [":"]
			,type: "mapping-operator"
		}
	}
}
function readMapping(str,index) {
	var token=readIdentifier(str,index);
	if(debug.mapping) console.log(token);
	if(!token) {
		return;
	}
	var match=[token];
	var looking_index=token.length;

	token=readMappingOperator(str.substring(looking_index),index+looking_index);
	if(debug.mapping) console.log(token);
	if(!token) {
		return;
	}

	looking_index+=token.length;
	match.push(token);

	token=readIdentifier(str.substring(looking_index),index+looking_index);
	if(debug.mapping) console.log(token);
	if(!token) {
		return;
	}
	looking_index+=token.length;
	match.push(token);

	match.unshift(str.substring(0,looking_index))
	return {
		start: index
		,length: looking_index
		,match: match
		,type: "mapping"
	}
}

function readUniversal() {
	if (str.charAt(0)=="*") {
		return {
			start: index
			,length: 1
			,match: ["*"]
			,type: "selector-universal"
		}
	}
}
function readSelectorId() {
	/[#][\d\w\-_]*/
}
function readSelectorClass() {
	/[.][\d\w\-_]*/
}
function readSelectorPseudoClass() {
	/[:][\d\w\-_]*/
}
function readSelectorTagName() {
	readIdentifier()
}
function readSelectorPseudoElement() {
	/[:]{2}[\d\w\-_]*/
}
function readSelectorAttribute() {
	"[" /?/ "=" /?/ "]"
}
function readSelectorFunction() {
	/\w[\d\w]*\(/
		readArguments()
	")"
}
function readSelector(str,index) {
	var token=readIdentifier(str,index) || readUniversal()
	if (!token) {
		return;
	}
	return {
		start: index
		,length: token.length
		,match: [token]
		,type: "selector"
	}
}

function readSelectorList() {
	readSelector()
	"," readSelector()
}

function readMetaOperator(str,index) {
	if(debug.meta) console.log(str)
	if (str.charAt(0)=="@") {
		return {
			start: index
			,length: 1
			,match: ["@"]
			,type: "meta-operator"
		}
	}
}
function readMeta(str,index) {
	var token=readMetaOperator(str,index)
	if (!token) {
		return;
	}
	var match=[token];
	var looking_index=token.length;

	token=readIdentifier()
	if (!token) {
		return;
	}
	looking_index+=token.length;
	match.push(token)

	//Statement | SelectorBlock | Block | Value?

	match.unshift(str.substring(0,looking_index))
	return {
		start: index
		,length: looking_index
		,match: match
		,type: "mapping"
	}
}