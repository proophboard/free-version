/**
 * HTML in-place editor
 */
mxCellEditor.prototype.isContentEditing = function()
{
    var state = this.graph.view.getState(this.editingCell);

    return state != null && state.style['html'] == 1;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
mxCellEditor.prototype.saveSelection = function()
{
    if (window.getSelection)
    {
        var sel = window.getSelection();

        if (sel.getRangeAt && sel.rangeCount)
        {
            var ranges = [];

            for (var i = 0, len = sel.rangeCount; i < len; ++i)
            {
                ranges.push(sel.getRangeAt(i));
            }

            return ranges;
        }
    }
    else if (document.selection && document.selection.createRange)
    {
        return document.selection.createRange();
    }

    return null;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
mxCellEditor.prototype.restoreSelection = function(savedSel)
{
    try
    {
        if (savedSel)
        {
            if (window.getSelection)
            {
                sel = window.getSelection();
                sel.removeAllRanges();

                for (var i = 0, len = savedSel.length; i < len; ++i)
                {
                    sel.addRange(savedSel[i]);
                }
            }
            else if (document.selection && savedSel.select)
            {
                savedSel.select();
            }
        }
    }
    catch (e)
    {
        // ignore
    }
};

mxCellEditor.prototype.escapeCancelsEditing = false;

var mxCellEditorStartEditing = mxCellEditor.prototype.startEditing;
mxCellEditor.prototype.startEditing = function(cell, trigger)
{
    mxCellEditorStartEditing.apply(this, arguments);

    // Overrides class in case of HTML content to add
    // dashed borders for divs and table cells
    var state = this.graph.view.getState(cell);

    if (state != null && state.style['html'] == 1)
    {
        this.textarea.className = 'mxCellEditor geContentEditable';
    }
    else
    {
        this.textarea.className = 'mxCellEditor mxPlainTextEditor';
    }

    // Toggles markup vs wysiwyg mode
    this.codeViewMode = false;

    // Stores current selection range when switching between markup and code
    this.switchSelectionState = null;

    // Selects editing cell
    this.graph.setSelectionCell(cell);

    // Enables focus outline for edges and edge labels
    var parent = this.graph.getModel().getParent(cell);
    var geo = this.graph.getCellGeometry(cell);

    if ((this.graph.getModel().isEdge(parent) && geo != null && geo.relative) ||
        this.graph.getModel().isEdge(cell))
    {
        // Quirks does not support outline at all so use border instead
        if (mxClient.IS_QUIRKS)
        {
            this.textarea.style.border = 'gray dotted 1px';
        }
        // IE>8 and FF on Windows uses outline default of none
        else if (mxClient.IS_IE || mxClient.IS_IE11 || (mxClient.IS_FF && mxClient.IS_WIN))
        {
            this.textarea.style.outline = 'gray dotted 1px';
        }
        else
        {
            this.textarea.style.outline = 'none';
        }
    }
    else if (mxClient.IS_QUIRKS)
    {
        this.textarea.style.outline = 'none';
        this.textarea.style.border = '';
    }

    //Sync Font Size
    if(inspectioUtils.isContainer(cell)) {
        const tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = cell.getAttribute('label');
        const firstChild = tmpDiv.firstChild;
        if(firstChild && firstChild.style) {
            const fontSize = parseInt(tmpDiv.firstChild.style.fontSize);
            if(fontSize > 0) {
                this.textarea.style.fontSize = Math.round(fontSize) + 'px';
            }
        }

    }

    this.currentTValuePassedToCell = this.getTextareaValue();

    if(state != null) {
        this.currentWidth = state.width;
        this.currentHeight = state.height;
    }
}

/**
 * HTML in-place editor
 */
var cellEditorInstallListeners = mxCellEditor.prototype.installListeners;
mxCellEditor.prototype.installListeners = function(elt)
{
    cellEditorInstallListeners.apply(this, arguments);

    // Adds a reference from the clone to the original node, recursively
    function reference(node, clone)
    {
        clone.originalNode = node;

        node = node.firstChild;
        var child = clone.firstChild;

        while (node != null && child != null)
        {
            reference(node, child);
            node = node.nextSibling;
            child = child.nextSibling;
        }

        return clone;
    };

    // Checks the given node for new nodes, recursively
    function checkNode(node, clone)
    {
        if (node != null)
        {
            if (clone.originalNode != node)
            {
                cleanNode(node);
            }
            else
            {
                node = node.firstChild;
                clone = clone.firstChild;

                while (node != null)
                {
                    var nextNode = node.nextSibling;

                    if (clone == null)
                    {
                        cleanNode(node);
                    }
                    else
                    {
                        checkNode(node, clone);
                        clone = clone.nextSibling;
                    }

                    node = nextNode;
                }
            }
        }
    };

    // Removes unused DOM nodes and attributes, recursively
    function cleanNode(node)
    {
        var child = node.firstChild;

        while (child != null)
        {
            var next = child.nextSibling;
            cleanNode(child);
            child = next;
        }

        if ((node.nodeType != 1 || (node.nodeName !== 'BR' && node.firstChild == null)) &&
            (node.nodeType != 3 || mxUtils.trim(mxUtils.getTextContent(node)).length == 0))
        {
            node.parentNode.removeChild(node);
        }
        else
        {
            // Removes linefeeds
            if (node.nodeType == 3)
            {
                mxUtils.setTextContent(node, mxUtils.getTextContent(node).replace(/\n|\r/g, ''));
            }

            // Removes CSS classes and styles (for Word and Excel)
            if (node.nodeType == 1)
            {
                node.removeAttribute('style');
                node.removeAttribute('class');
                node.removeAttribute('width');
                node.removeAttribute('cellpadding');
                node.removeAttribute('cellspacing');
                node.removeAttribute('border');
            }
        }
    };

    // Handles paste from Word, Excel etc by removing styles, classnames and unused nodes
    // LATER: Fix undo/redo for paste
    if (!mxClient.IS_QUIRKS && document.documentMode !== 7 && document.documentMode !== 8)
    {
        mxEvent.addListener(this.textarea, 'paste', mxUtils.bind(this, function(evt)
        {
            var clone = reference(this.textarea, this.textarea.cloneNode(true));

            window.setTimeout(mxUtils.bind(this, function()
            {
                checkNode(this.textarea, clone);
            }), 0);
        }));
    }

    var pendingSyncTask = null;
    mxEvent.addListener(this.textarea, 'keydown', mxUtils.bind(this, function(evt) {
        this.handleShortcuts(evt);

        if(pendingSyncTask) {
            window.clearTimeout(pendingSyncTask);
        }

        this.graph.setUserTyping(true);

        var valAtTriggerTime = this.getTextareaValue();

        pendingSyncTask = window.setTimeout(mxUtils.bind(this, function () {
            if(valAtTriggerTime !== this.getTextareaValue()) {
                this.syncWithCell();
            }
        }), 1000);
    }));

    mxEvent.addListener(this.textarea, 'keyup', mxUtils.bind(this, function (evt) {
        if(this.editingCell && !this.editingCell.isEdge() && !inspectioUtils.isEdgeLabel(this.editingCell)) {
            this.syncSize();
        }
    }));
};

mxCellEditor.prototype.handleShortcuts = function (evt) {
    // Ctrl+Shift+H
    if(mxEvent.isControlDown(evt, true) &&
        mxEvent.isShiftDown(evt) &&
        evt.keyCode === 72) {
        this.graph.editorUi.actions.get('inserthorizontalrule').funct();
        mxEvent.consume(evt);
    }

    // Ctrl+Shift+L
    if(this.graph.editorUi &&
        mxEvent.isControlDown(evt, true) &&
        mxEvent.isShiftDown(evt) &&
        evt.keyCode === 76) {
        this.graph.editorUi.actions.get('link').funct();
        mxEvent.consume(evt);
    }
}

mxCellEditor.prototype.getTextareaValue = function()
{
    var state = this.graph.view.getState(this.editingCell);

    if(state != null) {
        return this.getCurrentValue(state);
    } else {
        return '';
    }
}

mxCellEditor.prototype.toggleViewMode = function()
{
    var state = this.graph.view.getState(this.editingCell);
    var nl2Br = state != null && mxUtils.getValue(state.style, 'nl2Br', '1') != '0';
    var tmp = this.saveSelection();

    if (!this.codeViewMode)
    {
        // Clears the initial empty label on the first keystroke
        if (this.clearOnChange && this.textarea.innerHTML == this.getEmptyLabelText())
        {
            this.clearOnChange = false;
            this.textarea.innerHTML = '';
        }

        // Removes newlines from HTML and converts breaks to newlines
        // to match the HTML output in plain text
        var content = mxUtils.htmlEntities(this.textarea.innerHTML);

        // Workaround for trailing line breaks being ignored in the editor
        if (!mxClient.IS_QUIRKS && document.documentMode != 8)
        {
            content = mxUtils.replaceTrailingNewlines(content, '<div><br></div>');
        }

        content = this.graph.sanitizeHtml((nl2Br) ? content.replace(/\n/g, '').replace(/&lt;br\s*.?&gt;/g, '<br>') : content, true);
        this.textarea.className = 'mxCellEditor mxPlainTextEditor';

        var size = mxConstants.DEFAULT_FONTSIZE;

        this.textarea.style.lineHeight = (mxConstants.ABSOLUTE_LINE_HEIGHT) ? Math.round(size * mxConstants.LINE_HEIGHT) + 'px' : mxConstants.LINE_HEIGHT;
        this.textarea.style.fontSize = Math.round(size) + 'px';
        this.textarea.style.textDecoration = '';
        this.textarea.style.fontWeight = 'normal';
        this.textarea.style.fontStyle = '';
        this.textarea.style.fontFamily = mxConstants.DEFAULT_FONTFAMILY;
        this.textarea.style.textAlign = 'left';

        // Adds padding to make cursor visible with borders
        this.textarea.style.padding = '2px';

        if (this.textarea.innerHTML != content)
        {
            this.textarea.innerHTML = content;
        }

        this.codeViewMode = true;
    }
    else
    {
        var content = mxUtils.extractTextWithWhitespace(this.textarea.childNodes);

        // Strips trailing line break
        if (content.length > 0 && content.charAt(content.length - 1) == '\n')
        {
            content = content.substring(0, content.length - 1);
        }

        content = this.graph.sanitizeHtml((nl2Br) ? content.replace(/\n/g, '<br/>') : content, true)
        this.textarea.className = 'mxCellEditor geContentEditable';

        var size = mxUtils.getValue(state.style, mxConstants.STYLE_FONTSIZE, mxConstants.DEFAULT_FONTSIZE);
        var family = mxUtils.getValue(state.style, mxConstants.STYLE_FONTFAMILY, mxConstants.DEFAULT_FONTFAMILY);
        var align = mxUtils.getValue(state.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_LEFT);
        var bold = (mxUtils.getValue(state.style, mxConstants.STYLE_FONTSTYLE, 0) &
            mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD;
        var italic = (mxUtils.getValue(state.style, mxConstants.STYLE_FONTSTYLE, 0) &
            mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC;
        var uline = (mxUtils.getValue(state.style, mxConstants.STYLE_FONTSTYLE, 0) &
            mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE;

        this.textarea.style.lineHeight = (mxConstants.ABSOLUTE_LINE_HEIGHT) ? Math.round(size * mxConstants.LINE_HEIGHT) + 'px' : mxConstants.LINE_HEIGHT;
        this.textarea.style.fontSize = Math.round(size) + 'px';
        this.textarea.style.textDecoration = (uline) ? 'underline' : '';
        this.textarea.style.fontWeight = (bold) ? 'bold' : 'normal';
        this.textarea.style.fontStyle = (italic) ? 'italic' : '';
        this.textarea.style.fontFamily = family;
        this.textarea.style.textAlign = align;
        this.textarea.style.padding = '0px';

        if (this.textarea.innerHTML != content)
        {
            this.textarea.innerHTML = content;

            if (this.textarea.innerHTML.length == 0)
            {
                this.textarea.innerHTML = this.getEmptyLabelText();
                this.clearOnChange = this.textarea.innerHTML.length > 0;
            }
        }

        this.codeViewMode = false;
    }

    this.textarea.focus();

    if (this.switchSelectionState != null)
    {
        this.restoreSelection(this.switchSelectionState);
    }

    this.switchSelectionState = tmp;
    this.resize();
};

var mxCellEditorResize = mxCellEditor.prototype.resize;
mxCellEditor.prototype.resize = function(state, trigger)
{
    if (this.textarea != null)
    {
        var state = this.graph.getView().getState(this.editingCell);

        if (this.codeViewMode && state != null)
        {
            var scale = state.view.scale;
            this.bounds = mxRectangle.fromRectangle(state);

            // General placement of code editor if cell has no size
            // LATER: Fix HTML editor bounds for edge labels
            if (this.bounds.width == 0 && this.bounds.height == 0)
            {
                this.bounds.width = 160 * scale;
                this.bounds.height = 60 * scale;

                var m = (state.text != null) ? state.text.margin : null;

                if (m == null)
                {
                    m = mxUtils.getAlignmentAsPoint(mxUtils.getValue(state.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_CENTER),
                        mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_MIDDLE));
                }

                this.bounds.x += m.x * this.bounds.width;
                this.bounds.y += m.y * this.bounds.height;
            }

            this.textarea.style.width = Math.round((this.bounds.width - 4) / scale) + 'px';
            this.textarea.style.height = Math.round((this.bounds.height - 4) / scale) + 'px';
            this.textarea.style.overflow = 'auto';

            // Adds scrollbar offset if visible
            if (this.textarea.clientHeight < this.textarea.offsetHeight)
            {
                this.textarea.style.height = Math.round((this.bounds.height / scale)) + (this.textarea.offsetHeight - this.textarea.clientHeight) + 'px';
                this.bounds.height = parseInt(this.textarea.style.height) * scale;
            }

            if (this.textarea.clientWidth < this.textarea.offsetWidth)
            {
                this.textarea.style.width = Math.round((this.bounds.width / scale)) + (this.textarea.offsetWidth - this.textarea.clientWidth) + 'px';
                this.bounds.width = parseInt(this.textarea.style.width) * scale;
            }

            this.textarea.style.left = Math.round(this.bounds.x / scale) + 'px';
            this.textarea.style.top = Math.round(this.bounds.y / scale) + 'px';

            if (mxClient.IS_VML)
            {
                this.textarea.style.zoom = scale;
            }
            else
            {
                mxUtils.setPrefixedStyle(this.textarea.style, 'transform', 'scale(' + scale + ',' + scale + ')');
            }
        }
        else
        {
            this.textarea.style.height = '';
            this.textarea.style.overflow = '';
            this.modifiedResize();
        }
    }
};

// Line comments document modifications
mxCellEditor.prototype.modifiedResize = function()
{
    var state = this.graph.getView().getState(this.editingCell);

    if (state == null)
    {
        this.stopEditing(true);
    }
    else if (this.textarea != null)
    {
        var isEdge = this.graph.getModel().isEdge(state.cell);
        var scale = this.graph.getView().scale;
        var m = null;

        // If block complete removed
        //if (!this.autoSize || (state.style[mxConstants.STYLE_OVERFLOW] == 'fill'))

        var lw = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_WIDTH, null);
        m = (state.text != null) ? state.text.margin : null;

        if (m == null)
        {
            m = mxUtils.getAlignmentAsPoint(mxUtils.getValue(state.style, mxConstants.STYLE_ALIGN, mxConstants.ALIGN_CENTER),
                mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_MIDDLE));
        }

        if (isEdge)
        {
            this.bounds = new mxRectangle(state.absoluteOffset.x, state.absoluteOffset.y, 0, 0);

            if (lw != null)
            {
                var tmp = (parseFloat(lw) + 2) * scale;
                this.bounds.width = tmp;
                this.bounds.x += m.x * tmp;
            }
        }
        else
        {
            // Only this line is modified: state needs to be translated
            var bds = this.graph.translateBounds(mxRectangle.fromRectangle(state));
            var hpos = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
            var vpos = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);

            bds = (state.shape != null && hpos == mxConstants.ALIGN_CENTER && vpos == mxConstants.ALIGN_MIDDLE) ? state.shape.getLabelBounds(bds) : bds;

            if (lw != null)
            {
                bds.width = parseFloat(lw) * scale;
            }

            if (!state.view.graph.cellRenderer.legacySpacing || state.style[mxConstants.STYLE_OVERFLOW] != 'width')
            {
                var spacing = parseInt(state.style[mxConstants.STYLE_SPACING] || 2) * scale;
                var spacingTop = (parseInt(state.style[mxConstants.STYLE_SPACING_TOP] || 0) + mxText.prototype.baseSpacingTop) * scale + spacing;
                var spacingRight = (parseInt(state.style[mxConstants.STYLE_SPACING_RIGHT] || 0) + mxText.prototype.baseSpacingRight) * scale + spacing;
                var spacingBottom = (parseInt(state.style[mxConstants.STYLE_SPACING_BOTTOM] || 0) + mxText.prototype.baseSpacingBottom) * scale + spacing;
                var spacingLeft = (parseInt(state.style[mxConstants.STYLE_SPACING_LEFT] || 0) + mxText.prototype.baseSpacingLeft) * scale + spacing;

                var hpos = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
                var vpos = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);

                bds = new mxRectangle(bds.x + spacingLeft, bds.y + spacingTop,
                    bds.width - ((hpos == mxConstants.ALIGN_CENTER && lw == null) ? (spacingLeft + spacingRight) : 0),
                    bds.height - ((vpos == mxConstants.ALIGN_MIDDLE) ? (spacingTop + spacingBottom) : 0));
            }

            this.bounds = new mxRectangle(bds.x + state.absoluteOffset.x, bds.y + state.absoluteOffset.y, bds.width, bds.height);
        }

        // Needed for word wrap inside text blocks with oversize lines to match the final result where
        // the width of the longest line is used as the reference for text alignment in the cell
        // TODO: Fix word wrapping preview for edge labels in helloworld.html
        if (this.graph.isWrapping(state.cell) && (this.bounds.width >= 2 || this.bounds.height >= 2) &&
            this.textarea.innerHTML != this.getEmptyLabelText())
        {
            this.textarea.style.wordWrap = mxConstants.WORD_WRAP;
            this.textarea.style.whiteSpace = 'normal';

            // Forces automatic reflow if text is removed from an oversize label and normal word wrap
            var tmp = Math.round(this.bounds.width / ((document.documentMode == 8) ? scale : scale)) + this.wordWrapPadding;

            if (this.textarea.style.position != 'relative')
            {
                this.textarea.style.width = tmp + 'px';

                if (this.textarea.scrollWidth > tmp)
                {
                    this.textarea.style.width = this.textarea.scrollWidth + 'px';
                }
            }
            else
            {
                this.textarea.style.maxWidth = tmp + 'px';
            }
        }
        else
        {
            // KNOWN: Trailing cursor in IE9 quirks mode is not visible
            this.textarea.style.whiteSpace = 'nowrap';
            this.textarea.style.width = '';
        }

        // LATER: Keep in visible area, add fine tuning for pixel precision
        // Workaround for wrong measuring in IE8 standards
        if (document.documentMode == 8)
        {
            this.textarea.style.zoom = '1';
            this.textarea.style.height = 'auto';
        }

        var ow = this.textarea.scrollWidth;
        var oh = this.textarea.scrollHeight;

        // TODO: Update CSS width and height if smaller than minResize or remove minResize
        //if (this.minResize != null)
        //{
        //	ow = Math.max(ow, this.minResize.width);
        //	oh = Math.max(oh, this.minResize.height);
        //}

        // LATER: Keep in visible area, add fine tuning for pixel precision
        if (document.documentMode == 8)
        {
            // LATER: Scaled wrapping and position is wrong in IE8
            this.textarea.style.left = Math.max(0, Math.ceil((this.bounds.x - m.x * (this.bounds.width - (ow + 1) * scale) + ow * (scale - 1) * 0 + (m.x + 0.5) * 2) / scale)) + 'px';
            this.textarea.style.top = Math.max(0, Math.ceil((this.bounds.y - m.y * (this.bounds.height - (oh + 0.5) * scale) + oh * (scale - 1) * 0 + Math.abs(m.y + 0.5) * 1) / scale)) + 'px';
            // Workaround for wrong event handling width and height
            this.textarea.style.width = Math.round(ow * scale) + 'px';
            this.textarea.style.height = Math.round(oh * scale) + 'px';
        }
        else if (mxClient.IS_QUIRKS)
        {
            this.textarea.style.left = Math.max(0, Math.ceil(this.bounds.x - m.x * (this.bounds.width - (ow + 1) * scale) + ow * (scale - 1) * 0 + (m.x + 0.5) * 2)) + 'px';
            this.textarea.style.top = Math.max(0, Math.ceil(this.bounds.y - m.y * (this.bounds.height - (oh + 0.5) * scale) + oh * (scale - 1) * 0 + Math.abs(m.y + 0.5) * 1)) + 'px';
        }
        else
        {
            this.textarea.style.left = Math.max(0, Math.round(this.bounds.x - m.x * (this.bounds.width - 2)) + 1) + 'px';
            this.textarea.style.top = Math.max(0, Math.round(this.bounds.y - m.y * (this.bounds.height - 4) + ((m.y == -1) ? 3 : 0)) + 1) + 'px';
        }
    }

    if (mxClient.IS_VML)
    {
        this.textarea.style.zoom = scale;
    }
    else
    {
        mxUtils.setPrefixedStyle(this.textarea.style, 'transformOrigin', '0px 0px');
        mxUtils.setPrefixedStyle(this.textarea.style, 'transform',
            'scale(' + scale + ',' + scale + ')' + ((m == null) ? '' :
            ' translate(' + (m.x * 100) + '%,' + (m.y * 100) + '%)'));
    }
};

mxCellEditorGetEditorBounds = mxCellEditor.prototype.getEditorBounds;
mxCellEditor.prototype.getEditorBounds = function(state) {
    var isEdge = this.graph.getModel().isEdge(state.cell);
    var scale = this.graph.currentScale;
    var minSize = this.getMinimumSize(state);
    var minWidth = minSize.width;
    var minHeight = minSize.height;
    var result = null;

    if (!isEdge && state.view.graph.cellRenderer.legacySpacing && state.style[mxConstants.STYLE_OVERFLOW] == 'fill')
    {
        result = state.shape.getLabelBounds(mxRectangle.fromRectangle(state));
    }
    else
    {
        var spacing = parseInt(state.style[mxConstants.STYLE_SPACING] || 0) * scale;
        var spacingTop = (parseInt(state.style[mxConstants.STYLE_SPACING_TOP] || 0) + mxText.prototype.baseSpacingTop) * scale + spacing;
        var spacingRight = (parseInt(state.style[mxConstants.STYLE_SPACING_RIGHT] || 0) + mxText.prototype.baseSpacingRight) * scale + spacing;
        var spacingBottom = (parseInt(state.style[mxConstants.STYLE_SPACING_BOTTOM] || 0) + mxText.prototype.baseSpacingBottom) * scale + spacing;
        var spacingLeft = (parseInt(state.style[mxConstants.STYLE_SPACING_LEFT] || 0) + mxText.prototype.baseSpacingLeft) * scale + spacing;
        var scaledBounds = this.graph.translateBounds(state);

        result = new mxRectangle(scaledBounds.x, scaledBounds.y,
            Math.max(minWidth, scaledBounds.width - spacingLeft - spacingRight),
            Math.max(minHeight, scaledBounds.height - spacingTop - spacingBottom));
        var hpos = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
        var vpos = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);

        result = (state.shape != null && hpos == mxConstants.ALIGN_CENTER && vpos == mxConstants.ALIGN_MIDDLE) ? state.shape.getLabelBounds(result) : result;

        if (isEdge)
        {
            result.x = state.absoluteOffset.x;
            result.y = state.absoluteOffset.y;

            if (state.text != null && state.text.boundingBox != null)
            {
                // Workaround for label containing just spaces in which case
                // the bounding box location contains negative numbers
                if (state.text.boundingBox.x > 0)
                {
                    result.x = state.text.boundingBox.x;
                }

                if (state.text.boundingBox.y > 0)
                {
                    result.y = state.text.boundingBox.y;
                }
            }
        }
        else if (state.text != null && state.text.boundingBox != null)
        {
            result.x = Math.min(result.x, state.text.boundingBox.x);
            result.y = Math.min(result.y, state.text.boundingBox.y);
        }

        result.x += spacingLeft;
        result.y += spacingTop;

        if (state.text != null && state.text.boundingBox != null)
        {
            if (!isEdge)
            {
                result.width = Math.max(result.width, state.text.boundingBox.width);
                result.height = Math.max(result.height, state.text.boundingBox.height);
            }
            else
            {
                result.width = Math.max(minWidth, state.text.boundingBox.width);
                result.height = Math.max(minHeight, state.text.boundingBox.height);
            }
        }

        // Applies the horizontal and vertical label positions
        if (this.graph.getModel().isVertex(state.cell))
        {
            var horizontal = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);

            if (horizontal == mxConstants.ALIGN_LEFT)
            {
                result.x -= scaledBounds.width;
            }
            else if (horizontal == mxConstants.ALIGN_RIGHT)
            {
                result.x += scaledBounds.width;
            }

            var vertical = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);

            if (vertical == mxConstants.ALIGN_TOP)
            {
                result.y -= scaledBounds.height;
            }
            else if (vertical == mxConstants.ALIGN_BOTTOM)
            {
                result.y += scaledBounds.height;
            }
        }
    }

    return new mxRectangle(Math.round(result.x), Math.round(result.y), Math.round(result.width), Math.round(result.height));
}

mxCellEditorGetInitialValue = mxCellEditor.prototype.getInitialValue;
mxCellEditor.prototype.getInitialValue = function(state, trigger)
{
    if (mxUtils.getValue(state.style, 'html', '0') == '0')
    {
        return mxCellEditorGetInitialValue.apply(this, arguments);
    }
    else
    {
        var result = this.graph.getEditingValue(state.cell, trigger)

        if (mxUtils.getValue(state.style, 'nl2Br', '1') == '1')
        {
            result = result.replace(/\n/g, '<br/>');
        }

        result = this.graph.sanitizeHtml(result, true);

        return result;
    }
};

mxCellEditorGetCurrentValue = mxCellEditor.prototype.getCurrentValue;
mxCellEditor.prototype.getCurrentValue = function(state, ignoreCurrentCellValue)
{
    var value = null;

    if (mxUtils.getValue(state.style, 'html', '0') == '0')
    {
        value = mxCellEditorGetCurrentValue.apply(this, arguments);
    }
    else
    {
        var result = this.graph.sanitizeHtml(this.textarea.innerHTML, true);

        if (mxUtils.getValue(state.style, 'nl2Br', '1') == '1')
        {
            result = result.replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>');
        }
        else
        {
            result = result.replace(/\r\n/g, '').replace(/\n/g, '');
        }

        value = result;
    }

    if(ignoreCurrentCellValue) {
        return  value;
    }

    // Returning null here stops mxCellEditor to apply the value twice
    if(value === this.currentTValuePassedToCell) {
        return null;
    }

    return value;
};

var mxCellEditorStopEditing = mxCellEditor.prototype.stopEditing;
mxCellEditor.prototype.stopEditing = function(cancel)
{
    // Restores default view mode before applying value
    if (this.codeViewMode)
    {
        this.toggleViewMode();
    }

    mxCellEditorStopEditing.apply(this, arguments);
    this.currentWidth = null;
    this.currentHeight = null;

    // Tries to move focus back to container after editing if possible
    this.focusContainer();
};

mxCellEditor.prototype.focusContainer = function()
{
    try
    {
        this.graph.container.focus();
    }
    catch (e)
    {
        // ignore
    }
};

var mxCellEditorApplyValue = mxCellEditor.prototype.applyValue;
mxCellEditor.prototype.applyValue = function(state, value)
{
    // Removes empty relative child labels in edges
    this.graph.getModel().beginUpdate();

    try
    {
        if(this.editingCell && !this.editingCell.isEdge() && !inspectioUtils.isEdgeLabel(this.editingCell)) {
            // Reset cell geometry to force changeset
            var geo = this.graph.model.getGeometry(state.cell);
            state.cell.setGeometry(new mxGeometry(geo.x, geo.y, this.currentWidth, this.currentHeight));
        }

        mxCellEditorApplyValue.apply(this, arguments);

        if(this.editingCell && !this.editingCell.isEdge() && !inspectioUtils.isEdgeLabel(this.editingCell)) {
            var newState = this.graph.view.getState(state.cell);

            if(newState.width > this.currentWidth || newState.height > this.currentHeight) {
                if(parseInt(newState.style[mxConstants.STYLE_AUTOSIZE] || 0) !== 1) {
                    this.graph.setCellStyles(mxConstants.STYLE_AUTOSIZE, 1, [state.cell]);
                }
            }
        }

        if (this.graph.isCellDeletable(state.cell) && this.graph.model.getChildCount(state.cell) == 0)
        {
            var stroke = mxUtils.getValue(state.style, mxConstants.STYLE_STROKECOLOR, mxConstants.NONE);
            var fill = mxUtils.getValue(state.style, mxConstants.STYLE_FILLCOLOR, mxConstants.NONE);

            if (value == '' && stroke == mxConstants.NONE && fill == mxConstants.NONE)
            {
                this.graph.removeCells([state.cell], false);
            }
        }
    }
    finally
    {
        this.graph.getModel().endUpdate();
    }
};

/**
 * Returns the background color to be used for the editing box. This returns
 * the label background for edge labels and null for all other cases.
 */
mxCellEditor.prototype.getBackgroundColor = function(state)
{
    var color = null;

    if (this.graph.getModel().isEdge(state.cell) || this.graph.getModel().isEdge(this.graph.getModel().getParent(state.cell)))
    {
        var color = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, null);

        if (color == mxConstants.NONE)
        {
            color = null;
        }
    }

    return color;
};

mxCellEditor.prototype.getMinimumSize = function(state)
{
    var scale = this.graph.getView().scale;

    return new mxRectangle(0, 0, (state.text == null) ? 30 :  state.text.size * scale + 20, 30);
};

mxCellEditor.prototype.syncWithCell = function()
{
    if (this.editingCell != null)
    {
        var state = this.graph.view.getState(this.editingCell);

        if (state != null)
        {
            this.prepareTextarea();
            var value = this.getCurrentValue(state);

            if (value != null)
            {
                this.applyValue(state, value);
                this.currentTValuePassedToCell = this.getTextareaValue();
                state = this.graph.view.getState(this.editingCell);
                this.currentWidth = state.width;
                this.currentHeight = state.height;

                if (state.text != null && this.isHideLabel(state))
                {
                    this.textNode = state.text.node;
                    this.textNode.style.visibility = 'hidden';
                }
            }
        }
    }

    this.graph.setUserTyping(false);
};

mxCellEditor.prototype.syncSize = function() {
    if (this.editingCell != null) {
        var state = this.graph.view.getState(this.editingCell);

        if (state != null) {
            var value = this.getCurrentValue(state, true);

            if (value != null)
            {
                this.graph.model.beginUpdateWithoutChangeNotifications();

                this.graph.labelChanged(state.cell, value, this.trigger);

                this.graph.model.endUpdateWithoutChangeNotifications();

                if (state.text != null && this.isHideLabel(state))
                {
                    this.textNode = state.text.node;
                    this.textNode.style.visibility = 'hidden';
                }

                this.resize();
            }
        }
    }
}
