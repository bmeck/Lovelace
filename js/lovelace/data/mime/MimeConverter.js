Loader.Require("../../util/URI");
Loader.Require("../Data");

/*
	Class: MimeConverter
	Provides an interface to be used when converting data that has extensibility and reusability.
	Must implement the conversions for js/array and text/plain for full functionality.
	It is wiser to use a <DefaultConverter> than this class directly, however,
	you cannot override conversions that already exist so it is not uncommon to directly use this class.
	
	The mime-types used by converters do not follow the official standard but do resemble them closely.
	Most of the functions here accept the use of wildcards using "*" in place of a token split around the "/"s of a mime-type.

	See:
		<DefaultConverter>
		
	Enumeration: Mime-Type
	This is the list of mime-types generally accepted by the MimeConverter standard and their corresponding data types in JavaScript.
	
		text/plain - String
	    text/html - String
	    text/css - String
	    text/javascript - String
		text/json - String
	    text/xml - String

	    dom/elem - ElementNode
	    dom/attr - AttributeNode
	    dom/comment - CommentNode
	    dom/cdata - CDataNode
	    dom/document - Document
	    dom/document-fragment - DocumentFragment
	    dom/node - Node

	    js/number - Number
	    js/array - Array
	    js/function - Function
	    js/obj - Object
	
		css/value - CSSValue
	
	    input/key - KeyEvent
	    input/mouse - MouseEvent
	    input/clipboard - Event that has *ClipboardData*

	Note:
		All mime-types are converted to lowercase upon addition.
*/
 MimeConverter=function() {
    var customMimes = {
        fileExtensions: {}
    };
	/*
		Function: RegisterMime
		Attempts to register the mime-type as being associated with a _file extension_
		
		Parameters:
			mime - String of the mime-type
			fileExtensions - List of file extensions without the '.' to register to this mime type
			
		Warning:
			This requires a couple converters
			- fileExtensions to *js/array*
			- mime,fileExtensions[i] to *text/plain*
	*/
    this.RegisterMime = function(mime, fileExtensions) {
        fileExtensions = this.ConvertToMime("js/array", fileExtensions).data
        for (var i = 0; i < fileExtensions.length; i++) {
            var file_ext = this.ConvertToMime("text/plain", fileExtensions[i]).data.toLowerCase();
            customMimes.fileExtensions[file_ext] = mime;
        }
    }
	/*
		Function: GuessMime
		Attempts to determine the mime-type of an object.
		
		Parameters:
			data - Object to discern the mime-type from.
			url - Source of the object. *Optional.*
		
		Note:
			Default action is to just declare it *js/obj* because it will always be true.
	*/
    this.GuessMime = function(data, url) {
		return "js/obj"
    }
    var converters = {
        }
	var fallbackChains = {
		
	}
    /*
		Function: RegisterConversion
		Attempts to add a conversion to the <MimeConverter> that can be used to convert from one mime-type to another.
		This will not overwrite mime conversions that exist.
		Therefore to prevent more converters from being added just add a dummy converter that goes from "*" to "*"
		
		Parameters:
			mime - The original mime-type of the object
			toMime - The mime-type of the object after the conversion
			func - obj function(data,url): a callback function that takes a JavaScript object of mime and turns it into another
				JavaScript object of toMime
		
		Returns:
			- The conversion function if successful.
			- *undefined* if unsuccessful
			
		Warning:
			- Will log if unsucessful and why.
	*/
    this.RegisterConversion = function(mime, toMime, func) {
        if (!converters[mime]) converters[mime] = {}
        if (converters[mime] && converters[mime][toMime]) {
            Log.log("Converter for ", mime, "to", toMime, "registered under", mime, "to", toMime)
            return;
        }
        var mimeParts = mime.split("/")
        var mimePath = ""
        for (var i = 0; i < mimeParts.length; i++) {
            mimePath += mimeParts[i]
            if (converters[mimePath + "/*"] && converters[mimePath + "/*"][toMime]) {
                Log.log("Converter for ", mime, "to", toMime, "registered under ", mimePath + "/* to", toMime)
                return
            }
        }
        if (converters["*"] && converters["*"][toMime]) {
            Log.log("Converter for ", mime, "to", toMime, "registered under * to", toMime)
            return;
            //Dont allow mime conversion injection
        }
        return converters[mime][toMime] = func;
    }
    /*
		Function: ConvertToMime
		Attempts to convert and object to a given mime-type. The order of conversion priorities is as follows
		- Check for direct conversion
		- Check for conversion of obj's mime-type to "*"
		- Check for conversion of all of the parts of obj's mime (split by "/")
		- Check for a universal conversion "*" to the desired mime-type
		- Check for a ChainMap conversion
		- - A Chainmap will be created if possible by chaining together other converters
		- - A Chainmap conversion will be cached *FOREVER*
		
		Parameters:
			toMime - The mime-type of the object after the conversion.
			obj - The object to convert to toMime.
			fromUrl - The url of an object if it is representing a full File or Url.
			inPlace - If the object should not be a copy and instead it should have its attributes changed in place.
		
		Returns:
			- The converted object if successful.

		Warning:
			- Will log if unsucessful and why.
	*/
    this.ConvertToMime = function(toMime, obj, fromUrl, inPlace) {
	//Log.log(obj,toMime)
        obj = new Data(obj)
        if (obj.mime == toMime) {
			//Log.log("already proper type")
			return obj;
		}
        var mime = obj.mime;
        var data = obj.data;
        if (!toMime) {
            console.error("Not provided mime type to convert to")
            return;
        }
        if (!converters[mime]) {
            Log.log("No mime type converter for data of ", mime, "to anything.");
            return;
        }
        if (converters[mime][toMime]) {
            //Log.log("@Converter: using " + mime + "=>", toMime, "on", obj)
			if(inPlace) {
				obj.mime=toMime;
				obj.data=converters[mime][toMime](data,toMime, fromUrl)
				return obj;
			}
            return new Data(converters[mime][toMime](data,toMime, fromUrl),toMime);
        }
		//try to find direct chain before anything else
		if (converters[mime]["*"]) {
            //Log.log("@Converter: using " + mime + "=>* on", obj)
			if(inPlace) {
				obj.mime=toMime;
				obj.data=converters[mime]["*"](data,toMime, fromUrl)
				return obj;
			}
            return new Data(converters[mime][toMime](data,toMime, fromUrl),toMime);
        }
        var mimeParts = mime.split("/")
        var mimePath = ""
        for (var i = 0; i < mimeParts.length; i++) {
            mimePath += mimeParts[i]
            if (converters[mimePath + "/*"] && converters[mimePath + "/*"][toMime]) {
                //Log.log("@Converter: using " + mimePath + "/*=>", toMime, "on", obj)
				if(inPlace) {
					obj.mime=toMime;
					obj.data=converters[mime][toMime](data,toMime, fromUrl)
					return obj;
				}
                return new Data(converters[mimePath + "/*"][toMime](data,toMime, fromUrl),toMime);
            }
			if (converters[mimePath + "/*"] && converters[mimePath + "/*"]["*"]) {
                //Log.log("@Converter: using " + mimePath + "/*=>* on", obj)
				if(inPlace) {
					obj.mime=toMime;
					obj.data=converters[mime]["*"](data,toMime, fromUrl)
					return obj;
				}
                return new Data(converters[mimePath + "/*"]["*"](data,toMime, fromUrl),toMime);
            }
            mimePath += "/"
        }
		delete mimeParts;
		delete mimePath;

        if (converters["*"] && converters["*"][toMime]) {
            //generic conversions
            //Log.log("@Converter: using *=>", toMime, "on", obj)
			if(inPlace) {
				obj.mime=toMime;
				obj.data=converters[mime][toMime](data,toMime, fromUrl)
				return obj;
			}
            return new Data(converters["*"][toMime](data,toMime, fromUrl),toMime);
        }
		if(fallbackChains[mime]&&fallbackChains[mime][toMime]) {
			if(inPlace) {
				obj.mime=toMime;
				obj.data=fallbackChains[mime][toMime](data,toMime,fromUrl)
				return obj;
			}
            return new Data(fallbackChains[mime][toMime](data,toMime,fromUrl),toMime);
		}
		var chain=ChainMap(converters,mime,toMime);
		//found a chain... save it to temp
		if(chain) {
			Log.log("Chaining converters",chain)
			var callbacks=[];
			var func=function(data,toMime,fromUrl) {
				for(var i=0;i<callbacks.length;i++) {
					data=callbacks[i](data,chain[i+1],fromUrl);
					if(data==undefined) return undefined;
				}
				return data;
			}
			for(var i=1;i<chain.length;i++) {
				callbacks.push(converters[chain[i-1]][chain[i]]);
			}
			if(!fallbackChains[mime])fallbackChains[mime]={};
			fallbackChains[mime][toMime]=func;
			delete mime;
			delete data;
			if(inPlace) {
				obj.mime=toMime;
				obj.data=fallbackChains[obj.mime][toMime](obj.data,toMime,fromUrl)
				return obj;
			}
            return new Data(fallbackChains[obj.mime][toMime](obj.data,toMime,fromUrl),toMime);
		}
        Log.log("No mime type converter for data of ", mime, "to", toMime);
        return;
    }
}
/*
	Function ChaimMap
	Takes a mapping of converters with mime-types as keys of the starting type and a dictionary of mime-types to converters.
	and finds a chain of converters from one mime-type to another.
	
	Returns:
		An array of arrays that contain the mapping of the starting mime-type and ending mime-type of each part of the chain.
		|[[x,y],[y,z]...]
	
	Note:
		This returns a best effort, not optimal.
*/
ChainMap = function(map,start,target){
	var toVisit=[{key:start,visitStack:[start]}];
	var visited={}
	var bestMatch;
	var node;
	while(node=toVisit.shift()) {
		//dont continue looking if its already worse
		if(bestMatch&&node.visitStack.length>bestMatch.length) continue;
		if(node.key==target) {
			if(!bestMatch
			|| node.visitStack.length<bestMatch.length) {
				bestMatch=node.visitStack;
			}
		}
		for(var i in map[node.key]) {
			//Log.log(node,i)
			//ignore wildcard
			if(i=="*")continue;
			//push the node and previous stack onto the node
			if(!(i in visited)) {
				toVisit.unshift({key:i,visitStack:node.visitStack.concat([i])})
				visited[i]=node.visitStack;
			}
			else {
				if(node.visitStack.length<visited[i]) {
					//better path found...need to reeval
					toVisit.unshift({key:i,visitStack:node.visitStack.concat([i])})
					visited[i]=node.visitStack;
				}
			}
		}
	}
	return bestMatch;
}
/*
	Function: GetCharacter
	Attempts to resolve an object into a human readable character (or whitespace) by keyCode.
	
	Parameters:
		data - Object to attempt to resolve
		- Must implement ConvertToMime("input/key")
		
	Returns:
		- Data object representing the character if found.
		- *undefined* if no mapping was found.
*/
GetCharacter = function(data) {
    data = new Data(data);
	data=data.ConvertToMime("input/key");
    if (data) {
        data = data.data
        var unicodePoint = data.which;
        var unicodeChar;
        if (unicodePoint >= 0x0041 && unicodePoint <= 0x005a) {
            unicodeChar = String.fromCharCode(unicodePoint)
            unicodeChar = GetShifted(unicodeChar);
        }
        else if (
        (unicodePoint >= 0x0030 && unicodePoint <= 0x0039) ||
		unicodePoint == 0x0020 ||
        unicodePoint == "\t".charCodeAt(0) ||
        unicodePoint == "\n".charCodeAt(0) ||
        unicodePoint == "\r".charCodeAt(0)) {
            unicodeChar = String.fromCharCode(unicodePoint);
        }
        else switch (unicodePoint) {
            //Normal
        case 186:
            unicodeChar = ";";
            break;
        case 187:
            unicodeChar = "=";
            break;
        case 188:
            unicodeChar = ",";
            break;
        case 189:
            unicodeChar = "-";
            break;
        case 190:
            unicodeChar = ".";
            break;
        case 191:
            unicodeChar = "/";
            break;
        case 192:
            unicodeChar = "`";
            break;
        case 219:
            unicodeChar = "[";
            break;
        case 220:
            unicodeChar = "\\";
            break;
        case 221:
            unicodeChar = "]";
            break;
        case 222:
            unicodeChar = "'";
            break;
        }
        if (unicodeChar) {
            if (data.shiftKey) {
                unicodeChar = GetShifted(unicodeChar)
            }
            return unicodeChar;
        }
        else switch (unicodePoint) {
            //Numpad
        case 96:
            unicodeChar = "0";
            break;
        case 97:
            unicodeChar = "1";
            break;
        case 98:
            unicodeChar = "2";
            break;
        case 99:
            unicodeChar = "3";
            break;
        case 100:
            unicodeChar = "4";
            break;
        case 101:
            unicodeChar = "5";
            break;
        case 102:
            unicodeChar = "6";
            break;
        case 103:
            unicodeChar = "7";
            break;
        case 104:
            unicodeChar = "8";
            break;
        case 105:
            unicodeChar = "9";
            break;

        case 106:
            unicodeChar = "*";
            break;
        case 107:
            unicodeChar = "+";
            break;
        case 109:
            unicodeChar = "-";
            break;
        case 110:
            unicodeChar = ".";
            break;
        case 111:
            unicodeChar = "/";
            break;
        }
        if (unicodeChar) {
            return new Data(unicodeChar,"text/plain");
        }
        //Log.log("Found non printed character "+unicodePoint)
    }
}
/*
	Function: GetShifted
	Attempts to return the alternative of a character is the shift key was toggled from its original form.
	
	Parameter:
		unicodeChar - character to shift in the form of a String
	
	Returns:
		- String of the shifted character if found.
		- The original character if no mapping was found.
*/
GetShifted = function(unicodeChar) {
    switch (unicodeChar) {
    case "`":return "~";
	case "~":return "`";
	
    case "1":return "!";
	case "!":return "1";
	
    case "2":return "@";
	case "@":return "2";
	
    case "3":return "#";
	case "#":return "3";
	
    case "4":return "$";
	case "$":return "4";
	
    case "5":return "%";
	case "%":return "5";
	
    case "6":return "^";
	case "^":return "6";
	
    case "7":return "&";
	case "&":return "7";
	
    case "8":return "*";
	case "*":return "8";
	
    case "9":return "(";
	case "(":return "9";
	
    case "0":return ")";
	case ")":return "0";
	
    case "-":return "_";
	case "_":return "-";
	
    case "=":return "+";
	case "+":return "=";
	
    case "[":return "{";
	case "{":return "[";
	
    case "]":return "}";
	case "{":return "]";
	
    case "\\":return "|";
	case "|":return "\\";

    case ";":return ":";
	case ":":return ";";
	
    case "'":return "\"";
	case "\"":return "'";
	
    case ",":return "<";
	case "<":return ",";
	
    case ".":return ">";
	case ">":return ".";
	
    case "/":return "?";
	case "?":return "/";
    }
    if (unicodeChar.toUpperCase() == unicodeChar) {
        return unicodeChar.toLowerCase();
    }
    else {
        return unicodeChar.toUpperCase();
    }
}