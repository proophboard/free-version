mxKeyHandler.prototype.isControlDown = function (evt) {
    return (mxClient.IS_MAC && mxEvent.isMetaDown(evt)) || mxEvent.isControlDown(evt);
}
