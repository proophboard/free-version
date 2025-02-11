mxCellRenderer.prototype.redraw = function(state, force, rendering, preflightRendering)
{
    if(!state) {
        return;
    }

    var doRedraw = () => {
        var orgScale = 1;
        if(state.view) {
            orgScale = state.view.scale;
            state.view.scale = 1;
        }

        var shapeChanged = this.redrawShape(state, force, rendering);

        if (state.shape != null && (rendering == null || rendering))
        {
            this.redrawLabel(state, shapeChanged);
            this.redrawCellOverlays(state, shapeChanged);
            this.redrawControl(state, shapeChanged);
        }

        if(state.view) {
            state.view.scale = orgScale;
        }
    };

    if(preflightRendering) {
        window.requestAnimationFrame(doRedraw);
    } else {
        doRedraw();
    }

};

/**
 * Function: installListeners
 *
 * Installs the event listeners for the given cell state.
 *
 * Modified to stop propagation of mouse down events if cell editor is active for given cell
 * This improves Pen support on iPad, because one can write with the pen on a sticky without moving it around.
 *
 * Parameters:
 *
 * state - <mxCellState> for which the event listeners should be isntalled.
 */
mxCellRenderer.prototype.installListeners = function(state)
{
    var graph = state.view.graph;

    // Workaround for touch devices routing all events for a mouse
    // gesture (down, move, up) via the initial DOM node. Same for
    // HTML images in all IE versions (VML images are working).
    var getState = function(evt)
    {
        var result = state;

        if ((graph.dialect != mxConstants.DIALECT_SVG && mxEvent.getSource(evt).nodeName == 'IMG') || mxClient.IS_TOUCH)
        {
            var x = mxEvent.getClientX(evt);
            var y = mxEvent.getClientY(evt);

            // Dispatches the drop event to the graph which
            // consumes and executes the source function
            var pt = mxUtils.convertPoint(graph.container, x, y);
            result = graph.view.getState(graph.getCellAt(pt.x, pt.y));
        }

        return result;
    };

    mxEvent.addGestureListeners(state.shape.node,
        mxUtils.bind(this, function(evt)
        {
            if (this.isShapeEvent(state, evt))
            {
                // Do not fire mouse event when cell editor is active
                if(graph.cellEditor.isContentEditing() && graph.getView().getState(graph.cellEditor.getEditingCell()) === state) {
                    return;
                }
                graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt, state));
            }
        }),
        mxUtils.bind(this, function(evt)
        {
            if (this.isShapeEvent(state, evt))
            {
                graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt, getState(evt)));
            }
        }),
        mxUtils.bind(this, function(evt)
        {
            if (this.isShapeEvent(state, evt))
            {
                graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt, getState(evt)));
            }
        })
    );

    // Uses double click timeout in mxGraph for quirks mode
    if (graph.nativeDblClickEnabled)
    {
        mxEvent.addListener(state.shape.node, 'dblclick',
            mxUtils.bind(this, function(evt)
            {
                if (this.isShapeEvent(state, evt))
                {
                    graph.dblClick(evt, state.cell);
                    mxEvent.consume(evt);
                }
            })
        );
    }
};
