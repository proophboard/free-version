mxVertexHandler.prototype.resizeVertex = function(me)
{
    var ct = new mxPoint(this.state.getCenterX(), this.state.getCenterY());
    var alpha = mxUtils.toRadians(this.state.style[mxConstants.STYLE_ROTATION] || '0');
    var point = new mxPoint(me.getGraphX(), me.getGraphY());
    var tr = this.graph.view.translate;
    var scale = this.graph.view.scale;
    var cos = Math.cos(-alpha);
    var sin = Math.sin(-alpha);

    var dx = point.x - this.startX;
    var dy = point.y - this.startY;

    // Rotates vector for mouse gesture
    var tx = cos * dx - sin * dy;
    var ty = sin * dx + cos * dy;

    dx = tx;
    dy = ty;

    var geo = this.graph.getCellGeometry(this.state.cell);
    this.unscaledBounds = this.union(geo, dx / scale, dy / scale, this.index,
        this.graph.isGridEnabledEvent(me.getEvent()), 1,
        new mxPoint(0, 0), this.isConstrainedEvent(me),
        this.isCenteredEvent(this.state, me));

    // Keeps vertex within maximum graph or parent bounds
    if (!geo.relative)
    {
        var max = this.graph.getMaximumGraphBounds();

        // Handles child cells
        if (max != null && this.parentState != null)
        {
            max = mxRectangle.fromRectangle(max);

            max.x -= (this.parentState.x - tr.x * scale) / scale;
            max.y -= (this.parentState.y - tr.y * scale) / scale;
        }

        if (this.graph.isConstrainChild(this.state.cell))
        {
            var tmp = this.graph.getCellContainmentArea(this.state.cell);

            if (tmp != null)
            {
                var overlap = this.graph.getOverlap(this.state.cell);

                if (overlap > 0)
                {
                    tmp = mxRectangle.fromRectangle(tmp);

                    tmp.x -= tmp.width * overlap;
                    tmp.y -= tmp.height * overlap;
                    tmp.width += 2 * tmp.width * overlap;
                    tmp.height += 2 * tmp.height * overlap;
                }

                if (max == null)
                {
                    max = tmp;
                }
                else
                {
                    max = mxRectangle.fromRectangle(max);
                    max.intersect(tmp);
                }
            }
        }

        if (max != null)
        {
            if (this.unscaledBounds.x < max.x)
            {
                this.unscaledBounds.width -= max.x - this.unscaledBounds.x;
                this.unscaledBounds.x = max.x;
            }

            if (this.unscaledBounds.y < max.y)
            {
                this.unscaledBounds.height -= max.y - this.unscaledBounds.y;
                this.unscaledBounds.y = max.y;
            }

            if (this.unscaledBounds.x + this.unscaledBounds.width > max.x + max.width)
            {
                this.unscaledBounds.width -= this.unscaledBounds.x +
                    this.unscaledBounds.width - max.x - max.width;
            }

            if (this.unscaledBounds.y + this.unscaledBounds.height > max.y + max.height)
            {
                this.unscaledBounds.height -= this.unscaledBounds.y +
                    this.unscaledBounds.height - max.y - max.height;
            }
        }
    }

    this.bounds = new mxRectangle(((this.parentState != null) ? this.parentState.x : 0) +
        (this.unscaledBounds.x), ((this.parentState != null) ? this.parentState.y : 0) +
        (this.unscaledBounds.y), this.unscaledBounds.width, this.unscaledBounds.height);

    if (geo.relative && this.parentState != null)
    {
        this.bounds.x += this.state.x - this.parentState.x;
        this.bounds.y += this.state.y - this.parentState.y;
    }

    cos = Math.cos(alpha);
    sin = Math.sin(alpha);

    var c2 = new mxPoint(this.bounds.getCenterX(), this.bounds.getCenterY());

    var dx = c2.x - ct.x;
    var dy = c2.y - ct.y;

    var dx2 = cos * dx - sin * dy;
    var dy2 = sin * dx + cos * dy;

    var dx3 = dx2 - dx;
    var dy3 = dy2 - dy;

    var dx4 = this.bounds.x - this.state.x;
    var dy4 = this.bounds.y - this.state.y;

    var dx5 = cos * dx4 - sin * dy4;
    var dy5 = sin * dx4 + cos * dy4;

    this.bounds.x += dx3;
    this.bounds.y += dy3;

    // Rounds unscaled bounds to int
    this.unscaledBounds.x = this.roundLength(this.unscaledBounds.x + dx3 / scale);
    this.unscaledBounds.y = this.roundLength(this.unscaledBounds.y + dy3 / scale);
    this.unscaledBounds.width = this.roundLength(this.unscaledBounds.width);
    this.unscaledBounds.height = this.roundLength(this.unscaledBounds.height);

    // Shifts the children according to parent offset
    if (!this.graph.isCellCollapsed(this.state.cell) && (dx3 != 0 || dy3 != 0))
    {
        this.childOffsetX = this.state.x - this.bounds.x + dx5;
        this.childOffsetY = this.state.y - this.bounds.y + dy5;
    }
    else
    {
        this.childOffsetX = 0;
        this.childOffsetY = 0;
    }

    if (this.livePreview)
    {
        this.updateLivePreview(me);
    }

    if (this.preview != null)
    {
        this.drawPreview();
    }
};

mxVertexHandler.prototype.rotateVertex = function(me)
{
    var tBounds = this.graph.translateBounds(this.state);
    var point = new mxPoint(me.getGraphX(), me.getGraphY());
    var dx = tBounds.x + tBounds.width / 2 - point.x;
    var dy = tBounds.y + tBounds.height / 2 - point.y;
    this.currentAlpha = (dx != 0) ? Math.atan(dy / dx) * 180 / Math.PI + 90 : ((dy < 0) ? 180 : 0);

    if (dx > 0)
    {
        this.currentAlpha -= 180;
    }

    // Rotation raster
    if (this.rotationRaster && this.graph.isGridEnabledEvent(me.getEvent()))
    {
        var dx = point.x - tBounds.getCenterX();
        var dy = point.y - tBounds.getCenterY();
        var dist = Math.abs(Math.sqrt(dx * dx + dy * dy) - 20) * 3;
        var raster = Math.max(1, 5 * Math.min(3, Math.max(0, Math.round(80 / Math.abs(dist)))));

        this.currentAlpha = Math.round(this.currentAlpha / raster) * raster;
    }
    else
    {
        this.currentAlpha = this.roundAngle(this.currentAlpha);
    }

    this.selectionBorder.rotation = this.currentAlpha;
    this.selectionBorder.redraw();

    if (this.livePreview)
    {
        this.redrawHandles();
    }
};

mxVertexHandler.prototype.updateLivePreview = function(me)
{
    // TODO: Apply child offset to children in live preview
    var scale = this.graph.view.scale;
    var tr = this.graph.view.translate;

    // Saves current state
    var tempState = this.state.clone();

    // Temporarily changes size and origin
    this.state.x = this.bounds.x;
    this.state.y = this.bounds.y;
    this.state.width = this.bounds.width;
    this.state.height = this.bounds.height;

    // Needed to force update of text bounds
    this.state.unscaledWidth = null;

    // Redraws cell and handles
    var off = this.state.absoluteOffset;
    off = new mxPoint(off.x, off.y);

    // Required to store and reset absolute offset for updating label position
    this.state.absoluteOffset.x = 0;
    this.state.absoluteOffset.y = 0;
    var geo = this.graph.getCellGeometry(this.state.cell);

    if (geo != null)
    {
        var offset = geo.offset || this.EMPTY_POINT;

        if (offset != null && !geo.relative)
        {
            this.state.absoluteOffset.x = this.state.view.scale * offset.x;
            this.state.absoluteOffset.y = this.state.view.scale * offset.y;
        }

        this.state.view.updateVertexLabelOffset(this.state);
    }

    // Draws the live preview
    this.state.view.graph.cellRenderer.redraw(this.state, true);

    // Redraws connected edges TODO: Include child edges
    this.state.view.invalidate(this.state.cell);
    this.state.invalid = false;
    this.state.view.validate();
    this.redrawHandles();

    // Restores current state
    this.state.setState(tempState);
};

mxVertexHandler.prototype.redrawHandles = function()
{
    var tol = this.tolerance;
    this.horizontalOffset = 0;
    this.verticalOffset = 0;
    var s = this.bounds;

    if (this.sizers != null && this.sizers.length > 0 && this.sizers[0] != null)
    {
        if (this.index == null && this.manageSizers && this.sizers.length >= 8)
        {
            // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
            var padding = this.getHandlePadding();
            this.horizontalOffset = padding.x;
            this.verticalOffset = padding.y;

            if (this.horizontalOffset != 0 || this.verticalOffset != 0)
            {
                s = new mxRectangle(s.x, s.y, s.width, s.height);

                s.x -= this.horizontalOffset / 2;
                s.width += this.horizontalOffset;
                s.y -= this.verticalOffset / 2;
                s.height += this.verticalOffset;
            }

            if (this.sizers.length >= 8)
            {
                if ((s.width < 2 * this.sizers[0].bounds.width + 2 * tol) ||
                    (s.height < 2 * this.sizers[0].bounds.height + 2 * tol))
                {
                    this.sizers[0].node.style.display = 'none';
                    this.sizers[2].node.style.display = 'none';
                    this.sizers[5].node.style.display = 'none';
                    this.sizers[7].node.style.display = 'none';
                }
                else
                {
                    this.sizers[0].node.style.display = '';
                    this.sizers[2].node.style.display = '';
                    this.sizers[5].node.style.display = '';
                    this.sizers[7].node.style.display = '';
                }
            }
        }

        var r = s.x + s.width;
        var b = s.y + s.height;

        if (this.singleSizer)
        {
            this.moveSizerTo(this.sizers[0], r, b);
        }
        else
        {
            var cx = s.x + s.width / 2;
            var cy = s.y + s.height / 2;

            if (this.sizers.length >= 8)
            {
                var crs = ['nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize'];

                var alpha = mxUtils.toRadians(this.state.style[mxConstants.STYLE_ROTATION] || '0');
                var cos = Math.cos(alpha);
                var sin = Math.sin(alpha);

                var da = Math.round(alpha * 4 / Math.PI);

                var ct = new mxPoint(s.getCenterX(), s.getCenterY());
                var pt = mxUtils.getRotatedPoint(new mxPoint(s.x, s.y), cos, sin, ct);

                this.moveSizerTo(this.sizers[0], pt.x, pt.y);
                this.sizers[0].setCursor(crs[mxUtils.mod(0 + da, crs.length)]);

                pt.x = cx;
                pt.y = s.y;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[1], pt.x, pt.y);
                this.sizers[1].setCursor(crs[mxUtils.mod(1 + da, crs.length)]);

                pt.x = r;
                pt.y = s.y;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[2], pt.x, pt.y);
                this.sizers[2].setCursor(crs[mxUtils.mod(2 + da, crs.length)]);

                pt.x = s.x;
                pt.y = cy;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[3], pt.x, pt.y);
                this.sizers[3].setCursor(crs[mxUtils.mod(7 + da, crs.length)]);

                pt.x = r;
                pt.y = cy;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[4], pt.x, pt.y);
                this.sizers[4].setCursor(crs[mxUtils.mod(3 + da, crs.length)]);

                pt.x = s.x;
                pt.y = b;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[5], pt.x, pt.y);
                this.sizers[5].setCursor(crs[mxUtils.mod(6 + da, crs.length)]);

                pt.x = cx;
                pt.y = b;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[6], pt.x, pt.y);
                this.sizers[6].setCursor(crs[mxUtils.mod(5 + da, crs.length)]);

                pt.x = r;
                pt.y = b;
                pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);

                this.moveSizerTo(this.sizers[7], pt.x, pt.y);
                this.sizers[7].setCursor(crs[mxUtils.mod(4 + da, crs.length)]);

                this.moveSizerTo(this.sizers[8], cx + this.state.absoluteOffset.x, cy + this.state.absoluteOffset.y);
            }
            else if (this.state.width >= 2 && this.state.height >= 2)
            {
                this.moveSizerTo(this.sizers[0], cx + this.state.absoluteOffset.x, cy + this.state.absoluteOffset.y);
            }
            else
            {
                this.moveSizerTo(this.sizers[0], this.state.x, this.state.y);
            }
        }
    }

    if (this.rotationShape != null)
    {
        var alpha = mxUtils.toRadians((this.currentAlpha != null) ? this.currentAlpha : this.state.style[mxConstants.STYLE_ROTATION] || '0');
        var cos = Math.cos(alpha);
        var sin = Math.sin(alpha);

        var ct = new mxPoint(this.state.getCenterX(), this.state.getCenterY());
        var pt = mxUtils.getRotatedPoint(this.getRotationHandlePosition(), cos, sin, ct);

        if (this.rotationShape.node != null)
        {
            this.moveSizerTo(this.rotationShape, pt.x, pt.y);

            // Hides rotation handle during text editing
            this.rotationShape.node.style.visibility = (this.state.view.graph.isEditing()) ? 'hidden' : '';
        }
    }

    if (this.selectionBorder != null)
    {
        this.selectionBorder.rotation = Number(this.state.style[mxConstants.STYLE_ROTATION] || '0');
    }

    if (this.edgeHandlers != null)
    {
        for (var i = 0; i < this.edgeHandlers.length; i++)
        {
            this.edgeHandlers[i].redraw();
        }
    }

    if (this.customHandles != null)
    {
        for (var i = 0; i < this.customHandles.length; i++)
        {
            var temp = this.customHandles[i].shape.node.style.display;
            this.customHandles[i].redraw();
            this.customHandles[i].shape.node.style.display = temp;

            // Hides custom handles during text editing
            this.customHandles[i].shape.node.style.visibility = (this.graph.isEditing()) ? 'hidden' : '';
        }
    }

    this.updateParentHighlight();
};

mxVertexHandler.prototype.getHandlePadding = function()
{
    // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
    var result = new mxPoint(0, 0);
    var tol = this.tolerance;

    if(this.sizers != null && this.sizers.length > 0 && this.sizers[0] != null) {
        var tBounds = this.graph.translateBounds(this.bounds);
        var tSizerBounds = new mxRectangle(
            this.sizers[0].bounds.x,
            this.sizers[0].bounds.y,
            this.sizers[0].bounds.width / this.graph.currentScale,
            this.sizers[0].bounds.height / this.graph.currentScale
        );

        if (tBounds.width < 2 * tSizerBounds.width + 2 * tol ||
            tBounds.height < 2 * tSizerBounds.height + 2 * tol)
        {
            tol /= 2;

            result.x = (this.sizers[0].bounds.width + tol) / this.graph.currentScale;
            result.y = (this.sizers[0].bounds.height + tol) / this.graph.currentScale;
        }
    }

    return result;
};

mxVertexHandler.prototype.moveSizerTo = function(shape, x, y)
{
    if (shape != null)
    {
        var orgBounds = new mxRectangle(shape.bounds.x, shape.bounds.y, shape.bounds.width, shape.bounds.height);
        var tWidth = shape.bounds.width / this.graph.currentScale;
        var tHeight = shape.bounds.height / this.graph.currentScale;
        shape.bounds.x = Math.floor(x - tWidth / 2);
        shape.bounds.y = Math.floor(y - tHeight / 2);
        shape.bounds.width = tWidth;
        shape.bounds.height = tHeight;

        // Fixes visible inactive handles in VML
        if (shape.node != null && shape.node.style.display != 'none')
        {
            shape.redraw();
        }

        shape.bounds = orgBounds;
    }
};

mxVertexHandler.prototype.getRotationHandlePosition = function()
{
    var padding = this.getHandlePadding();
    return new mxPoint(this.bounds.x + this.bounds.width / 2, this.bounds.y + (this.rotationHandleVSpacing / this.graph.currentScale) - padding.y)
};