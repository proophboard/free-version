mxEvent.addMouseWheelListener = function(funct)
{
    if (funct != null)
    {
        var wheelHandler = function(evt)
        {
            // IE does not give an event object but the
            // global event object is the mousewheel event
            // at this point in time.
            if (evt == null)
            {
                evt = window.event;
            }

            var delta = 0;

            if (mxClient.IS_FF)
            {
                delta = -evt.detail / 2;
            }
            else
            {
                delta = evt.wheelDelta / 120;
            }

            // Handles the event using the given function
            if (delta != 0)
            {
                funct(evt, delta > 0);
            }
        };

        // Webkit has NS event API, but IE event name and details
        if (mxClient.IS_NS && document.documentMode == null)
        {
            var eventName = (mxClient.IS_SF || 	mxClient.IS_GC) ? 'mousewheel' : 'DOMMouseScroll';
            mxEvent.addListener(window, eventName, wheelHandler, {passive: false});
        }
        else
        {
            mxEvent.addListener(document, 'mousewheel', wheelHandler, {passive: false});
        }
    }
};

mxEvent.addListener = function()
{
    var updateListenerList = function(element, eventName, funct)
    {
        if (element.mxListenerList == null)
        {
            element.mxListenerList = [];
        }

        var entry = {name: eventName, f: funct};
        element.mxListenerList.push(entry);
    };

    if (window.addEventListener)
    {
        return function(element, eventName, funct, listenerOptions)
        {
            if(typeof listenerOptions === 'undefined') {
                listenerOptions = false;
            }
            element.addEventListener(eventName, funct, listenerOptions);
            updateListenerList(element, eventName, funct);
        };
    }
    else
    {
        return function(element, eventName, funct)
        {
            element.attachEvent('on' + eventName, funct);
            updateListenerList(element, eventName, funct);
        };
    }
}();

mxEvent.isTouchpadZoomEvent = function (evt) {
    return evt.wheelDeltaY ? Math.abs(evt.deltaY) < 10 : evt.deltaMode === 0;
}

mxEvent.isTouchpadPinchToZoomEvent = function (evt) {
    return evt.ctrlKey;
};
