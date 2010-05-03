(function() {
	var logs={}
	function Log(name) {
		var msgs=[];
		this.log = function(file,line) {
			console.group(file+line);
			console.log.apply(console,Array.prototype.slice.call(arguments,2))
			console.groupEnd();
		}
		this.error = function(file,line) {
			console.group(file+line);
			console.error.apply(console,Array.prototype.slice.call(arguments,2))
			console.groupEnd();
		}
		this.warn = function(file,line) {
			console.group(file);
			console.warn.apply(console,Array.prototype.slice.call(arguments,2))
			console.groupEnd();
		}
	}
	var Logger={
		MakeLog: function(name) {
			if(logs[name]){
				console.error("Log already exists.")
				return;
			}
			return logs[name]=new Log(name)
		},
		GetLog: function(name) {
			return logs[name]
		}
	}
	LoaderLog=Logger.MakeLog("Loader")
	//$1 user
	//$2 pass
	//$3 protocol
	//$4 domain
	//$5 path
	//$6 filename
	//$7 fileext
	//$8 query
	//$9 hash
	var uriMatcher=RegExp(
		"^"
		+"(?:"
			+"(?:([^/]*)"
			+"(?:\\:([^/]))\\@)?"
			+"([^\\:]+)\\:(?:[/]*)"
		+")?"
		+"([^/\\?\\#]*)?"
		+"(?:/((?:[^\\?\\#/]*/)*))?"
		+"([a-zA-Z0-9\\-\\_]+(?:\\.(?:[a-zA-Z0-9\\-\\_]+))*?)?"
		+"(?:\\.([a-zA-Z0-9\\-\\_]+))?"
		+"(?:\\?([^\#]*))?"
		+"(?:\\#(.*))?"
		+"$"
		)
	function URI(url) {
		if(url instanceof URI) return url;
		//if(url instanceof String == false) console.warn("Converting non-string url to string for URI parsing");
		//Log.log("?",url)
		url=String(url);//working with strings ppl~
		//normalize the slashes
		url=url.replace("\\","/")
		//Log.log(1)
		var match=url.match(uriMatcher)
		//Log.log(2)
		//console.error(url,match)
		if(!match) if(logging) console.log("@Loader: URL:",url,"appears to be invalid.")

		//check, do we have something to work on ?
		if(!(match[3]||match[4]||match[5]||match[7]||match[8]||match[9])) console.error("Url provided does not appear to be valid");
		this.href=url

		this.user=match[1]
		this.password=match[2]

		this.protocol=match[3]
		this.domain=match[4]

			//if it has no extension assume it is a directory
		this.path=match[5]?match[5]:""
		if(match[7]){
			this.file={}
			this.file.name=match[6],
			this.file.extension=match[7]
		}

		this.query=match[8]
		this.hash=match[9]
		if(!this.protocol) {
			if(this.domain) {
				this.path=this.domain+"/"+this.path;
				this.domain=undefined;
			}
		}
		if(!this.file) {
			if(match[6]) {
				this.path+=match[6]+"/"
			}
		}
		//Log.log("URI",this)
		return this;
	}
	function ResolveUri(base,target){
		base=new URI(base);
		console.log(base,target)
		target=new URI(target);
		//Log.log(target,base)
		if(target.protocol||target.domain) {
			return target;
		}
		var currentPathing=[]//dont jump up a domain
		//if target has the root selected dont concat our path
		if(base.path&&target.path.charAt(0)!="/") currentPathing=currentPathing.concat(base.path.split("/"))
		//Log.log("pathing",currentPathing.concat(),base)
		if(currentPathing[currentPathing.length-1]=="") currentPathing.pop();
		var targetPathing=[]
		if(target.path) targetPathing=targetPathing.concat(target.path.split("/"))
		for(var i=0;i<targetPathing.length;i++) {
			var dir=targetPathing[i];
			if(dir=="..") {
				if(currentPathing.length==0) {
					console.warn("Cannot go to ../ of a domain");
				}
				else {
					//console.log("GOING UP")
					currentPathing.pop();
				}
			}
			else if(dir.length>=1) {
				currentPathing.push(dir);
			}
		}
		var href=(base.user||"")+
		(base.password||"")+

		(base.protocol?(base.protocol)+"://":"")+
		(base.domain?(base.domain):"")+

		//if it has no extension assume it is a directory
		("/"+currentPathing.join("/"))+
		(target.file?"/"+(target.file.name)+"."+(target.file.extension):"")+

		(target.query||"")+
		(target.hash||"")
		//Log.log("resolved to",href,"from",base,target)
		var resolvedUri = new URI(
			href
		)
		return resolvedUri;
	}

	//@start event queue
	var EventQueue = function(){
	    //Form an event queue (needed due to a slew of delayed action events)
	    //ie. ajax, saving, undo, copy, paste, etc.
	    var self = this;
	    var eventQueue = this.eventQueue = [];
	    var eventHolds = this.eventHolds = {};

	    //Attempt to perform all the events in the queue
	    //Returns false if stopped by something
	    //Otherwise, returns true
	    this.Flush = function() {
	        while (eventQueue.length > 0)
	        {
	            for (var hold in eventHolds) {
	                return false;
	            }
	            var event = eventQueue.shift();
	            if (event.log) {
	               console.log(event.log);
	            }
				if (!event.thisObject) {
					event.thisObject = {};//Default to avoid global namespace colisions
				}
	            event.callbackFunction.apply(event.thisObject,event.argumentsArray);
	        }
	        return true;
	    }

	    //Put an event on the queue
	    //@evt = {
	    //  argumentsArray = [],
	    //  callbackFunction = function(...){},
	    //  thisObject = $
	    //}
		//@return position in queue (1 indexed) or null if not allowed
	    this.PushEvent = function(evt) {
			for (var filter in eventHolds) {
				if(eventHolds[filter] && !eventHolds[filter]()) return null;
			}
	        return eventQueue.push(evt)
	    }

	    //Put an event on the queue
	    //@evt = {
	    //  argumentsArray = [],
	    //  callbackFunction = function(...){},
	    //  thisObject = $
	    //}
		//@return position in queue (1 indexed) or null if not allowed
	    this.UnshiftEvent = function(evt) {
		    var eventFilter;
			for (var filter in eventHolds) {
				if (eventFilter && !eventFilter(evt)) {
				console.log("FAIL")
					return null;
				}
			}
	        eventQueue.unshift(evt);
			//Log.log(evt,"added")
	        return 0;
	    }

	    //Put up a mutex lock to prevent any more events
		//@pushFilter - bool function(evt) - return true if push is allowed for this event
	    //@return id of the mutex in order to release it
	    this.HoldEvents = function(pushFilter) {
	        var holdId = Math.random();
			while (eventHolds[holdId]) {
				holdId = Math.random();
			}
	        eventHolds[holdId] = pushFilter;
	        return holdId;
	    }
	    //Release a mutex holding up the event queue
	    //@holdId a value returned from HoldEvents() of the mutex to nullify
	    this.ReleaseHold = function(holdId) {
			//Log.log("releasing ",holdId,eventHolds)
	        if (holdId in eventHolds) {
	            delete eventHolds[holdId];
	            return true;
	        }
	        return false;
	    }

		this.Bump = function(item) {
			var index = eventQueue.indexOf(item)
			if(index!=-1) {
				var newTop = eventQueue.splice(index,1)[0];
				this.UnshiftEvent(newTop)
			}
		}
//	    window.addEventListener("onload",function() {
//	        Log.log("Document Load Event Flush.")
//	        self.Flush();
//	    });
	    return this;
	}
	//@end event queue

    var ScriptQueue = new EventQueue();
	var CallbackQueue = new EventQueue();
	var LoadingScripts = {}
	var LoadedScripts = {}
	var	CurrentDir;
	/*
		Class: Loader
		Provides a means to load javascript asynchronously.
		Scripts loaded with this gain access to the logger using Log instead of console in order to keep line numbers.
	*/
	Loader = {
		/*
			Function: Require
				Used in order to load a script at a given url and evaluate it with some minor protection.
				Scripts are given to an EventQueue for loading and once loaded
				are given to another EventQueue to be evaluated in proper order.
				Recursive scripts work fine.

			Parameters:
				url - URI relative to the current script's document to load
				force - allow the script to be reloaded even if we have done so already
					(does not force a reload if the script is already waiting to be evaluated)

			See:
				<EventQueue>
				<URI>
		*/
 	   Require : function(url,force) {
			if(!CurrentDir) {
				//Log.log("defaulting currentDir")
				CurrentDir=new URI(document.location.href)
			}
			//Log.log("@Loader: Loading require... ",url,CurrentDir.href)
			if(url.length<3) {
					url+=".js"
			}
			url=new URI(url);
			if(!url.file) { //defaults to all.js
				ResolveUri(url,"all.js")
			}
			else{
				if(!url.file.extension) {
					url.href+=".js";
					url.file.extension="js"
				}
			}
			var uri=ResolveUri(CurrentDir,url);
			//Log.log("321",uri)
			if(uri.href in LoadedScripts) {
				if(!force) {
					//Log.log("@Loader:",url,"already loaded, not forced, stopping...");
					return;
				}
			}
			else if(uri.href in LoadingScripts) {
				//Bump it if its already queued!
				//Log.log("@Loader: New request for",uri.href,"bumping to highest priority.");
				ScriptQueue.Bump(LoadingScripts[uri.href])
				return;
			}
			//Log.log(LoadedScripts,LoadingScripts)
			var callbackHold = CallbackQueue.HoldEvents();
			//Log.log("@Loader: Holding callbacks for ",url,"with",callbackHold)
	        var hold = ScriptQueue.HoldEvents();

			var evt = {
				callbackFunction: function(script){
					if(!script)return;

					CurrentDir=uri;
					//Log.log("current dir set to",uri)
					console.log("@Loader: Evaluating ",url)//,"then releasing callbackhold",callbackHold)
					var lineCount=1
					script=script.replace(/(\n)|\bLog\.([a-zA-Z0-9_]+)((?:\s*(?:\.call|.apply))?[ \t\r]*\()/g,
					function(match,newline,funcName,callStyle){
						if(newline) {
							lineCount++;
							return newline;
						}
						//console.warn("Log."+funcName+callStyle+"\""+uri.href+":\","+lineCount+",");
						return "Log."+funcName+callStyle+"\""+uri.href+":\","+lineCount+",";
					})
					var scriptFunc=new Function("__File__","Log",script);
					scriptFunc.call({},uri.href,Logger.MakeLog(uri.href));
					LoadedScripts[uri.href]=uri;
					delete LoadingScripts[uri.href];
					//no need to reset the currentdir, evals will do it as needed
					//Log.log(CallbackQueue)
					CallbackQueue.ReleaseHold(callbackHold);
					CallbackQueue.Flush();
					//Log.log("@Loader: Evaluation of ",url,"done.")
				},
				thisObject: null
	        }
			//register it as loading
			LoadingScripts[uri.href]=evt;
			ScriptQueue.UnshiftEvent(evt);

			var req = new XMLHttpRequest();
			req.open('GET', uri.href, true);
	        req.onreadystatechange = function(xhrEvt) {
	            if (req.readyState == 4) {
	                if (req.status == 200) {
	                	evt.argumentsArray = [req.responseText]
						//if(logging)Log.log("@Loader:",uri.href,"retrieved successfully");
					}
					else {
		            	LoaderLog.error("@Loader: Could not load required script ", uri.href);
						//CallbackQueue.ReleaseHold(callbackHold);
					}
					ScriptQueue.ReleaseHold(hold);
					ScriptQueue.Flush();
	            }
	        }

		    req.send();
	    },
		/*
			Function: OnLoaded
			When loading scripts that require other scripts it is often the case that those scripts are used in initialization.
			OnLoaded provides a means to have these scripts register callbacks so that they can initialize things
			after their requirements are finished loading.

			Parameters:
				callback - function to call once all the required scripts have been loaded
		*/
		OnLoaded: function(callback) {
			CallbackQueue.UnshiftEvent({
				callbackFunction: callback
			});
		}
	}
})();