mxGraphView.prototype.getVisibleTerminal = function(edge, source)
{
    var model = this.graph.getModel();
    var result = model.getTerminal(edge, source);
    var best = null;

    while (best === null && result != this.currentRoot)
    {
        if (this.graph.isCellVisible(result, true))
        {
            best = result;
        }

        result = model.getParent(result);
    }

    // Checks if the result is valid for the current view state
    if (best != null && (!model.contains(best) ||
        model.getParent(best) == model.getRoot() ||
        best == this.currentRoot))
    {
        best = null;
    }

    return best;
};

mxGraphView.prototype.validateCellState = function(cell, recurse)
{
    recurse = (recurse != null) ? recurse : true;
    var state = null;

    if (cell != null)
    {
        state = this.getState(cell);

        if (state != null)
        {
            var model = this.graph.getModel();

            if (state.invalid)
            {
                state.invalid = false;

                if (state.style == null || state.invalidStyle)
                {
                    state.style = this.graph.getCellStyle(state.cell);
                    state.invalidStyle = false;
                }

                if (cell != this.currentRoot)
                {
                    this.validateCellState(model.getParent(cell), false);
                }

                state.setVisibleTerminalState(this.validateCellState(this.getVisibleTerminal(cell, true), false), true);
                state.setVisibleTerminalState(this.validateCellState(this.getVisibleTerminal(cell, false), false), false);

                this.updateCellState(state);

                // Repaint happens immediately after the cell is validated
                if (cell != this.currentRoot && !state.invalid)
                {
                    this.graph.cellRenderer.redraw(state, false, this.isRendering(), this.graph.isPreflightRendering);

                    // Handles changes to invertex paintbounds after update of rendering shape
                    state.updateCachedBounds();
                }
            }

            if (recurse && !state.invalid)
            {
                // Updates order in DOM if recursively traversing
                if (state.shape != null)
                {
                    this.stateValidated(state);
                }

                var childCount = model.getChildCount(cell);

                for (var i = 0; i < childCount; i++)
                {
                    this.validateCellState(model.getChildAt(cell, i));
                }
            }
        }
    }

    return state;
};

mxGraphView.prototype.updateEdgeState = function(state, geo)
{
    var source = state.getVisibleTerminalState(true);
    var target = state.getVisibleTerminalState(false);

    source = this.graph.getAlternateStyleTerminal(source);
    target = this.graph.getAlternateStyleTerminal(target);

    // This will remove edges with no terminals and no terminal points
    // as such edges are invalid and produce NPEs in the edge styles.
    // Also removes connected edges that have no visible terminals.
    if ((this.graph.model.getTerminal(state.cell, true) != null && source == null) ||
        (source == null && geo.getTerminalPoint(true) == null) ||
        (this.graph.model.getTerminal(state.cell, false) != null && target == null) ||
        (target == null && geo.getTerminalPoint(false) == null))
    {
        this.clear(state.cell, true);
    }
    else
    {
        this.updateFixedTerminalPoints(state, source, target);
        this.updatePoints(state, geo.points, source, target);
        this.updateFloatingTerminalPoints(state, source, target);

        var pts = state.absolutePoints;

        if (state.cell != this.currentRoot && (pts == null || pts.length < 2 ||
            pts[0] == null || pts[pts.length - 1] == null))
        {
            // This will remove edges with invalid points from the list of states in the view.
            // Happens if the one of the terminals and the corresponding terminal point is null.
            this.clear(state.cell, true);
        }
        else
        {
            this.updateEdgeBounds(state);
            this.updateEdgeLabelOffset(state);
        }
    }
};

mxGraphView.prototype.getTerminalPort = function(state, terminal, source)
{
    var key = (source) ? mxConstants.STYLE_SOURCE_PORT :
        mxConstants.STYLE_TARGET_PORT;
    var id = mxUtils.getValue(state.style, key);

    if (id != null)
    {
        var cell = this.graph.getModel.getCell(id);

        var proc = cell.parent;
        if(this.graph.hasAlternateStyle(proc)) {
            tmp = this.getState(proc);
        } else {
            var tmp = this.getState(this.graph.getModel().getCell(id));
        }

        // Only uses ports where a cell state exists
        if (tmp != null)
        {
            terminal = tmp;
        }
    }

    return terminal;
};

/**
 * Function: validate
 *
 * Calls <validateCell> and <validateCellState> and updates the <graphBounds>
 * using <getBoundingBox>. Finally the background is validated using
 * <validateBackground>.
 *
 * Parameters:
 *
 * cell - Optional <mxCell> to be used as the root of the validation.
 * Default is <currentRoot> or the root of the model.
 */
mxGraphView.prototype.validate = function(cell, deactivateCellValidation)
{
    var t0 = mxLog.enter('mxGraphView.validate');
    window.status = mxResources.get(this.updatingDocumentResource) ||
        this.updatingDocumentResource;

    this.resetValidationState();

    // Improves IE rendering speed by minimizing reflows
    var prevDisplay = null;

    if (this.optimizeVmlReflows && this.canvas != null && this.textDiv == null &&
        ((document.documentMode == 8 && !mxClient.IS_EM) || mxClient.IS_QUIRKS))
    {
        // Placeholder keeps scrollbar positions when canvas is hidden
        this.placeholder = document.createElement('div');
        this.placeholder.style.position = 'absolute';
        this.placeholder.style.width = this.canvas.clientWidth + 'px';
        this.placeholder.style.height = this.canvas.clientHeight + 'px';
        this.canvas.parentNode.appendChild(this.placeholder);

        prevDisplay = this.drawPane.style.display;
        this.canvas.style.display = 'none';

        // Creates temporary DIV used for text measuring in mxText.updateBoundingBox
        this.textDiv = document.createElement('div');
        this.textDiv.style.position = 'absolute';
        this.textDiv.style.whiteSpace = 'nowrap';
        this.textDiv.style.visibility = 'hidden';
        this.textDiv.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
        this.textDiv.style.zoom = '1';

        document.body.appendChild(this.textDiv);
    }

    var graphBounds = null;

    // Added possibility to deactivate cell state validation. Prop is used by viewStateChanged()
    if(!deactivateCellValidation) {
        graphBounds = this.getBoundingBox(this.validateCellState(
            this.validateCell(cell || ((this.currentRoot != null) ?
                this.currentRoot : this.graph.getModel().getRoot()))));
    }

    this.setGraphBounds((graphBounds != null) ? graphBounds : this.getEmptyBounds());
    this.validateBackground();

    if (prevDisplay != null)
    {
        this.canvas.style.display = prevDisplay;
        this.textDiv.parentNode.removeChild(this.textDiv);

        if (this.placeholder != null)
        {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }

        // Textdiv cannot be reused
        this.textDiv = null;
    }

    this.resetValidationState();

    window.status = mxResources.get(this.doneResource) ||
        this.doneResource;
    mxLog.leave('mxGraphView.validate', t0);
};
