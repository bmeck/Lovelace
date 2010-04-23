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
RegexCombination=_RegexCombination//EXPORT
function _RegexCombination(Regex_or_String){
	if(this==global()) {//Only possible if there is not a 'new' call, no .call or .apply, etc.
		if(Regex_or_String
		&& Regex_or_String.prototype===_RegexCombination.prototype) {
			return Regex_or_String;
		}
		else {
			var $this={};
			$this.prototype=_RegexCombination.prototype;
			if(Regex_or_String) {
				if (Regex_or_String instanceof RegExp) {
					$this.nodes=[Regex_or_String];
				}
				else {
					$this.nodes=[RegExp(RegexEscape(Regex_or_String))];
				}
			}
			else {
				$this.nodes = [];
			}
			$this.type = "Concat";//"Or"|"Concat"|"Closure"
			$this.callbacks = [];//On instance not related to nodes, done post
			return $this;
		}
	}
	throw("New not allowed!");
}

//
//	Returns a RegexCombination that has a type of Concat containing itself and the arguments,
//	if the current RegexCombination is not of type concat it will be cast to a concat,
//	and the original values will be put inside of a child node
//
_RegexCombination.prototype.Concat = function(/*args*/) {
	var args=[],len=0,$this=this;
	for(;len<arguments.length;len++) {
		args[len]=RegexCombination(arguments[len]);
	}
	if($this.type != "Concat") {
		var child=RegexCombination();
		child.type=$this.type;
		child.nodes=$this.nodes;
		child.callbacks=$this.callbacks;

		$this.type="Concat";
		$this.nodes=[child];
		$this.callbacks=[];
		return false;
	}
	else {
		$this.nodes.slice($this.nodes.length,args)
		return true;
	}
}
_RegexCombination.prototype.AddEventListener = function(evtType,callback) {
	;
}
//reduce except on recursion
function RegexCombinationOptimize(re) {
	var path = []
	var edge = [re]
	while(edge.length>0) {
		var node = edge.shift();
		if(path.indexOf(node)!=-1) {//RECURSION
			continue;
		}

	}
}

function RegexEscape(str) {
	return String(str).replace(/\W/g,"\\$0");
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