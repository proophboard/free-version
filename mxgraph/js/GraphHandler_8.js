// Disable default update cursor logic, since we don't want to set cursors on cell states, but only change graph container cursor
mxGraphHandler.prototype.updateCursor = false;

mxGraphHandler.onlyY = false;

const mxGraphHandlerMouseDown = mxGraphHandler.prototype.mouseDown;
mxGraphHandler.prototype.mouseDown = function(sender, me) {
    var cell = this.getInitialCellForEvent(me);

    if(cell && cell.isEdge() && this.graph.isCellLocked(cell.source) && this.graph.isCellLocked(cell.target)) {
        this.graph.setSelectionCells([cell, cell.source, cell.target]);
    }

    mxGraphHandlerMouseDown.call(this, sender, me);
}

mxGraphHandler.prototype.start = function(cell, x, y)
{
    this.cell = cell;
    this.first = mxUtils.convertPoint(this.graph.container, x, y);
    this.firstT = new mxPoint(this.graph.view.translate.x, this.graph.view.translate.y);

    this.onlyY = false;

    if(this.cell.isEdge() && this.graph.isCellLocked(this.cell.source) && this.graph.isCellLocked(this.cell.target)) {
        this.cells = [this.cell, this.cell.source, this.cell.target];
        this.onlyY = true;
    } else {
        this.cells = this.getCells(this.cell);
        if(inspectioUtils.isSliceLaneLabel(this.cell)) {
            this.onlyY = true;
        }
    }


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

    return new mxPoint(this.onlyY ? 0 : this.roundLength((point.x - this.first.x + tDX) / s) * s,
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

    var mouseTarget = me.getCell();
    var cursor = null;

    if(this.cell && this.graph.isMergeSchemaEnabled() && this.isSchemaMergeTarget(this.cell, mouseTarget)) {
        var state = this.graph.getView().getState(mouseTarget);

        if(state) {
            this.setHighlightColor(mxConstants.DROP_TARGET_COLOR);
            this.highlight.highlight(state);
            cursor = 'url("data:image/svg+xml,%3Csvg version=\'1.1\' id=\'Layer_1\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' x=\'0px\' y=\'0px\' width=\'30px\' height=\'22px\' viewBox=\'-0.5 -0.5 241 178\' style=\'enable-background:new 0 0 512 512;\' xml:space=\'preserve\'%3E %3Cdefs%20%2F%3E%3Cg%3E%3Cellipse%20cx%3D%22200%22%20cy%3D%2257%22%20rx%3D%2240%22%20ry%3D%2240%22%20fill%3D%22%23999999%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%2240%22%20cy%3D%2257%22%20rx%3D%2240%22%20ry%3D%2240%22%20fill%3D%22%23999999%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%2240%22%20cy%3D%2257%22%20rx%3D%2230%22%20ry%3D%2230%22%20fill%3D%22%23ffffff%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%22200%22%20cy%3D%2257%22%20rx%3D%2230%22%20ry%3D%2230%22%20fill%3D%22%23ffffff%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%22120%22%20cy%3D%2297%22%20rx%3D%2280%22%20ry%3D%2280%22%20fill%3D%22%238f8f8f%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%2295%22%20cy%3D%2292%22%20rx%3D%2235%22%20ry%3D%2235%22%20fill%3D%22%23ffffff%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%22145%22%20cy%3D%2292%22%20rx%3D%2235%22%20ry%3D%2235%22%20fill%3D%22%23ffffff%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%22118.75%22%20cy%3D%22137%22%20rx%3D%2251.25%22%20ry%3D%2230%22%20fill%3D%22%23ffffff%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cpath%20d%3D%22M%20109.41%20118.87%20Q%20128.16%20118.87%20128.16%20143.87%20Q%20128.16%20168.87%20109.41%20168.87%20Z%22%20fill%3D%22%23999999%22%20stroke%3D%22none%22%20transform%3D%22rotate%2889%2C118.79%2C143.87%29%22%20pointer-events%3D%22all%22%2F%3E%3Cellipse%20cx%3D%22121%22%20cy%3D%22109.43%22%20rx%3D%2210.865%22%20ry%3D%227.714999999999999%22%20fill%3D%22%23999999%22%20stroke%3D%22none%22%20pointer-events%3D%22all%22%2F%3E%3Cpath%20d%3D%22M%20113.13%209.5%20Q%20143.13%209.5%20143.13%2033.25%20Q%20143.13%2057%20113.13%2057%20Q%20128.13%2033.25%20113.13%209.5%20Z%22%20fill%3D%22%238f8f8f%22%20stroke%3D%22none%22%20transform%3D%22rotate%2815%2C128.13%2C33.25%29%22%20pointer-events%3D%22all%22%2F%3E%3Cpath%20d%3D%22M%2091.73%20-11%20Q%20121.73%20-11%20121.73%2024%20Q%20121.73%2059%2091.73%2059%20Q%20106.73%2024%2091.73%20-11%20Z%22%20fill%3D%22%238f8f8f%22%20stroke%3D%22none%22%20transform%3D%22rotate%28-75%2C106.73%2C24%29%22%20pointer-events%3D%22all%22%2F%3E%3Cpath%20d%3D%22M%2087.25%2077%20Q%2097.16%2077%2097.16%2087%20Q%2097.16%2097%2087.25%2097%20Z%22%20fill%3D%22%23999999%22%20stroke%3D%22none%22%20transform%3D%22rotate%28-89%2C92.2%2C87%29%22%20pointer-events%3D%22all%22%2F%3E%3Cpath%20d%3D%22M%20142.22%2077%20Q%20152.13%2077%20152.13%2087%20Q%20152.13%2097%20142.22%2097%20Z%22%20fill%3D%22%23999999%22%20stroke%3D%22none%22%20transform%3D%22rotate%28-89%2C147.17%2C87%29%22%20pointer-events%3D%22all%22%2F%3E%3C%2Fg%3E %3C/svg%3E"), pointer';
        }
    } else {
        cursor = this.graph.getCursorForMouseEvent(me);
    }

    if(cursor !== null) {
        this.graph.setMouseCursor(cursor);
    } else {
        this.graph.setMouseCursor('default');
    }
}

mxGraphHandler.prototype.isSchemaMergeTarget = function (sourceCell, targetCell) {
    if(!inspectioUtils.isSticky(sourceCell) || !inspectioUtils.isSticky(targetCell)) {
        return false;
    }

    var relevantTypes = [ispConst.TYPE_DOCUMENT, ispConst.TYPE_COMMAND, ispConst.TYPE_EVENT];

    if(inspectioUtils.getType(sourceCell) !== ispConst.TYPE_DOCUMENT || !relevantTypes.includes(inspectioUtils.getType(targetCell))) {
        return false;
    }

    return sourceCell.getId() !== targetCell.getId();
}

mxGraphHandlerMouseUp = mxGraphHandler.prototype.mouseUp;
mxGraphHandler.prototype.mouseUp = function (sender, me) {
    if(this.target && inspectioUtils.isContainer(this.target)) {
        // Reset target, because graph CELLS_MOVED listener will check and sync cells with overlapping containers
        this.target = null;
    }

    if (this.graph.isMergeSchemaEnabled() && this.isSchemaMergeTarget(this.cell, me.getCell())) {
        this.graph.mergeSchema(this.cell, me.getCell());
    }

    var isSourceLocked = false;
    var isTargetLocked = false;
    var maybeEdge = this.cell;

    if(maybeEdge && maybeEdge.isEdge()) {
        isSourceLocked = this.graph.isCellLocked(maybeEdge.source);
        isTargetLocked = this.graph.isCellLocked(maybeEdge.target);

        if(isSourceLocked) {
            mxClipboard.tempUnlockCell(this.graph, maybeEdge.source);
        }

        // this.cells.push(maybeEdge.source);

        if(isTargetLocked) {
            mxClipboard.tempUnlockCell(this.graph, maybeEdge.target);
        }

        // this.cells.push(maybeEdge.target);
    }

    mxGraphHandlerMouseUp.call(this, sender, me);

    if(isSourceLocked) {
        mxClipboard.relockCell(this.graph, maybeEdge.source);
    }

    if(isTargetLocked) {
        mxClipboard.relockCell(this.graph, maybeEdge.target);
    }

    const newCells = this.graph.getSelectionCells();

    if(isSourceLocked && newCells.length === 3) {
        mxClipboard.relockCell(this.graph, newCells[1]);
    }

    if(isTargetLocked && newCells.length === 3) {
        mxClipboard.relockCell(this.graph, newCells[2]);
    }
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
