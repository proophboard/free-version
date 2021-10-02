var mxTextPaint = mxText.prototype.paint;
mxText.prototype.paint = function (c, update) {
    mxTextPaint.call(this, c, update);
    //Set it always to last width of state, because state.unscaledWidth can be null and this
    //causes repainting of label when cells are folded and an mxGeometryChange was applied to the label's cell before
    this.lastUnscaledWidth = (this.state)? this.state.width : null;
}

/**
 * Function: redraw
 *
 * Renders the text using the given DOM nodes.
 */
mxText.prototype.redraw = function()
{
    if (this.visible && this.checkBounds() && this.cacheEnabled && this.lastValue == this.value &&
        (mxUtils.isNode(this.value) || this.dialect == mxConstants.DIALECT_STRICTHTML))
    {
        if (this.node.nodeName == 'DIV' && (this.isHtmlAllowed() || !mxClient.IS_VML))
        {
            this.updateSize(this.node, (this.state == null || this.state.view.textDiv == null));

            if (mxClient.IS_IE && (document.documentMode == null || document.documentMode <= 8))
            {
                this.updateHtmlFilter();
            }
            else
            {
                this.updateHtmlTransform();
            }

            this.updateBoundingBox();
        }
        else
        {
            var canvas = this.createCanvas();

            if (canvas != null && canvas.updateText != null &&
                canvas.invalidateCachedOffsetSize != null)
            {
                this.paint(canvas, true);
                this.destroyCanvas(canvas);
                this.updateBoundingBox();
            }
            else
            {
                // Fallback if canvas does not support updateText (VML)
                mxShape.prototype.redraw.apply(this, arguments);
            }
        }
    }
    else
    {
        var currentNode = this.node;
        var graph = this.state.view.graph;

        var doRedrawText = () => {
            mxShape.prototype.redraw.apply(this, arguments);

            if (mxUtils.isNode(this.value) || this.dialect == mxConstants.DIALECT_STRICTHTML)
            {
                this.lastValue = this.value;
            }
            else
            {
                this.lastValue = null;
            }
        };

        if(graph.isLazyTextPaintEnabled()) {
            graph.scheduleTask(() => {
                this.node = currentNode;
                doRedrawText();
            });
        } else {
            doRedrawText();
        }
    }
};
