Loader.module("Event",function(){
	var F=false,T=true,prevented={},stopped={};
	BindableEvent=function(evtType,data) {
		//preventMe and stopMe exist outside of the event object to keep
		var $this=this,preventMe=F,stopMe=F;
		$this.type=evtType;
		$this.detail=data;
		$this.preventDefault=function(){prevented[$this]=preventMe=T;};
		$this.isPrevented=function(){return preventMe;};
		$this.stopPropagation=function(){stopped[$this]=stopMe=T;};
		$this.isStopped=function(){return stopMe;};
	};
	Bindable=function(defaultActions){
		var eListeners={},$this=this;
		if(!$this.addEventListener){
			$this.addEventListener=function(evtType,evtHandler) {
				if(!eListeners[evtType]) {
					eListeners[evtType]={};
				}
				eListeners[evtType][evtHandler]=evtHandler;
			};
		}
		if(!$this.removeEventListener){
			$this.removeEventListener=function(evtType,evtHandler) {
				evtType=eListeners[evtType];
				if(evtType){
					if(evtType[evtHandler]) {
						delete evtType[evtHandler];
						return $this;
					}
				}
			};
		}
		$this.dispatchEvent=function(evt) {
			var etype=evt.type,listeners,actions,handler,$this=this;
			if(etype && eListeners[etype]) {
				listeners=eListeners[etype];
				for(handler in listeners) {
					listeners[handler].call($this,evt);
				}
				if(evt in prevented) {
					delete prevented[evt];
				}
				else if(defaultActions[etype]) {
					actions=defaultActions[etype];
					for(handler in actions) {
						actions[handler].call($this,evt);
					}
				}
				if(evt in stopped) {
					delete stopped[evt];
				}
			}
		};
		return $this;
	};
})