var mxConnectionHandlerInit = mxConnectionHandler.prototype.init;
mxConnectionHandler.prototype.init = function () {
    mxConnectionHandlerInit.call(this);
    this.lastInsertedEdge = null;
    this.insertedEdgeSourceConstraint = null;
    this.insertedEdgeTargetConstraint = null;
}

mxConnectionHandler.prototype.createShape = function()
{
    // Creates the edge preview
    var shape = (this.livePreview && this.edgeState != null) ?
        this.graph.cellRenderer.createShape(this.edgeState) :
        new mxPolyline([], mxConstants.INVALID_COLOR);
    shape.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ?
        mxConstants.DIALECT_VML : mxConstants.DIALECT_SVG;
    shape.scale = this.graph.view.scale;
    shape.pointerEvents = false;
    shape.isDashed = true;
    shape.init(this.graph.getView().getOverlayPane());
    mxEvent.redirectMouseEvents(shape.node, this.graph, null);

    if(shape.node) {
        shape.node.classList.add('ge-edge-connector');
    }

    return shape;
};

/**
 * Function: updateEdgeState
 *
 * Updates <edgeState>.
 */
mxConnectionHandler.prototype.updateEdgeState = function(current, constraint)
{
    // TODO: Use generic method for writing constraint to style
    if (this.sourceConstraint != null && this.sourceConstraint.point != null)
    {
        this.edgeState.style[mxConstants.STYLE_EXIT_X] = this.sourceConstraint.point.x;
        this.edgeState.style[mxConstants.STYLE_EXIT_Y] = this.sourceConstraint.point.y;
    }

    if (constraint != null && constraint.point != null)
    {
        this.edgeState.style[mxConstants.STYLE_ENTRY_X] = constraint.point.x;
        this.edgeState.style[mxConstants.STYLE_ENTRY_Y] = constraint.point.y;
    }
    else
    {
        delete this.edgeState.style[mxConstants.STYLE_ENTRY_X];
        delete this.edgeState.style[mxConstants.STYLE_ENTRY_Y];
    }

    this.edgeState.absolutePoints = [null, (this.currentState != null) ? null : current];
    this.graph.view.updateFixedTerminalPoint(this.edgeState, this.previous, true, this.sourceConstraint);

    if (this.currentState != null)
    {
        if (constraint == null)
        {
            constraint = this.graph.getConnectionConstraint(this.edgeState, this.previous, false);
        }

        this.edgeState.setAbsoluteTerminalPoint(null, false);
        this.graph.view.updateFixedTerminalPoint(this.edgeState, this.currentState, false, constraint);
    }

    // Scales and translates the waypoints to the model
    var realPoints = null;

    if (this.waypoints != null)
    {
        realPoints = [];

        for (var i = 0; i < this.waypoints.length; i++)
        {
            var pt = this.waypoints[i].clone();
            this.convertWaypoint(pt);
            realPoints[i] = pt;
        }
    }

    this.graph.view.updatePoints(this.edgeState, realPoints, this.graph.cloneAndTranslateCellState(this.previous), this.graph.cloneAndTranslateCellState(this.currentState));
    this.graph.view.updateFloatingTerminalPoints(this.edgeState, this.graph.cloneAndTranslateCellState(this.previous), this.graph.cloneAndTranslateCellState(this.currentState));
};

mxConnectionHandler.prototype.detectConnectDirection = function (targetBounds, mousePoint) {
    var diffX = null;
    var diffY = null;

    var isNearLeft = function () {
        return targetBounds.x < mousePoint.x && mousePoint.x - targetBounds.x < targetBounds.width / 2;
    }

    var isNearRight = function () {
        return targetBounds.x + targetBounds.width > mousePoint.x && mousePoint.x >= targetBounds.x + targetBounds.width / 2;
    }

    var isNearTop = function () {
        return targetBounds.y < mousePoint.y && mousePoint.y - targetBounds.y < targetBounds.height / 2;
    }

    var isNearBottom = function () {
        return targetBounds.y + targetBounds.height > mousePoint.y && mousePoint.y >= targetBounds.y + targetBounds.height / 2;
    }

    var detectVerticalConnectSite = function () {
        if(isNearLeft()) {
            return mxConstants.DIRECTION_WEST;
        }

        return mxConstants.DIRECTION_EAST;
    }

    var detectHorizontalConnectSite = function () {
        if(isNearTop()) {
            return mxConstants.DIRECTION_NORTH;
        }

        return mxConstants.DIRECTION_SOUTH;
    }

    if(isNearLeft()) {
        diffX = mousePoint.x - targetBounds.x;
    } else if (isNearRight()) {
        diffX = targetBounds.x + targetBounds.width - mousePoint.x;
    }

    if(isNearTop()) {
        diffY = mousePoint.y - targetBounds.y;
    } else if (isNearBottom()) {
        diffY = targetBounds.y + targetBounds.height - mousePoint.y;
    }

    if(!diffX || !diffY) {
        return null;
    }

    if(diffX < diffY) {
        return detectVerticalConnectSite();
    } else {
        return detectHorizontalConnectSite();
    }

}

/**
 * Function: mouseMove
 *
 * Handles the event by updating the preview edge or by highlighting
 * a possible source or target terminal.
 */
mxConnectionHandler.prototype.mouseMove = function(sender, me)
{
    if (!me.isConsumed() && (this.ignoreMouseDown || this.first != null || !this.graph.isMouseDown))
    {
        // Handles special case when handler is disabled during highlight
        if (!this.isEnabled() && this.currentState != null)
        {
            this.destroyIcons();
            this.currentState = null;
        }

        var view = this.graph.getView();
        var scale = view.scale;
        var tr = view.translate;
        var point = new mxPoint(me.getGraphX(), me.getGraphY());
        this.error = null;

        if (this.graph.isGridEnabledEvent(me.getEvent()))
        {
            point = new mxPoint((this.graph.snap(point.x / scale - tr.x) + tr.x) * scale,
                (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale);
        }

        this.snapToPreview(me, point);
        this.currentPoint = point;

        if ((this.first != null || (this.isEnabled() && this.graph.isEnabled())) &&
            (this.shape != null || this.first == null ||
                Math.abs(me.getGraphX() - this.first.x) > this.graph.tolerance ||
                Math.abs(me.getGraphY() - this.first.y) > this.graph.tolerance))
        {
            this.updateCurrentState(me, point);
        }

        if (this.first != null)
        {
            var constraint = null;
            var current = point;

            // Uses the current point from the constraint handler if available
            if (this.constraintHandler.currentConstraint != null &&
                this.constraintHandler.currentFocus != null &&
                this.constraintHandler.currentPoint != null)
            {
                constraint = this.constraintHandler.currentConstraint;
                current = this.constraintHandler.currentPoint.clone();
            }
            else if (this.previous != null && !this.graph.isIgnoreTerminalEvent(me.getEvent()) &&
                mxEvent.isShiftDown(me.getEvent()))
            {
                if (Math.abs(this.previous.getCenterX() - point.x) <
                    Math.abs(this.previous.getCenterY() - point.y))
                {
                    point.x = this.previous.getCenterX();
                }
                else
                {
                    point.y = this.previous.getCenterY();
                }
            }

            var pt2 = this.first;

            // Moves the connect icon with the mouse
            if (this.selectedIcon != null)
            {
                var w = this.selectedIcon.bounds.width;
                var h = this.selectedIcon.bounds.height;

                if (this.currentState != null && this.targetConnectImage)
                {
                    var pos = this.getIconPosition(this.selectedIcon, this.currentState);
                    this.selectedIcon.bounds.x = pos.x;
                    this.selectedIcon.bounds.y = pos.y;
                }
                else
                {
                    var bounds = new mxRectangle(me.getGraphX() + this.connectIconOffset.x,
                        me.getGraphY() + this.connectIconOffset.y, w, h);
                    this.selectedIcon.bounds = bounds;
                }

                this.selectedIcon.redraw();
            }

            // Uses edge state to compute the terminal points
            if (this.edgeState != null)
            {
                if(this.graph.considerDirectionOnConnect && this.previous != null && this.currentState != null && this.previous !== this.currentState) {
                    var targetBounds = this.graph.view.getPerimeterBounds(this.currentState);
                    var mousePoint = this.graph.translateMousePoint(me.getGraphX(), me.getGraphY());
                    var connectDirection = this.detectConnectDirection(targetBounds, mousePoint);

                    if(connectDirection) {
                        var graphPointing;

                        // @TODO: clarify why we need an outline constraint for preview edge, with different coordinates
                        // For finally inserted edge constraint point coordinates are scaled, which seems to be wrong
                        switch (connectDirection) {
                            case mxConstants.DIRECTION_WEST:
                                graphPointing = this.graph.translateGraphPoint(targetBounds.x, targetBounds.getCenterY());
                                this.insertedEdgeTargetConstraint = new mxConnectionConstraint(new mxPoint(0, 0.5), false);
                                break;
                            case mxConstants.DIRECTION_EAST:
                                graphPointing = this.graph.translateGraphPoint(targetBounds.x + targetBounds.width, targetBounds.getCenterY());
                                this.insertedEdgeTargetConstraint = new mxConnectionConstraint(new mxPoint(1, 0.5), false);
                                break;
                            case mxConstants.DIRECTION_NORTH:
                                graphPointing = this.graph.translateGraphPoint(targetBounds.getCenterX(), targetBounds.y);
                                this.insertedEdgeTargetConstraint = new mxConnectionConstraint(new mxPoint(0.5, 0), false);
                                break;
                            case mxConstants.DIRECTION_SOUTH:
                                graphPointing = this.graph.translateGraphPoint(targetBounds.getCenterX(), targetBounds.y + targetBounds.height);
                                this.insertedEdgeTargetConstraint = new mxConnectionConstraint(new mxPoint(0.5, 1), false);
                                break;
                        }

                        constraint = this.graph.getOutlineConstraint(graphPointing, this.currentState, me);
                        this.constraintHandler.setFocus(me, this.currentState, false);
                        this.constraintHandler.currentConstraint = constraint;
                        this.constraintHandler.currentPoint = graphPointing;
                        current = this.constraintHandler.currentPoint.clone();
                    }
                }
                this.updateEdgeState(current, constraint);
                current = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 1];
                pt2 = this.edgeState.absolutePoints[0];
            }
            else
            {
                if (this.currentState != null)
                {
                    if (this.constraintHandler.currentConstraint == null)
                    {
                        var tmp = this.getTargetPerimeterPoint(this.currentState, me);

                        if (tmp != null)
                        {
                            current = tmp;
                        }
                    }
                }

                // Computes the source perimeter point
                if (this.sourceConstraint == null && this.previous != null)
                {
                    var next = (this.waypoints != null && this.waypoints.length > 0) ?
                        this.waypoints[0] : current;
                    var tmp = this.getSourcePerimeterPoint(this.previous, next, me);

                    if (tmp != null)
                    {
                        pt2 = tmp;
                    }
                }
            }

            // Makes sure the cell under the mousepointer can be detected
            // by moving the preview shape away from the mouse. This
            // makes sure the preview shape does not prevent the detection
            // of the cell under the mousepointer even for slow gestures.
            if (this.currentState == null && this.movePreviewAway)
            {
                var tmp = pt2;

                if (this.edgeState != null && this.edgeState.absolutePoints.length >= 2)
                {
                    var tmp2 = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 2];

                    if (tmp2 != null)
                    {
                        tmp = tmp2;
                    }
                }

                var dx = current.x - tmp.x;
                var dy = current.y - tmp.y;

                var len = Math.sqrt(dx * dx + dy * dy);

                if (len == 0)
                {
                    return;
                }

                // Stores old point to reuse when creating edge
                this.originalPoint = current.clone();
                current.x -= dx * 4 / len;
                current.y -= dy * 4 / len;
            }
            else
            {
                this.originalPoint = null;
            }

            // Creates the preview shape (lazy)
            if (this.shape == null)
            {
                var dx = Math.abs(me.getGraphX() - this.first.x);
                var dy = Math.abs(me.getGraphY() - this.first.y);

                if (dx > this.graph.tolerance || dy > this.graph.tolerance)
                {
                    this.shape = this.createShape();

                    if (this.edgeState != null)
                    {
                        this.shape.apply(this.edgeState);
                    }

                    // Revalidates current connection
                    this.updateCurrentState(me, point);
                }
            }

            // Updates the points in the preview edge
            if (this.shape != null)
            {
                if (this.edgeState != null)
                {
                    var unscaledPoints = [];

                    this.edgeState.absolutePoints.forEach(scaledPoint => {
                        unscaledPoints.push(this.graph.translateMousePoint(scaledPoint.x, scaledPoint.y));
                    });

                    this.shape.points = unscaledPoints;
                }
                else
                {
                    var pts = [pt2];

                    if (this.waypoints != null)
                    {
                        pts = pts.concat(this.waypoints);
                    }

                    pts.push(current);
                    this.shape.points = pts;
                }

                this.drawPreview();
            }

            // Makes sure endpoint of edge is visible during connect
            if (this.cursor != null)
            {
                this.graph.container.style.cursor = this.cursor;
            }

            mxEvent.consume(me.getEvent());
            me.consume();
        }
        else if (!this.isEnabled() || !this.graph.isEnabled())
        {
            this.constraintHandler.reset();
        }
        else if (this.previous != this.currentState && this.edgeState == null)
        {
            this.destroyIcons();

            // Sets the cursor on the current shape
            if (this.currentState != null && this.error == null && this.constraintHandler.currentConstraint == null)
            {
                this.icons = this.createIcons(this.currentState);

                if (this.icons == null)
                {
                    this.currentState.setCursor(mxConstants.CURSOR_CONNECT);
                    me.consume();
                }
            }

            this.previous = this.currentState;
        }
        else if (this.previous == this.currentState && this.currentState != null && this.icons == null &&
            !this.graph.isMouseDown)
        {
            // Makes sure that no cursors are changed
            me.consume();
        }

        if (!this.graph.isMouseDown && this.currentState != null && this.icons != null)
        {
            var hitsIcon = false;
            var target = me.getSource();

            for (var i = 0; i < this.icons.length && !hitsIcon; i++)
            {
                hitsIcon = target == this.icons[i].node || target.parentNode == this.icons[i].node;
            }

            if (!hitsIcon)
            {
                this.updateIcons(this.currentState, this.icons, me);
            }
        }
    }
    else
    {
        this.constraintHandler.reset();
    }
};

var mxConnectionHandlerInsertEdge = mxConnectionHandler.prototype.insertEdge;
mxConnectionHandler.prototype.insertEdge = function(parent, id, value, source, target, style)
{
    this.lastInsertedEdge = mxConnectionHandlerInsertEdge.call(this, parent, id, value, source, target, style);
    return this.lastInsertedEdge;
}

var mxConnectionHandlerConnect = mxConnectionHandler.prototype.connect;
mxConnectionHandler.prototype.connect = function (source, target, evt, dropTarget) {

    if(this.graph.considerDirectionOnConnect && this.insertedEdgeSourceConstraint) {
        this.sourceConstraint = this.insertedEdgeSourceConstraint;
    } else {
        this.sourceConstraint = null;
    }

    // Use helper constraint to force edge connection on specific target terminal site (see mouseMove above)
    if(this.graph.considerDirectionOnConnect && this.insertedEdgeTargetConstraint) {
        this.constraintHandler.currentConstraint = this.insertedEdgeTargetConstraint;
    } else {
        this.constraintHandler.reset();
    }
    mxConnectionHandlerConnect.call(this, source, target, evt, dropTarget);

    if(this.graph.considerDirectionOnConnect && this.lastInsertedEdge) {
        this.graph.getModel().beginUpdate();

        try {
            var edgeState = this.graph.getView().getState(this.lastInsertedEdge);
            var containerParent = this.graph.getModel().getSameContainerParent(source, target);

            if(edgeState) {
                var geo = this.lastInsertedEdge.geometry;
                var absPoints = edgeState.absolutePoints;

                // Check if edge has absolute points along the way
                if(geo && absPoints && absPoints.length > 2) {
                    geo = geo.clone();

                    absPoints = edgeState.absolutePoints.slice(1, -1);
                    // if so, copy them to geometry as fixed waypoints
                    geo.points = absPoints;

                    if(containerParent) {
                        geo.translate(containerParent.getGeometry().x * -1, containerParent.getGeometry().y * -1);
                    }

                    this.graph.getModel().setGeometry(this.lastInsertedEdge, geo);
                    // Now we can reset source and target connection constraint, so that connection points are floating again
                    this.graph.connectCell(this.lastInsertedEdge, source, true, new mxConnectionConstraint());
                    this.graph.connectCell(this.lastInsertedEdge, target, false, new mxConnectionConstraint());
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            this.graph.getModel().endUpdate();
        }
    }

    this.insertedEdgeSourceConstraint = null;
    this.insertedEdgeTargetConstraint = null;
    this.lastInsertedEdge = null;
}
