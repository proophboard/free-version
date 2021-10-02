mxCellRenderer.prototype.redraw = function(state, force, rendering, preflightRendering)
{
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
