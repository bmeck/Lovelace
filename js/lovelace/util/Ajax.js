window["Ajax"]=function() {
	if(XMLHttpRequest){
		return new XMLHttpRequest();
	}
	else {
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch(e) {
			try {
				return new ActiveXObject("Msxml3.XMLHTTP");
			}
			catch(e) {
				return new ActiveXObject("Microsoft.XMLHTTP");
			}
		}
	}
}