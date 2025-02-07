const mxGraphModelCellAdded = mxGraphModel.prototype.cellAdded;
mxGraphModel.prototype.cellAdded = function (cell) {
  mxGraphModelCellAdded.call(this, cell);
  if(this.graph) {
    cell.tempVisible = true;
    const children = [];
    this.graph.flattenChildren(children, cell);
    children.forEach(child => child.tempVisible = true);

    // Ensure that container is not in an inconsistent state when added remotely or lite mode is on
    if(inspectioUtils.isContainer(cell)) {
      cell.setCollapsed(0);
      this.graph.showAll(cell);
      // this.graph.toggleAlternateStyle([cell], true);
      // this.graph.applyZoomMode(ispConst.ZOOM_MODE_ALL_ELES, false, true, cell);
    }
  }
}

mxGraphModel.prototype.getSelectableChildren = function(cell)
{
  let children = this.getChildren(cell)

  if(children && this.graph) {
    return children.filter(c => this.graph.isCellSelectable(c, true));
  }

  return [];
};
