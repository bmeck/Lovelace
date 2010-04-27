//Garbage Collection Job manager...
//Yes, its here to manually remove things in a defered manner
//ie: Removing tags in documents that are not seen by the user
//,   Cleaning up growable JS objects
window["GarbageCollectionManager"]=function(cleanUpTime,cleanUpWindow){
	//once every second
	cleanUpTime=cleanUpTime||1000;
	//skip if its been over 2 seconds since last run
	cleanUpWindow=cleanUpWindow||cleanUpTime*2;
	var lastRun=new Date;
	var jobs=[];
	var $this={};
	function RemovalDistpatcher(job) {
		return function(){
			$this.removeJob(job);
		}
	}
	var cleanUp;
	cleanUp=function(){
		var time=new Date;
		//time between is more than the window?
		var tooBusy=time-lastRun>cleanUpWindow;
		lastRun=time;
		if(tooBusy) {
			return;//its been busy enough to prevent timely call, skip it
		}
		$this.collect();
		setTimeout(cleanUp,cleanUpTime);
	}
	$this.collect=function(){
		for(var i=0;i<jobs.length;i++) {
			jobs[i]();
		}
	}
	$this.addJob=function(callback) {
		jobs.push(callback);
		return callback;
	}
	$this.removeJob=function(callback) {
		jobs.splice(jobs.indexOf(job),1);
	}
	//Get this bad boy running
	setTimeout(cleanUp,cleanUpTime);
	return $this;
}
window["gc"]=GarbageCollectionManager()