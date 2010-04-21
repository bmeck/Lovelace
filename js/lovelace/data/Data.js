/*
	Class: Data
	Provides encapsulation of arbitrary values and tries to classify it with a mime-type system.
	It is often the case that the default converter provides enough for applications, if so,
	please use <DefaultConverter.DefaultData>.
	
	If given another Data object for construction, it will be be overwritten.
	This is the default action because it allows the reuse of allocated objects.
	
	If you wish to copy (clone) a data object it is advised that you use
	|var newData=new Data(
	|    oldData.data,
	|    oldData.mime,
	|    null,
	|    oldData.converter
	|)
	
	Parameters:
		obj - Object to encapsulate. Can be of any data type.
		mime - Guaranteed mime-type of the object. *Optional.*
		url - Where the object was obtained from. This can aid in guessing the mime-type of text/plain especially. *Optional.*
		converter - The MimeConverter to use in default conversions to other mime-types. *Optional.*
		
	Warnings:
		If obj follows the Duck typing rules of being a Data object but is not, it will be wrapped and a warning will be issued.
		
	Properties:
		data - The data as in its natural representation.
		mime - The mime-type that represents this data as a String.
		converter - The MimeConverter to use in default conversions to other mime-types.
	
	See:
		<MimeConverter>
*/
Data=function(obj,mime,url,converter) {
	//Log.log("@DATA:",obj,typeof(obj))
	if(obj instanceof Data) {
		if(mime) obj.mime=mime;
		if(converter) obj.converter=converter;
		return obj;
	}
	else {
		if(typeof(obj)=="object"&&"data" in obj && "mime" in obj && "converter" in obj) {
			Log.warn(obj,"looks like Data* but it is not an instance of, wrapping");
		}
		this.converter=converter;
		if (mime) {
			this.mime=mime;
		}
		else if (converter) {
			this.mime=converter.GuessMime(obj,url);
		}
		this.data=obj;
	}
	/*
		Function: ConvertToMime
		Attempts to use the converter of this data object to morph it into a new mime-type,
		which can be used in order to transform *this.data* into a new value.
		The conversion is done _in place_ and does not return a new object.
		Be aware of this if multiple references to this Object are about.
		
		Parameters:
			toMime - A String representing the mime-type that should be representing this object
			converter - The MimeConverter to use in this conversion rather than the default.
	*/
	this.ConvertToMime=function(toMime,converter){
		converter=converter||this.converter
		if(converter) {
			converter.ConvertToMime(toMime,this,undefined,true);
		}
	}
	return this;
}