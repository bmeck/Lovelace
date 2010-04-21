(function(){//Wrapper
function RegexCombination(){
	this.nodes = [];
	this.type = "Or"|"Concat"|"Closure";
	this.callbacks = [];
}
RegexCombination.prototype.Concat = function(/*args*/) {
	
}
RegexCombination.prototype.AddEventListener = function(evtType,callback) {
	
}
//reduce except on recursion
function RegexCombinationOptimize(re) {
	var path = []
	var edge = [re]
	while(edge.length>0) {
		var node = edge.shift();
		if(path.indexOf(node)!=-1) {//RECURSION
			//TODO
			continue;
		}
				
	}
}

//|1 with|2 guarantees odd number of '\'s
//|3,avoid controls
//|4,avoid character classes
//|5,find a ( that does not capture
var NotCapturingParen = /\\[^\(]|\\\(|[^\\\(\[]|\[(?:\\\]|\\[^\]]|[^\\])*\]|\((?:\?[\:\!\=])/g
//assumes given a valid regex pattern
function getCaptureCount(str) {
	return str.replace(NotCapturingParen,"").length;
}

})();//EndWrapper