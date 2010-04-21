(function(){
	var prevented={};
	var stopped={};
	BindableEvent=function(evtType,data) {
		var evt=this;
		
		evt.type=evtType;
		evt.detail=data;
		//double duty in case element gets removed from prevented or stopped tables prior to the calls
		var preventMe=false;
		var stopMe=false;
		evt.preventDefault=function(){prevented[evt]=preventMe=true;}
		evt.isPrevented=function(){return preventMe;};
		evt.stopPropagation=function(){stopped[evt]=stopMe=true;};
		evt.isStopped=function(){return stopMe;}
	}
	Bindable=function(defaultActions){
		var eListeners={};
		if(!this.addEventListener)this.addEventListener=function(evtType,evtHandler) {
			if(!eListeners[evtType])eListeners[evtType]={};
			eListeners[evtType][evtHandler]=evtHandler;
		}
		else {
			Log.warn(this,"already has addEventListener capability");
		}
		if(!this.removeEventListener)this.removeEventListener=function(evtType,evtHandler) {
			evtType=eListeners[evtType]
			if(evtType){
				if(evtType[evtHandler]) {
					delete evtType[evtHandler];
					return this;
				}
			}
		}
		else {
			Log.warn(this,"already has removeEventListener capability");
		}
		this.dispatchEvent=function(evt) {
			var etype=evt.type
			if(etype) {
				if(eListeners[etype]) {
					var listeners=eListeners[etype];
					for(var handler in listeners) {
						listeners[handler].call(this,evt);
					}
					if(evt in prevented) {
						delete prevented[evt];
					}
					else {
						if(defaultActions[etype]) {
							var actions=defaultActions[etype];
							for(var handler in actions) {
								actions[handler].call(this,evt);
							}
						}
					}
					if(evt in stopped) {
						delete stopped[evt];
					}
				}
			}
		}
		return this;
	}
})();