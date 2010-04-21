var uriMatcher=RegExp(""+
	"(?:"+
		"(?:([^/]*)"+
		"(?:\\:([^/]))\\@)?"+
		"([^\\:]+)\\:(?:[/]*)"+
	")?"+
	"([^/\\?\\#]*)?"+
	"(?:/((?:[^\\?\\#/]*/)*))?"+
	"(?:([a-zA-Z0-9\\-\\_]+)?(?:\\.([a-zA-Z0-9\\-\\_]+))?)"+
	"(?:\\?([^\#]*))?"+
	"(?:\\#(.*))?$")
/*
	Class: URI
	Splits up a url into the parts of a URI.

	Properties:
		href - the full url of the URI

		user - the user of the URI
		password - the password of the URI

		protocol - the protocol of the URI
		domain - the domain (*.com) of the URI
		path - the path on the domain of the URI

		hash - the hash of the URI (generally used by client)
		query - the query of the URI (generally used by the server)
*/
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
	if(!match) if(logging) Log.log("@Loader: URL:",url,"appears to be invalid.")

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
/*
	Function: ResolveUri
	Takes a base URI and resolves a relative URI against it.

	Parameters:
		base - the URI to start the resolution at.
		target - the relative URI to use changing the base URI.
*/
function ResolveUri(base,target){
	base=new URI(base);
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