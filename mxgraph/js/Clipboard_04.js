mxClipboard.useBrowserClipboard = function (extClipboard, graph) {
    mxClipboard.extClipboard = extClipboard;
    mxClipboard.graph = graph;
    mxClipboard.textEle = document.createElement('textarea');
    mxClipboard.textEle.setAttribute('id', 'mxclipboard-helper');
    //mxClipboard.textEle.style.visibility = 'hidden';
    mxClipboard.textEle.style.position = 'absolute';
    mxClipboard.textEle.style.top = '-1000px';
    document.body.appendChild(mxClipboard.textEle);
}

mxClipboard.setCells = function (cells) {
    if(this.extClipboard) {
        var node = node = this.graph.encodeCells(mxUtils.sortCells(this.graph.model.getTopmostCells(cells)));
        this.extClipboard(mxUtils.getPrettyXml(node));
    }

    mxClipboard.cells = cells;
}

mxClipboard.setCellsInMemoryOnly = function (cells) {
    mxClipboard.cells = cells;
}

mxClipboard.paste = function(graph, x, y, intoDefaultParent)
{
    var cells = null;

    if (!mxClipboard.isEmpty())
    {
        cells = graph.getImportableCells(mxClipboard.getCells());

        var deltaX = mxClipboard.insertCount * mxClipboard.STEPSIZE;
        var deltaY = mxClipboard.insertCount * mxClipboard.STEPSIZE;

        if(typeof x !== 'undefined' && typeof y !== 'undefined') {
            deltaX = x;
            deltaY = y;
        }

        var source = graph.getSelectionCell();
        var parent = null;

        if(source && !intoDefaultParent) {
            var targetContainer = graph.getModel().getParent(source);

            if(targetContainer && !inspectioUtils.isFeature(targetContainer) && !inspectioUtils.isBoundedContext(targetContainer)) {
                var targetParent = graph.getModel().getParent(targetContainer);

                if(inspectioUtils.isContainer(targetParent)) {
                    targetContainer = targetParent;
                }
            }

            if(targetContainer) {
                parent = targetContainer;
            }
        }

        if(!parent) {
            parent = graph.getDefaultParent();
        }

        cells = graph.importCells(cells, deltaX, deltaY, parent);

        // Increments the counter and selects the inserted cells
        mxClipboard.insertCount++;
        graph.setSelectionCells(cells);
    }

    return cells;
}
