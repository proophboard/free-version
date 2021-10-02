mxUtils.hasScrollbars = function (node) {
    //Avoid recalculating state, our container never has scrollbars
    return false;
}

/**
 * UPDATED: Use whitspace: wrap and return div.scrollWidth when textWidth is passed to function
 *
 * Function: getSizeForString
 *
 * Returns an <mxRectangle> with the size (width and height in pixels) of
 * the given string. The string may contain HTML markup. Newlines should be
 * converted to <br> before calling this method. The caller is responsible
 * for sanitizing the HTML markup.
 *
 * Example:
 *
 * (code)
 * var label = graph.getLabel(cell).replace(/\n/g, "<br>");
 * var size = graph.getSizeForString(label);
 * (end)
 *
 * Parameters:
 *
 * text - String whose size should be returned.
 * fontSize - Integer that specifies the font size in pixels. Default is
 * <mxConstants.DEFAULT_FONTSIZE>.
 * fontFamily - String that specifies the name of the font family. Default
 * is <mxConstants.DEFAULT_FONTFAMILY>.
 * textWidth - Optional width for text wrapping.
 */
mxUtils.getSizeForString = function(text, fontSize, fontFamily, textWidth)
{
    fontSize = (fontSize != null) ? fontSize : mxConstants.DEFAULT_FONTSIZE;
    fontFamily = (fontFamily != null) ? fontFamily : mxConstants.DEFAULT_FONTFAMILY;
    var div = document.createElement('div');

    // Sets the font size and family
    div.style.fontFamily = fontFamily;
    div.style.fontSize = Math.round(fontSize) + 'px';
    div.style.lineHeight = Math.round(fontSize * mxConstants.LINE_HEIGHT) + 'px';

    // Disables block layout and outside wrapping and hides the div
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
    div.style.zoom = '1';

    if (textWidth != null)
    {
        div.style.width = textWidth + 'px';
        div.style.whiteSpace = 'wrap';
    }
    else
    {
        div.style.whiteSpace = 'nowrap';
    }

    // Adds the text and inserts into DOM for updating of size
    div.innerHTML = text;
    document.body.appendChild(div);

    // Gets the size and removes from DOM
    var size = new mxRectangle(0, 0, div.scrollWidth, div.offsetHeight);
    document.body.removeChild(div);

    return size;
};
