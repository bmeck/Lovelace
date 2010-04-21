function Tool(name,func) {
	var tool=this;
	tool.execute=function(editor) {
		func.apply(arguments)
	}
	return tool;
}