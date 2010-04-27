(function(){
var waitLength=0,line=[],timer=setInterval(function(){
	for(var i=0;i<waitLength;i++) {
		var pair=line[i]
		var passed=pair[1]();
		if(passed) {
			pair[2]();
		}
	}
},100);
window["Wait"]=function(test,callback) {
	if(this == (function(){return this;})()) {
		line[waitLength++]=[test,callback];
		return true;
	}
	else {
		return false;
	}
}
})();