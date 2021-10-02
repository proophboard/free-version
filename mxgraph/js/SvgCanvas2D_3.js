mxSvgCanvas2D.prototype.createDiv = function(str, align, valign, style, overflow, whiteSpace)
{
    var s = this.state;

    var orgFontSize = s.fontSize;

    if(orgFontSize > 18) {
        s.fontSize = 18;
    }

    // Inline block for rendering HTML background over SVG in Safari
    var lh = (mxConstants.ABSOLUTE_LINE_HEIGHT) ? (s.fontSize * mxConstants.LINE_HEIGHT) + 'px' :
        (mxConstants.LINE_HEIGHT * this.lineHeightCorrection);

    // Quotes are workaround for font name "m+"
    style = 'display:inline-block;font-size:' + s.fontSize + 'px;font-family:"' + s.fontFamily +
        '";color:' + s.fontColor + ';line-height:' + lh + ';' + style;

    if ((s.fontStyle & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD)
    {
        style += 'font-weight:bold;';
    }

    if ((s.fontStyle & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC)
    {
        style += 'font-style:italic;';
    }

    if ((s.fontStyle & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE)
    {
        style += 'text-decoration:underline;';
    }

    if (align == mxConstants.ALIGN_CENTER)
    {
        style += 'text-align:center;';
    }
    else if (align == mxConstants.ALIGN_RIGHT)
    {
        style += 'text-align:right;';
    }

    var css = '';

    if (s.fontBackgroundColor != null)
    {
        css += 'background-color:' + s.fontBackgroundColor + ';';
    }

    if (s.fontBorderColor != null)
    {
        css += 'border:1px solid ' + s.fontBorderColor + ';';
    }

    var val = str;

    // Labels of Features and BCs are wrapped with a span. fontSize of the container div is set to 18px, and
    // font size of the wrapping span is set to the expected size
    // This fixes the problem, that a large initial font causes the line height to always be large, even if a smaller
    // font size is chosen
    if(orgFontSize !== s.fontSize) {
        val = this.wrapWithFontSpan(str, orgFontSize);
    }


    if (!mxUtils.isNode(val))
    {
        val = this.convertHtml(val);

        if (overflow != 'fill' && overflow != 'width')
        {
            // Workaround for no wrapping in HTML canvas for image
            // export if the inner HTML contains a DIV with width
            if (whiteSpace != null)
            {
                css += 'white-space:' + whiteSpace + ';';
            }

            // Inner div always needed to measure wrapped text
            val = '<div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;' + css + '">' + val + '</div>';
        }
        else
        {
            style += css;
        }
    }

    // Uses DOM API where available. This cannot be used in IE to avoid
    // an opening and two (!) closing TBODY tags being added to tables.
    if (!mxClient.IS_IE && document.createElementNS)
    {
        var div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        div.setAttribute('style', style);

        if (mxUtils.isNode(val))
        {
            // Creates a copy for export
            if (this.root.ownerDocument != document)
            {
                div.appendChild(val.cloneNode(true));
            }
            else
            {
                div.appendChild(val);
            }
        }
        else
        {
            div.innerHTML = val;
        }
        return div;
    }
    else
    {
        // Serializes for export
        if (mxUtils.isNode(val) && this.root.ownerDocument != document)
        {
            val = val.outerHTML;
        }

        // NOTE: FF 3.6 crashes if content CSS contains "height:100%"
        return mxUtils.parseXml('<div xmlns="http://www.w3.org/1999/xhtml" style="' + style +
            '">' + val + '</div>').documentElement;
    }
};

mxSvgCanvas2D.prototype.wrapWithFontSpan = function (val, fontSize) {
    if(val[0] !== '<') {
        val = '<span class="font-wrapper" style="font-size:' + fontSize + 'px;">'+val+'</span>';
    } else {
        var tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = val;

        var textNode = tmpDiv.firstChild;

        if(textNode.tagName === 'span' && textNode.classList.contains('font-wrapper')) {
            val = '<span class="font-wrapper" style="font-size:' + fontSize + 'px;">'+textNode.innerHTML+'</span>';
        }
    }

    return val;
}

mxSvgCanvas2D.prototype.text = function(x, y, w, h, str, align, valign, wrap, format, overflow, clip, rotation, dir)
{
    if (this.textEnabled && str != null)
    {
        rotation = (rotation != null) ? rotation : 0;

        var s = this.state;
        x += s.dx;
        y += s.dy;

        if (this.foEnabled && format == 'html')
        {
            var style = 'vertical-align:top;';

            if (clip)
            {
                style += 'overflow:hidden;max-height:' + Math.round(h) + 'px;max-width:' + Math.round(w) + 'px;';
            }
            else if (overflow == 'fill')
            {
                style += 'width:' + Math.round(w + 1) + 'px;height:' + Math.round(h + 1) + 'px;overflow:hidden;';
            }
            else if (overflow == 'width')
            {
                style += 'width:' + Math.round(w + 1) + 'px;';

                if (h > 0)
                {
                    style += 'max-height:' + Math.round(h) + 'px;overflow:hidden;';
                }
            }

            if (wrap && w > 0)
            {
                style += 'width:' + Math.round(w + 1) + 'px;white-space:normal;word-wrap:' +
                    mxConstants.WORD_WRAP + ';';
            }
            else
            {
                style += 'white-space:nowrap;';
            }

            // Uses outer group for opacity and transforms to
            // fix rendering order in Chrome
            var group = this.createElement('g');

            if (s.alpha < 1)
            {
                group.setAttribute('opacity', s.alpha);
            }

            var fo = this.createElement('foreignObject');
            fo.setAttribute('style', 'overflow:visible;');
            fo.setAttribute('pointer-events', 'all');

            var div = this.createDiv(str, align, valign, style, overflow, (wrap && w > 0) ? 'normal' : null);

            // Ignores invalid XHTML labels
            if (div == null)
            {
                return;
            }
            else if (dir != null)
            {
                div.setAttribute('dir', dir);
            }

            group.appendChild(fo);
            this.root.appendChild(group);

            // Code that depends on the size which is computed after
            // the element was added to the DOM.
            var ow = 0;
            var oh = 0;

            // Padding avoids clipping on border and wrapping for differing font metrics on platforms
            var padX = 2;
            var padY = 2;

            // NOTE: IE is always export as it does not support foreign objects
            if (mxClient.IS_IE && (document.documentMode == 9 || !mxClient.IS_SVG))
            {
                // Handles non-standard namespace for getting size in IE
                var clone = document.createElement('div');

                clone.style.cssText = div.getAttribute('style');
                clone.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
                clone.style.position = 'absolute';
                clone.style.visibility = 'hidden';

                // Inner DIV is needed for text measuring
                var div2 = document.createElement('div');
                div2.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
                div2.style.wordWrap = mxConstants.WORD_WRAP;
                div2.innerHTML = (mxUtils.isNode(str)) ? str.outerHTML : str;
                clone.appendChild(div2);

                document.body.appendChild(clone);

                // Workaround for different box models
                if (document.documentMode != 8 && document.documentMode != 9 && s.fontBorderColor != null)
                {
                    padX += 2;
                    padY += 2;
                }

                if (wrap && w > 0)
                {
                    var tmp = div2.offsetWidth;

                    // Workaround for adding padding twice in IE8/IE9 standards mode if label is wrapped
                    padDx = 0;

                    // For export, if no wrapping occurs, we add a large padding to make
                    // sure there is no wrapping even if the text metrics are different.
                    // This adds support for text metrics on different operating systems.
                    // Disables wrapping if text is not wrapped for given width
                    if (!clip && wrap && w > 0 && this.root.ownerDocument != document && overflow != 'fill')
                    {
                        var ws = clone.style.whiteSpace;
                        div2.style.whiteSpace = 'nowrap';

                        if (tmp < div2.offsetWidth)
                        {
                            clone.style.whiteSpace = ws;
                        }
                    }

                    if (clip)
                    {
                        tmp = Math.min(tmp, w);
                    }

                    clone.style.width = tmp + 'px';

                    // Padding avoids clipping on border
                    ow = div2.offsetWidth + padX + padDx;
                    oh = div2.offsetHeight + padY;

                    // Overrides the width of the DIV via XML DOM by using the
                    // clone DOM style, getting the CSS text for that and
                    // then setting that on the DIV via setAttribute
                    clone.style.display = 'inline-block';
                    clone.style.position = '';
                    clone.style.visibility = '';
                    clone.style.width = ow + 'px';

                    div.setAttribute('style', clone.style.cssText);
                }
                else
                {
                    // Padding avoids clipping on border
                    ow = div2.offsetWidth + padX;
                    oh = div2.offsetHeight + padY;
                }

                clone.parentNode.removeChild(clone);
                fo.appendChild(div);
            }
            else
            {
                // Uses document for text measuring during export
                if (this.root.ownerDocument != document)
                {
                    div.style.visibility = 'hidden';
                    document.body.appendChild(div);
                }
                else
                {
                    fo.appendChild(div);
                }

                var sizeDiv = div;

                /**
                 * Disabled to avoid calculating size of first inner div instad of all
                 *
                if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName == 'DIV')
                {
                    sizeDiv = sizeDiv.firstChild;

                    if (wrap && div.style.wordWrap == 'break-word')
                    {
                        sizeDiv.style.width = '100%';
                    }
                }
                */

                var tmp = sizeDiv.offsetWidth;

                // Workaround for text measuring in hidden containers
                if (tmp == 0 && div.parentNode == fo)
                {
                    div.style.visibility = 'hidden';
                    document.body.appendChild(div);

                    tmp = sizeDiv.offsetWidth;
                }

                if (this.cacheOffsetSize)
                {
                    group.mxCachedOffsetWidth = tmp;
                }

                // Disables wrapping if text is not wrapped for given width
                if (!clip && wrap && w > 0 && this.root.ownerDocument != document &&
                    overflow != 'fill' && overflow != 'width')
                {
                    var ws = div.style.whiteSpace;
                    div.style.whiteSpace = 'nowrap';

                    if (tmp < sizeDiv.offsetWidth)
                    {
                        div.style.whiteSpace = ws;
                    }
                }

                ow = tmp + padX - 1;

                // Recomputes the height of the element for wrapped width
                if (wrap && overflow != 'fill' && overflow != 'width')
                {
                    if (clip)
                    {
                        ow = Math.min(ow, w);
                    }

                    div.style.width = ow + 'px';
                }

                ow = sizeDiv.offsetWidth;
                oh = sizeDiv.offsetHeight;

                if (this.cacheOffsetSize)
                {
                    group.mxCachedFinalOffsetWidth = ow;
                    group.mxCachedFinalOffsetHeight = oh;
                }

                oh -= padY;

                if (div.parentNode != fo)
                {
                    fo.appendChild(div);
                    div.style.visibility = '';
                }
            }

            if (clip)
            {
                oh = Math.min(oh, h);
                ow = Math.min(ow, w);
            }

            if (overflow == 'width')
            {
                h = oh;
            }
            else if (overflow != 'fill')
            {
                w = ow;
                h = oh;
            }

            if (s.alpha < 1)
            {
                group.setAttribute('opacity', s.alpha);
            }

            var dx = 0;
            var dy = 0;

            if (align == mxConstants.ALIGN_CENTER)
            {
                dx -= w / 2;
            }
            else if (align == mxConstants.ALIGN_RIGHT)
            {
                dx -= w;
            }

            x += dx;

            // FIXME: LINE_HEIGHT not ideal for all text sizes, fix for export
            if (valign == mxConstants.ALIGN_MIDDLE)
            {
                dy -= h / 2;
            }
            else if (valign == mxConstants.ALIGN_BOTTOM)
            {
                dy -= h;
            }

            // Workaround for rendering offsets
            // TODO: Check if export needs these fixes, too
            //if (this.root.ownerDocument == document)
            if (overflow != 'fill' && mxClient.IS_FF && mxClient.IS_WIN)
            {
                dy -= 2;
            }

            y += dy;

            var tr = (s.scale != 1) ? 'scale(' + s.scale + ')' : '';

            if (s.rotation != 0 && this.rotateHtml)
            {
                tr += 'rotate(' + (s.rotation) + ',' + (w / 2) + ',' + (h / 2) + ')';
                var pt = this.rotatePoint((x + w / 2) * s.scale, (y + h / 2) * s.scale,
                    s.rotation, s.rotationCx, s.rotationCy);
                x = pt.x - w * s.scale / 2;
                y = pt.y - h * s.scale / 2;
            }
            else
            {
                x *= s.scale;
                y *= s.scale;
            }

            if (rotation != 0)
            {
                tr += 'rotate(' + (rotation) + ',' + (-dx) + ',' + (-dy) + ')';
            }

            group.setAttribute('transform', 'translate(' + (Math.round(x) + this.foOffset) + ',' +
                (Math.round(y) + this.foOffset) + ')' + tr);
            fo.setAttribute('width', Math.round(Math.max(1, w)));
            fo.setAttribute('height', Math.round(Math.max(1, h)));

            // Adds alternate content if foreignObject not supported in viewer
            if (this.root.ownerDocument != document)
            {
                var alt = this.createAlternateContent(fo, x, y, w, h, str, align, valign, wrap, format, overflow, clip, rotation);

                if (alt != null)
                {
                    fo.setAttribute('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility');
                    var sw = this.createElement('switch');
                    sw.appendChild(fo);
                    sw.appendChild(alt);
                    group.appendChild(sw);
                }
            }
        }
        else
        {
            this.plainText(x, y, w, h, str, align, valign, wrap, overflow, clip, rotation, dir);
        }
    }
};

mxSvgCanvas2D.prototype.updateText = function(x, y, w, h, align, valign, wrap, overflow, clip, rotation, node)
{
    if (node != null && node.firstChild != null && node.firstChild.firstChild != null &&
        node.firstChild.firstChild.firstChild != null)
    {
        // Uses outer group for opacity and transforms to
        // fix rendering order in Chrome
        var group = node.firstChild;
        var fo = group.firstChild;
        var div = fo.firstChild;

        rotation = (rotation != null) ? rotation : 0;

        var s = this.state;
        x += s.dx;
        y += s.dy;

        if (clip)
        {
            div.style.maxHeight = Math.round(h) + 'px';
            div.style.maxWidth = Math.round(w) + 'px';
        }
        else if (overflow == 'fill')
        {
            div.style.width = Math.round(w + 1) + 'px';
            div.style.height = Math.round(h + 1) + 'px';
        }
        else if (overflow == 'width')
        {
            div.style.width = Math.round(w + 1) + 'px';

            if (h > 0)
            {
                div.style.maxHeight = Math.round(h) + 'px';
            }
        }

        if (wrap && w > 0)
        {
            div.style.width = Math.round(w + 1) + 'px';
        }

        // Code that depends on the size which is computed after
        // the element was added to the DOM.
        var ow = 0;
        var oh = 0;

        // Padding avoids clipping on border and wrapping for differing font metrics on platforms
        var padX = 0;
        var padY = 2;

        var sizeDiv = div;

        if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName == 'DIV')
        {
            // Bugfix for left aligned text box, first div is only first row so height was calculated wrong
            // now group size is used which works as expected
            // sizeDiv = sizeDiv.firstChild;
        }

        var tmp = (group.mxCachedOffsetWidth != null) ? group.mxCachedOffsetWidth : sizeDiv.offsetWidth;
        ow = tmp + padX;

        // Recomputes the height of the element for wrapped width
        if (wrap && overflow != 'fill')
        {
            if (clip)
            {
                ow = Math.min(ow, w);
            }

            div.style.width = Math.round(ow + 1) + 'px';
        }

        ow = (group.mxCachedFinalOffsetWidth != null) ? group.mxCachedFinalOffsetWidth : sizeDiv.offsetWidth;
        oh = (group.mxCachedFinalOffsetHeight != null) ? group.mxCachedFinalOffsetHeight : sizeDiv.offsetHeight;

        if (this.cacheOffsetSize)
        {
            group.mxCachedOffsetWidth = tmp;
            group.mxCachedFinalOffsetWidth = ow;
            group.mxCachedFinalOffsetHeight = oh;
        }

        ow += padX;
        oh -= 2;

        if (clip)
        {
            oh = Math.min(oh, h);
            ow = Math.min(ow, w);
        }

        if (overflow == 'width')
        {
            h = oh;
        }
        else if (overflow != 'fill')
        {
            w = ow;
            h = oh;
        }

        var dx = 0;
        var dy = 0;

        if (align == mxConstants.ALIGN_CENTER)
        {
            dx -= w / 2;
        }
        else if (align == mxConstants.ALIGN_RIGHT)
        {
            dx -= w;
        }

        x += dx;

        // FIXME: LINE_HEIGHT not ideal for all text sizes, fix for export
        if (valign == mxConstants.ALIGN_MIDDLE)
        {
            dy -= h / 2;
        }
        else if (valign == mxConstants.ALIGN_BOTTOM)
        {
            dy -= h;
        }

        // Workaround for rendering offsets
        // TODO: Check if export needs these fixes, too
        if (overflow != 'fill' && mxClient.IS_FF && mxClient.IS_WIN)
        {
            dy -= 2;
        }

        y += dy;

        var tr = (s.scale != 1) ? 'scale(' + s.scale + ')' : '';

        if (s.rotation != 0 && this.rotateHtml)
        {
            tr += 'rotate(' + (s.rotation) + ',' + (w / 2) + ',' + (h / 2) + ')';
            var pt = this.rotatePoint((x + w / 2) * s.scale, (y + h / 2) * s.scale,
                s.rotation, s.rotationCx, s.rotationCy);
            x = pt.x - w * s.scale / 2;
            y = pt.y - h * s.scale / 2;
        }
        else
        {
            x *= s.scale;
            y *= s.scale;
        }

        if (rotation != 0)
        {
            tr += 'rotate(' + (rotation) + ',' + (-dx) + ',' + (-dy) + ')';
        }

        group.setAttribute('transform', 'translate(' + Math.round(x) + ',' + Math.round(y) + ')' + tr);
        fo.setAttribute('width', Math.round(Math.max(1, w)));
        fo.setAttribute('height', Math.round(Math.max(1, h)));
    }
};
