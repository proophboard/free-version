mxClipboard.useBrowserClipboard = function (extClipboard, graph) {
    mxClipboard.extClipboard = extClipboard;
    mxClipboard.graph = graph;
    mxClipboard.textEle = document.createElement('textarea');
    mxClipboard.textEle.setAttribute('id', 'mxclipboard-helper');
    //mxClipboard.textEle.style.visibility = 'hidden';
    mxClipboard.textEle.style.position = 'absolute';
    mxClipboard.textEle.style.top = '-1000px';
    document.body.appendChild(mxClipboard.textEle);


    mxClipboard.codec = new mxCodec();
    mxClipboard.codec.lookup = (id) => {
        const cell = graph.model.getCell(id);

        if(!cell) {
            return null;
        }

        return cell;
    }
}

mxClipboard.sortCells = function (cells) {
    const edges = [];
    const vertexes = [];

    if(cells) {
        cells.forEach(cell => {
            if(cell.isEdge()) {
                edges.push(cell);
                return;
            }

            if(cell.children) {
                cell.children = this.sortCells(cell.children);
            }

            vertexes.push(cell);
        })

        return [...vertexes, ...edges];
    } else {
        return [];
    }
}

mxClipboard.tempUnlockCell = function (graph, cell) {
    graph.getModel().beginUpdateWithoutChangeNotifications();
    try {
        graph.setCellStyles('locked', '0', [cell]);
    }
    finally {
        graph.getModel().endUpdateWithoutChangeNotifications();
    }

}

mxClipboard.relockCell = function (graph, cell) {
    graph.getModel().beginUpdateWithoutChangeNotifications();
    try {
        graph.setCellStyles('locked', '1', [cell]);
    }
    finally {
        graph.getModel().endUpdateWithoutChangeNotifications();
    }
}

mxClipboard.copy = function (graph, cells) {
    cells = cells || graph.getSelectionCells();


    var result = graph.getExportableCells(graph.model.getTopmostCells(cells));
    mxClipboard.insertCount = 1;
    mxClipboard.setCells(graph.cloneCells(result));


    return result;
}

mxClipboard.setCells = function (cells) {
    if(this.extClipboard && cells && cells.length) {
        const enc = new mxCodec(mxUtils.createXmlDocument());

        const tmpModel = this.graph.getTempModel();

        cells = this.sortCells(cells);

        cells.forEach(cell => tmpModel.add(tmpModel.getChildAt(tmpModel.getRoot(), 0), cell));


        this.extClipboard(mxUtils.getXml(enc.encode(tmpModel)));
    }

    mxClipboard.cells = cells;
}

mxClipboard.setCellsInMemoryOnly = function (cells) {
    mxClipboard.cells = cells;
}

mxClipboard.importCells = function(cells, graph, intoDefaultParent) {
    cells = graph.getImportableCells(cells);

    var deltaX = mxClipboard.insertCount * mxClipboard.STEPSIZE;
    var deltaY = mxClipboard.insertCount * mxClipboard.STEPSIZE;

    if (typeof x !== 'undefined' && typeof y !== 'undefined') {
        deltaX = x;
        deltaY = y;
    }

    var source = graph.getSelectionCell();
    var parent = null;

    if (source && !intoDefaultParent) {
        var targetContainer = graph.getModel().getParent(source);

        if (targetContainer && !inspectioUtils.isFeature(targetContainer) && !inspectioUtils.isBoundedContext(targetContainer)) {
            var targetParent = graph.getModel().getParent(targetContainer);

            if (inspectioUtils.isContainer(targetParent)) {
                targetContainer = targetParent;
            }
        }

        if (targetContainer) {
            parent = targetContainer;
        }
    }

    if (!parent) {
        parent = graph.getDefaultParent();
    }

    cells = graph.importCells(cells, deltaX, deltaY, parent);

    if (intoDefaultParent) {
        const topmostCells = graph.model.getTopmostCells(cells);

        let smallestX = null;
        let smallestY = null;

        topmostCells.forEach(topmostCell => {
            const topmostGeo = graph.model.getGeometry(topmostCell);
            if (topmostGeo && !topmostCell.isEdge() && !inspectioUtils.isEdgeLabel(topmostCell)) {
                if (smallestX === null) {
                    smallestX = topmostGeo.x;
                    smallestY = topmostGeo.y;
                }

                if (topmostGeo.x < smallestX) {
                    smallestX = topmostGeo.x;
                }

                if (topmostGeo.y < smallestY) {
                    smallestY = topmostGeo.y;
                }
            }
        })

        topmostCells.forEach(topmostCell => {
            const topmostGeo = graph.model.getGeometry(topmostCell);

            if (topmostGeo && !topmostCell.isEdge() && !inspectioUtils.isEdgeLabel(topmostCell)) {
                graph.model.setGeometry(topmostCell, new mxGeometry(topmostGeo.x - smallestX, topmostGeo.y - smallestY, topmostGeo.width, topmostGeo.height));
            }

            if (topmostCell.isEdge()) {
                const edgeGeometry = mxUtils.clone(topmostCell.getGeometry());

                edgeGeometry.translate(smallestX * -1, smallestY * -1);

                graph.model.setGeometry(topmostCell, edgeGeometry);
            }
        })
    }


    // Increments the counter and selects the inserted cells
    mxClipboard.insertCount++;
    graph.setSelectionCells(cells);

    return cells;
}

mxClipboard.paste = function(graph, x, y, intoDefaultParent)
{

    return new Promise((resolve, reject) => {
        var cells = null;

        // pasteHereOnNextClick requires cells read from mxClipboard.cells, see mxClipboard.setCellsInMemoryOnly
        if (navigator.clipboard && !graph.pasteHereOnNextClick) {
            navigator.clipboard.readText()
                .then(text => {
                    const graphDoc = mxUtils.parseXml(text);
                    cells = graph.decodeCells(graphDoc.documentElement);

                    graph.getModel().beginUpdate();
                    try {
                        cells = this.importCells(cells, graph, intoDefaultParent);
                    } finally
                    {
                        graph.getModel().endUpdate();
                        resolve(cells);
                    }
                })
                .catch((e) => {
                    if(graph.canNotify()) {
                        graph.notify('Error while pasting content', e.toString(), 'error');
                    }

                    console.error(e);
                });
        } else {
            if (!mxClipboard.isEmpty())
            {
                graph.getModel().beginUpdate();
                try {
                    cells = this.importCells(mxClipboard.getCells(), graph, intoDefaultParent);
                } finally
                {
                    graph.getModel().endUpdate();
                    resolve(cells);
                }
            }
        }
    });
}
