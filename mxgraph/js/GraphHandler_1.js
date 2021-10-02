mxGraphHandler.prototype.start = function(cell, x, y)
{
    this.cell = cell;
    this.first = mxUtils.convertPoint(this.graph.container, x, y);
    this.firstT = new mxPoint(this.graph.view.translate.x, this.graph.view.translate.y);
    this.cells = this.getCells(this.cell);
    this.bounds = this.graph.getView().getBounds(this.cells);
    this.pBounds = this.getPreviewBounds(this.cells);

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