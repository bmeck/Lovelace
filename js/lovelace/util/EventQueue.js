/*
	Class: EventQueue
	A blocking queue that is used to call callback functions as it flushes.
	
	It is often the case that you will want to flush the queue on loading it
	- w3c:
	|document.defaultView.addEventListener("load",function() {
    |    e.Flush();
    |});
	- ie: 
	|document.defaultView.attachEvent("load",function() {
    |    e.Flush();
    |});
	
	Type: EventObject
	This is the specification of what the evt parameters in this file follow.
	It is meant as simple encapsulation and as such does not use a constructor
	|{
	| argumentsArray : [],
	| callbackFunction : function(...){},
	| thisObject : $
	|}
*/
EventQueue = function(){
    //Form an event queue (needed due to a slew of delayed action events)
    //ie. ajax, saving, undo, copy, paste, etc.
    var self = this;
    var eventQueue = [];
    var eventHolds = {};

	/*Function: Flush
    	Attempt to perform all the events in the queue from first priority to last priority.
    	
	  Return:
		- *false* if stopped by something.
    	- *true* otherwise.
	*/
    this.Flush = function() {
        while (eventQueue.length > 0)
        {
            for (var hold in eventHolds) {
                return false;
            }
            var event = eventQueue.shift();
            if (event.log) {
               Log.log(event.log);
            }
			if (!event.thisObject) {
				event.thisObject = {};//Default to avoid global namespace colisions
			}
            event.callbackFunction.apply(event.thisObject,event.argumentsArray);
        }
        return true;
    }

    /*
		Function: PushEvent
		Put an event on the queue at the last priority. Uses an object to push for reusability.
		
    	Parameter: 
			evt - Object to be put at the end of the queue

		Return:
			position in queue *(1 indexed)* or null if not allowed
			
		See:
			<EventObject>
			<UnshiftEvent>
	*/
    this.PushEvent = function(evt) {
		for (var filter in eventHolds) {
			if(eventHolds[filter] && !eventHolds[filter]()) return null;
		}
        return eventQueue.push(evt)
    }

    /*
		Function: UnshiftEvent
		Put an event on the queue at the first priority. Uses an object to push for reusability.

    	Parameter: 
			evt - Object to be put at the top of the queue

		Return:
			position in queue *(1 indexed)* or null if not allowed
		
		See:
			<EventObject>
			<PushEvent>
	*/
    this.UnshiftEvent = function(evt) {
		for (var filter in eventHolds) {
			if (eventHolds[filter] && !eventHolds[filter](evt)) return null;
		}
        eventQueue.unshift(evt);
		//Log.log(evt,"added")
        return 0;
    }

	/*
		Function: HoldEvents
		Prevents any more events from being executed until the hold is released.
		Optionally prevents any more events from being added to the queue with a filter.

    	Parameter: 
			pushFilter - bool function(evt): return true if the event is allowed to be added to the queue while this hold is active

		Return:
			holdId - Object to give to ReleaseHold to release this specific hold
		
		See:
			<ReleaseHold>
	*/
    this.HoldEvents = function(pushFilter) {
        var holdId = Math.random();
		while (eventHolds[holdId]) {
			holdId = Math.random();
		}
        eventHolds[holdId] = pushFilter;
        return holdId;
    }
    /*
		Function: ReleaseHold
		Releases a hold on this queue and allows events to flow naturally again.

    	Parameter: 
			holdId - Object specifying which hold to release

		Return:
			- *true* if successful in releasing that hold
			- *false* if hold was not released or was released already
		
		See:
			<HoldEvents>
	*/
    this.ReleaseHold = function(holdId) {
		//Log.log("releasing ",holdId,eventHolds)
        if (holdId in eventHolds) {
            delete eventHolds[holdId];
            return true;
        }
        return false;
    }

	/*
		Function: Bump
		Moves a given event to the front of the queue.
		If the event is not in the queue already it is ignored.
		If the event is already at the front of the queue it does nothing

    	Parameter: 
			evt - Object to push to top
			
		See:
			<EventObject>
	*/
	this.Bump = function(evt) {
		var index = eventQueue.indexOf(evt)
		if(index<0) {
			var newTop = eventQueue.splice(evt,1)[0];
			this.UnshiftEvent(evt)
		}
	}

    return this;
}