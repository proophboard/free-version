mxDragSource.prototype.dragOver = function(graph, evt)
{
    var offset = mxUtils.getOffset(graph.container);
    var origin = mxUtils.getScrollOrigin(graph.container);
    var x = mxEvent.getClientX(evt) - offset.x + origin.x - graph.panDx;
    var y = mxEvent.getClientY(evt) - offset.y + origin.y - graph.panDy;

    if (graph.autoScroll && (this.autoscroll == null || this.autoscroll))
    {
        graph.scrollPointToVisible(x, y, graph.autoExtend);
    }

    // Highlights the drop target under the mouse
    if (this.currentHighlight != null && graph.isDropEnabled())
    {
        this.currentDropTarget = this.getDropTarget(graph, x, y, evt);
        var state = graph.getView().getState(this.currentDropTarget);
        this.currentHighlight.highlight(state);
    }

    // Updates the location of the preview
    if (this.previewElement != null)
    {
        if (this.previewElement.parentNode == null)
        {
            graph.container.appendChild(this.previewElement);

            this.previewElement.style.zIndex = '3';
            this.previewElement.style.position = 'absolute';
        }

        var gridEnabled = this.isGridEnabled() && graph.isGridEnabledEvent(evt);
        var hideGuide = true;

        // Grid and guides
        if (this.currentGuide != null && this.currentGuide.isEnabledForEvent(evt))
        {
            // LATER: HTML preview appears smaller than SVG preview
            var w = parseInt(this.previewElement.style.width);
            var h = parseInt(this.previewElement.style.height);
            var delta = graph.translateMousePoint(x,y);
            var bounds = new mxRectangle(delta.x, delta.y, w / graph.currentScale, h / graph.currentScale);
            // Set delta to 0, b/c drag source is always at current mouse position
            delta = this.currentGuide.move(bounds, new mxPoint(0,0), gridEnabled, true);
            hideGuide = false;
            x += delta.x;
            y += delta.y;
        }
        else if (gridEnabled)
        {
            var scale = graph.view.scale;
            var tr = graph.view.translate;
            var off = graph.gridSize / 2;
            x = (graph.snap(x / scale - tr.x - off) + tr.x) * scale;
            y = (graph.snap(y / scale - tr.y - off) + tr.y) * scale;
        }

        if (this.currentGuide != null && hideGuide)
        {
            this.currentGuide.hide();
        }

        if (this.previewOffset != null)
        {
            x += this.previewOffset.x;
            y += this.previewOffset.y;
        }

        this.previewElement.style.left = Math.round(x) + 'px';
        this.previewElement.style.top = Math.round(y) + 'px';
        this.previewElement.style.visibility = 'visible';
    }

    this.currentPoint = new mxPoint(x, y);
};