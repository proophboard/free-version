// Disable default update cursor logic, since we don't want to set cursors on cell states, but only change graph container cursor
mxGraphHandler.prototype.updateCursor = false;

mxGraphHandler.prototype.start = function(cell, x, y)
{
    this.cell = cell;
    this.first = mxUtils.convertPoint(this.graph.container, x, y);
    this.firstT = new mxPoint(this.graph.view.translate.x, this.graph.view.translate.y);
    this.cells = this.getCells(this.cell);
    this.bounds = this.graph.getView().getBounds(this.cells);
    this.pBounds = this.getPreviewBounds(this.cells);
    this.prevGraphCursor = this.graph.getMouseCursor();

    this.graph.setMouseCursor('grabbing');


    if (this.guidesEnabled)
    {
        this.guide = new mxGuide(this.graph, this.getGuideStates());
    }
};

mxGraphHandler.prototype.getDelta = function(me)
{
    var point = mxUtils.convertPoint(this.graph.container, me.getX(), me.getY());
    var s = this.graph.view.scale;

    var tDX = (this.firstT.x - this.graph.view.translate.x) * this.graph.view.scale;
    var tDY = (this.firstT.y - this.graph.view.translate.y) * this.graph.view.scale;

    return new mxPoint(this.roundLength((point.x - this.first.x + tDX) / s) * s,
        this.roundLength((point.y - this.first.y + tDY) / s) * s);
};

var mxGraphHanderMouseMove = mxGraphHandler.prototype.mouseMove;
mxGraphHandler.prototype.mouseMove = function (sender, me) {
    if (!me.isConsumed() && this.graph.isMouseDown && this.cell != null &&
        this.first != null && this.bounds != null)
    {
        // Do not move cell while content editing
        if(this.graph.cellEditor.isContentEditing()) {
            this.reset();
            return;
        }
    }

    mxGraphHanderMouseMove.call(this, sender, me);

    const cursor = this.graph.getCursorForMouseEvent(me);

    if(cursor !== null) {
        this.graph.setMouseCursor(cursor);
    } else {
        this.graph.setMouseCursor('default');
    }
}

mxGraphHandlerMouseUp = mxGraphHandler.prototype.mouseUp;
mxGraphHandler.prototype.mouseUp = function (sender, me) {
    if(this.target && inspectioUtils.isContainer(this.target)) {
        // Reset target, because graph CELLS_MOVED listener will check and sync cells with overlapping containers
        this.target = null;
    }

    mxGraphHandlerMouseUp.call(this, sender, me);
}

var mxGraphHandlerCreatePreviewShape = mxGraphHandler.prototype.createPreviewShape;
mxGraphHandler.prototype.createPreviewShape = function (bounds) {
    const shape = mxGraphHandlerCreatePreviewShape.call(this, bounds);
    shape.setCursor('grabbing');
    return shape;
}

var mxGraphHandlerReset = mxGraphHandler.prototype.reset;
mxGraphHandler.prototype.reset = function()
{
    mxGraphHandlerReset.call(this);
    this.graph.setMouseCursor(this.prevGraphCursor);
}
