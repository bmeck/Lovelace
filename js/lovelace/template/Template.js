function TemplateContext(base) {
	var values=[{}];
	if(base) {
		for(var property in base) {
			//ARRAY! for historied scopes
			values[0][property]=base[property];
		}
	}
	var $this={};
	$this.put=function(key,value) {
		values[0][key]=value;
	}
	$this.retrieve=function(key) {
		for(var i=0;values.length;i++){
			var valueSnapshot=values[i];
			if(key in valueSnapshot) {
				return valueSnapshot[key];
			}
		}
	}
	$this.save=function() {
		values.unshift({});
	}
	$this.revert=function() {
		values.shift();
	}
	return $this;
}

function TemplateManager() {
	var $this={};
	var bindings={};
	var cachedTemplates={};
	$this.bindAsset=function(key,obj,forcibly) {
		var parts=key.split("/");
		var dir=bindings;
		var length=parts.length-1;
		var path;
		for(var i=0;i<length;i++) {
			path=parts[i];
			if(!path in dir) {
				dir[path]={};
			}
			dir=dir[path];
		}
		path=parts[length]
		if(path in dir && !forcibly) {
			throw "Cannot override asset!";
		}
		dir[parts[length]]=obj;
	}
	//Render it in an iframe, then grab the content as a documentFragment!
	$this.render=function(template,context) {
		if(cachedTemplates) {

		}
		template.apply(context);
	};
	return $this;
}

//has to check attributes
//
function Template(src) {
	src.replace(/[<][%](?:([!]\w+)?\s)(.*?)[%][>]/g,function(block,tag,content){
		;
	});
	//Returns a "new" template with
	$this.apply=function() {
	}
}