/**
 * Copyright (c) 2006-2015, JGraph Ltd
 */

//Card Shape
function CardShape()
{
    mxRectangleShape.call(this);
}
mxUtils.extend(CardShape, mxRectangleShape);

CardShape.prototype.paintBackground = function(c, x, y, w, h) {
    const stroke = this.stroke;
    this.stroke = '#e3e3e3';
    c.setStrokeColor('#e3e3e3');
    mxRectangleShape.prototype.paintBackground.call(this, c, x, y, w, h);
    this.stroke = stroke;
    c.setStrokeColor(this.stroke);
    c.begin();
    c.setStrokeWidth(10);
    c.setShadow(false);
    c.moveTo(x - 0.5, y + 4);
    c.lineTo(x + w + 0.5, y + 4);
    c.end();
    c.stroke();
}
CardShape.prototype.getLabelBounds = function(rect)
{
    var d = mxUtils.getValue(this.style, mxConstants.STYLE_DIRECTION, mxConstants.DIRECTION_EAST);
    var verticalAlign = mxUtils.getValue(this.style, mxConstants.STYLE_VERTICAL_ALIGN, 'middle');
    var bounds = rect;
    if(verticalAlign === 'top') {
        bounds.y = rect.y + 10;
    }
    bounds.x = rect.x + 10;
    bounds.width = rect.width - 20;

    // Normalizes argument for getLabelMargins hook
    if (d != mxConstants.DIRECTION_SOUTH && d != mxConstants.DIRECTION_NORTH &&
        this.state != null && this.state.text != null &&
        this.state.text.isPaintBoundsInverted())
    {
        bounds = bounds.clone();
        var tmp = bounds.width;
        bounds.width = bounds.height;
        bounds.height = tmp;
    }

    var m = this.getLabelMargins(bounds);

    if (m != null)
    {
        var flipH = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPH, false) == '1';
        var flipV = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPV, false) == '1';

        // Handles special case for vertical labels
        if (this.state != null && this.state.text != null &&
            this.state.text.isPaintBoundsInverted())
        {
            var tmp = m.x;
            m.x = m.height;
            m.height = m.width;
            m.width = m.y;
            m.y = tmp;

            tmp = flipH;
            flipH = flipV;
            flipV = tmp;
        }

        return mxUtils.getDirectedBounds(rect, m, this.style, flipH, flipV);
    }

    return bounds;
};
mxCellRenderer.registerShape('card', CardShape);


/**
 * Registers shapes.
 */
(function()
{
	// Cube Shape, supports size style
	function CubeShape()
	{
		mxCylinder.call(this);
	};
	mxUtils.extend(CubeShape, mxCylinder);
	CubeShape.prototype.size = 20;
	CubeShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
	{
		var s = Math.max(0, Math.min(w, Math.min(h, parseFloat(mxUtils.getValue(this.style, 'size', this.size)))));

		if (isForeground)
		{
			path.moveTo(s, h);
			path.lineTo(s, s);
			path.lineTo(0, 0);
			path.moveTo(s, s);
			path.lineTo(w, s);
			path.end();
		}
		else
		{
			path.moveTo(0, 0);
			path.lineTo(w - s, 0);
			path.lineTo(w, s);
			path.lineTo(w, h);
			path.lineTo(s, h);
			path.lineTo(0, h - s);
			path.lineTo(0, 0);
			path.close();
			path.end();
		}
	};
	CubeShape.prototype.getLabelMargins = function(rect)
	{
		if (mxUtils.getValue(this.style, 'boundedLbl', false))
		{
			var s = parseFloat(mxUtils.getValue(this.style, 'size', this.size)) * this.scale;
			
			return new mxRectangle(s, s, 0, 0);
		}
		
		return null;
	};
	
	mxCellRenderer.registerShape('cube', CubeShape);

    /**
     * Adds handJiggle style (jiggle=n sets jiggle)
     */
    function HandJiggle(canvas, defaultVariation)
    {
        this.canvas = canvas;

        // Avoids "spikes" in the output
        this.canvas.setLineJoin('round');
        this.canvas.setLineCap('round');

        this.defaultVariation = defaultVariation;

        this.originalLineTo = this.canvas.lineTo;
        this.canvas.lineTo = mxUtils.bind(this, HandJiggle.prototype.lineTo);

        this.originalMoveTo = this.canvas.moveTo;
        this.canvas.moveTo = mxUtils.bind(this, HandJiggle.prototype.moveTo);

        this.originalClose = this.canvas.close;
        this.canvas.close = mxUtils.bind(this, HandJiggle.prototype.close);

        this.originalQuadTo = this.canvas.quadTo;
        this.canvas.quadTo = mxUtils.bind(this, HandJiggle.prototype.quadTo);

        this.originalCurveTo = this.canvas.curveTo;
        this.canvas.curveTo = mxUtils.bind(this, HandJiggle.prototype.curveTo);

        this.originalArcTo = this.canvas.arcTo;
        this.canvas.arcTo = mxUtils.bind(this, HandJiggle.prototype.arcTo);
    };

    HandJiggle.prototype.moveTo = function(endX, endY)
    {
        this.originalMoveTo.apply(this.canvas, arguments);
        this.lastX = endX;
        this.lastY = endY;
        this.firstX = endX;
        this.firstY = endY;
    };

    HandJiggle.prototype.close = function()
    {
        if (this.firstX != null && this.firstY != null)
        {
            this.lineTo(this.firstX, this.firstY);
            this.originalClose.apply(this.canvas, arguments);
        }

        this.originalClose.apply(this.canvas, arguments);
    };

    HandJiggle.prototype.quadTo = function(x1, y1, x2, y2)
    {
        this.originalQuadTo.apply(this.canvas, arguments);
        this.lastX = x2;
        this.lastY = y2;
    };

    HandJiggle.prototype.curveTo = function(x1, y1, x2, y2, x3, y3)
    {
        this.originalCurveTo.apply(this.canvas, arguments);
        this.lastX = x3;
        this.lastY = y3;
    };

    HandJiggle.prototype.arcTo = function(rx, ry, angle, largeArcFlag, sweepFlag, x, y)
    {
        this.originalArcTo.apply(this.canvas, arguments);
        this.lastX = x;
        this.lastY = y;
    };

    HandJiggle.prototype.lineTo = function(endX, endY)
    {
        // LATER: Check why this.canvas.lastX cannot be used
        if (this.lastX != null && this.lastY != null)
        {
            var dx = Math.abs(endX - this.lastX);
            var dy = Math.abs(endY - this.lastY);
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2)
            {
                this.originalLineTo.apply(this.canvas, arguments);
                this.lastX = endX;
                this.lastY = endY;

                return;
            }

            var segs = Math.round(dist / 10);
            var variation = this.defaultVariation;

            if (segs < 5)
            {
                segs = 5;
                variation /= 3;
            }

            function sign(x)
            {
                return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
            }

            var stepX = sign(endX - this.lastX) * dx / segs;
            var stepY = sign(endY - this.lastY) * dy / segs;

            var fx = dx / dist;
            var fy = dy / dist;

            for (var s = 0; s < segs; s++)
            {
                var x = stepX * s + this.lastX;
                var y = stepY * s + this.lastY;

                var offset = (Math.random() - 0.5) * variation;
                this.originalLineTo.call(this.canvas, x - offset * fy, y - offset * fx);
            }

            this.originalLineTo.call(this.canvas, endX, endY);
            this.lastX = endX;
            this.lastY = endY;
        }
        else
        {
            this.originalLineTo.apply(this.canvas, arguments);
            this.lastX = endX;
            this.lastY = endY;
        }
    };

    HandJiggle.prototype.destroy = function()
    {
        this.canvas.lineTo = this.originalLineTo;
        this.canvas.moveTo = this.originalMoveTo;
        this.canvas.close = this.originalClose;
        this.canvas.quadTo = this.originalQuadTo;
        this.canvas.curveTo = this.originalCurveTo;
        this.canvas.arcTo = this.originalArcTo;
    };

    // Installs hand jiggle in all shapes
    var mxShapePaint0 = mxShape.prototype.paint;
    mxShape.prototype.defaultJiggle = 1.5;
    mxShape.prototype.paint = function(c)
    {
        // NOTE: getValue does not return a boolean value so !('0') would return true here and below
        if (this.style != null && mxUtils.getValue(this.style, 'comic', '0') != '0' && c.handHiggle == null)
        {
            c.handJiggle = new HandJiggle(c, mxUtils.getValue(this.style, 'jiggle', this.defaultJiggle));
        }

        mxShapePaint0.apply(this, arguments);

        if (c.handJiggle != null)
        {
            c.handJiggle.destroy();
            delete c.handJiggle;
        }
    };

    // Sets default jiggle for diamond
    mxRhombus.prototype.defaultJiggle = 2;

    /**
     * Overrides to avoid call to rect
     */
    var mxRectangleShapeIsHtmlAllowed0 = mxRectangleShape.prototype.isHtmlAllowed;
    mxRectangleShape.prototype.isHtmlAllowed = function()
    {
        return (this.style == null || mxUtils.getValue(this.style, 'comic', '0') == '0') &&
            mxRectangleShapeIsHtmlAllowed0.apply(this, arguments);
    };

    var mxRectangleShapePaintBackground0 = mxRectangleShape.prototype.paintBackground;
    mxRectangleShape.prototype.paintBackground = function(c, x, y, w, h)
    {
        if (c.handJiggle == null)
        {
            mxRectangleShapePaintBackground0.apply(this, arguments);
        }
        else
        {
            var events = true;

            if (this.style != null)
            {
                events = mxUtils.getValue(this.style, mxConstants.STYLE_POINTER_EVENTS, '1') == '1';
            }

            if (events || (this.fill != null && this.fill != mxConstants.NONE) ||
                (this.stroke != null && this.stroke != mxConstants.NONE))
            {
                if (!events && (this.fill == null || this.fill == mxConstants.NONE))
                {
                    c.pointerEvents = false;
                }

                c.begin();

                if (this.isRounded)
                {
                    var r = 0;

                    if (mxUtils.getValue(this.style, mxConstants.STYLE_ABSOLUTE_ARCSIZE, 0) == '1')
                    {
                        r = Math.min(w / 2, Math.min(h / 2, mxUtils.getValue(this.style,
                            mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2));
                    }
                    else
                    {
                        var f = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE,
                            mxConstants.RECTANGLE_ROUNDING_FACTOR * 100) / 100;
                        r = Math.min(w * f, h * f);
                    }

                    c.moveTo(x + r, y);
                    c.lineTo(x + w - r, y);
                    c.quadTo(x + w, y, x + w, y + r);
                    c.lineTo(x + w, y + h - r);
                    c.quadTo(x + w, y + h, x + w - r, y + h);
                    c.lineTo(x + r, y + h);
                    c.quadTo(x, y + h, x, y + h - r);
                    c.lineTo(x, y + r);
                    c.quadTo(x, y, x + r, y);
                }
                else
                {

                    c.moveTo(x, y);
                    c.lineTo(x + w, y);
                    c.lineTo(x + w, y + h);
                    c.lineTo(x, y + h);
                    c.lineTo(x, y);
                }

                // LATER: Check if close is needed here
                c.close();
                c.end();

                c.fillAndStroke();
            }
        }
    };

    /**
     * Disables glass effect with hand jiggle.
     */
    var mxRectangleShapePaintForeground0 = mxRectangleShape.prototype.paintForeground;
    mxRectangleShape.prototype.paintForeground = function(c, x, y, w, h)
    {
        if (c.handJiggle == null)
        {
            mxRectangleShapePaintForeground0.apply(this, arguments);
        }
    };

    mxRectangleShape.prototype.getLabelBounds = function(rect)
    {
        var d = mxUtils.getValue(this.style, mxConstants.STYLE_DIRECTION, mxConstants.DIRECTION_EAST);
        var bounds = rect;
        if(this.state && this.state.cell && inspectioUtils.isTextField(this.state.cell) && bounds.width > 100) {
            bounds.x = rect.x + 30;
            bounds.width = rect.width - 60;
        }

        // Normalizes argument for getLabelMargins hook
        if (d != mxConstants.DIRECTION_SOUTH && d != mxConstants.DIRECTION_NORTH &&
            this.state != null && this.state.text != null &&
            this.state.text.isPaintBoundsInverted())
        {
            bounds = bounds.clone();
            var tmp = bounds.width;
            bounds.width = bounds.height;
            bounds.height = tmp;
        }

        var m = this.getLabelMargins(bounds);

        if (m != null)
        {
            var flipH = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPH, false) == '1';
            var flipV = mxUtils.getValue(this.style, mxConstants.STYLE_FLIPV, false) == '1';

            // Handles special case for vertical labels
            if (this.state != null && this.state.text != null &&
                this.state.text.isPaintBoundsInverted())
            {
                var tmp = m.x;
                m.x = m.height;
                m.height = m.width;
                m.width = m.y;
                m.y = tmp;

                tmp = flipH;
                flipH = flipV;
                flipV = tmp;
            }

            return mxUtils.getDirectedBounds(rect, m, this.style, flipH, flipV);
        }

        return bounds;
    };
    
    // End of hand jiggle integration
})();
