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
window["EventQueue"] = function(){
    //Form an event queue (needed due to a slew of delayed action events)
    //ie. ajax, saving, undo, copy, paste, etc.
    var $this = {},eventQueue = [],eventHolds = {};

	/*Function: Flush
    	Attempt to perform all the events in the queue from first priority to last priority.

	  Return:
		- *false* if stopped by something.
    	- *true* otherwise.
	*/
    $this["flush"] = function() {
        while (eventQueue.length > 0)
        {
        	var event;
            for (event in eventHolds) {
                return false;
            }
			event=eventQueue.shift();
            event.callbackFunction.apply(
            	event.thisObject||{}
            	,event.argumentsArray
            );
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
    $this["push"] = function(evt) {
		for (var filter in eventHolds) {
			if(!eventHolds[filter]()) {
				return null;
			}
		}
		//use push since the get is costly due to scope chain
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
    $this["unshift"] = function(evt) {
		for (var filter in eventHolds) {
			if (!eventHolds[filter](evt)) {
				return null;
			}
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
    $this["hold"] = function(pushFilter) {
        var holdId;
		do {
			holdId = Math.random();
		} while(eventHolds[holdId]);
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
    $this["release"] = function(holdId) {
        return delete eventHolds[holdId];
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
	$this["bump"] = function(evt) {
		var index = eventQueue.indexOf(evt);
		if(index >= 0) {
			$this.unshift(eventQueue.splice(index,1))
		}
	}

    return $this;
}