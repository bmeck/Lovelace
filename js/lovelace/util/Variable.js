window["Watchable"]=function(v) {
	var value=v
	,watchers=[]
	,locked=false;
	return {
		put:function(v){
			if(locked) {
				return;//undefined, cannot put() inside of a put()...
			}
			locked=true;
			for(var i=0;i<watchers.length;i++) {
				//oldvalue,newvalue
				watchers[i](value,v);
			}
			return value=v;
		}
		,retrieve:function(){
			return value;
		}
		,watch:function(callback){
			watchers.push(callback);
		}
		,unwatch:function(callback){
			watchers=watchers.splice(watchers.indexOf(callback),1);
		}
	};
}

//Asset is a watchable tied to a function callback (generally ajax)
//It is also bindable! onload, onreload, onremove
//Requires a load/remove
//Optional reload (if faster performance us it!)
//callback's this is the
window["Asset"]=function(opts) {
	var value=EventListener(Watchable())
	var reload=opts.reload?opts.reload:opts.load;
	var load=opts.load;
	var remove=opts.remove;
	value.load=function(){
		load.call(value,DeferedEventDispatcher(value,"load"));
	}
	value.reload=function(){
		reload.call(value,DeferedEventDispatcher(value,"reload"));
	}
	value.remove=function(){r
		remove.call(value,DeferedEventDispatcher(value,"remove"));
	}
	return value;
}

window["AjaxAsset"]=function(method,url,data,headers,opts) {
	var asset;
	asset=Asset({
		load:function(dispatcher) {
			var ajax=Ajax();
			ajax.open(method,url,true/*async*/);
			for(var h in headers) {
				ajax.setRequestHeader(h,headers[h]);
			}
			ajax.onreadystatechange = function () {
				if (ajax.readyState != 4) return;
				if (ajax.status < 200 || ajax.status > 299) {
					window.error.shove(EventListenerEvent("AjaxFailure",ajax),asset);
				}
				else if (ajax.status != 304) {
					opts.load.call(this,dispatcher,ajax.responseText)
				}
			}
			ajax.send(data);
		}
		,remove:function(dispatcher) {
			opts.remove.call(this,dispatcher);
		}
	})
	return asset;
}

window["StylesheetAsset"]=function(method,url,data,headers) {
	var bridge=document.createElement("span");
	return AjaxAsset(method,url,data,headers,{
		load:function(dispatcher,responseText){
			if(bridge.parentNode) {
				bridge.parentNode.removeChild(bridge);
			}
			while(bridge.childNodes.length) {
				bridge.removeChild(bridge.firstChild);
			}
			//TODO: Better escape?
			bridge.innerHTML="<style type='text/css'><![CDATA["
				+responseText.replace(/\]\]\>/g,"]] >")
				+"]]></style>";
			}
			document.appendChild(bridge);
			var styleElement=bridge.getElementsByTagName("style")[0];
			for(var i=0;i<document.stylesheets.length;i++) {
				var stylesheet=document.stylesheets[i]
				if(stylesheet.ownerNode===styleElement) {
					this.put(stylesheet);
					break;
				}
			}
			dispatcher();
		}
		,remove:function(dispatcher) {
			if(bridge.parentNode) {
				bridge.parentNode.removeChild(bridge);
			}
			dispatcher(this.retrieve());
		}
	})
}

//Careful! this can be used for cross-site scripting (they could do it anywho)
window["ScriptAsset"]=function(url) {
	var bridge=document.createElement("span");
	var loader,remover;
	loader=function(dispatcher,responseText){
		if(bridge.parentNode) {
			bridge.parentNode.removeChild(bridge);
		}
		while(bridge.childNodes.length) {
			bridge.removeChild(bridge.firstChild);
		}
		var script=document.createElement('script');
		script.src=url;
		bridge.appendChild(script);
		document.appendChild(bridge);
		dispatcher();
	}
	//cant really 'undo' what the script ran, just collect when applicable
	remover=gc.addJob(function(dispatcher) {
		if(bridge&&brigde.parentNode) {
			bridge.parentNode.removeChild(bridge);
			delete bridge;
			gc.removeJob(remover);
			dispatcher(url);
		}
	})
	return Asset({
		load:loader
		,remove:remover)
	})
}