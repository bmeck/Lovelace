
//Whew constructor mayhem
function global() {
	return this;
}
//
//	Class: RegexCombination
//	A means for combining regular expressions predictably and between browsers,
//	the resulting Regex from a .compile() will have case sensitivity (ignore case Regex will be converted appropriately),
//	the expressions inside of a .compile() will have ^ match a line and ^^ match the start, same for $ and $$
//	finally, the resulting expression will not have the global flag set
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

var id_next=0
function _RegexCombination(Regex_or_String){
	var $this=this;
	if(Regex_or_String) {
		if (Regex_or_String instanceof RegExp) {
			$this.nodes=[Regex_or_String];
		}
		else {
			$this.nodes=[RegExp(RegexEscape(String(Regex_or_String)))];
		}
	}
	else {
		$this.nodes = [];
	}
	$this.id=id_next++;
	$this.type = "Concat";//"Any"|"Concat"|"Repitition"
	$this.callbacks = [];//On instance not related to nodes, done post
	$this.cloning= false;
	return $this;
}

//performs a copy of a RegexCombination
_RegexCombination.prototype.clone = function(deep,cloneRegExp) {
	var $this=this;
	var clone=new _RegexCombination();
	clone.type=$this.type;
	clone.cloning=$this.cloning;
	clone.callbacks=$this.callbacks;
	if(deep) {
		var nodes=$this.nodes;
		for(var i=0;i<$this.nodes.length;i++) {
			var node=nodes[i];
			if(nodes instanceof _RegexCombination) {
				nodes.push(node.clone(true,cloneRegExp));
			}
			else {
				nodes.push(cloneRegExp?
					RegExp(node.source
						,node.global?"g":""
						+node.multiline?"m":""
						+node.ignoreCase?"i":""
					)
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
//
_RegexCombination.prototype.repetition = function(lower,upper) {
	var $this=this;
	$this.nodes=[];
	if(this.nodes.length) {
		var child=RegexCombination();
		child.type=$this.type;
		child.nodes=$this.nodes;
		child.callbacks=$this.callbacks;
		$this.nodes.push(child);
	}

	$this.type="Repetition";
	$this.lower=Number(lower);
	$this.upper=Number(upper);
	$this.callbacks=[];
	return $this;
}


_RegexCombination.prototype.match = function(str,depth) {
	depth=depth||0;
	viewing_str=str
	var nodes=this.nodes;
	var index=0;
	var result=[];
	result.source=this;
	result.toString=function() {return this.join("");}
	if(window.debug) console.group("Regex")
	for (var i=0;i<nodes.length;i++) {
		var part=nodes[i];
		//works on both RegExp and _RegexCombination
		var match=part instanceof _RegexCombination
			?part.match(str.substr(index),depth+1)
			:part.exec(viewing_str);
		if(window.debug) console.log(
			"String:",viewing_str
			,"Submatch:",match
			,"This:",this
			,"Node:",i,part
		);
		switch(this.type) {
			case "Concat":
				if(match==null) {
					if(window.debug) console.groupEnd()
					return null;
				}
				index+=match.toString().length
				viewing_str=str.substr(index)
				match.offset=index;
				result.push(match);
				break;
			case "Any":
				if(match==null) {
					continue;
				}
				result.push(match);
				if(window.debug) console.groupEnd()
				return result;
		}
	}
	if(window.debug) console.groupEnd()
	return this.type=="Concat"?result:null;
}

//DANGEROUS BUT FASTER (except on very very complex very very large parsers (rather hard to achieve))
_RegexCombination.prototype.optimize = function() {
	return this._optimize();
}

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
					node._optimize(visited,depth+1);
					if(node.type===type) {
						Array.prototype.push.apply(new_nodes,node.nodes);
						continue;
					}
				}
			}
			new_nodes.push(node)
		}
		$this.nodes=new_nodes
	}
	visited.pop();
	return $this;
}

//Takes a regex and preserves functionality while making it fit the ignoreCase, and multiLine flags to match RegExp(...,"mg")
function RegexNormalize(re) {
	if(re.normalized) {
		return re;
	}
	var i=re.ignoreCase,m=re.multiLine;
	if(!i && m) {
		return re;
	}
	else {
		var source=re.source;
		if(i) {
			//take all the normal characters and wrap em in char classes w/ their cased counterparts
		}
		if(!m) {
			//put in our way of tracking the start and end of string vs line
		}
	}
	return re;
}

function RegexEscape(str) {
	return String(str).replace(/\W/g,"\\$&");
}

//|1 with |2 guarantees odd number of '\'s
//|3,avoid controls
//|4,avoid character classes
//|5,find a ( that does not capture
var NotCapturingParen = /\\[^\(]|\\\(|[^\\\(\[]|\[(?:\\\]|\\[^\]]|[^\\])*\]|\((?:\?[\:\!\=])/g
//assumes given a valid regex pattern
function getCaptureCount(str) {
	return str.replace(NotCapturingParen,"").length;
}