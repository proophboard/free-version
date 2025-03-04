/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
/**
 * Constructs the actions object for the given UI.
 */
function Actions(editorUi)
{
	this.editorUi = editorUi;
	this.actions = new Object();
	this.init();
	var color = '#f7f727';
};

/**
 * Adds the default actions.
 */
Actions.prototype.init = function()
{
	var ui = this.editorUi;
	var editor = ui.editor;
	var graph = editor.graph;
	var isGraphEnabled = function()
	{
		return Action.prototype.isEnabled.apply(this, arguments) && graph.isEnabled();
	};

	// File actions
	this.addAction('new...', function() { graph.openLink(ui.getUrl()); });
	this.addAction('open...', function()
	{
		window.openNew = true;
		window.openKey = 'open';

		ui.openFile();
	});
	this.addAction('import...', function()
	{
		window.openNew = false;
		window.openKey = 'import';

		// Closes dialog after open
		window.openFile = new OpenFile(mxUtils.bind(this, function()
		{
			ui.hideDialog();
		}));

		window.openFile.setConsumer(mxUtils.bind(this, function(xml, filename)
		{
			try
			{
				var doc = mxUtils.parseXml(xml);
				editor.graph.setSelectionCells(editor.graph.importGraphModel(doc.documentElement));
			}
			catch (e)
			{
				mxUtils.alert(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
			}
		}));

		// Removes openFile if dialog is closed
		ui.showDialog(new OpenDialog(this).container, 320, 220, true, true, function()
		{
			window.openFile = null;
		});
	}).isEnabled = isGraphEnabled;
	this.addAction('import', (cb) => {

		if(!cb) {
			cb = () => {};
		}


	    /*
	    Import behaviour changed with layer support! All layers are imported now!
	    const canImportCell = (cell) => {
            if(!cell.getId()) {
                return true;
            }

            const extistingCell = this.editorUi.editor.graph.model.getCell(cell.getId());

            return extistingCell === undefined;
        };

	    const getImportableCells = (cells) => {
            return this.editorUi.editor.graph.model.filterCells(cells, canImportCell);
        };*/

		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		mxEvent.addListener(fileInput, 'change', (e) => {
			const file = e.target.files[0] || null;

			if(file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const xml = this.editorUi.editor.graph.zapGremlins(e.target.result);

					let error = null;

					this.editorUi.editor.graph.model.beginUpdate();
					try {
                        var doc = mxUtils.parseXml(xml);

                        this.editorUi.editor.graph.setSelectionCells(
                        	this.editorUi.editor.graph.importGraphModel(doc.documentElement)
						);
						this.editorUi.editor.graph.setDefaultParent(this.editorUi.editor.graph.model.getCell(MXGRAPH_ROOT_UUIDS[0]));
                        this.editorUi.editor.graph.zoom(0.2 / this.editorUi.editor.graph.currentScale, true);
					} catch (e) {
						error = e;
                    } finally {
						this.editorUi.editor.graph.model.endUpdate();
                    }

                    if(error) {
						mxUtils.alert(error);
					} else {
                    	cb(this.editorUi.editor.graph);
					}
				}
				reader.readAsText(file);
			}
		});
		fileInput.click();
	});
	this.addAction('export', () => {
		const xml = mxUtils.getPrettyXml(this.editorUi.editor.getGraphXml());

        const blob = new Blob([xml], {type: 'application/xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.download = this.editorUi.getBoardName() + '.xml';
        a.href = url;
        a.click();
	}, true, undefined, Editor.ctrlKey + '+S');
	this.addAction('editDiagram...', function()
	{
		var dlg = new EditDiagramDialog(ui);
		ui.showDialog(dlg.container, 620, 420, true, false);
		dlg.init();
	});
	this.addAction('pageSetup...', function() { ui.showDialog(new PageSetupDialog(ui).container, 320, 220, true, true); }).isEnabled = isGraphEnabled;
	this.addAction('print...', function() { ui.showDialog(new PrintDialog(ui).container, 300, 180, true, true); }, null, 'sprite-print', Editor.ctrlKey + '+P');
	this.addAction('preview', function() { mxUtils.show(graph, null, 10, 10); });

	// Edit actions
	this.addAction('undo', function() { ui.undo(); }, null, 'sprite-undo', Editor.ctrlKey + '+Z');
	this.addAction('redo', function() { ui.redo(); }, null, 'sprite-redo', (!mxClient.IS_WIN) ? Editor.ctrlKey + '+Shift+Z' : Editor.ctrlKey + '+Y');
	this.addAction('cut', function() { mxClipboard.cut(graph); }, null, 'sprite-cut', Editor.ctrlKey + '+X');
	this.addAction('copy', function() { mxClipboard.copy(graph); }, null, 'sprite-copy', Editor.ctrlKey + '+C');
	this.addAction('paste', function()
	{
		if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
		{
			mxClipboard.paste(graph);
		}
	}, false, 'sprite-paste', Editor.ctrlKey + '+V');
	this.addAction('pasteGraphCenter', function(evt)
	{
		var targetContainer = graph.getSelectionCell();

		if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
		{
			mxClipboard.paste(graph, undefined, undefined, true).then(cells => {
				graph.getModel().beginUpdate();
				try
				{
					if (cells != null)
					{
						var t = graph.view.translate;
						var s = graph.view.scale;
						var dx = -t.x * s;
						var dy = -t.y * s;
						var geo = null;

						console.log("org x y", dx, dy);
						console.log("scale", s);

						if(cells.length > 0) {
							var firstCell = cells[0];

							geo = firstCell.getGeometry();
						}

						if(geo != null) {
							var x = Math.round(graph.snap((dx + graph.container.clientWidth/2)));
							var y = Math.round(graph.snap((dy + graph.container.clientHeight/2)));

							console.log("center", x, y);

							graph.cellsMoved(cells, (x/s) - geo.x, (y/s) - geo.y);
						}

					}
				}
				finally
				{
					graph.getModel().endUpdate();
				}

				if(cells && targetContainer && inspectioUtils.isContainer(targetContainer)) {
					graph.syncOverlappingChildrenToContainer(targetContainer);

					// Check if all cells were pasted in container or some on parent
					var allCellsInTarget = true;
					cells.forEach((cell) => {
						if(cell.parent.getId() !== targetContainer.getId()) {
							allCellsInTarget = false;
						}
					});

					if(!allCellsInTarget && inspectioUtils.isContainer(targetContainer.parent)) {
						graph.syncOverlappingChildrenToContainer(targetContainer.parent);
					}
				}
			})
		}
	});
	this.addAction('pasteHere', function(evt)
	{
		var targetContainer = graph.getSelectionCell();

		if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
		{
			mxClipboard.paste(graph, undefined, undefined, true).then(cells => {
				graph.getModel().beginUpdate();
				try {
					if (cells != null)
					{
						var includeEdges = true;

						for (var i = 0; i < cells.length && includeEdges; i++)
						{
							includeEdges = includeEdges && graph.model.isEdge(cells[i]);
						}

						var t = graph.view.translate;
						var s = graph.view.scale;
						var dx = t.x;
						var dy = t.y;
						var bb = null;

						if (cells.length == 1 && includeEdges)
						{
							var geo = graph.getCellGeometry(cells[0]);

							if (geo != null)
							{
								bb = geo.getTerminalPoint(true);
							}
						}

						bb = (bb != null) ? bb : graph.getBoundingBoxFromGeometry(cells, includeEdges);

						if (bb != null)
						{
							var x = Math.round(graph.snap(graph.popupMenuHandler.triggerX / s - dx));
							var y = Math.round(graph.snap(graph.popupMenuHandler.triggerY / s - dy));

							graph.cellsMoved(cells, x - bb.x, y - bb.y);
						}
					}
				} finally
				{
					graph.getModel().endUpdate();
				}

				if(cells && targetContainer && inspectioUtils.isContainer(targetContainer)) {
					graph.syncOverlappingChildrenToContainer(targetContainer);

					// Check if all cells were pasted in container or some on parent
					var allCellsInTarget = true;
					cells.forEach((cell) => {
						if(cell.parent.getId() !== targetContainer.getId()) {
							allCellsInTarget = false;
						}
					});

					if(!allCellsInTarget && inspectioUtils.isContainer(targetContainer.parent)) {
						graph.syncOverlappingChildrenToContainer(targetContainer.parent);
					}

					if(inspectioUtils.isEventModel(targetContainer)) {
						graph.repositionLanes([targetContainer]);
					}
				}
			})
		}
	});

	this.addAction('copySize', function(evt)
	{
		var cell = graph.getSelectionCell();

		if (graph.isEnabled() && cell != null && graph.getModel().isVertex(cell))
		{
			var geo = graph.getCellGeometry(cell);

			if (geo != null)
			{
				ui.copiedSize = new mxRectangle(geo.x, geo.y, geo.width, geo.height);
			}
		}
	}, null, null, 'Alt+Shit+X');

	this.addAction('pasteSize', function(evt)
	{
		if (graph.isEnabled() && !graph.isSelectionEmpty() && ui.copiedSize != null)
		{
			graph.getModel().beginUpdate();

			try
			{
				var cells = graph.getSelectionCells();

				for (var i = 0; i < cells.length; i++)
				{
					if (graph.getModel().isVertex(cells[i]))
					{
						var geo = graph.getCellGeometry(cells[i]);

						if (geo != null)
						{
							geo = geo.clone();
							geo.width = ui.copiedSize.width;
							geo.height = ui.copiedSize.height;

							graph.getModel().setGeometry(cells[i], geo);
						}
					}
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}
	}, null, null, 'Alt+Shit+V');

	function deleteCells(includeEdges)
	{
		// Cancels interactive operations
		graph.escape();

		var cells = graph.getDeletableCells(graph.getSelectionCells());

		if (cells != null && cells.length > 0)
		{
			graph.removeCells(cells, true /* always delete connected edges */);
		}
	};

	this.addAction('delete', function(evt)
	{
		deleteCells(evt != null && mxEvent.isShiftDown(evt));
	}, null, null, 'Delete');
	this.addAction('deleteAll', function()
	{
		deleteCells(true);
	}, null, null, Editor.ctrlKey + '+Delete');
	this.addAction('duplicate', function()
	{
		graph.setSelectionCells(graph.duplicateCells());
	}, null, null, Editor.ctrlKey + '+D');
	this.put('turn', new Action(mxResources.get('turn') + ' / ' + mxResources.get('reverse'), function()
	{
		graph.turnShapes(graph.getSelectionCells());
	}, null, null, Editor.ctrlKey + '+R'));
	this.addAction('selectVertices', function() { graph.selectVertices(); }, null, null, Editor.ctrlKey + '+Shift+I');
	this.addAction('selectEdges', function() { graph.selectEdges(); }, null, null, Editor.ctrlKey + '+Shift+E');
	this.addAction('selectAll', function() { graph.selectAll(null, true); }, null, null, Editor.ctrlKey + '+A');
	this.addAction('selectNone', function() { graph.clearSelection(); }, null, null, Editor.ctrlKey + '+Shift+A');
	this.addAction('lockUnlock', function()
	{
		if (!graph.isSelectionEmpty())
		{
			graph.getModel().beginUpdate();
			try
			{
				var defaultValue = graph.isCellMovable(graph.getSelectionCell()) ? 1 : 0;
				graph.toggleCellStyles(mxConstants.STYLE_MOVABLE, defaultValue);
				graph.toggleCellStyles(mxConstants.STYLE_RESIZABLE, defaultValue);
				graph.toggleCellStyles(mxConstants.STYLE_ROTATABLE, defaultValue);
				graph.toggleCellStyles(mxConstants.STYLE_DELETABLE, defaultValue);
				graph.toggleCellStyles(mxConstants.STYLE_EDITABLE, defaultValue);
				graph.toggleCellStyles('connectable', defaultValue);
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}
	}, null, null, Editor.ctrlKey + '+L');

	//Event Model
	this.addAction('make_space_in_event_model', function () {
		const startingCell = graph.getSelectionCell();

		if(startingCell && inspectioUtils.isEventModel(startingCell.parent)) {
			const em = startingCell.parent;

			const hasSameEventModelRoot = (cell) => {
				while(cell.parent) {
					if(cell.parent === em) {
						return true;
					}

					cell = cell.parent;
				}

				return false;
			}

			const childrenToMove = graph.model.getChildren(em)
				.filter(c => c.getGeometry().x > startingCell.getGeometry().x)
				.filter(c => !inspectioUtils.isLaneLabelWatermark(c));

			let edgesToMove = [];
			let edgesToReset = [];

			childrenToMove.forEach(c => {
				if(c.edges && c.edges.length > 0) {
					edgesToMove.push(...c.edges);
				}



				graph.model.filterDescendants((subChild) => {
					if(subChild.edges && subChild.edges.length > 0) {
						subChild.edges.forEach(edge => {
							if(hasSameEventModelRoot(edge.source) && hasSameEventModelRoot(edge.target)) {
								edgesToMove.push(edge);
							} else {
								edgesToReset.push(edge);
							}
						})
					}

					return false;
				}, c);
			})

			edgesToMove = new Set(edgesToMove);
			edgesToReset = new Set(edgesToReset);

			const newSliceBounds = new mxRectangle(
				em.getGeometry().x,
				em.getGeometry().y,
				em.getGeometry().width + ispConst.LANE_WATERMARK_DISTANCE,
				em.getGeometry().height
			);

			childrenToMove.push(startingCell);

			graph.model.beginUpdate();

			try {
				graph.resizeCell(em, newSliceBounds);
				graph.moveCells([...edgesToMove, ...childrenToMove], ispConst.LANE_WATERMARK_DISTANCE, 0);
				graph.installLaneLabelWatermarks(em);

				edgesToReset.forEach(edge => {
					var geo = graph.getCellGeometry(edge);

					if (geo != null)
					{
						geo = geo.clone();
						geo.points = null;
						graph.getModel().setGeometry(edge, geo);
					}
				})

			} finally {
				graph.model.endUpdate();
			}
		}
	});

	// Video Avatar actions
	this.addAction('centerVideoAvatar', function() { graph.centerVideoAvatar(); });
	this.addAction('moveVideoAvatarHere', function() {
		var point = graph.translateMousePoint(graph.popupMenuHandler.triggerX, graph.popupMenuHandler.triggerY);
		graph.moveVideoAvatarToPosition(point.x, point.y);
	})

	// Navigation actions
	this.addAction('home', function() { graph.home(); }, null, null, 'Home');
	this.addAction('exitGroup', function() { graph.exitGroup(); }, null, null, Editor.ctrlKey + '+Shift+Home');
	this.addAction('enterGroup', function() { graph.enterGroup(); }, null, null, Editor.ctrlKey + '+Shift+End');
	this.addAction('collapse', function() { graph.foldCells(true); }, null, null, Editor.ctrlKey + '+Home');
	this.addAction('expand', function() { graph.foldCells(false); }, null, null, Editor.ctrlKey + '+End');

	// Go to previous graph position
	this.addAction('previousGraphPosition', function () {
		graph.goToPreviousPosition();
	}, null, null, Editor.ctrlKey + '+Shift+Backspace')

	// Deeplink
	this.addAction('deeplink', function () {
		var cells = graph.getSelectionCells();

		if(cells && graph.canCopyToClipboard) {
			var cellIds = [];

			cells.forEach(function (cell) {
				cellIds.push(cell.getId());
			})

			var cellStr = cellIds.join(";");

			graph.copyToClipboard(graph.deeplinkFactory(cellStr));

			if(graph.canNotify()) {
				graph.notify('Link copied to clipboard', '', 'info');
			}
		}
	}, null, null, null);

	//Open in Cockpit
	this.addAction('cockpit', function () {
		var cell = graph.getSelectionCell();

		if(cell && graph.hasCockpitBaseUrl()) {
			var element = inspectioUtils.getPascalCaseLabel(cell);
			var path = '';

			switch (inspectioUtils.getType(cell)) {
				case ispConst.TYPE_AGGREGATE:
					path = '#/aggregates/';
					element = element.toLowerCase();
					break;
				case ispConst.TYPE_COMMAND:
					path = '#/commands/';
					break;
				case ispConst.TYPE_EVENT:
					path = '#/events/';
					break;
				case ispConst.TYPE_DOCUMENT:
					path = '#/queries/';
					break;
			}

			if(path === '') {
				element = '';
			}

			window.open(`${graph.getCockpitBaseUrl()}${path}${element}`, 'cockpit', 'menubar=0,resizable=1,width=1200,height=800', true);
		}
	});

	this.addAction('linkboard', function () {
		var graph = ui.editor.graph;

		if(graph.linkBoardListener && graph.isEnabled()) {
			var cells = graph.getSelectionCells();

			if(cells && cells.length > 0) {
				var cell = cells[0];
				var currentLink = null;
				var cellState = graph.view.getState(cell);

				if(cellState && cellState.text && cellState.text.node) {
					var links = cellState.text.node.getElementsByTagName('a');

					if(links && links.length > 0) {
						currentLink = links[0].href;
					}
				}

				graph.linkBoardListener(currentLink, (boardLink) => {
					graph.setLinkForCell(cell, boardLink);
					var cellState = graph.view.getState(cell);

					if(cellState && cellState.text && cellState.text.node) {
						var tempDiv = document.createElement('div');
						tempDiv.innerHTML = cell.getAttribute('label');

						var links = tempDiv.getElementsByClassName('boarditem');
						var aTag = document.createElement('a');

						if(links && links.length > 0) {
							links[0].remove();
						}

						if(boardLink !== '') {
							var iTag = document.createElement('i');
							iTag.classList.add('small', 'icon', 'arrow', 'alternate', 'circle', 'right', 'outline');
							aTag.innerHTML = "&nbsp;" + iTag.outerHTML;

							aTag.href = boardLink;

							const orgStyle = graph.getStylesheet().getCellStyle(cell.getStyle());
							aTag.style.fontSize = orgStyle['fontSize'] + "px";
							aTag.classList.add('boarditem');

							tempDiv.append(aTag);
						}

						graph.model.beginUpdate();
						try {
							graph.labelChanged(cell, tempDiv.innerHTML);
						} finally {
							graph.model.endUpdate();
						}
					}
				});
			}
		}
	});

	this.addAction('codywizard', function () {
		var graph = ui.editor.graph;

		if(!graph.isEnabled() || !graph.codyWizardListener) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			graph.codyWizardListener(cells[0]);
		}
	}, null, null, Editor.ctrlKey + '+H');

	this.addAction('codywizard_run', function () {
		var graph = ui.editor.graph;

		if(!graph.isEnabled() || !graph.codyWizardListener) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			graph.codyWizardListener(cells[0], true);
		}
	});

	this.addAction('linktask', function () {
		var graph = ui.editor.graph;

		if (!graph.isEnabled() || !graph.linkTaskListener) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			var cell = cells[0];
		}

		var currentLink = graph.getFeatureTaskLink(cell);

		graph.linkTaskListener(currentLink, mxUtils.bind(this, function(value) {
			graph.setFeatureTaskLink(cell, value);
		}));
	});

	this.addAction('show_container_details', function() {
		var graph = ui.editor.graph;

		if (!graph.isEnabled()) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			var cell = cells[0];
		}

		if(inspectioUtils.isContainer(cell)) {
			graph.showContainerDetails(cell);
		}
	})

	this.addAction('hide_container_details', function() {
		var graph = ui.editor.graph;

		if (!graph.isEnabled()) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			var cell = cells[0];
		}

		if(inspectioUtils.isContainer(cell)) {
			graph.hideContainerDetails(cell);
		}
	})

	this.addAction('toggleswimlane', function() {
		var graph = ui.editor.graph;

		if (!graph.isEnabled() || !graph.linkTaskListener) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			var cell = cells[0];
		}

		if(inspectioUtils.isContainer(cell)) {
			graph.model.beginUpdate();
			try {
				graph.model.execute(new mxContainerSwimLaneChange(cell, ! (cell.isContainerSwimLane || false)));
			} catch (e) {
				console.error(e);
			} finally {
				graph.model.endUpdate();
			}
		}
	});

	this.addAction('change_default_event_model', function() {
		var graph = ui.editor.graph;

		if (!graph.isEnabled() || !graph.linkTaskListener) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			var cell = cells[0];
			graph.changeDefaultEventModel(cell);
		}
	});

	this.addAction('sync_slice_lanes', function() {
		var graph = ui.editor.graph;

		if (!graph.isEnabled() || !graph.linkTaskListener) {
			return;
		}

		var cells = graph.getSelectionCells();

		if(cells && cells.length > 0) {
			var cell = cells[0];
			graph.syncEventModelLanes(cell);
		}
	});

	this.addAction('sync_lanes_from_default_event_model', function() {
		var graph = ui.editor.graph;

		if (!graph.isEnabled() || !graph.linkTaskListener) {
			return;
		}

		const defaultEventModel = graph.getDefaultEventModel();

		if(!defaultEventModel) {
			return;
		}

		var cells = graph.getSelectionCells().filter(c => inspectioUtils.isEventModel(c));

		graph.syncEventModelLanes(defaultEventModel, cells);
	})

	var isDataUrl = function (imageUrl) {
		return imageUrl.includes('data:image/');
	};

    this.addAction('replaceimage', function () {
        var graph = ui.editor.graph;

        if (!graph.isEnabled() || !graph.replaceImageListener) {
            return;
        }

        var cells = graph.getSelectionCells();

        if(cells && cells.length > 0) {
            var cell = cells[0];
        }

        var imageId = null;

        var cellState = graph.view.getState(cell);
        if(cellState && cellState.shape && cellState.shape.image && !isDataUrl('data:image/')) {
            imageId = cellState.shape.image.split('/').pop();
        }

        graph.replaceImageListener(imageId, (imgName, imageUrl) => {
        	let newImageUrl = imageUrl;

        	// Update the timestamp to prevent caching issues if we're dealing with an image URL
        	if (!isDataUrl('data:image/')) {
				newImageUrl = imageUrl.includes('?')
					? imageUrl.split('?')[0] + '?timestamp=' + Date.now()
					: imageUrl + '?timestamp=' + Date.now();
			}

            var styleWithNewImage = mxUtils.setStyle(cell.getStyle(), 'image', newImageUrl);
            graph.model.beginUpdate();
            try {
                graph.setCellStyle(styleWithNewImage, [cell]);
                graph.labelChanged(cell, imgName);
                const cellState = graph.getCellState(cell);
                graph.cellRenderer.redraw(cellState, false, true);
            } catch (e) {
                console.error(e);
            } finally {
                graph.model.endUpdate();
            }
		});
    });


	var toggleTags = [ispConst.TAG_IMPORTANT, ispConst.TAG_PLANNED, ispConst.TAG_READY, ispConst.TAG_DEPLOYED];

	// Tagging
	var setCellFillColorAndTag = function (cell, color, tag) {
		var hasAlternateStyle = graph.hasAlternateStyle(cell);
		graph.toggleAlternateStyle([cell], false);

		const tagsToRemove = toggleTags.filter(function (toggleTag) {
			return toggleTag !== tag;
		});

		const cellStyle = mxUtils.setStyle(cell.getStyle(), mxConstants.STYLE_FILLCOLOR, color);
		graph.model.beginUpdate();
		graph.setCellStyle(cellStyle, [cell]);
		graph.syncContainerStyles(cell, mxConstants.STYLE_FILLCOLOR, color);
		inspectioUtils.removeAndAddTags(cell, tagsToRemove, [tag], graph);
		graph.model.endUpdate();

		graph.toggleAlternateStyle([cell], hasAlternateStyle);

		graph.hideChildrenAfterStyleChange(cell, true);
	};

	var getContainerFillColor = function (cell) {
		if(inspectioUtils.hasTag(cell, ispConst.TAG_IMPORTANT)) {
			return ispConst.FILL_COLOR_TAG_IMPORTANT;
		}

		if(inspectioUtils.hasTag(cell, ispConst.TAG_DEPLOYED)) {
			if(inspectioUtils.isFeature(cell)) {
				return ispConst.FILL_COLOR_DEFAULT_FEATURE;
			}

			return ispConst.FILL_COLOR_DEFAULT_CONTEXT;
		}

		if(inspectioUtils.hasTag(cell, ispConst.TAG_READY)) {
			return ispConst.FILL_COLOR_TAG_READY;
		}

		if(inspectioUtils.hasTag(cell, ispConst.TAG_PLANNED)) {
			return ispConst.FILL_COLOR_TAG_PLANNED;
		}

		if(inspectioUtils.isFeature(cell)) {
			return ispConst.FILL_COLOR_DEFAULT_FEATURE;
		}

		return ispConst.FILL_COLOR_DEFAULT_CONTEXT;
	}

	var removeCellFillColorAndTag = function (cell, tag) {
		var hasAlternateStyle = graph.hasAlternateStyle(cell);
		graph.toggleAlternateStyle([cell], false);

		graph.model.beginUpdate();

		inspectioUtils.removeTag(cell, tag, graph);

		var color = getContainerFillColor(cell);

		const cellStyle = mxUtils.setStyle(cell.getStyle(), mxConstants.STYLE_FILLCOLOR, color);
		graph.setCellStyle(cellStyle, [cell]);
		graph.syncContainerStyles(cell, mxConstants.STYLE_FILLCOLOR, color);

		graph.model.endUpdate();

		graph.toggleAlternateStyle([cell], hasAlternateStyle);

		graph.hideChildrenAfterStyleChange(cell, true);
	}

	var toggleCellTag = function (cell, tag, color) {
		if(inspectioUtils.hasTag(cell, tag)) {
			removeCellFillColorAndTag(cell, tag);
		} else {
			setCellFillColorAndTag(cell, color, tag);
		}
	}

	this.addAction('tagImportant', function () {
		var cells = graph.getSelectionCells();

		cells.forEach(function (cell) {
			if(inspectioUtils.isContainer(cell)) {
				toggleCellTag(cell, ispConst.TAG_IMPORTANT, ispConst.FILL_COLOR_TAG_IMPORTANT);
			}
		})

	}, null, null, null);

	this.addAction('tagPlanned', function () {
		var cells = graph.getSelectionCells();

		cells.forEach(function (cell) {
			if(inspectioUtils.isContainer(cell)) {
				// @TODO: Remove fallback after a while, fixed spelling 2019-11-26
				if(inspectioUtils.hasTag(cell, 'planed')) {
					toggleCellTag(cell, 'planed');
				}
				toggleCellTag(cell, ispConst.TAG_PLANNED, ispConst.FILL_COLOR_TAG_PLANNED);
			}
		})

	}, null, null, null);

	this.addAction('tagReady', function () {
		var cells = graph.getSelectionCells();

		cells.forEach(function (cell) {
			if(inspectioUtils.isContainer(cell)) {
				toggleCellTag(cell, ispConst.TAG_READY, ispConst.FILL_COLOR_TAG_READY);
			}
		})

	}, null, null, null);

	this.addAction('tagDeployed', function () {
		var cells = graph.getSelectionCells();

		cells.forEach(function (cell) {
			if(inspectioUtils.isProcess(cell)) {
				toggleCellTag(cell, ispConst.TAG_DEPLOYED, ispConst.FILL_COLOR_DEFAULT_FEATURE);
			}

			if(inspectioUtils.isBoundedContext(cell)) {
				toggleCellTag(cell, ispConst.TAG_DEPLOYED, ispConst.FILL_COLOR_DEFAULT_CONTEXT);
			}
		})

	}, null, null, null);

	// Change shape
	this.addAction('set_shape_rectangle', function() {
		graph.setCellStyles(mxConstants.STYLE_SHAPE, mxConstants.SHAPE_LABEL);
		graph.setCellStyles(mxConstants.STYLE_PERIMETER, mxConstants.PERIMETER_RECTANGLE);



		if(inspectioUtils.isContainer(cell)) {
			graph.syncContainerStyles(cell, mxConstants.STYLE_SHAPE, mxConstants.SHAPE_LABEL);
			graph.syncContainerStyles(cell, mxConstants.STYLE_PERIMETER, PERIMETER_RECTANGLE.SHAPE_LABEL);
		}
	})

	this.addAction('set_shape_ellipse', function() {
		graph.setCellStyles(mxConstants.STYLE_SHAPE, mxConstants.SHAPE_ELLIPSE);
		graph.setCellStyles(mxConstants.STYLE_PERIMETER, mxConstants.PERIMETER_ELLIPSE);

		const cell = graph.getSelectionCell();

		if(inspectioUtils.isContainer(cell)) {
			graph.syncContainerStyles(cell, mxConstants.STYLE_SHAPE, mxConstants.SHAPE_ELLIPSE);
			graph.syncContainerStyles(cell, mxConstants.STYLE_PERIMETER, PERIMETER_RECTANGLE.PERIMETER_ELLIPSE);
		}
	})

	this.addAction('set_shape_triangle', function() {
		graph.setCellStyles(mxConstants.STYLE_SHAPE, mxConstants.SHAPE_TRIANGLE);
		graph.setCellStyles(mxConstants.STYLE_PERIMETER, mxConstants.PERIMETER_TRIANGLE);

		const cell = graph.getSelectionCell();

		if(inspectioUtils.isContainer(cell)) {
			graph.syncContainerStyles(cell, mxConstants.STYLE_SHAPE, mxConstants.SHAPE_TRIANGLE);
			graph.syncContainerStyles(cell, mxConstants.STYLE_PERIMETER, PERIMETER_RECTANGLE.PERIMETER_TRIANGLE);
		}
	})

	this.addAction('set_shape_rhombus', function() {
		graph.setCellStyles(mxConstants.STYLE_SHAPE, mxConstants.SHAPE_RHOMBUS);
		graph.setCellStyles(mxConstants.STYLE_PERIMETER, mxConstants.PERIMETER_RHOMBUS);

		const cell = graph.getSelectionCell();

		if(inspectioUtils.isContainer(cell)) {
			graph.syncContainerStyles(cell, mxConstants.STYLE_SHAPE, mxConstants.SHAPE_RHOMBUS);
			graph.syncContainerStyles(cell, mxConstants.STYLE_PERIMETER, PERIMETER_RECTANGLE.PERIMETER_RHOMBUS);
		}
	})

	this.addAction('set_shape_hexagon', function() {
		graph.setCellStyles(mxConstants.STYLE_SHAPE, mxConstants.SHAPE_HEXAGON);
		graph.setCellStyles(mxConstants.STYLE_PERIMETER, mxConstants.PERIMETER_HEXAGON);

		const cell = graph.getSelectionCell();

		if(inspectioUtils.isContainer(cell)) {
			graph.syncContainerStyles(cell, mxConstants.STYLE_SHAPE, mxConstants.SHAPE_HEXAGON);
			graph.syncContainerStyles(cell, mxConstants.STYLE_PERIMETER, PERIMETER_RECTANGLE.PERIMETER_HEXAGON);
		}
	})

	this.addAction('change_sticky_type', function(type) {
		const cell = graph.getSelectionCell();

		if(inspectioUtils.isSticky(cell)) {
			graph.setAttributeForCell(cell, 'type', type);
			graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, inspectioUtils.getColorForStickyType(type));
		}
	})

	// Dashed Edge Style
	this.addAction('set_dashed_style', function () {
		graph.setCellStyles(mxConstants.STYLE_DASHED, 1);
		graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, 'none');
		graph.currentEdgeStyle[mxConstants.STYLE_DASHED] = '1';
		graph.currentEdgeStyle[mxConstants.STYLE_DASH_PATTERN] = 'none';
	}, null, null, null);

	this.addAction('set_non_dashed_style', function () {
		graph.setCellStyles(mxConstants.STYLE_DASHED, 0);
		graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, 'none');
		graph.currentEdgeStyle[mxConstants.STYLE_DASHED] = '0';
		graph.currentEdgeStyle[mxConstants.STYLE_DASH_PATTERN] = 'none';
	}, null, null, null);

	this.addAction('set_dotted_style', function () {
		graph.setCellStyles(mxConstants.STYLE_DASHED, 1);
		graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, '1 4');
		graph.currentEdgeStyle[mxConstants.STYLE_DASHED] = '1';
		graph.currentEdgeStyle[mxConstants.STYLE_DASH_PATTERN] = '1 4';
	}, null, null, null);

	this.addAction('set_edge_color', function (color) {
		graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, color);
	}, null, null, null)

	this.addAction('set_comic_style', function() {
		var cells = graph.getSelectionCells();

		graph.model.beginUpdate();

		try {
			graph.setCellStyles('comic', '1');
			graph.setCellStyles(mxConstants.STYLE_FONTFAMILY, 'Permanent Marker');

			cells.forEach(cell => {
				if(inspectioUtils.isContainer(cell)) {
					graph.syncContainerStyles(cell, 'comic', '1');
					graph.syncContainerStyles(cell, mxConstants.STYLE_FONTFAMILY, 'Permanent Marker');
				}
			})

		} finally {
			graph.model.endUpdate();
		}
	})

	this.addAction('remove_comic_style', function() {
		var cells = graph.getSelectionCells();

		graph.model.beginUpdate();

		try {
			graph.setCellStyles('comic', '0');
			graph.setCellStyles(mxConstants.STYLE_FONTFAMILY, 'Roboto');

			cells.forEach(cell => {
				if(inspectioUtils.isContainer(cell)) {
					graph.syncContainerStyles(cell, 'comic', '0');
					graph.syncContainerStyles(cell, mxConstants.STYLE_FONTFAMILY, 'Roboto');
				}
			})

		} finally {
			graph.model.endUpdate();
		}
	})

	this.addAction('align_horizontal_center', function() {
		const cells = graph.getSelectionCells();

		let mostLeft = null;
		let centerOfMostLeftCell = null;

		cells.forEach(cell => {
			if(cell.isEdge()) {
				return;
			}

			const geo = cell.getGeometry();

			if(mostLeft === null) {
				mostLeft = geo.x;
				centerOfMostLeftCell = geo.x + (geo.width / 2);
			}

			if(geo.x < mostLeft) {
				mostLeft = geo.x;
				centerOfMostLeftCell = geo.x + (geo.width / 2);
			}
		})

		graph.model.beginUpdate();

		try {
			cells.forEach(cell => {
				if(cell.isEdge()) {
					return;
				}

				const cellGeo = cell.getGeometry().clone();
				cellGeo.x = mostLeft;
				const centerOfCell = cellGeo.x + cellGeo.width / 2;
				const diffCenter = centerOfCell - centerOfMostLeftCell;
				cellGeo.x = cellGeo.x - diffCenter;

				graph.model.setGeometry(cell, cellGeo);
			})

		} finally {
			graph.model.endUpdate();
		}
	}, true, undefined, Editor.ctrlKey + '+Shift+C')

	this.addAction('align_horizontal_left', function() {
		const cells = graph.getSelectionCells();

		let mostLeft = null;

		cells.forEach(cell => {
			if(cell.isEdge()) {
				return;
			}

			const geo = cell.getGeometry();

			if(mostLeft === null) {
				mostLeft = geo.x;
			}

			if(geo.x < mostLeft) {
				mostLeft = geo.x;
			}
		})

		graph.model.beginUpdate();

		try {
			cells.forEach(cell => {
				if(cell.isEdge()) {
					return;
				}

				const cellGeo = cell.getGeometry().clone();
				if(cellGeo.x !== mostLeft) {
					cellGeo.x = mostLeft;

					graph.model.setGeometry(cell, cellGeo);
				}
			})

		} finally {
			graph.model.endUpdate();
		}
	}, true, undefined, Editor.ctrlKey + '+Shift+L')

	this.addAction('align_horizontal_right', function() {
		const cells = graph.getSelectionCells();

		let mostRight = null;
		let mostRightX = null;

		cells.forEach(cell => {
			if(cell.isEdge()) {
				return;
			}

			const geo = cell.getGeometry();

			if(mostRight === null) {
				mostRight = geo.x + geo.width;
			}

			if(geo.x + geo.width > mostRight) {
				mostRight = geo.x + geo.width;
				mostRightX = geo.x;
			}
		})

		graph.model.beginUpdate();

		try {
			cells.forEach(cell => {
				if(cell.isEdge()) {
					return;
				}

				const cellGeo = cell.getGeometry().clone();
				if(cellGeo.x + cellGeo.width !== mostRight) {
					cellGeo.x = mostRightX;

					const diff = cellGeo.x + cellGeo.width - mostRight;
					cellGeo.x = cellGeo.x - diff;

					graph.model.setGeometry(cell, cellGeo);
				}
			})

		} finally {
			graph.model.endUpdate();
		}
	}, true, undefined, Editor.ctrlKey + '+Shift+R')

	this.addAction('align_vertical_middle', function() {
		const cells = graph.getSelectionCells();

		let mostTop = null;
		let centerOfMostTopCell = null;

		cells.forEach(cell => {
			if(cell.isEdge()) {
				return;
			}

			const geo = cell.getGeometry();

			if(mostTop === null) {
				mostTop = geo.y;
				centerOfMostTopCell = geo.y + (geo.height / 2);
			}

			if(geo.y < mostTop) {
				mostTop = geo.y;
				centerOfMostTopCell = geo.y + (geo.height / 2);
			}
		})

		graph.model.beginUpdate();

		try {
			cells.forEach(cell => {
				if(cell.isEdge()) {
					return;
				}

				const cellGeo = cell.getGeometry().clone();
				cellGeo.y = mostTop;
				const centerOfCell = cellGeo.y + cellGeo.height / 2;
				const diffCenter = centerOfCell - centerOfMostTopCell;
				cellGeo.y = cellGeo.y - diffCenter;

				graph.model.setGeometry(cell, cellGeo);
			})

		} finally {
			graph.model.endUpdate();
		}
	}, true, undefined, Editor.ctrlKey + '+Shift+M')

	this.addAction('align_vertical_up', function() {
		const cells = graph.getSelectionCells();

		let mostTop = null;

		cells.forEach(cell => {
			if(cell.isEdge()) {
				return;
			}

			const geo = cell.getGeometry();

			if(mostTop === null) {
				mostTop = geo.y;
			}

			if(geo.x < mostTop) {
				mostTop = geo.y;
			}
		})

		graph.model.beginUpdate();

		try {
			cells.forEach(cell => {
				if(cell.isEdge()) {
					return;
				}

				const cellGeo = cell.getGeometry().clone();
				if(cellGeo.y !== mostTop) {
					cellGeo.y = mostTop;

					graph.model.setGeometry(cell, cellGeo);
				}
			})

		} finally {
			graph.model.endUpdate();
		}
	}, true, undefined, Editor.ctrlKey + '+Shift+U')

	this.addAction('align_vertical_down', function() {
		const cells = graph.getSelectionCells();

		let mostBottom = null;
		let mostBottomY = null;

		cells.forEach(cell => {
			if(cell.isEdge()) {
				return;
			}

			const geo = cell.getGeometry();

			if(mostBottom === null) {
				mostBottom = geo.y + geo.height;
			}

			if(geo.y + geo.height > mostBottom) {
				mostBottom = geo.y + geo.height;
				mostBottomY = geo.y;
			}
		})

		graph.model.beginUpdate();

		try {
			cells.forEach(cell => {
				if(cell.isEdge()) {
					return;
				}

				const cellGeo = cell.getGeometry().clone();
				if(cellGeo.y + cellGeo.height !== mostBottom) {
					cellGeo.y = mostBottomY;

					const diff = cellGeo.y + cellGeo.height - mostBottom;
					cellGeo.y = cellGeo.y - diff;

					graph.model.setGeometry(cell, cellGeo);
				}
			})

		} finally {
			graph.model.endUpdate();
		}
	}, true, undefined, Editor.ctrlKey + '+Shift+D')

	//Label Position
	this.addAction('set_label_top', function () {
		graph.setCellStyles(mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_TOP);
	}, null, null, null);

	this.addAction('set_label_middle', function () {
		graph.setCellStyles(mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);
	}, null, null, null);

	this.addAction('set_label_bottom', function () {
		graph.setCellStyles(mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_BOTTOM);
	}, null, null, null);

	this.addAction('set_label_left', function () {
		graph.setCellStyles(mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_LEFT);
	}, null, null, null);

	this.addAction('set_label_right', function () {
		graph.setCellStyles(mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_RIGHT);
	}, null, null, null);

	this.addAction('set_label_center', function () {
		graph.setCellStyles(mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
	}, null, null, null);

	this.addAction('lookup_element', function () {
		var selectedCell = graph.getSelectionCell();
		if(selectedCell) {
			graph.lookupElement(inspectioUtils.getLabelText(selectedCell), inspectioUtils.getType(selectedCell));
		} else {
			graph.lookupElement('');
		}

	}, null, null, Editor.ctrlKey +'+F');

	this.addAction('show_side_by_side', function () {
		if(graph.getSelectionCount() !== 2) {
			return;
		}

		const selectedCells = graph.getSelectionCells();

		let activeEle = null;

		selectedCells.forEach(cell => {
			if(graph.currentActiveGraphElement === cell) {
				activeEle = cell;
			}
		})

		if(!activeEle) {
			graph.triggerChangeActiveGraphElement(selectedCells[0]);
		}

		graph.showCellMetadata(false);

		window.setTimeout(() => {
			selectedCells.forEach(cell => {
				if(graph.currentActiveGraphElement !== cell) {
					graph.showCellMetadata(false, cell);
				}
			})
		}, 50)
	})

	this.addAction('show_element_metadata', function () {
		var selectedCell = graph.getSelectionCell();
		if(selectedCell) {
			graph.showCellMetadata(false);
		}
	}, null, null, Editor.ctrlKey + '+M');

	this.addAction('trigger_cody', function () {
		graph.triggerCody();
	}, null, null, Editor.ctrlKey + '+G');

	// Arrange actions
	this.addAction('toFront', function() { graph.orderCells(false); }, null, null, Editor.ctrlKey + '+Shift+F');
	this.addAction('toBack', function() { graph.orderCells(true); }, null, null, Editor.ctrlKey + '+Shift+B');
	this.addAction('group', function()
	{
		if (graph.getSelectionCount() == 1)
		{
			graph.setCellStyles('container', '1');
		}
		else
		{
			graph.setSelectionCell(graph.groupCells(null, 0));
		}
	}, null, null, Editor.ctrlKey + '+G');
	this.addAction('ungroup', function()
	{
		if (graph.getSelectionCount() == 1 && graph.getModel().getChildCount(graph.getSelectionCell()) == 0)
		{
			graph.setCellStyles('container', '0');
		}
		else
		{
			graph.setSelectionCells(graph.ungroupCells());
		}
	}, null, null, Editor.ctrlKey + '+Shift+U');
	this.addAction('removeFromGroup', function() { graph.removeCellsFromParent(); });
	// Adds action
	this.addAction('edit', function()
	{
		if (graph.isEnabled())
		{
			graph.startEditingAtCell();
		}
	}, null, null, 'F2/Enter');
	this.addAction('editData...', function()
	{
		var cell = graph.getSelectionCell() || graph.getModel().getRoot();
		ui.showDataDialog(cell);
	}, null, null, Editor.ctrlKey + '+M');
	this.addAction('editTooltip...', function()
	{
		var graph = ui.editor.graph;

		if (graph.isEnabled() && !graph.isSelectionEmpty())
		{
			var cell = graph.getSelectionCell();
			var tooltip = '';

			if (mxUtils.isNode(cell.value))
			{
				var tmp = cell.value.getAttribute('tooltip');

				if (tmp != null)
				{
					tooltip = tmp;
				}
			}

	    	var dlg = new TextareaDialog(ui, mxResources.get('editTooltip') + ':', tooltip, function(newValue)
			{
				graph.setTooltipForCell(cell, newValue);
			});
			ui.showDialog(dlg.container, 320, 200, true, true);
			dlg.init();
		}
	}, null, null, 'Alt+Shift+T');
	this.addAction('openLink', function()
	{
		var link = graph.getLinkForCell(graph.getSelectionCell());

		if (link != null)
		{
			graph.openLink(link);
		}
	});
	this.addAction('editLink...', function()
	{
		var graph = ui.editor.graph;

		if (graph.isEnabled() && !graph.isSelectionEmpty())
		{
			var cell = graph.getSelectionCell();
			var value = graph.getLinkForCell(cell) || '';

			ui.showLinkDialog(value, mxResources.get('apply'), function(link)
			{
				link = mxUtils.trim(link);
    			graph.setLinkForCell(cell, (link.length > 0) ? link : null);
			});
		}
	}, null, null, 'Alt+Shift+L');
	this.addAction('inserthorizontalrule', function () {
		if(graph.cellEditor && graph.cellEditor.isContentEditing()) {
			document.execCommand('inserthorizontalrule', false, null);
			if(!mxClient.IS_FF) {
				document.execCommand('insertText', false, '\n');
			}
			document.execCommand('justifyleft', false, null);
		}
	}, null, null, Editor.ctrlKey + '+Shift+H');
	this.addAction('insertLink...', function()
	{
		if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
		{
			ui.showLinkDialog('', mxResources.get('insert'), function(link, docs)
			{
				link = mxUtils.trim(link);

				if (link.length > 0)
				{
					var icon = null;
					var title = graph.getLinkTitle(link);

					if (docs != null && docs.length > 0)
					{
						icon = docs[0].iconUrl;
						title = docs[0].name || docs[0].type;
						title = title.charAt(0).toUpperCase() + title.substring(1);

						if (title.length > 30)
						{
							title = title.substring(0, 30) + '...';
						}
					}

					var pt = graph.getFreeInsertPoint();
            		var linkCell = new mxCell(title, new mxGeometry(pt.x, pt.y, 100, 40),
	            	    	'fontColor=#0000EE;fontStyle=4;rounded=1;overflow=hidden;' + ((icon != null) ?
	            	    	'shape=label;imageWidth=16;imageHeight=16;spacingLeft=26;align=left;image=' + icon :
	            	    	'spacing=10;'));
            	    linkCell.vertex = true;

            	    graph.setLinkForCell(linkCell, link);
            	    graph.cellSizeUpdated(linkCell, true);

            		graph.getModel().beginUpdate();
            		try
            		{
        	    		linkCell = graph.addCell(linkCell);
        	    		graph.fireEvent(new mxEventObject('cellsInserted', 'cells', [linkCell]));
            	    }
            		finally
            		{
            			graph.getModel().endUpdate();
            		}

            	    graph.setSelectionCell(linkCell);
            	    graph.scrollCellToVisible(graph.getSelectionCell());
				}
			});
		}
	}).isEnabled = isGraphEnabled;
	this.addAction('link...', mxUtils.bind(this, function()
	{
		var graph = ui.editor.graph;

		if (graph.isEnabled())
		{
			if (graph.cellEditor.isContentEditing())
			{
				var elt = graph.getSelectedElement();
				var link = graph.getParentByName(elt, 'A', graph.cellEditor.textarea);
				var oldValue = '';

				// Workaround for FF returning the outermost selected element after double
				// click on a DOM hierarchy with a link inside (but not as topmost element)
				if (link == null && elt != null && elt.getElementsByTagName != null)
				{
					// Finds all links in the selected DOM and uses the link
					// where the selection text matches its text content
					var links = elt.getElementsByTagName('a');

					for (var i = 0; i < links.length && link == null; i++)
					{
						if (links[i].textContent == elt.textContent)
						{
							graph.selectNode(links[i]);
							link = links[i];
						}
					}
				}

				if (link != null && link.nodeName == 'A')
				{
					oldValue = link.getAttribute('href') || '';
				}

				var selState = graph.cellEditor.saveSelection();

				ui.showLinkDialog(oldValue, mxResources.get('apply'), mxUtils.bind(this, function(value)
				{
		    		graph.cellEditor.restoreSelection(selState);

		    		if (value != null)
		    		{
		    			graph.insertLink(value);
					}
				}));
			}
			else if (graph.isSelectionEmpty())
			{
				this.get('insertLink').funct();
			}
			else
			{
				this.get('editLink').funct();
			}
		}
	}), null, null, Editor.ctrlKey + '+Shift+L').isEnabled = isGraphEnabled;
	this.addAction('autosize', function()
	{
		var cells = graph.getSelectionCells();

		if (cells != null)
		{
			graph.getModel().beginUpdate();
			try
			{
				for (var i = 0; i < cells.length; i++)
				{
					var cell = cells[i];

					if (graph.getModel().getChildCount(cell))
					{
						graph.updateGroupBounds([cell], 20);
					}
					else
					{
						var state = graph.view.getState(cell);
						var geo = graph.getCellGeometry(cell);

						if (graph.getModel().isVertex(cell) && state != null && state.text != null &&
							geo != null && graph.isWrapping(cell))
						{
							geo = geo.clone();
							geo.height = state.text.boundingBox.height / graph.view.scale;
							graph.getModel().setGeometry(cell, geo);
						}
						else
						{
							graph.updateCellSize(cell);
						}
					}
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}
	}, null, null, Editor.ctrlKey + '+Shift+Y');
	this.addAction('formattedText', function()
	{
    	var state = graph.getView().getState(graph.getSelectionCell());

    	if (state != null)
    	{
	    	var value = '1';
	    	graph.stopEditing();

			graph.getModel().beginUpdate();
			try
			{
		    	if (state.style['html'] == '1')
		    	{
		    		value = null;
		    		var label = graph.convertValueToString(state.cell);

		    		if (mxUtils.getValue(state.style, 'nl2Br', '1') != '0')
					{
						// Removes newlines from HTML and converts breaks to newlines
						// to match the HTML output in plain text
						label = label.replace(/\n/g, '').replace(/<br\s*.?>/g, '\n');
					}

		    		// Removes HTML tags
	    			var temp = document.createElement('div');
	    			temp.innerHTML = label;
	    			label = mxUtils.extractTextWithWhitespace(temp.childNodes);

					graph.cellLabelChanged(state.cell, label);
		    	}
		    	else
		    	{
		    		// Converts HTML tags to text
		    		var label = mxUtils.htmlEntities(graph.convertValueToString(state.cell), false);

		    		if (mxUtils.getValue(state.style, 'nl2Br', '1') != '0')
					{
						// Converts newlines in plain text to breaks in HTML
						// to match the plain text output
		    			label = label.replace(/\n/g, '<br/>');
					}

		    		graph.cellLabelChanged(state.cell, graph.sanitizeHtml(label));
		    	}

		       	graph.setCellStyles('html', value);
				ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['html'],
						'values', [(value != null) ? value : '0'], 'cells',
						graph.getSelectionCells()));
			}
			finally
			{
				graph.getModel().endUpdate();
			}
    	}
	});
	this.addAction('wordWrap', function()
	{
    	var state = graph.getView().getState(graph.getSelectionCell());
    	var value = 'wrap';

		graph.stopEditing();

    	if (state != null && state.style[mxConstants.STYLE_WHITE_SPACE] == 'wrap')
    	{
    		value = null;
    	}

       	graph.setCellStyles(mxConstants.STYLE_WHITE_SPACE, value);
	});
	this.addAction('rotation', function()
	{
		var value = '0';
    	var state = graph.getView().getState(graph.getSelectionCell());

    	if (state != null)
    	{
    		value = state.style[mxConstants.STYLE_ROTATION] || value;
    	}

		var dlg = new FilenameDialog(ui, value, mxResources.get('apply'), function(newValue)
		{
			if (newValue != null && newValue.length > 0)
			{
				graph.setCellStyles(mxConstants.STYLE_ROTATION, newValue);
			}
		}, mxResources.get('enterValue') + ' (' + mxResources.get('rotation') + ' 0-360)');

		ui.showDialog(dlg.container, 375, 80, true, true);
		dlg.init();
	});
	// View actions
	this.addAction('resetView', function()
	{
		graph.zoomTo(1);
		ui.resetScrollbars();
	}, null, null, Editor.ctrlKey + '+H');
	this.addAction('zoomIn', function(evt) { graph.zoomIn(); }, null, null, Editor.ctrlKey + ' + (Numpad) / Alt+Mousewheel');
	this.addAction('zoomOut', function(evt) { graph.zoomOut(); }, null, null, Editor.ctrlKey + ' - (Numpad) / Alt+Mousewheel');
	this.addAction('fitWindow', function() { graph.fit(); }, null, null, Editor.ctrlKey + '+Shift+H');
	this.addAction('fitPage', mxUtils.bind(this, function()
	{
		if (!graph.pageVisible)
		{
			this.get('pageView').funct();
		}

		var fmt = graph.pageFormat;
		var ps = graph.pageScale;
		var cw = graph.container.clientWidth - 10;
		var ch = graph.container.clientHeight - 10;
		var scale = Math.floor(20 * Math.min(cw / fmt.width / ps, ch / fmt.height / ps)) / 20;
		graph.zoomTo(scale);

		if (mxUtils.hasScrollbars(graph.container))
		{
			var pad = graph.getPagePadding();
			graph.container.scrollTop = pad.y * graph.view.scale - 1;
			graph.container.scrollLeft = Math.min(pad.x * graph.view.scale, (graph.container.scrollWidth - graph.container.clientWidth) / 2) - 1;
		}
	}), null, null, Editor.ctrlKey + '+J');
	this.addAction('fitTwoPages', mxUtils.bind(this, function()
	{
		if (!graph.pageVisible)
		{
			this.get('pageView').funct();
		}

		var fmt = graph.pageFormat;
		var ps = graph.pageScale;
		var cw = graph.container.clientWidth - 10;
		var ch = graph.container.clientHeight - 10;

		var scale = Math.floor(20 * Math.min(cw / (2 * fmt.width) / ps, ch / fmt.height / ps)) / 20;
		graph.zoomTo(scale);

		if (mxUtils.hasScrollbars(graph.container))
		{
			var pad = graph.getPagePadding();
			graph.container.scrollTop = Math.min(pad.y, (graph.container.scrollHeight - graph.container.clientHeight) / 2);
			graph.container.scrollLeft = Math.min(pad.x, (graph.container.scrollWidth - graph.container.clientWidth) / 2);
		}
	}), null, null, Editor.ctrlKey + '+Shift+J');
	this.addAction('fitPageWidth', mxUtils.bind(this, function()
	{
		if (!graph.pageVisible)
		{
			this.get('pageView').funct();
		}

		var fmt = graph.pageFormat;
		var ps = graph.pageScale;
		var cw = graph.container.clientWidth - 10;

		var scale = Math.floor(20 * cw / fmt.width / ps) / 20;
		graph.zoomTo(scale);

		if (mxUtils.hasScrollbars(graph.container))
		{
			var pad = graph.getPagePadding();
			graph.container.scrollLeft = Math.min(pad.x * graph.view.scale,
				(graph.container.scrollWidth - graph.container.clientWidth) / 2);
		}
	}));
	this.put('customZoom', new Action(mxResources.get('custom') + '...', mxUtils.bind(this, function()
	{
		var dlg = new FilenameDialog(this.editorUi, parseInt(graph.getView().getScale() * 100), mxResources.get('apply'), mxUtils.bind(this, function(newValue)
		{
			var val = parseInt(newValue);

			if (!isNaN(val) && val > 0)
			{
				graph.zoomTo(val / 100);
			}
		}), mxResources.get('zoom') + ' (%)');
		this.editorUi.showDialog(dlg.container, 300, 80, true, true);
		dlg.init();
	}), null, null, Editor.ctrlKey + '+0'));
	this.addAction('pageScale...', mxUtils.bind(this, function()
	{
		var dlg = new FilenameDialog(this.editorUi, parseInt(graph.pageScale * 100), mxResources.get('apply'), mxUtils.bind(this, function(newValue)
		{
			var val = parseInt(newValue);

			if (!isNaN(val) && val > 0)
			{
				ui.setPageScale(val / 100);
			}
		}), mxResources.get('pageScale') + ' (%)');
		this.editorUi.showDialog(dlg.container, 300, 80, true, true);
		dlg.init();
	}));

	// Option actions
	var action = null;
	action = this.addAction('grid', function()
	{
		graph.setGridEnabled(!graph.isGridEnabled());
		ui.fireEvent(new mxEventObject('gridEnabledChanged'));
	}, null, null, Editor.ctrlKey + '+Shift+G');
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.isGridEnabled(); });
	action.setEnabled(false);

	action = this.addAction('guides', function()
	{
		graph.graphHandler.guidesEnabled = !graph.graphHandler.guidesEnabled;
		ui.fireEvent(new mxEventObject('guidesEnabledChanged'));
	});
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.graphHandler.guidesEnabled; });
	action.setEnabled(false);

	action = this.addAction('tooltips', function()
	{
		graph.tooltipHandler.setEnabled(!graph.tooltipHandler.isEnabled());
	});
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.tooltipHandler.isEnabled(); });

	action = this.addAction('collapseExpand', function()
	{
		var change = new ChangePageSetup(ui);
		change.ignoreColor = true;
		change.ignoreImage = true;
		change.foldingEnabled = !graph.foldingEnabled;

		graph.model.execute(change);
	});
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.foldingEnabled; });
	action.isEnabled = isGraphEnabled;
	action = this.addAction('scrollbars', function()
	{
		ui.setScrollbars(!ui.hasScrollbars());
	});
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.scrollbars; });
	action = this.addAction('pageView', mxUtils.bind(this, function()
	{
		ui.setPageVisible(!graph.pageVisible);
	}));
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.pageVisible; });
	action = this.addAction('connectionArrows', function()
	{
		graph.connectionArrowsEnabled = !graph.connectionArrowsEnabled;
		ui.fireEvent(new mxEventObject('connectionArrowsChanged'));
	}, null, null, 'Alt+Shift+A');
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.connectionArrowsEnabled; });
	action = this.addAction('connectionPoints', function()
	{
		graph.setConnectable(!graph.connectionHandler.isEnabled());
		ui.fireEvent(new mxEventObject('connectionPointsChanged'));
	}, null, null, 'Alt+Shift+P');
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.connectionHandler.isEnabled(); });
	action = this.addAction('copyConnect', function()
	{
		graph.connectionHandler.setCreateTarget(!graph.connectionHandler.isCreateTarget());
		ui.fireEvent(new mxEventObject('copyConnectChanged'));
	});
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return graph.connectionHandler.isCreateTarget(); });
	action.isEnabled = isGraphEnabled;
	action = this.addAction('autosave', function()
	{
		ui.editor.setAutosave(!ui.editor.autosave);
	});
	action.setToggleAction(true);
	action.setSelectedCallback(function() { return ui.editor.autosave; });
	action.isEnabled = isGraphEnabled;
	action.visible = false;

	// Help actions
	this.addAction('help', function()
	{
		var ext = '';

		if (mxResources.isLanguageSupported(mxClient.language))
		{
			ext = '_' + mxClient.language;
		}

		graph.openLink(RESOURCES_PATH + '/help' + ext + '.html');
	});

	var showingAbout = false;

	this.put('about', new Action(mxResources.get('about') + ' Graph Editor...', function()
	{
		if (!showingAbout)
		{
			ui.showDialog(new AboutDialog(ui).container, 320, 280, true, true, function()
			{
				showingAbout = false;
			});

			showingAbout = true;
		}
	}, null, null, 'F1'));

	// Font style actions
	var toggleFontStyle = mxUtils.bind(this, function(key, style, fn, shortcut)
	{
		return this.addAction(key, function()
		{
			if (fn != null && graph.cellEditor.isContentEditing())
			{
				fn();
			}
			else
			{
				graph.stopEditing(false);

				graph.getModel().beginUpdate();
				try
				{
					graph.toggleCellStyleFlags(mxConstants.STYLE_FONTSTYLE, style);

					// Removes bold and italic tags and CSS styles inside labels
					if ((style & mxConstants.FONT_BOLD) == mxConstants.FONT_BOLD)
					{
						graph.updateLabelElements(graph.getSelectionCells(), function(elt)
						{
							elt.style.fontWeight = null;

							if (elt.nodeName == 'B')
							{
								graph.replaceElement(elt);
							}
						});
					}
					else if ((style & mxConstants.FONT_ITALIC) == mxConstants.FONT_ITALIC)
					{
						graph.updateLabelElements(graph.getSelectionCells(), function(elt)
						{
							elt.style.fontStyle = null;

							if (elt.nodeName == 'I')
							{
								graph.replaceElement(elt);
							}
						});
					}
					else if ((style & mxConstants.FONT_UNDERLINE) == mxConstants.FONT_UNDERLINE)
					{
						graph.updateLabelElements(graph.getSelectionCells(), function(elt)
						{
							elt.style.textDecoration = null;

							if (elt.nodeName == 'U')
							{
								graph.replaceElement(elt);
							}
						});
					}
				}
				finally
				{
					graph.getModel().endUpdate();
				}
			}
		}, null, null, shortcut);
	});

	toggleFontStyle('bold', mxConstants.FONT_BOLD, function() { document.execCommand('bold', false, null); }, Editor.ctrlKey + '+B');
	toggleFontStyle('italic', mxConstants.FONT_ITALIC, function() { document.execCommand('italic', false, null); }, Editor.ctrlKey + '+I');
	toggleFontStyle('underline', mxConstants.FONT_UNDERLINE, function() { document.execCommand('underline', false, null); }, Editor.ctrlKey + '+U');

	// Color actions
	this.addAction('fontColor...', function() { ui.menus.pickColor(mxConstants.STYLE_FONTCOLOR, 'forecolor', '000000'); });
	this.addAction('strokeColor...', function() { ui.menus.pickColor(mxConstants.STYLE_STROKECOLOR); });
	this.addAction('fillColor...', function() { ui.menus.pickColor(mxConstants.STYLE_FILLCOLOR); });
	this.addAction('gradientColor...', function() { ui.menus.pickColor(mxConstants.STYLE_GRADIENTCOLOR); });
	this.addAction('backgroundColor...', function() { ui.menus.pickColor(mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, ispConst.CMD_PICK_COLOR_CELL_BACKGROUND); });
	this.addAction('borderColor...', function() { ui.menus.pickColor(mxConstants.STYLE_LABEL_BORDERCOLOR); });

	// Format actions
	this.addAction('vertical', function() { ui.menus.toggleStyle(mxConstants.STYLE_HORIZONTAL, true); });
	this.addAction('shadow', function() { ui.menus.toggleStyle(mxConstants.STYLE_SHADOW); });
	this.addAction('solid', function()
	{
		graph.getModel().beginUpdate();
		try
		{
			graph.setCellStyles(mxConstants.STYLE_DASHED, null);
			graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, null);
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN],
				'values', [null, null], 'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
	this.addAction('dashed', function()
	{
		graph.getModel().beginUpdate();
		try
		{
			graph.setCellStyles(mxConstants.STYLE_DASHED, '1');
			graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, null);
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN],
				'values', ['1', null], 'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
	this.addAction('dotted', function()
	{
		graph.getModel().beginUpdate();
		try
		{
			graph.setCellStyles(mxConstants.STYLE_DASHED, '1');
			graph.setCellStyles(mxConstants.STYLE_DASH_PATTERN, '1 4');
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_DASHED, mxConstants.STYLE_DASH_PATTERN],
				'values', ['1', '1 4'], 'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
	this.addAction('sharp', function()
	{
		graph.getModel().beginUpdate();
		try
		{
			graph.setCellStyles(mxConstants.STYLE_ROUNDED, '0');
			graph.setCellStyles(mxConstants.STYLE_CURVED, '0');
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
					'values', ['0', '0'], 'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
	this.addAction('rounded', function()
	{
		graph.getModel().beginUpdate();
		try
		{
			graph.setCellStyles(mxConstants.STYLE_ROUNDED, '1');
			graph.setCellStyles(mxConstants.STYLE_CURVED, '0');
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
					'values', ['1', '0'], 'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
	this.addAction('toggleRounded', function()
	{
		if (!graph.isSelectionEmpty() && graph.isEnabled())
		{
			graph.getModel().beginUpdate();
			try
			{
				var cells = graph.getSelectionCells();
	    		var state = graph.view.getState(cells[0]);
	    		var style = (state != null) ? state.style : graph.getCellStyle(cells[0]);
	    		var value = (mxUtils.getValue(style, mxConstants.STYLE_ROUNDED, '0') == '1') ? '0' : '1';

				graph.setCellStyles(mxConstants.STYLE_ROUNDED, value);
				graph.setCellStyles(mxConstants.STYLE_CURVED, null);
				ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
						'values', [value, '0'], 'cells', graph.getSelectionCells()));
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}
	});
	this.addAction('curved', function()
	{
		graph.getModel().beginUpdate();
		try
		{
			graph.setCellStyles(mxConstants.STYLE_ROUNDED, '0');
			graph.setCellStyles(mxConstants.STYLE_CURVED, '1');
			ui.fireEvent(new mxEventObject('styleChanged', 'keys', [mxConstants.STYLE_ROUNDED, mxConstants.STYLE_CURVED],
					'values', ['0', '1'], 'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
	this.addAction('collapsible', function()
	{
		var state = graph.view.getState(graph.getSelectionCell());
		var value = '1';

		if (state != null && graph.getFoldingImage(state) != null)
		{
			value = '0';
		}

		graph.setCellStyles('collapsible', value);
		ui.fireEvent(new mxEventObject('styleChanged', 'keys', ['collapsible'],
				'values', [value], 'cells', graph.getSelectionCells()));
	});
	this.addAction('editStyle...', mxUtils.bind(this, function()
	{
		var cells = graph.getSelectionCells();

		if (cells != null && cells.length > 0)
		{
			var model = graph.getModel();

	    	var dlg = new TextareaDialog(this.editorUi, mxResources.get('editStyle') + ':',
	    		model.getStyle(cells[0]) || '', function(newValue)
			{
	    		if (newValue != null)
				{
					graph.setCellStyle(mxUtils.trim(newValue), cells);
				}
			}, null, null, 400, 220);
			this.editorUi.showDialog(dlg.container, 420, 300, true, true);
			dlg.init();
		}
	}), null, null, Editor.ctrlKey + '+E');
	this.addAction('setAsDefaultStyle', function()
	{
		if (graph.isEnabled() && !graph.isSelectionEmpty())
		{
			ui.setDefaultStyle(graph.getSelectionCell());
		}
	}, null, null, Editor.ctrlKey + '+Shift+D');
	this.addAction('clearDefaultStyle', function()
	{
		if (graph.isEnabled())
		{
			ui.clearDefaultStyle();
		}
	}, null, null, Editor.ctrlKey + '+Shift+R');
	this.addAction('addWaypoint', function()
	{
		var cell = graph.getSelectionCell();

		if (cell != null && graph.getModel().isEdge(cell))
		{
			var handler = editor.graph.selectionCellsHandler.getHandler(cell);

			if (handler instanceof mxEdgeHandler)
			{
				var t = graph.view.translate;
				var s = graph.view.scale;
				var dx = t.x;
				var dy = t.y;

				var parent = graph.getModel().getParent(cell);
				var pgeo = graph.getCellGeometry(parent);

				while (graph.getModel().isVertex(parent) && pgeo != null)
				{
					dx += pgeo.x;
					dy += pgeo.y;

					parent = graph.getModel().getParent(parent);
					pgeo = graph.getCellGeometry(parent);
				}

				var x = Math.round(graph.snap(graph.popupMenuHandler.triggerX / s - dx));
				var y = Math.round(graph.snap(graph.popupMenuHandler.triggerY / s - dy));

				handler.addPointAt(handler.state, x, y);
			}
		}
	});
	this.addAction('removeWaypoint', function()
	{
		// TODO: Action should run with "this" set to action
		var rmWaypointAction = ui.actions.get('removeWaypoint');

		if (rmWaypointAction.handler != null)
		{
			// NOTE: Popupevent handled and action updated in Menus.createPopupMenu
			rmWaypointAction.handler.removePoint(rmWaypointAction.handler.state, rmWaypointAction.index);
		}
	});
	this.addAction('clearWaypoints', function()
	{
		var cells = graph.getSelectionCells();

		if (cells != null)
		{
			cells = graph.addAllEdges(cells);

			graph.getModel().beginUpdate();
			try
			{
				for (var i = 0; i < cells.length; i++)
				{
					var cell = cells[i];

					if (graph.getModel().isEdge(cell))
					{
						var geo = graph.getCellGeometry(cell);

						if (geo != null)
						{
							geo = geo.clone();
							geo.points = null;
							graph.getModel().setGeometry(cell, geo);
						}
					}
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}
		}
	}, null, null, 'Alt+Shift+C');
	action = this.addAction('subscript', mxUtils.bind(this, function()
	{
	    if (graph.cellEditor.isContentEditing())
	    {
			document.execCommand('subscript', false, null);
		}
	}), null, null, Editor.ctrlKey + '+,');
	action = this.addAction('superscript', mxUtils.bind(this, function()
	{
	    if (graph.cellEditor.isContentEditing())
	    {
			document.execCommand('superscript', false, null);
		}
	}), null, null, Editor.ctrlKey + '+.');
	this.addAction('image...', function()
	{
		if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
		{
			var title = mxResources.get('image') + ' (' + mxResources.get('url') + '):';
	    	var state = graph.getView().getState(graph.getSelectionCell());
	    	var value = '';

	    	if (state != null)
	    	{
	    		value = state.style[mxConstants.STYLE_IMAGE] || value;
	    	}

	    	var selectionState = graph.cellEditor.saveSelection();

	    	ui.showImageDialog(title, value, function(newValue, w, h)
			{
	    		// Inserts image into HTML text
	    		if (graph.cellEditor.isContentEditing())
	    		{
	    			graph.cellEditor.restoreSelection(selectionState);
	    			graph.insertImage(newValue, w, h);
	    		}
	    		else
	    		{
					var cells = graph.getSelectionCells();

					if (newValue != null && (newValue.length > 0 || cells.length > 0))
					{
						var select = null;

						graph.getModel().beginUpdate();
			        	try
			        	{
			        		// Inserts new cell if no cell is selected
			    			if (cells.length == 0)
			    			{
			    				var pt = graph.getFreeInsertPoint();
			    				cells = [graph.insertVertex(graph.getDefaultParent(), null, '', pt.x, pt.y, w, h,
			    						'shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;')];
			    				select = cells;
		            	    		graph.fireEvent(new mxEventObject('cellsInserted', 'cells', select));
			    			}

			        		graph.setCellStyles(mxConstants.STYLE_IMAGE, (newValue.length > 0) ? newValue : null, cells);

			        		// Sets shape only if not already shape with image (label or image)
			        		var state = graph.view.getState(cells[0]);
			        		var style = (state != null) ? state.style : graph.getCellStyle(cells[0]);

			        		if (style[mxConstants.STYLE_SHAPE] != 'image' && style[mxConstants.STYLE_SHAPE] != 'label')
			        		{
			        			graph.setCellStyles(mxConstants.STYLE_SHAPE, 'image', cells);
			        		}
			        		else if (newValue.length == 0)
			        		{
			        			graph.setCellStyles(mxConstants.STYLE_SHAPE, null, cells);
			        		}

				        	if (graph.getSelectionCount() == 1)
				        	{
					        	if (w != null && h != null)
					        	{
					        		var cell = cells[0];
					        		var geo = graph.getModel().getGeometry(cell);

					        		if (geo != null)
					        		{
					        			geo = geo.clone();
						        		geo.width = w;
						        		geo.height = h;
						        		graph.getModel().setGeometry(cell, geo);
					        		}
					        	}
				        	}
			        	}
			        	finally
			        	{
			        		graph.getModel().endUpdate();
			        	}

			        	if (select != null)
			        	{
			        		graph.setSelectionCells(select);
			        		graph.scrollCellToVisible(select[0]);
			        	}
					}
		    	}
			}, graph.cellEditor.isContentEditing(), !graph.cellEditor.isContentEditing());
		}
	}).isEnabled = isGraphEnabled;
    this.addAction('icon...', function(iconCb)
    {
        if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
        {
            var title = mxResources.get('icon') + ' (' + mxResources.get('url') + '):';
            var state = graph.getView().getState(graph.getSelectionCell());
            var value = '';

            if (state != null)
            {
                value = state.style[mxConstants.STYLE_IMAGE] || value;
            }

            var selectionState = graph.cellEditor.saveSelection();

            ui.showIconDialog(function(newValue)
            {
            	if(iconCb) {
            		iconCb(newValue);
            		return;
				}

            	const w = 30;
            	const h = 30;
                // Inserts image into HTML text
                if (graph.cellEditor.isContentEditing())
                {
                    graph.cellEditor.restoreSelection(selectionState);
                    graph.insertIcon(newValue, w, h);
                }
                else
                {
                    var cells = graph.getSelectionCells();

                    if (newValue != null && (newValue.length > 0 || cells.length > 0))
                    {
                        var select = null;

                        graph.getModel().beginUpdate();
                        try
                        {
                            // Inserts new cell if no cell is selected
                            if (cells.length == 0)
                            {
                                var pt = graph.getFreeInsertPoint();
                                cells = [graph.insertVertex(graph.getDefaultParent(), null, '', pt.x, pt.y, w, h,
                                    'shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;')];
                                select = cells;
                                graph.fireEvent(new mxEventObject('cellsInserted', 'cells', select));
                            }

                            graph.setCellStyles(mxConstants.STYLE_IMAGE, (newValue.length > 0) ? newValue : null, cells);

                            // Sets shape only if not already shape with image (label or image)
                            var state = graph.view.getState(cells[0]);
                            var style = (state != null) ? state.style : graph.getCellStyle(cells[0]);

                            if (style[mxConstants.STYLE_SHAPE] != 'image' && style[mxConstants.STYLE_SHAPE] != 'label')
                            {
                                graph.setCellStyles(mxConstants.STYLE_SHAPE, 'image', cells);
                            }
                            else if (newValue.length == 0)
                            {
                                graph.setCellStyles(mxConstants.STYLE_SHAPE, null, cells);
                            }

                            if (graph.getSelectionCount() == 1)
                            {
                                if (w != null && h != null)
                                {
                                    var cell = cells[0];
                                    var geo = graph.getModel().getGeometry(cell);

                                    if (geo != null)
                                    {
                                        geo = geo.clone();
                                        geo.width = w;
                                        geo.height = h;
                                        graph.getModel().setGeometry(cell, geo);
                                    }
                                }
                            }
                        }
                        finally
                        {
                            graph.getModel().endUpdate();
                        }

                        if (select != null)
                        {
                            graph.setSelectionCells(select);
                            graph.scrollCellToVisible(select[0]);
                        }
                    }
                }
            }, typeof iconCb !== 'undefined');
        }
    }).isEnabled = isGraphEnabled;
	this.addAction('insertImage...', function()
	{
		if (graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent()))
		{
			graph.clearSelection();
			ui.actions.get('image').funct();
		}
	}).isEnabled = isGraphEnabled;
	action = this.addAction('layers', mxUtils.bind(this, function()
	{
		if (this.layersWindow == null)
		{
			// LATER: Check outline window for initial placement
			this.layersWindow = new LayersWindow(ui, document.body.offsetWidth - 280, 120, 220, 200);
			this.layersWindow.window.addListener('show', function()
			{
				ui.fireEvent(new mxEventObject('layers'));
			});
			this.layersWindow.window.addListener('hide', function()
			{
				ui.fireEvent(new mxEventObject('layers'));
			});
			this.layersWindow.window.setVisible(true);
			ui.fireEvent(new mxEventObject('layers'));
		}
		else
		{
			this.layersWindow.window.setVisible(!this.layersWindow.window.isVisible());
		}
	}), null, null, null);
	action.setToggleAction(true);
	action.setSelectedCallback(mxUtils.bind(this, function() { return this.layersWindow != null && this.layersWindow.window.isVisible(); }));
	action = this.addAction('formatPanel', mxUtils.bind(this, function()
	{
		ui.toggleFormatPanel();
	}), null, null, Editor.ctrlKey + '+Shift+P');
	action.setToggleAction(true);
	action.setSelectedCallback(mxUtils.bind(this, function() { return ui.formatWidth > 0; }));
	action = this.addAction('outline', mxUtils.bind(this, function()
	{
		if (this.outlineWindow == null)
		{
			// LATER: Check layers window for initial placement
			this.outlineWindow = new OutlineWindow(ui, document.body.offsetWidth - 260, 100, 180, 180);
			this.outlineWindow.window.addListener('show', function()
			{
				ui.fireEvent(new mxEventObject('outline'));
			});
			this.outlineWindow.window.addListener('hide', function()
			{
				ui.fireEvent(new mxEventObject('outline'));
			});
			this.outlineWindow.window.setVisible(true);
			ui.fireEvent(new mxEventObject('outline'));
		}
		else
		{
			this.outlineWindow.window.setVisible(!this.outlineWindow.window.isVisible());
		}
	}), null, null, Editor.ctrlKey + '+Shift+O');

	action.setToggleAction(true);
	action.setSelectedCallback(mxUtils.bind(this, function() { return this.outlineWindow != null && this.outlineWindow.window.isVisible(); }));
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.addAction = function(key, funct, enabled, iconCls, shortcut)
{
	var title;

	if (key.substring(key.length - 3) == '...')
	{
		key = key.substring(0, key.length - 3);
		title = mxResources.get(key) + '...';
	}
	else
	{
		title = mxResources.get(key);
	}

	return this.put(key, new Action(title, funct, enabled, iconCls, shortcut));
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.put = function(name, action)
{
	this.actions[name] = action;

	return action;
};

/**
 * Returns the action for the given name or null if no such action exists.
 */
Actions.prototype.get = function(name)
{
	return this.actions[name];
};

/**
 * Constructs a new action for the given parameters.
 */
function Action(label, funct, enabled, iconCls, shortcut)
{
	mxEventSource.call(this);
	this.label = label;
	this.funct = this.createFunction(funct);
	this.enabled = (enabled != null) ? enabled : true;
	this.iconCls = iconCls;
	this.shortcut = shortcut;
	this.visible = true;
};

// Action inherits from mxEventSource
mxUtils.extend(Action, mxEventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.createFunction = function(funct)
{
	return funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setEnabled = function(value)
{
	if (this.enabled != value)
	{
		this.enabled = value;
		this.fireEvent(new mxEventObject('stateChanged'));
	}
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isEnabled = function()
{
	return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setToggleAction = function(value)
{
	this.toggleAction = value;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setSelectedCallback = function(funct)
{
	this.selectedCallback = funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isSelected = function()
{
	return this.selectedCallback();
};
