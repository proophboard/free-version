// Shows secondary handle for fixed connection points
mxEdgeHandler.prototype.createHandleShape = function(index, virtual)
{
    var source = index != null && index == 0;
    var terminalState = this.state.getVisibleTerminalState(source);
    var c = (index != null && (index == 0 || index >= this.state.absolutePoints.length - 1 ||
        (this.constructor == mxElbowEdgeHandler && index == 2))) ?
        this.graph.getConnectionConstraint(this.state, terminalState, source) : null;
    var pt = (c != null) ? this.graph.getConnectionPoint(this.state.getVisibleTerminalState(source), c) : null;
    var img = (pt != null) ? this.fixedHandleImage : ((c != null && terminalState != null) ?
        this.terminalHandleImage : this.handleImage);

    if (img != null)
    {
        var shape = new mxImageShape(new mxRectangle(0, 0, img.width / this.graph.currentScale, img.height /  this.graph.currentScale), img.src);

        // Allows HTML rendering of the images
        shape.preserveImageAspect = false;

        return shape;
    }
    else
    {
        var s = mxConstants.HANDLE_SIZE / this.graph.currentScale;

        if (this.preferHtml)
        {
            s -= 1;
        }

        return new mxRectangleShape(new mxRectangle(0, 0, s, s), mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR);
    }
};

mxEdgeHandler.prototype.createSelectionShape = function(points)
{
    var shape = new mxEdgeHighlight(undefined, undefined, 3);
    shape.outline = true;
    shape.apply(this.state);

    shape.isDashed = this.isSelectionDashed();
    shape.stroke = this.getSelectionColor();
    shape.isShadow = false;
    shape.strokewidth = 4;

    return shape;
};

mxEdgeHandler.prototype.mouseMove = function(sender, me)
{
    if (this.index != null && this.marker != null)
    {
        var orgEdgeState = this.state;
        var orgSourceState = this.state.getVisibleTerminalState(true);
        var orgTargetState = this.state.getVisibleTerminalState(false);

        this.state = this.graph.cloneAndTranslateCellState(orgEdgeState);
        this.state.setVisibleTerminalState(this.graph.cloneAndTranslateCellState(orgSourceState), true);
        this.state.setVisibleTerminalState(this.graph.cloneAndTranslateCellState(orgTargetState), false);

        this.currentPoint = this.getPointForEvent(me);
        this.error = null;

        // Uses the current point from the constraint handler if available
        if (!this.graph.isIgnoreTerminalEvent(me.getEvent()) && mxEvent.isShiftDown(me.getEvent()) && this.snapPoint != null)
        {
            if (Math.abs(this.snapPoint.x - this.currentPoint.x) < Math.abs(this.snapPoint.y - this.currentPoint.y))
            {
                this.currentPoint.x = this.snapPoint.x;
            }
            else
            {
                this.currentPoint.y = this.snapPoint.y;
            }
        }

        if (this.index <= mxEvent.CUSTOM_HANDLE && this.index > mxEvent.VIRTUAL_HANDLE)
        {
            if (this.customHandles != null)
            {
                this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].processEvent(me);
            }
        }
        else if (this.isLabel)
        {
            this.label.x = this.currentPoint.x;
            this.label.y = this.currentPoint.y;
        }
        else
        {
            this.points = this.getPreviewPoints(this.currentPoint, me);
            var terminalState = (this.isSource || this.isTarget) ? this.getPreviewTerminalState(me) : null;

            if (this.constraintHandler.currentConstraint != null &&
                this.constraintHandler.currentFocus != null &&
                this.constraintHandler.currentPoint != null)
            {
                this.currentPoint = this.constraintHandler.currentPoint.clone();
            }
            else if (this.outlineConnect)
            {
                // Need to check outline before cloning terminal state
                var outline = (this.isSource || this.isTarget) ? this.isOutlineConnectEvent(me) : false

                if (outline)
                {
                    terminalState = this.marker.highlight.state;
                }
                else if (terminalState != null && terminalState != me.getState() && this.marker.highlight.shape != null)
                {
                    this.marker.highlight.shape.stroke = 'transparent';
                    this.marker.highlight.repaint();
                    terminalState = null;
                }
            }

            if (terminalState != null && this.graph.isCellLocked(terminalState.cell))
            {
                terminalState = null;
                this.marker.reset();
            }

            if(terminalState != null) {
                terminalState = this.graph.cloneAndTranslateCellState(terminalState);
            }

            var clone = this.clonePreviewState(this.currentPoint, (terminalState != null) ? terminalState.cell : null);
            this.updatePreviewState(clone, this.currentPoint, terminalState, me, outline);

            // Sets the color of the preview to valid or invalid, updates the
            // points of the preview and redraws
            var color = (this.error == null) ? this.marker.validColor : this.marker.invalidColor;
            this.setPreviewColor(color);
            this.abspoints = clone.absolutePoints;
            this.active = true;
        }

        // This should go before calling isOutlineConnectEvent above. As a workaround
        // we add an offset of gridSize to the hint to avoid problem with hit detection
        // in highlight.isHighlightAt (which uses comonentFromPoint)
        this.updateHint(me, this.currentPoint);
        this.drawPreview();
        mxEvent.consume(me.getEvent());
        me.consume();

        this.state = orgEdgeState;
        this.state.setVisibleTerminalState(orgSourceState, true);
        this.state.setVisibleTerminalState(orgTargetState, false);
    }
    // Workaround for disabling the connect highlight when over handle
    else if (mxClient.IS_IE && this.getHandleForEvent(me) != null)
    {
        me.consume(false);
    }
};

mxEdgeHandler.prototype.redraw = function()
{
    this.abspoints = this.state.absolutePoints.slice();
    this.redrawHandles();

    var tState = this.graph.cloneAndTranslateCellState(this.state);
    this.abspoints = tState.absolutePoints.slice();

    var g = this.graph.getModel().getGeometry(this.state.cell);
    var pts = g.points;

    if (this.bends != null && this.bends.length > 0)
    {
        if (pts != null)
        {
            if (this.points == null)
            {
                this.points = [];
            }

            for (var i = 1; i < this.bends.length - 1; i++)
            {
                if (this.bends[i] != null && this.abspoints[i] != null)
                {
                    this.points[i - 1] = pts[i - 1];
                }
            }
        }
    }

    this.drawPreview();
};

mxEdgeHandler.prototype.drawPreview = function()
{
    if (this.isLabel)
    {
        var b = this.labelShape.bounds;
        var bounds = new mxRectangle(Math.round(this.label.x - b.width / 2),
            Math.round(this.label.y - b.height / 2), b.width, b.height);
        this.labelShape.bounds = bounds;
        this.labelShape.redraw();
    }
    else if (this.shape != null)
    {
        const graphPoints = [];

        this.abspoints.forEach(abspoint => {
            graphPoints.push(this.graph.translateMousePoint(abspoint.x, abspoint.y));
        })

        this.shape.apply(this.graph.cloneAndScaleCellState(this.state));
        this.shape.points = graphPoints;
        this.shape.isDashed = this.isSelectionDashed();
        this.shape.stroke = this.getSelectionColor();
        this.shape.strokewidth = this.getSelectionStrokeWidth() / this.shape.scale / this.shape.scale;
        this.shape.isShadow = false;
        this.shape.redraw();
    }

    if (this.parentHighlight != null)
    {
        this.parentHighlight.redraw();
    }
};
