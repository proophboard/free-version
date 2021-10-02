/**
 * Function: move
 *
 * Moves the <bounds> by the given <mxPoint> and returnt the snapped point.
 */
mxGuide.prototype.move = function(bounds, delta, gridEnabled, clone)
{
    if (this.states != null && (this.horizontal || this.vertical) && bounds != null && delta != null)
    {
        var bounds = this.graph.translateBounds(bounds);
        var tStates = [];

        this.states.forEach(state => {
            if(state != null) {
                tStates.push(this.graph.translateBounds(state));
            }
        });

        var trx = this.graph.getView().translate;
        var scale = this.graph.getView().scale;
        var dx = delta.x;
        var dy = delta.y;

        var overrideX = false;
        var stateX = null;
        var valueX = null;
        var overrideY = false;
        var stateY = null;
        var valueY = null;

        var tt = this.getGuideTolerance();
        var ttX = tt;
        var ttY = tt;

        var b = bounds.clone();
        b.x += delta.x;
        b.y += delta.y;

        var left = b.x;
        var right = b.x + b.width;
        var center = b.getCenterX();
        var top = b.y;
        var bottom = b.y + b.height;
        var middle = b.getCenterY();

        // Snaps the left, center and right to the given x-coordinate
        function snapX(x, state)
        {
            x += this.graph.panDx;
            var override = false;

            if (Math.abs(x - center) < ttX)
            {
                dx = x - bounds.getCenterX();
                ttX = Math.abs(x - center);
                override = true;
            }
            else if (Math.abs(x - left) < ttX)
            {
                dx = x - bounds.x;
                ttX = Math.abs(x - left);
                override = true;
            }
            else if (Math.abs(x - right) < ttX)
            {
                dx = x - bounds.x - bounds.width;
                ttX = Math.abs(x - right);
                override = true;
            }

            if (override)
            {
                stateX = state;
                valueX = Math.round(x - this.graph.panDx);

                if (this.guideX == null)
                {
                    this.guideX = this.createGuideShape(true);

                    // Makes sure to use either VML or SVG shapes in order to implement
                    // event-transparency on the background area of the rectangle since
                    // HTML shapes do not let mouseevents through even when transparent
                    this.guideX.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ?
                        mxConstants.DIALECT_VML : mxConstants.DIALECT_SVG;
                    this.guideX.pointerEvents = false;
                    this.guideX.init(this.graph.getView().getOverlayPane());
                }
            }

            overrideX = overrideX || override;
        };

        // Snaps the top, middle or bottom to the given y-coordinate
        function snapY(y, state)
        {
            y += this.graph.panDy;
            var override = false;

            if (Math.abs(y - middle) < ttY)
            {
                dy = y - bounds.getCenterY();
                ttY = Math.abs(y -  middle);
                override = true;
            }
            else if (Math.abs(y - top) < ttY)
            {
                dy = y - bounds.y;
                ttY = Math.abs(y - top);
                override = true;
            }
            else if (Math.abs(y - bottom) < ttY)
            {
                dy = y - bounds.y - bounds.height;
                ttY = Math.abs(y - bottom);
                override = true;
            }

            if (override)
            {
                stateY = state;
                valueY = Math.round(y - this.graph.panDy);

                if (this.guideY == null)
                {
                    this.guideY = this.createGuideShape(false);

                    // Makes sure to use either VML or SVG shapes in order to implement
                    // event-transparency on the background area of the rectangle since
                    // HTML shapes do not let mouseevents through even when transparent
                    this.guideY.dialect = (this.graph.dialect != mxConstants.DIALECT_SVG) ?
                        mxConstants.DIALECT_VML : mxConstants.DIALECT_SVG;
                    this.guideY.pointerEvents = false;
                    this.guideY.init(this.graph.getView().getOverlayPane());
                }
            }

            overrideY = overrideY || override;
        };

        for (var i = 0; i < tStates.length; i++)
        {
            var state =  tStates[i];

            if (state != null)
            {
                // Align x
                if (this.horizontal)
                {
                    snapX.call(this, state.getCenterX(), state);
                    snapX.call(this, state.x, state);
                    snapX.call(this, state.x + state.width, state);
                }

                // Align y
                if (this.vertical)
                {
                    snapY.call(this, state.getCenterY(), state);
                    snapY.call(this, state.y, state);
                    snapY.call(this, state.y + state.height, state);
                }
            }
        }

        // Moves cells that are off-grid back to the grid on move
        if (gridEnabled)
        {
            if (!overrideX)
            {
                var tx = bounds.x - (this.graph.snap(bounds.x /
                    scale - trx.x) + trx.x) * scale;
                dx = this.graph.snap(dx / scale) * scale - tx;
            }

            if (!overrideY)
            {
                var ty = bounds.y - (this.graph.snap(bounds.y /
                    scale - trx.y) + trx.y) * scale;
                dy = this.graph.snap(dy / scale) * scale - ty;
            }
        }

        // Redraws the guides
        var c = this.graph.container;

        if (!overrideX && this.guideX != null)
        {
            this.guideX.node.style.visibility = 'hidden';
        }
        else if (this.guideX != null)
        {
            if (stateX != null && bounds != null)
            {
                minY = Math.min(bounds.y + dy - this.graph.panDy, stateX.y);
                maxY = Math.max(bounds.y + bounds.height + dy - this.graph.panDy, stateX.y + stateX.height);
            }

            if (minY != null && maxY != null)
            {
                this.guideX.points = [this.graph.translateMousePoint(valueX, minY), this.graph.translateMousePoint(valueX, maxY)];
            }
            else
            {
                this.guideX.points = [this.graph.translateMousePoint(valueX, -this.graph.panDy), this.graph.translateMousePoint(valueX, c.scrollHeight - 3 - this.graph.panDy)];
            }

            this.guideX.stroke = this.getGuideColor(stateX, true);
            this.guideX.node.style.visibility = 'visible';
            this.guideX.redraw();
        }

        if (!overrideY && this.guideY != null)
        {
            this.guideY.node.style.visibility = 'hidden';
        }
        else if (this.guideY != null)
        {
            if (stateY != null && bounds != null)
            {
                minX = Math.min(bounds.x + dx - this.graph.panDx, stateY.x);
                maxX = Math.max(bounds.x + bounds.width + dx - this.graph.panDx, stateY.x + stateY.width);
            }

            if (minX != null && maxX != null)
            {
                this.guideY.points = [this.graph.translateMousePoint(minX, valueY), this.graph.translateMousePoint(maxX, valueY)];
            }
            else
            {
                this.guideY.points = [this.graph.translateMousePoint(-this.graph.panDx, valueY), this.graph.translateMousePoint(c.scrollWidth - 3 - this.graph.panDx, valueY)];
            }

            this.guideY.stroke = this.getGuideColor(stateY, false);
            this.guideY.node.style.visibility = 'visible';
            this.guideY.redraw();
        }

        delta = this.getDelta(bounds, stateX, dx, stateY, dy)
    }

    return delta;
};

mxGuide.prototype.getDelta = function(bounds, stateX, dx, stateY, dy)
{
    // Round to pixels for virtual states (eg. page guides)
    if (this.rounded || (stateX != null && stateX.cell == null))
    {
        //dx = Math.floor(bounds.x + dx) - bounds.x;
    }

    if (this.rounded || (stateY != null && stateY.cell == null))
    {
        //dy = Math.floor(bounds.y + dy) - bounds.y;
    }

    return new mxPoint(dx, dy);
};