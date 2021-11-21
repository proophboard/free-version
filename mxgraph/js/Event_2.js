var mxEventIsControlDown = mxEvent.isControlDown;
mxEvent.isControlDown = function (evt, treatMetaAsCtrl) {
    if(treatMetaAsCtrl) {
        return (mxClient.IS_MAC && mxEvent.isMetaDown(evt)) || mxEventIsControlDown(evt);
    }

    return mxEventIsControlDown(evt);
}

mxEvent.isSingleTouchEvent = function(evt) {
    return (evt.type != null && evt.type.indexOf('touch') == 0 && evt.touches != null && evt.touches.length === 1);
}
