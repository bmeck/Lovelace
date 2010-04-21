Loader.Require("MimeConverter");
Loader.Require("../../util/URI");
/*
	Object: DefaultConverter
	Provides an intelligent MimeConverter for most applications.
	
	Type:
		<MimeConverter>
*/
Loader.OnLoaded(function() {
	DefaultConverter=new MimeConverter();
	DefaultConverter.GuessMime=function(data,url){
		if (url) {
            var uri = URI(url);
            if (uri.file)
            switch (uri.file.extension) {
            case "htm":
            case "html":
                return "text/html";
            case "xml":
            case "xhtml":
                return "text/xhtml";
            case "css":
                return "text/css";
            case "js":
                return "text/js";
            default:
                if (customMimes.fileExtensions[uri.file.extension])
                return customMimes.fileExtensions[uri.file.extension];
            }
        }
        switch (data.constructor) {
        case Array:
            return "js/array";
        case Number:
            return "js/number";
        case Function:
            return "js/function";
        case String:
            return "text/plain";
        }
        if (data.which) {
            return "input/key";
        }
		if (data.clipboardData) {
			return "input/clipboard"
		}
        if (data.target) {
            return "input/mouse";
        }
        if (data instanceof window.Node) {
            switch (data.nodeType) {
            case 1:
                return "dom/elem"
            case 2:
                return "dom/attr"
            case 3:
                return "dom/text"
            case 4:
                return "dom/cdata"
            case 8:
                return "dom/comment"
            case 9:
                return "dom/document"
            case 12:
                return "dom/document-fragment"
            }
            //Generic, idk wtf it is
            return "dom/node";
        }
        else if (data instanceof RegExp) {
            return "js/regexp";
        }
        for (var i = 0; i < customMimes.checks.length; i++)
        {
            var mime = customMimes.checks[i](data, url);
            //needs a / as an identifier of genus
            if (mime instanceof String && mime.indexOf("/") != -1) {
                return mime;
            }
        }
        return "js/obj";
	}
    DefaultConverter.RegisterConversion("dom/elem", "text/html",
    function(data, url) {
        var attrStr = [];
        for (var i in data.attributes) {
            attrString[attrStr.length] = i+"=\""+jQuery('<div/>').text(value).html()+"\""; 
        }
        switch (data.nodeName) {
        case "img":
        case "link":
		case "br":
		case "hr":
		case "wbr":
		case "input":
            return "<" + data.nodeName + " " + attrStr.join(" ") + "/>"
        default:
            return "<" + data.nodeName + " " + attrStr.join(" ") + ">" + data.innerHTML + "</" + data.nodeName + ">";
        }
    })
    DefaultConverter.RegisterConversion("dom/elem", "text/css",
    function(data) {
        return data.nodeName=="style"?data.innerText:data.style.cssText;
    })
    DefaultConverter.RegisterConversion("dom/elem", "text/plain",
    function(data) {
        return data.innerText;
    })
    DefaultConverter.RegisterConversion("dom/document", "text/plain",
    function(data) {
        return data.innerText;
    })
    DefaultConverter.RegisterConversion("dom/document-fragment", "text/plain",
    function(data) {
        return data.innerText;
    })
    DefaultConverter.RegisterConversion("dom/*", "text/plain",
    function(data) {
        return data.nodeValue;
    })
	DefaultConverter.RegisterConversion("text/html", "dom/document-fragment",
    function(data) {
		var fragment=document.createDocumentFragment();
		//need to use div's innerHTML as documents do not have that
		var div=document.createElement("div");
		div.innerHTML=data;
		while(div.childNodes.length>0){
			fragment.appendChild(div.childNodes[0])
		}
        return fragment;
    })
	DefaultConverter.RegisterConversion("text/plain", "dom/text", 
	function(data) {
		return document.createTextNode(data);
	})


    DefaultConverter.RegisterConversion("js/number", "input/key",
    function(data) {
        var keyEvent = document.createEvent("KeyboardEvent");
        keyEvent.initKeyboardEvent("KeyPress", true, true, document.defaultView,
        String.fromCharCode(data)
        , KeyboardEvent.DOM_KEY_LOCATION_STANDARD, "");
        return keyEvent;
    })
    DefaultConverter.RegisterConversion("js/obj", "input/key",
    function(data) {
        if (data instanceof KeyboardEvent) {
            return data
        }
    })
    DefaultConverter.RegisterConversion("input/key", "text/plain",
    function(data) {
        return GetCharacter(data)
    });
	DefaultConverter.RegisterConversion("input/key", "text/html",
    function(data) {
        var txt=GetCharacter(data);
		if(txt) return txt.replace(/(\n|\r\n?)|( )|(\t)/g,function(match,newline,space,tab){
			if(newline) return "<br>";
			if(space) return "&nbsp;";
			if(tab) return "&nbsp;&nbsp;&nbsp;&nbsp;"
		})
		return txt;
    });

	DefaultConverter.RegisterConversion("input/clipboard", "text/html",
    function(data,toMime) {
        var text=data.clipboardData.getData("text/html")
		if(text) {
			return text;
		}
    });
	DefaultConverter.RegisterConversion("input/clipboard", "text/plain",
    function(data,toMime) {
        var text=data.clipboardData.getData("text/plain")
		if(text) {
			return text;
		}
    });
	DefaultConverter.RegisterConversion("input/clipboard", "*",
    function(data,toMime) {
		//Log.log(toMime)
        return data.clipboardData.getData(toMime)
    });

	var CssFloatTypes=[
		CSSPrimitiveValue.CSS_NUMBER,
		CSSPrimitiveValue.CSS_PERCENTAGE,
		CSSPrimitiveValue.CSS_EMS,
		CSSPrimitiveValue.CSS_EXS,
		CSSPrimitiveValue.CSS_PX,
		CSSPrimitiveValue.CSS_CM,
		CSSPrimitiveValue.CSS_MM,
		CSSPrimitiveValue.CSS_IN,
		CSSPrimitiveValue.CSS_PT,
		CSSPrimitiveValue.CSS_PC,
		CSSPrimitiveValue.CSS_DEG,
		CSSPrimitiveValue.CSS_RAD,
		CSSPrimitiveValue.CSS_GRAD,
		CSSPrimitiveValue.CSS_MS,
		CSSPrimitiveValue.CSS_S,
		CSSPrimitiveValue.CSS_HZ,
		CSSPrimitiveValue.CSS_KHZ,
		CSSPrimitiveValue.CSS_DIMENSION
	]
	DefaultConverter.RegisterConversion("css/value", "js/number",
	function(data) {
		if(indexOf(data.cssValueType)!=-1)
			try{
				return data.getFloatValue(CSSPrimitiveValue.CSS_PX)
			}
			catch(e){
				//ignore problem... there a way to front detect this crud?
			}
	})
	DefaultConverter.RegisterConversion("css/value", "text/plain",
	function(data) {
		return data.cssText
	})


    DefaultConverter.RegisterConversion("*", "text/plain",
    function(data) {
        return data.toString ? data.toString() : String(data);
    })
    DefaultConverter.RegisterConversion("*", "js/array",
    function(data) {
        return data instanceof Array ? data: Array(data);
    })
    DefaultConverter.RegisterConversion("*", "js/number",
    function(data) {
        return Number(data);
    })
    DefaultConverter.RegisterConversion("*", "js/obj",
    function(data) {
        return Object(data);
    })
})