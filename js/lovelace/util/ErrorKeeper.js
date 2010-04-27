window["ErrorKeeper"]=function() {
	var errors={}
	var $this=Bindable()
	$this.tryCatch=function(toTry,ifCatched,storageKey) {
		try {
			toTry();
		}
		catch(e) {
			var result=ifCatched(e);
			var evtData={error:e,result:result}
			if(storageKey) {
				if(!storageKey in errors) {
					errors[storageKey]=[];
				}
				errors[storageKey].push(evtData);
			}
			$this.dispatchEvent(EventListenerEvent("error",evtData))
		}
	}
	$this.shove=function(e,context) {
		var evtData={error:e,context:context}
		$this.dispatchEvent(EventListenerEvent("error",evtData))
	}
	$this.errors=function(key) {
		return errors[key];
	}
	gc.addJob($this.clean=function() {
		for(var key in errors) {
			if(errors[key].length==0) {
				delete errors[key];
			}
		}
	})
	return $this;
}
window["error"]=ErrorKeeper()