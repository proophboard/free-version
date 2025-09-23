var inspectioUtils = {
    STICKY_TYPES: [
        ispConst.TYPE_EVENT,
        ispConst.TYPE_COMMAND,
        ispConst.TYPE_AGGREGATE,
        ispConst.TYPE_ROLE,
        ispConst.TYPE_DOCUMENT,
        ispConst.TYPE_EXTERNAL_SYSTEM,
        ispConst.TYPE_HOT_SPOT,
        ispConst.TYPE_POLICY,
        ispConst.TYPE_UI,
    ],
    forEachDelay: function(arr, callback, doneCb, delay) {
        if(!delay) {
            delay = 10;
        }

        if(!callback) {
            callback = () => {};
        }

        if(!doneCb) {
            doneCb = () => {};
        }

        if(arr.length > 0) {
            var result = callback(arr[0]);

            if(result !== false) {
                window.setTimeout(() => {
                    inspectioUtils.forEachDelay(arr.slice(1), callback, doneCb, delay);
                }, delay);
            }
        } else {
            doneCb();
        }
    },

    isFeature: function (cell) {
        return inspectioUtils.isOfType(cell, ispConst.TYPE_FEATURE);
    },

    isSlice: function (cell) {
        return inspectioUtils.isFeature(cell);
    },

    isEventModel: function (cell) {
      var tags = inspectioUtils.getTags(cell);

      return tags.includes(ispConst.TAG_EVENT_MODEL) || tags.includes(ispConst.TAG_SLICE) /* First impl. included Swimlanes in Slices, this check is for keeping BC */;
    },

    isSliceLaneLabel: function (cell) {
        const isLaneLabel = inspectioUtils.isSliceModuleLaneLabel(cell) || inspectioUtils.isSliceUserLaneLabel(cell);

        if(isLaneLabel && inspectioUtils.getType(cell) === ispConst.TYPE_ROLE) {
            if(!inspectioUtils.isEventModel(cell.parent)) {
                return false;
            }
        }

        return isLaneLabel;
    },

    isSliceModuleLaneLabel: function (cell) {
        return inspectioUtils.isTextField(cell) && inspectioUtils.hasTag(cell, ispConst.TAG_LANE_HANDLE) && (!cell.edges || cell.edges.length === 0);
    },

    isSliceLaneHandle: function (cell) {
        return inspectioUtils.isTextField(cell) && inspectioUtils.hasTag(cell, ispConst.TAG_LANE_HANDLE) && cell.edges && cell.edges.length === 1;
    },

    isSliceTimeHandle: function (cell) {
        return inspectioUtils.isTextField(cell) && inspectioUtils.hasTag(cell, ispConst.TAG_TIME_HANDLE) && cell.edges && cell.edges.length === 1;
    },

    isLastSliceModuleLaneLabel: function(cell) {
        if(!inspectioUtils.isSliceModuleLaneLabel(cell)) {
            return false;
        }

        const lastModuleLaneLabel = inspectioUtils.getLastSliceModuleLaneLabel(cell.parent);

        return lastModuleLaneLabel && lastModuleLaneLabel === cell;
    },

    isFirstSliceUserLaneLabel: function(cell) {
        if(!inspectioUtils.isSliceUserLaneLabel(cell)) {
            return false;
        }

        const firstUserLaneLabel = inspectioUtils.getFirstSliceUserLaneLabel(cell.parent);

        return firstUserLaneLabel && firstUserLaneLabel === cell;

    },

    getFirstSliceUserLaneLabel: function (cell) {
        if(!inspectioUtils.isEventModel(cell)) {
            return null;
        }

        let firstUserLabel = null;

        cell.children.forEach(child => {
            if(!inspectioUtils.isSliceUserLaneLabel(child)) {
                return;
            }

            if(!firstUserLabel) {
                firstUserLabel = child;
            }

            if(child.getGeometry().y < firstUserLabel.getGeometry().y) {
                firstUserLabel = child;
            }
        })

        return firstUserLabel;
    },

    getLastSliceModuleLaneLabel: function (cell) {
        if(!inspectioUtils.isEventModel(cell)) {
            return null;
        }

        let lastModuleLabel = null;

        cell.children.forEach(child => {
            if(!inspectioUtils.isSliceModuleLaneLabel(child)) {
                return;
            }

            if(!lastModuleLabel) {
                lastModuleLabel = child;
            }

            if(child.getGeometry().y > lastModuleLabel.getGeometry().y) {
                lastModuleLabel = child;
            }
        })

        return lastModuleLabel;
    },

    getLastSliceLaneHandle: function (cell) {
        if(!inspectioUtils.isEventModel(cell)) {
            return null;
        }

        let lastLaneHandle = null;

        cell.children.forEach(child => {
            if(!inspectioUtils.isSliceLaneHandle(child)) {
                return;
            }

            if(!lastLaneHandle) {
                lastLaneHandle = child;
            }

            if(child.getGeometry().y > lastLaneHandle.getGeometry().y) {
                lastLaneHandle = child;
            }
        })

        return lastLaneHandle;
    },

    getFirstSliceLaneHandle: function (cell) {
        if(!inspectioUtils.isEventModel(cell)) {
            return null;
        }

        let firstLaneHandle = null;

        cell.children.forEach(child => {
            if(!inspectioUtils.isSliceLaneHandle(child)) {
                return;
            }

            if(!firstLaneHandle) {
                firstLaneHandle = child;
            }

            if(child.getGeometry().y < firstLaneHandle.getGeometry().y) {
                firstLaneHandle = child;
            }
        })

        return firstLaneHandle;
    },

    getLastSliceTimeHandle: function (cell) {
        if(!inspectioUtils.isEventModel(cell)) {
            return null;
        }

        let lastTimeHandle = null;

        cell.children.forEach(child => {
            if(!inspectioUtils.isSliceTimeHandle(child)) {
                return;
            }

            if(!lastTimeHandle) {
                lastTimeHandle = child;
            }

            if(child.getGeometry().y > lastTimeHandle.getGeometry().y) {
                lastTimeHandle = child;
            }
        })

        return lastTimeHandle;
    },

    getFirstSliceTimeHandle: function (cell) {
        if(!inspectioUtils.isEventModel(cell)) {
            return null;
        }

        let firstTimeHandle = null;

        cell.children.forEach(child => {
            if(!inspectioUtils.isSliceTimeHandle(child)) {
                return;
            }

            if(!firstTimeHandle) {
                firstTimeHandle = child;
            }

            if(child.getGeometry().y < firstTimeHandle.getGeometry().y) {
                firstTimeHandle = child;
            }
        })

        return firstTimeHandle;
    },

    isSliceUserLaneLabel: function (cell) {
        return (inspectioUtils.getType(cell) === ispConst.TYPE_ROLE || inspectioUtils.getType(cell) === ispConst.TYPE_FREE_TEXT)
          && inspectioUtils.hasTag(cell, ispConst.TAG_LANE_HANDLE)
          && (!cell.edges || cell.edges.length === 0);
    },

    isTimeHandle: function (cell) {
        var tags = inspectioUtils.getTags(cell);

        return tags.includes(ispConst.TAG_TIME_HANDLE);
    },

    isLaneHandle: function (cell) {
        var tags = inspectioUtils.getTags(cell);
        return tags.includes(ispConst.TAG_LANE_HANDLE);
    },

    isLaneLabelWatermark: function (cell) {
        var tags = inspectioUtils.getTags(cell);
        return tags.includes(ispConst.TAG_LANE_WATERMARK);
    },

    isEventModelHandle: function (cell) {
        var tags = inspectioUtils.getTags(cell);
        return tags.includes(ispConst.TAG_LANE_WATERMARK) || tags.includes(ispConst.TAG_LANE_HANDLE) || tags.includes(ispConst.TAG_TIME_HANDLE);
    },

    isImage: function (cell) {
        return inspectioUtils.isOfType(cell, ispConst.TYPE_IMAGE);
    },

    isIcon: function (cell) {
        return inspectioUtils.isOfType(cell, ispConst.TYPE_ICON);
    },

    isImageOrIcon: function (cell) {
        return inspectioUtils.isImage(cell) || inspectioUtils.isIcon(cell);
    },

    isProcess: function (cell) {
        return inspectioUtils.isFeature(cell);
    },

    isBoundedContext: function (cell) {
        return inspectioUtils.isOfType(cell, ispConst.TYPE_BC);
    },

    isContainer: function (cell) {
        return inspectioUtils.isProcess(cell) || inspectioUtils.isBoundedContext(cell);
    },

    isContainerSwimLane: function (cell) {
        return inspectioUtils.isContainer(cell) && cell.isContainerSwimLane && (cell.isContainerSwimLane === true || cell.isContainerSwimLane === 1);
    },

    hasAlternateStyle: function (cell) {
        if (cell && cell.alternateStyleEnabled && cell.alternateStyleEnabled === '1') {
            return true;
        }

        return false;
    },

    moveOnBoundsOnly: function (cell) {
        return inspectioUtils.isContainer(cell) || inspectioUtils.isLargeTextCard(cell);
    },

    isLargeTextCard: function (cell) {
        if(cell && cell.style && cell.style.startsWith(ispConst.TYPE_TEXT_CARD))  {
            return true;
        }

        return false;
    },

    isTextField: function (cell) {
        if(cell && cell.style && (cell.style.startsWith(ispConst.TYPE_TEXT_CARD) || cell.style.startsWith(ispConst.TYPE_FREE_TEXT)))  {
            return true;
        }

        return false;
    },

    isEdgeLabel: function (cell) {
        if(cell && cell.parent && cell.parent.isEdge()) {
            return true;
        }

        return  false;
    },

    isDrawingShape: function (cell) {
        if(inspectioUtils.isTextField(cell)) {
            return true;
        }

        if(cell && cell.style && (cell.style.startsWith(ispConst.TYPE_ICON))) {
            return true;
        }

        return false;
    },

    isContainerType: function (type) {
        return type === ispConst.TYPE_FEATURE || type === ispConst.TYPE_BC;
    },

    isChild: function (cell) {
        return cell.parent.getId() !== MXGRAPH_ROOT_UUIDS[0];
    },

    canBeChildOf: function (containerType, cell) {
        if(inspectioUtils.isChild(cell) && inspectioUtils.isEventModelHandle(cell)) {
            return false;
        }

        return true;
    },

    isGroup: function (cell) {
        return typeof cell['style'] !== 'undefined' && cell.style === "group";
    },

    isSticky: function (cell) {
        var cellType = inspectioUtils.getType(cell);

        return this.STICKY_TYPES.includes(cellType);
    },

    isUI: function (cell) {
        var cellType = inspectioUtils.getType(cell);

        return [ispConst.TYPE_UI, ispConst.TYPE_IMAGE].includes(cellType);
    },

    isOfType: function (cell, type) {
        if(cell === null || typeof cell === 'undefined') {
            return false;
        }

        if(!cell.isVertex()) {
            return false;
        }

        if(!mxUtils.isNode(cell.getValue())) {
            return false;
        }

        const cellType = cell.getValue().getAttribute('type');

        return cellType === type;
    },

    getType: function (cell) {
        if(cell === null || typeof cell === 'undefined') {
            return false;
        }

        if(!cell.isVertex()) {
            return false;
        }

        if(inspectioUtils.isTextField(cell)) {
            if(inspectioUtils.isLargeTextCard(cell)) {
                return ispConst.TYPE_TEXT_CARD;
            } else {
                return ispConst.TYPE_FREE_TEXT;
            }
        }

        if(!mxUtils.isNode(cell.getValue())) {
            return false;
        }

        return cell.getValue().getAttribute('type');
    },

    getColorForStickyType: function(type) {
        switch (type) {
            case ispConst.TYPE_EVENT:
                return ispConst.EVENT_COLOR;
            case ispConst.TYPE_COMMAND:
                return ispConst.COMMAND_COLOR;
            case ispConst.TYPE_ROLE:
                return ispConst.ROLE_COLOR;
            case ispConst.TYPE_AGGREGATE:
                return ispConst.AGGREGATE_COLOR;
            case ispConst.TYPE_DOCUMENT:
                return ispConst.DOCUMENT_COLOR;
            case ispConst.TYPE_POLICY:
                return ispConst.POLICY_COLOR;
            case ispConst.TYPE_HOT_SPOT:
                return ispConst.HOT_SPOT_COLOR;
            case ispConst.TYPE_EXTERNAL_SYSTEM:
                return ispConst.EXTERNAL_SYSTEM_COLOR;
            case ispConst.TYPE_UI:
                return ispConst.UI_COLOR;
            default:
                return ispConst.UI_COLOR;
        }
    },

    getIconImageSrcForStickyType: function(type, size) {
        const fill = encodeURIComponent(inspectioUtils.getColorForStickyType(type));

        if(!size) {
            size = '32';
        }

        return 'data:image/svg+xml,%3Csvg version=\'1.1\' id=\'Layer_1\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' x=\'0px\' y=\'0px\' width=\''+size+'px\' height=\''+size+'px\' viewBox=\'0 0 512 512\' fill=\''+fill+'\' style=\'enable-background:new 0 0 512 512;\' xml:space=\'preserve\'%3E %3Cpath d=\'M448 348.106V80c0-26.51-21.49-48-48-48H48C21.49 32 0 53.49 0 80v351.988c0 26.51 21.49 48 48 48h268.118a48 48 0 0 0 33.941-14.059l83.882-83.882A48 48 0 0 0 448 348.106zm-128 80v-76.118h76.118L320 428.106zM400 80v223.988H296c-13.255 0-24 10.745-24 24v104H48V80h352z\'/%3E %3C/svg%3E'
    },

    getTypeInclEdge: function (cell) {
        const type = inspectioUtils.getType(cell);

        if(type) {
            return type;
        }

        if(cell === null || typeof cell === 'undefined') {
            return false;
        }

        if(cell.isEdge()) {
            return 'edge';
        }

        if(cell.parent && cell.parent.isEdge()) {
            return 'edge';
        }

        return  false;
    },

    getEdgeStyle: function (graph, source, target, style) {
        let sourceIsUI = false;
        let targetIsUI = false;

        if(typeof source !== "undefined" && typeof target !== "undefined") {
            if(inspectioUtils.isUI(source) || ((inspectioUtils.isTextField(source) || inspectioUtils.isIcon(source)) && inspectioUtils.isUI(graph.model.getParent(source)))) {
                sourceIsUI = true;
            }

            if(inspectioUtils.isUI(target) || ((inspectioUtils.isTextField(target) || inspectioUtils.isIcon(target)) && inspectioUtils.isUI(graph.model.getParent(target)))) {
                targetIsUI = true;
            }

            if(sourceIsUI && targetIsUI) {
                return mxUtils.setStyle(style, 'dashed', '1');
            } else if (sourceIsUI) {
                const targetType = inspectioUtils.getType(target);

                if(targetType === ispConst.TYPE_COMMAND) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.COMMAND_COLOR);
                }
            } else if (targetIsUI) {
                const sourceType = inspectioUtils.getType(source);

                if(sourceType === ispConst.TYPE_DOCUMENT) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.DOCUMENT_COLOR);
                }
            } else {
                const sType = inspectioUtils.getType(source);
                const tType = inspectioUtils.getType(target);

                if(sType === ispConst.TYPE_COMMAND && tType === ispConst.TYPE_EVENT) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.COMMAND_COLOR);
                }

                if(sType === ispConst.TYPE_COMMAND && tType === ispConst.TYPE_EXTERNAL_SYSTEM) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.COMMAND_COLOR);
                }

                if(sType === ispConst.TYPE_EVENT && tType === ispConst.TYPE_DOCUMENT) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.EVENT_COLOR);
                }

                if(sType === ispConst.TYPE_EVENT && tType === ispConst.TYPE_POLICY) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.EVENT_COLOR);
                }

                if(sType === ispConst.TYPE_POLICY && tType === ispConst.TYPE_COMMAND) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.COMMAND_COLOR);
                }

                if(sType === ispConst.TYPE_DOCUMENT && tType === ispConst.TYPE_COMMAND) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.DOCUMENT_COLOR);
                }

                if(sType === ispConst.TYPE_EXTERNAL_SYSTEM && tType === ispConst.TYPE_COMMAND) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.DOCUMENT_COLOR);
                }

                if(sType === ispConst.TYPE_DOCUMENT && tType === ispConst.TYPE_POLICY) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.DOCUMENT_COLOR);
                }

                if(sType === ispConst.TYPE_ICON && tType === ispConst.TYPE_DOCUMENT) {
                    return  mxUtils.setStyle(style, 'strokeColor', ispConst.DOCUMENT_COLOR);
                }
            }

        }

        return style;
    },

    getLabelText: function (cell) {
        if(cell === null || typeof cell === 'undefined') {
            return '';
        }

        var div = document.createElement('div');

        if(inspectioUtils.isTextField(cell)) {
            var textVal = cell.getValue();

            if(typeof textVal === 'string') {
                div.innerHTML = cell.getValue();
            } else if(textVal && textVal.getAttribute) {
                div.innerHTML = textVal.getAttribute('label');
            } else {
                div.innerHTML = '';
            }
        } else {
            if(!mxUtils.isNode(cell.getValue())) {
                var val = cell.getValue();

                if(!val) {
                    if(cell.isEdge() && cell.children && cell.children.length === 1) {
                        return inspectioUtils.getLabelText(cell.children[0]);
                    }

                    return '';
                }

                div.innerHTML = cell.getValue();
            } else {
                div.innerHTML = cell.getValue().getAttribute('label');
            }
        }

        var hrPos = div.innerHTML.toLowerCase().search(/<hr[^>]*>/);

        if(hrPos !== -1) {
            div.innerHTML = div.innerHTML.substr(0, hrPos);
        }

        var text = mxUtils.extractTextWithWhitespace([div]);

        if(!text) {
            return '';
        }

        return text.replace(/\s{2,}/, ' ');
    },

    getLabelSecondaryText: function (cell) {
        if(cell === null || typeof cell === 'undefined') {
            return '';
        }

        var div = document.createElement('div');

        if(inspectioUtils.isTextField(cell)) {
            var textVal = cell.getValue();

            if(typeof textVal === 'string') {
                div.innerHTML = cell.getValue();
            } else if(textVal && textVal.getAttribute) {
                div.innerHTML = textVal.getAttribute('label');
            } else {
                div.innerHTML = '';
            }
        } else {
            if(!mxUtils.isNode(cell.getValue())) {
                var val = cell.getValue();

                if(!val) {
                    if(cell.isEdge() && cell.children && cell.children.length === 1) {
                        return inspectioUtils.getLabelText(cell.children[0]);
                    }

                    return '';
                }

                div.innerHTML = cell.getValue();
            } else {
                div.innerHTML = cell.getValue().getAttribute('label');
            }
        }

        var hrPos = div.innerHTML.toLowerCase().search(/<hr[^>]*>/);

        if(hrPos === -1) {
            return '';
        }

        var match = div.innerHTML.toLowerCase().match(/(<hr[^>]*>)/);

        div.innerHTML = div.innerHTML.substr(hrPos + match[1].length);

        var text = mxUtils.extractTextWithWhitespace([div]);

        if(!text) {
            return '';
        }

        if(text.charAt(0) === '\n') {
            text = text.slice(1);
        }

        return text;
    },

    getPascalCaseLabel: function (cell) {
        var label = inspectioUtils.getLabelText(cell);

        return label.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
            return word.toUpperCase();
        }).replace(/\s+/g, '');
    },

    getMetadata: function (cell) {
        if(cell === null || typeof cell === 'undefined') {
            return undefined;
        }

        if(inspectioUtils.isTextField(cell)) {
            var textVal = cell.getValue();

            if(textVal && typeof textVal !== 'string' && textVal.hasAttribute && textVal.getAttribute) {
                return textVal.hasAttribute('metadata') ? textVal.getAttribute('metadata') : undefined;
            }
        }

        if(inspectioUtils.isTextField(cell)
            || !cell.isVertex()
            || !mxUtils.isNode(cell.getValue())) {
            return undefined;
        }

        if(cell.isEdge()) {
            if(cell.children && cell.children.length === 1) {
                return inspectioUtils.getMetadata(cell.children[0]);
            }

            return undefined;
        }

        return cell.value.hasAttribute('metadata') ? cell.value.getAttribute('metadata') : undefined;
    },

    metadataToJSON: function (metadata) {
        if(!metadata) {
            return {};
        }

        try {
            return JSON.parse(metadata);
        } catch (e) {
            return {};
        }
    },

    metadataJsonToString: function (metadata) {
        if(!metadata) {
            return "{}";
        }

        return JSON.stringify(metadata, null, 2);
    },

    setMetadata: function (cell, metadata, graph) {
        if(cell) {
            graph.model.beginUpdate();
            try {
                graph.setAttributeForCell(cell, 'metadata', metadata);
                const cellState = graph.getCellState(cell);
                graph.cellRenderer.redraw(cellState, false, true);
            } catch (e) {
                console.error(e);
            } finally {
                graph.model.endUpdate();
            }
        }
    },

    setLaneLabelId: function (cell, labelId, graph) {
        graph.model.beginUpdate();
        try {
            graph.setAttributeForCell(cell, 'lanelabelid', labelId);
            const cellState = graph.getCellState(cell);
            graph.cellRenderer.redraw(cellState, false, true);
        } catch (e) {
            console.error(e);
        } finally {
            graph.model.endUpdate();
        }
    },

    getLaneLabelId: function(cell) {
        if(inspectioUtils.isLaneLabelWatermark(cell)) {
            return cell.value.hasAttribute('lanelabelid') ? cell.value.getAttribute('lanelabelid') : undefined;
        }
    },

    joinLabelParts: function(label, secondaryText) {
        if(secondaryText) {
            label = label + "<hr />" + secondaryText;
        }

        return label;
    },

    createCellXmlValue: function (cellType, label, secondaryText, metadata, attributes) {
        if(secondaryText) {
            label = label + "<hr />" + secondaryText;
        }

        if(!attributes) {
            attributes = {};
        }

        let doc = mxUtils.createXmlDocument();
        let node = doc.createElement(cellType);
        node.setAttribute('label', label);
        node.setAttribute('type', cellType);
        node.setAttribute('metadata', metadata || '');

        for(const attrName in attributes) {
            if(attributes.hasOwnProperty(attrName)) {
                node.setAttribute(attrName, attributes[attrName])
            }
        }

        return node;
    },

    syncAlternateBounds: function (cell) {
        let geometry = cell.getGeometry();
        geometry.alternateBounds = new mxRectangle(
            geometry.x, geometry.y, geometry.width, geometry.height);
        cell.setGeometry(geometry);
    },

    initContainer: function(container, graph, doNotAssignNewId) {
        inspectioUtils.syncAlternateBounds(container);
        const orgStyle = graph.getStylesheet().getCellStyle(container.getStyle());
        let alternateStyle = mxUtils.setStyle(container.getStyle(), 'verticalAlign', orgStyle['alternateVerticalAlign']);
        alternateStyle = mxUtils.setStyle(alternateStyle, 'fontSize', orgStyle['alternateFontSize']);

        if(orgStyle['alternateFillColor']) {
            alternateStyle = mxUtils.setStyle(alternateStyle, 'fillColor', orgStyle['alternateFillColor']);
        }
        container.alternateStyle = alternateStyle;
        container.originalStyle = container.getStyle();
        if(!doNotAssignNewId) {
            container.setId(graph.model.createId());
        }
        graph.orderCells(true, [container]);
    },

    isMouseNearCellBounds: function (me, bounds) {
        const mouseX = me.graphX;
        const mouseY = me.graphY;


        const tol = 40;

        if(mouseX >= bounds.x - tol && mouseX < bounds.x + tol) {
            return true;
        }

        if(mouseX >= (bounds.x + bounds.width) - tol && mouseX < (bounds.x + bounds.width) + tol) {
            return true;
        }

        if(mouseY >= bounds.y - tol && mouseY < bounds.y + tol) {
            return true;
        }

        if(mouseY >= (bounds.y + bounds.height)  - tol && mouseY < (bounds.y + bounds.height)  + tol) {
            return true;
        }

        return false;
    },

    isHeadingTag: function (tagName) {
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

        return headings.includes(tagName.toLowerCase());
    },

    getTags: function (cell) {
        if(cell === null || typeof cell === 'undefined') {
            return [];
        }

        if(!cell.isVertex()) {
            return [];
        }

        if(!mxUtils.isNode(cell.getValue())) {
            return [];
        }

        if(!cell.getValue().hasAttribute(ispConst.TAGS_ATTR)) {
            return [];
        }

        var tags = cell.getValue().getAttribute(ispConst.TAGS_ATTR);

        if(typeof tags === "string") {
            return tags.split(",");
        }

        return tags;
    },

    hasTag: function (cell, tag) {
        var tags = inspectioUtils.getTags(cell);
        return tags.includes(tag);
    },

    addTag: function (cell, tag, graph) {
        var tags = inspectioUtils.getTags(cell);

        if(!tags.includes(tag)) {
            tags.push(tag);
            graph.setAttributeForCell(cell, ispConst.TAGS_ATTR, tags);
        }
    },

    removeTag: function (cell, tag, graph) {
        var tags = inspectioUtils.getTags(cell);

        if(tags.includes(tag)) {
            var newTags = [];

            tags.forEach(function (existingTag) {
                if(existingTag !== tag) {
                    newTags.push(existingTag);
                }
            });

            graph.setAttributeForCell(cell, ispConst.TAGS_ATTR, newTags);
        }
    },

    removeAndAddTags: function (cell, tagsToRemove, tagsToAdd, graph) {
        var tags = inspectioUtils.getTags(cell);

        var newTags = [];

        tags.forEach(function (existingTag) {
            if(!tagsToRemove.includes(existingTag)) {
                newTags.push(existingTag);
            }
        });

        newTags.push(...tagsToAdd);

        graph.setAttributeForCell(cell, ispConst.TAGS_ATTR, newTags);
    },

    replaceTags: function(cell, tags, graph) {
        graph.setAttributeForCell(cell, ispConst.TAGS_ATTR, tags);
    },

    parseTags: function (str, keepCase) {
        str = str.replaceAll(/=".*(#\w+)"/gm, '');
        let result;
        const tags = [];
        const reg = /([^\w]|^)#(?<tag>\w+)/gm;
        while(result = reg.exec(str)) {
            if(keepCase) {
                tags.push(result.groups.tag);
            } else {
                tags.push(result.groups.tag.toLowerCase());
            }
        }

        return tags;
    },

    require: function (file, cb) {
            const script = document.getElementsByTagName('script')[0],
                newjs = document.createElement('script');

            // IE
            newjs.onreadystatechange = function () {
                if (newjs.readyState === 'complete') {
                    cb();
                }
            };

            // others
            newjs.onload = function () {
                cb();
            };

            newjs.src = file;
            script.parentNode.insertBefore(newjs, script);
    },
    getIconColor: function (iconStyle) {
        const defaultColor = '#000000';

        if(typeof iconStyle !== 'object') {
            return defaultColor;
        }

        if(typeof iconStyle['image'] !== 'string') {
            return defaultColor;
        }

        const match = iconStyle['image'].match(/style="fill:(?<color>#[A-Fa-f0-9]{6,6})"/);

        if(!match) {
            return defaultColor;
        }

        return match.groups.color;
    },
    setIconColor: function (iconStyleStr, color) {
        if(typeof iconStyleStr !== 'string') {
            return iconStyleStr;
        }
        if(iconStyleStr === 'icon') {
            // default icon
            return mxUtils.setStyle(iconStyleStr, 'image', `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" style="fill:${color}" viewBox="0 0 512 512"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"/></svg>`);
        }

        if(!iconStyleStr.match(/style="fill:(?<color>#[A-Fa-f0-9]{6,6})"/)) {
            iconStyleStr = iconStyleStr.replace("<svg ", `<svg style="fill:${color}" `);
        } else {
            iconStyleStr = iconStyleStr.replace(/style="fill:#[A-Fa-f0-9]{6,6}"/, `style="fill:${color}"`);
        }

        return iconStyleStr;
    },
    //Taken from Stack Overvlow: https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    pSBC:(p,c0,c1,l)=>{
        let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
        if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
        if(!this.pSBCr)this.pSBCr=(d)=>{
            let n=d.length,x={};
            if(n>9){
                [r,g,b,a]=d=d.split(","),n=d.length;
                if(n<3||n>4)return null;
                x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
            }else{
                if(n==8||n==6||n<4)return null;
                if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
                d=i(d.slice(1),16);
                if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
                else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
            }return x};
        h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
        if(!f||!t)return null;
        if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
        else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
        a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
        if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
        else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
    },
    wrapSelectedTextNodes: (tag, style) => {
        inspectioUtils.getSelectedTextNodes().forEach((selection, index) => {
            selection.forEach((textNode, nodeNumber) => {
                let newTag = document.createElement(tag);

                for (const styleKey in style) {
                    newTag.style[styleKey] = style[styleKey];
                }

                textNode.before(newTag);
                newTag.appendChild(textNode);
            });
        });
    },
    getSelectedTextNodes: () => {
        let returnArray = new Array();
        let selection = window.getSelection();
        for (let rangeNumber = selection.rangeCount-1; rangeNumber >= 0; rangeNumber--) {
            let rangeNodes = new Array();
            let range = selection.getRangeAt(rangeNumber);
            if (range.startContainer === range.endContainer && range.endContainer.nodeType === Node.TEXT_NODE) {
                range.startContainer.splitText(range.endOffset);
                let textNode = range.startContainer.splitText(range.startOffset);
                rangeNodes.push(textNode);
            } else {
                let textIterator = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, (node) => (node.compareDocumentPosition(range.startContainer)==Node.DOCUMENT_POSITION_PRECEDING && node.compareDocumentPosition(range.endContainer)==Node.DOCUMENT_POSITION_FOLLOWING) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT );
                while (node = textIterator.nextNode()) { if (node.textContent.trim()!="") rangeNodes.push(node);}
                if (range.endContainer.nodeType === Node.TEXT_NODE) {
                    range.endContainer.splitText(range.endOffset);
                    rangeNodes.push(range.endContainer);
                }
                if (range.startContainer.nodeType === Node.TEXT_NODE) {
                    rangeNodes.unshift(range.startContainer.splitText(range.startOffset));
                }
            }
            returnArray.unshift(rangeNodes);
        }
        return returnArray;
    }
};
