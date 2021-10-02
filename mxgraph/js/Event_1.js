var mxEventIsControlDown = mxEvent.isControlDown;
mxEvent.isControlDown = function (evt, treatMetaAsCtrl) {
    if(treatMetaAsCtrl) {
        return (mxClient.IS_MAC && mxEvent.isMetaDown(evt)) || mxEventIsControlDown(evt);
    }

    return mxEventIsControlDown(evt);
}
