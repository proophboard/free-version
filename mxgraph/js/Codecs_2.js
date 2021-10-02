function mxCellOriginalStyleChange(cell, originalStyle)
{
    this.cell = cell;
    this.originalStyle = originalStyle;
    this.previous = originalStyle;
};

/**
 * Function: execute
 *
 * Changes the originalStyle of the cell's user object
 */
mxCellOriginalStyleChange.prototype.execute = function()
{
    if (this.cell != null)
    {
        const tmp = this.cell.originalStyle;

        this.cell.originalStyle = this.previous;

        this.previous = tmp;
    }
};

function mxCellAlternateStyleChange(cell, alternateStyle)
{
    this.cell = cell;
    this.alternateStyle = alternateStyle;
    this.previous = alternateStyle;
};

/**
 * Function: execute
 *
 * Changes the alternateStylee of the cell's user object
 */
mxCellAlternateStyleChange.prototype.execute = function()
{
    if (this.cell != null)
    {
        const tmp = this.cell.alternateStyle;

        this.cell.alternateStyle = this.previous;

        this.previous = tmp;
    }
};


function mxContainerSwimLaneChange(cell, asSwimLane)
{
    this.cell = cell;
    this.isContainerSwimLane = asSwimLane;
    this.previous = asSwimLane;
}

mxContainerSwimLaneChange.prototype.execute = function ()
{
    if (this.cell != null)
    {
        const tmp = this.cell.isContainerSwimLane || false;

        this.cell.isContainerSwimLane = this.previous;

        this.previous = tmp;
    }
}
