//TODO: add lexer callbacks based upon a regex to match
(function(){
//Whew constructor mayhem
function global() {
	return this;
}
//
//	Class: RegexCombination
//	A means for combining regular expressions predictably and between browsers,
//  Recursions is supported but not safeguarded, so be careful!
//
//  EXPORT : made to keep the singleton method available
RegexCombination=function(Regex_or_String) {
	if(this!=global()) {
		throw("New not allowed!");
	}
	if(Regex_or_String
	&& Regex_or_String instanceof _RegexCombination) {
		return Regex_or_String;
	}
	return new _RegexCombination(Regex_or_String);
}
RegexCombination.any=function() {
	var rec=RegexCombination()
	rec.any.apply(rec,arguments);
	return rec;
}
RegexCombination.concat=function() {
	var rec=RegexCombination()
	rec.concat.apply(rec,arguments);
	return rec;
}
RegexCombination.repetition=function() {
	var rec=RegexCombination()
	rec.repitition.apply(rec,arguments);
	return rec;
}


//
//  The private constructor for RegexCombination
//  Separate so that casting works
//
var id_next=0
function _RegexCombination(Regex_or_String){
	var $this=this;
	if(Regex_or_String) {
		if (Regex_or_String instanceof RegExp) {
			var dup=RegExp("^"+Regex_or_String.source,/*RegExpFlags(Regex_or_String)+*/"g")
			$this.nodes=[dup];
		}
		else {
			$this.nodes=[RegExp("^"+RegexEscape(String(Regex_or_String)),"g")];
		}
	}
	else {
		$this.nodes = [];
	}
	$this.id=id_next++;
	$this.type = "Concat";//"Any"|"Concat"|"Repitition"
	$this.callbacks = [];//On instance not related to nodes, done post
	$this.pure_callbacks = [];
	$this.cloning= true;
	return $this;
}

//  performs a copy of a RegexCombination
//  Properties:
//    deep -
//    cloneRegExp -
_RegexCombination.prototype.clone = function(deep,cloneRegExp,overwritable) {
	if (overwritable && ! overwritable instanceof _RegexCombination) {
		throw "overwritable must be a regexcombination";
	}
	var $this=this;
	var clone=overwritable||new _RegexCombination();
	clone.type=$this.type;
	clone.cloning=$this.cloning;
	//need to make a copy, otherwise... oddities
	clone.callbacks=$this.callbacks.slice();
	if(deep) {
		var nodes=$this.nodes;
		for(var i=0;i<$this.nodes.length;i++) {
			var node=nodes[i];
			if(nodes instanceof _RegexCombination) {
				nodes.push(node.clone(true,cloneRegExp));
			}
			else {
				nodes.push(cloneRegExp?
					cloneRegExp()
					:node
				);
			}
		}
	}
	else {
		clone.nodes=$this.nodes;
	}
	return clone;
}


_RegexCombination.prototype.join = function(delimiter) {
	var $this=this.cloning?this.clone():this;
	var child=$this.clone();
	$this.type="Concat";
	$this.cloning=true;
	$this.callbacks=[];
	$this.nodes=[child,RegexCombination(delimiter,child).repitition()];
	return $this;
}


//
//	Returns a RegexCombination that has a type of Concat containing itself and the arguments,
//	if the current RegexCombination is not of type concat it will be cast to a concat,
//	and the original values will be put inside of a child node
//
_RegexCombination.prototype.concat = function(/*args*/) {
	var args=[],len=0,$this=this;
	for(;len<arguments.length;len++) {
		var part=args[len];
		if(part instanceof _RegexCombination && part.cloning) {
			args[len]=part.clone();
		}
		else {
			args[len]=RegexCombination(arguments[len]);
		}
	}
	if($this.type != "Concat") {
		if($this.nodes.length) {
			var child=RegexCombination();
			child.type=$this.type;
			child.nodes=$this.nodes;
			child.callbacks=$this.callbacks;
			args.unshift(child);
		}

		$this.type="Concat";
		$this.nodes=args;
		$this.callbacks=[];
		return $this;
	}
	else {
		$this.nodes=$this.nodes.concat(args);
		return $this;
	}
}

//
//	Returns a RegexCombination that has a type of Any containing itself and the arguments,
//	if the current RegexCombination is not of type concat it will be cast to a concat,
//	and the original values will be put inside of a child node
//
_RegexCombination.prototype.any = function(/*args*/) {
	var args=[],len=0,$this=this;
	for(;len<arguments.length;len++) {
		var part=args[len];
		if(part instanceof _RegexCombination && part.cloning) {
			args[len]=part.clone();
		}
		else {
			args[len]=RegexCombination(arguments[len]);
		}
	}
	if($this.type != "Any") {
		if($this.nodes.length) {
			var child=RegexCombination();
			child.type=$this.type;
			child.nodes=$this.nodes;
			child.callbacks=$this.callbacks;
			args.unshift(child);
		}

		$this.type="Any";
		$this.nodes=args;
		$this.callbacks=[];
		return $this;
	}
	else {
		$this.nodes=$this.nodes.concat(args);
		return $this;
	}
}


//
//	Returns a RegexCombination that wraps the current one
//  lower < 0 = 0
//  upper == Number.infitity = unbounded
//  TODO: Implement in match!
_RegexCombination.prototype.repetition = function(lower,upper) {
	var $this=this;
	if($this.nodes.length) {
		var child=RegexCombination();
		child.type=$this.type;
		child.nodes=$this.nodes;
		child.callbacks=$this.callbacks;
		$this.nodes=[child];
	}
	else {
		$this.nodes=[];
	}

	$this.type="Repetition";
	$this.lower=Number(lower||0);
	$this.upper=Number(upper||Infinity);
	$this.callbacks=[];
	return $this;
}

function handleCallback(rec) {
	;
}

//
//   if a callback returns anything except undefined it will replace it's parsetree with an array of all the returns
//   the parse tree of a node is available to callbacks through the this object
_RegexCombination.prototype.callback = function(callbackFunction,argumentMap) {
	var $this=this;
	$this.callbacks.push(callbackFunction);
	return $this;
}

//
//  Adds a callback who does not have side effects on the parse (its return value is ignored)
//
_RegexCombination.prototype.pureCallback = function(callback) {

}

//  Function: match
//  Parameters:
//    str - the string that should be matched against
//    depth - used for debugging
_RegexCombination.prototype.match = function(str,depth) {
	var $this=this;
	depth=depth||0;
	var viewing_str=str
	var nodes=$this.nodes;
	var loops=1;
	var index=0;
	var result=[];
	result.source=$this;
	if($this.type=="Repetition") {
		loops=$this.upper;
	}
	var iterationMatches=[];
	if (window.debug && $this.type=="Repetition") {
		console.group("Regex");
	}
	//console.log("looping",loops)
	var returning=false;
	for(var i=0;i<loops;i++) {
		//if(window.debug) console.log("Loop Number, ",i)
		if(window.debug) {
			console.group("Regex");
		}
		//console.log("LOOP!")
		for (var i=0;i<nodes.length;i++) {
			if(window.debug) console.log("Checking Node ",i,"of",nodes.length)
			var part=nodes[i];
			//works on both RegExp and _RegexCombination
			var match;
			//console.warn("checking",viewing_str,index)
			if(part instanceof _RegexCombination) {
				match=part.match(viewing_str,depth+1)
			}
			else {
				part.lastIndex=0
				match=part.exec(viewing_str);
				//console.log(match,"REGEX MATCH",[viewing_str,part])
				if(match) match.lastIndex=match[0].length
			}
			//if(match)console.log(match.lastIndex)
			/*debug.start*/
			if(window.debug) console.log(
				"String:",viewing_str
				,"Submatch:",match
				//,"This:",$this
				,"Node:",i,part
			);
			/*debug.end*/
			switch(this.type) {
				case "Repetition":
					//if(window.debug) console.log("Repetition",match,(i==nodes.length-1&&i==$this.upper));
					if(!match
					||(i==nodes.length-1&&i==$this.upper)) {
						if(match) {
							index+=match.lastIndex
							iterationMatches.push(match);
							result.push(iterationMatches);
						}
						var length=result.length;
						if(length >= $this.lower && length <= $this.upper) {
							//if(window.debug) console.log("repetition success");
						}
						else {
							//if(window.debug) console.log("repetition failure index:",length,"out of range",$this.lower,$this.upper);
							result=null;
						}
						if(window.debug) console.groupEnd()
						returning=true
					}
					else {
						iterationMatches.push(match);
						result.push(iterationMatches);
						iterationMatches=[];
						//console.log(match.lastIndex,"match length");
						index+=match.lastIndex
						viewing_str=str.substr(index)
						match.offset=index;
						if(window.debug) console.log(result,returning)
						continue;
					}
					break;
				case "Concat":
					if(match==null) {
						if(window.debug) {
							//console.log("concat failure");
						}
						returning=true;
						result=null;
					}
					else {
						//console.log(match.lastIndex,"match length");
						index+=match.lastIndex
						viewing_str=str.substr(index)
						match.offset=index;
						result.push(match);
						if(i==nodes.length-1) {
							//if(window.debug) console.log("concat success");
							returning=true;
						}

					}
					break;
				case "Any":
					if(match) {
						result.push(match);
						if(window.debug) {
								//console.log("any success info",result,"node number",i)
							}
						//if(window.debug) console.log("any success");
						index=match.lastIndex;
						returning=true;
					}
					else {
						if(i==nodes.length-1) {
							if(window.debug) {
								//console.log("any failure info",result,"node number",i)
								//console.log("any failure");
							}
							returning=true;
							result=null;
						}
					}
					break;
			}
			if(returning) {
				//if(window.debug) console.log("Breaking node loop")
				break;
			}
		}
		if(window.debug) console.groupEnd()
		if(returning) {
			//if(window.debug) console.log("breaking repetition loop")
			break;
		}
	}
	if(result && $this.callbacks.length) {
		var callbacks=$this.callbacks;
		var length=callbacks.length;
		var newresult=[]

		for(var i=0;i<length;i++) {
			newresult.push(callbacks[i].call(this,result,str));
		}
		//if(window.debug) console.log("newresult")
		result=newresult;
	}
	if(window.debug) if (result) console.log("result:",result,"length:",index)
	if(result) result.lastIndex=index;
	return result;
}

//  DANGEROUS BUT FASTER (except on very very complex very very large parsers (rather hard to achieve))
//  recursively optimizes in place.
_RegexCombination.prototype.optimize = function() {
	//call a helper
	return this._optimize();
}

//
//  The recursive helper function for optimize
//  depth is  used for debugging right now, but can be used later for depth limiting?
//  TODO: Optimize down to callback depth of 1
//    , combine RegExps without callbacks
//    ,  combine RegExps w/ pureCallbacks by grouping
//
_RegexCombination.prototype._optimize = function(visited,depth) {
	visited=visited||[]
	/*debug.start*/
	depth=depth||0;
	/*debug.end*/
	var $this=this;
	visited.push($this);
	var type=$this.type;
	//Compress the types
	if(type==="Concat"||type==="Any") {
		var nodes=$this.nodes;
		var new_nodes=[];
		for(var i=0;i<nodes.length;i++) {
			var node=nodes[i];
			if(node instanceof _RegexCombination) {
				if(visited.indexOf(node)===-1) {
					//call the recursive optimize
					node._optimize(visited,depth+1);
					if(node.type===type&&node.callbacks.length==0) {
						Array.prototype.push.apply(new_nodes,node.nodes);
						continue;
					}
				}
			}
			new_nodes.push(node)
		}
		$this.nodes=new_nodes
	}
	if(type=="Repetition") {
		var nodes=$this.nodes;
		var new_nodes=[];
		for(var i=0;i<nodes.length;i++) {
			var node=nodes[i];
			if(node instanceof _RegexCombination) {
				if(visited.indexOf(node)===-1) {
					//call the recursive optimize
					node._optimize(visited,depth+1);
					if(node.type==="Concat"&&node.nodes.length==1&&node.callbacks.length==0) {
						new_nodes.push(node.nodes[0]);
						continue;
					}
				}
			}
			new_nodes.push(node);
		}
		$this.nodes=new_nodes;
	}
	visited.pop();
	return $this;
}

//Takes the i flag and make it so the pattern is not dependent upon it
//|1-|3 char escapes
//|4 char classes
//$1 char class internals
//|5 escaped thing
//|6 normal char
//$2 charclass $3 chars in class
var FlaggedChars=/(\\[bBcdDfnrsStvwW0]|\\x[a-fA-F0-9]|\\u[a-fA-F0-9]{4}|\\[^a-zA-Z])|(\[)(?:(\\.(?:-(?:\\.|[^\]]))?|[^\]](?:-(?:\\.|[^\]]))?))*\]|(\\?[a-zA-Z])/g
//$1 char at range start
//$2 char at range end
//Matches since characters and character ranges!
var CharRange=/(\\[^ux]|\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}|[^\\])(?:-(\\[^ux]|\\u[a-fA-F0-9]{4}|\\x[a-fA-F0-9]{2}|[^\\]))?/g
//Takes a regex and preserves functionality while making it fit the ignoreCase, and multiLine flags to match RegExp(...,"mg")
function RegexNormalizeIgnoreCase(re) {
	var patt=re.source;
	if (!re.ignoreCase) {
		return patt;
	}
	patt.replace(flagged,function(match,pre,charClass,charsInClass,character){
		if(pre) return pre;
		if(charClass) {
			return charClass+charsInClass.replace(CharRange,function(match,start,end){
				//only one char (be sure it has upper and lowercase)
				if(!end) return start.toUppercase()!=start.toLowercase()?start.toLowercase()+start.toUppercase():start;

				//range... ugg
				start=UnescapeUnicode(start).charCodeAt(0);
				end=UnescapeUnicode(end).charCodeAt(0)
				//does this thing actually contain stuff to case swap?
				if(end>64&&start<123) {
					//force the chars to stay in 65-90,97-122
					//drop it by 32 (lowercase from upper)
					//originals
					//up it by 32 (uppercase from lower)
					return String.fromCharCode(Math.max(start-32,65))+"-"+String.fromCharCode(Math.max(end-32,65))+
						String.fromCharCode(start)+"-"+String.fromCharCode(end)+
						String.fromCharCode(Math.min(start+32,97))+"-"+String.fromCharCode(Math.min(end+32,97));
				}
			})
		}
		else {
			return "["+character.toLowercase()+character.toUppercase()+"]";
		}
	})
	return patt;
}

//$1.start
//|1 guarantee odd number of '\'s
//|2 skip character classes
//$1.end
//$2.start
//|3 offset
//$2.end
//Takes a backreferenced regexp and shifts all the backreferences up by an offset
var BackReferenceArea=/(\\[^1-9]|\[(?:\\.|[^\]])*\])|\\([1-9](?:\d+)?)/g
function OffsetBackReferences(str,offset) {
	return str.replace(BackReference,function(match,pre,number) {
		if(pre) {
			return pre;
		}
		var newOffset=Number(number)+Number(offset);
		//dont move into non-backreference number (less than 1 is invalid)
		if(newOffset<=0) {
			console.warn("Offset provided pushes a backreference below valid range");
		}
		return String(newOffset);
	})
}

//turn a regexp into a string escaped form
function RegexEscape(str) {
	return String(str).replace(/\W/g,"\\$&");
}

//|1 with |2 guarantees odd number of '\'s
//|3,avoid controls
//|4,avoid character classes
//|5,find a ( that does not capture
var NotACapturingParen = /\\[^\(]|\\\(|[^\\\(\[]|\[(?:\\\]|\\[^\]]|[^\\])*\]|\((?:\?[\:\!\=])/g;
//assumes given a valid regex pattern
function getCaptureCount(str) {
	return str.replace(NotACapturingParen,"").length;
}


//Takes a regexp and returns a new cloned regexp, useful for the 'g' flag
function RegExpClone(re) {
	return RegExp(re.source,RegExpFlags(re))
}

function RegExpFlags(re) {
	return re.global?"g":""+re.multiline?"m":""+re.ignoreCase?"i":"";
}

})();