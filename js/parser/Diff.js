//iterable2 is considered the new version
function diff(iterable1,iterable2,delim) {
//	patch.push({
//		status:deleted|added|kept
//		,data:$
//	})
	var length=iterable1.length,startPartIndex=0
	,i=0,ii=0,offset=0
	,parts1=[],lengthParts1=0
	,parts2=[],lengthParts2=0
	,patch=[];
	for(;i<length;i++) {
		if(iterable1[i]==delim) {
			parts1[lengthParts1++]=iterable1.slice(
				startPartIndex,startPartIndex=i+1
			);
		}
	}
	length=iterable2.length;
	for(i=0;i<length;i++) {
		if(iterable2[i]==delim) {
			parts2[lengthParts2++]=iterable1.slice(
				startPartIndex,startPartIndex=i+1
			);
		}
	}
	//run through all the items of parts1
	for(i=0;i<lengthParts1;i++) {
		//just run if they are the same
		while(parts2[ii]==parts1[i]) {
			ii++;i++
		}
		//resolve diff,
		//find first matching pair of items
		var setMap={}
	}
	//add rest of parts2
	if(ii<)

	return patch;
}