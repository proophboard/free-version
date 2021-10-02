function mxEdgeHighlight(points, stroke, strokeWidth) {
    mxConnector.call(this, points, stroke, strokeWidth);
}

/**
 * Extends mxPolyline.
 */
mxUtils.extend(mxEdgeHighlight, mxConnector);

var mxShapeInit = mxShape.prototype.init;
mxEdgeHighlight.prototype.init = function (container) {
    mxShapeInit.call(this, container);

    if(this.node) {
        this.node.classList.add('ge-selected-edge');

        //Wait until paths are drawn
        // window.setTimeout(() => {
        //     if(this.node.children.length) {
        //         var highlight = this.node.children[0].cloneNode();
        //
        //         highlight.classList.add('highlight');
        //         this.node.append(highlight);
        //     }
        // }, 50);
    }
}

// var mxShapeRedraw = mxShape.prototype.redraw;
// var redrawTimer = null;
// mxEdgeHighlight.prototype.redraw = function() {
//     mxShapeRedraw.call(this);
//
//     if(this.node) {
//         if(redrawTimer) {
//             window.clearTimeout(redrawTimer);
//             redrawTimer = null;
//         }
//
//         // Wait until paths are drawn
//         redrawTimer = window.setTimeout(() => {
//             if(this.node.children.length) {
//                 var highlight = this.node.children[0].cloneNode();
//
//                 highlight.classList.add('highlight');
//                 this.node.append(highlight);
//             }
//         }, 1);
//     }
// }

