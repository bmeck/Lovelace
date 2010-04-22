(function(){
	var _queue=new EventQueue();
	var tryEval=function(callback) {
		switch(typeof(callback)) {
			case "function":return function() {try {callback();return true;} catch(ex) {return false;}}
			case "string":return function() {try {eval(callback);return true;} catch(ex) {return false;}}
		}
	}
	Primer=function(callback) {
		_queue.push(tryEval(callback));
	}
	Primer.Url=function(url) {
		Ajax.request(url,{
			onSuccess: function() {
				eval(url);
			}
		})
	}
})();