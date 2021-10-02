/**
 * Function: addElement
 *
 * Adds the given element to <elements> if it has an ID.
 */
var MXGRAPH_ROOT_UUIDS = [
    '7fe80d19-d317-4e9d-8296-96c598786d78',
    'e975feae-1579-4c09-98d0-98cbf2108aec',
];

var mxCodecAddElement = mxCodec.prototype.addElement;
mxCodec.prototype.addElement = function(node)
{
    try {
        mxCodecAddElement.apply(this, arguments);
    } catch (error) {
        //Function changed in in mxgraph 4.0 and throws an error now
        var id = node.getAttribute('id');

        if(id === MXGRAPH_ROOT_UUIDS[0] || id === MXGRAPH_ROOT_UUIDS[1]) {
            node = node.firstChild;

            while (node != null)
            {
                this.addElement(node);
                node = node.nextSibling;
            }
        } else {
            // Try again with a new ID instead of throwing an error
            node.setAttribute('id', mxGraphModel.prototype.createId());
            mxCodecAddElement.call(this, node);
            return;
        }
    }
};

// Override method to filter out non root cells without parent
var mxCodecDecodeCell = mxCodec.prototype.decodeCell;
mxCodec.prototype.decodeCell = function (node, restoreStructures) {
    var cell = mxCodecDecodeCell.apply(this, arguments);

    if(cell && cell.getParent() == null && !MXGRAPH_ROOT_UUIDS.includes(cell.getId())) {
        return null;
    }

    return cell;
}

//Do not insert cells that don't have a parent
var mxCodecInsertIntoGraph = mxCodec.prototype.insertIntoGraph;
mxCodec.prototype.insertIntoGraph = function (cell) {
    if(cell && cell.getParent() == null && !MXGRAPH_ROOT_UUIDS.includes(cell.getId())) {
        return;
    }

    mxCodecInsertIntoGraph.apply(this, arguments);
}
