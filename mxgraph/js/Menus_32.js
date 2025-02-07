/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
/**
 * Constructs a new graph editor
 */
Menus = function(editorUi)
{
	this.editorUi = editorUi;
	this.menus = new Object();
	this.init();

	// Pre-fetches checkmark image
	if (!mxClient.IS_SVG)
	{
		new Image().src = this.checkmarkImage;
	}
};

/**
 * Sets the default font family.
 */
Menus.prototype.defaultFont = 'Helvetica';

/**
 * Sets the default font size.
 */
Menus.prototype.defaultFontSize = '12';

/**
 * Sets the default font size.
 */
Menus.prototype.defaultMenuItems = ['file', 'edit', 'view', 'arrange', 'extras', 'help'];

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.defaultFonts = ['Permanent Marker', 'Gaegu', 'Roboto', 'Sans Serif Neue', 'Helvetica', 'Verdana', 'Times New Roman', 'Garamond',
           		             'Courier New', 'Georgia', 'Lucida Console', 'Tahoma'];

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.init = function()
{
	var graph = this.editorUi.editor.graph;
	var isGraphEnabled = mxUtils.bind(graph, graph.isEnabled);

	this.customFonts = [];
	this.customFontSizes = [];

	this.put('fontFamily', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		var addItem = mxUtils.bind(this, function(fontname)
		{
			var tr = this.styleChange(menu, fontname, [mxConstants.STYLE_FONTFAMILY], [fontname], null, parent, function()
			{
				document.execCommand('fontname', false, fontname);
			}, function()
			{
				graph.updateLabelElements(graph.getSelectionCells(), function(elt)
				{
					elt.removeAttribute('face');
					elt.style.fontFamily = null;

					if (elt.nodeName == 'PRE')
					{
						graph.replaceElement(elt, 'div');
					}
				});
			});
			tr.firstChild.nextSibling.style.fontFamily = fontname;
		});

		for (var i = 0; i < this.defaultFonts.length; i++)
		{
			addItem(this.defaultFonts[i]);
		}

	})));
	this.put('formatBlock', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		function addItem(label, tag)
		{
			return menu.addItem(label, null, mxUtils.bind(this, function()
			{
				// TODO: Check if visible
				if (graph.cellEditor.textarea != null)
				{
					graph.cellEditor.textarea.focus();
		      		document.execCommand('formatBlock', false, '<' + tag + '>');
				}
			}), parent);
		};

		addItem(mxResources.get('normal'), 'p');

		addItem('', 'h1').firstChild.nextSibling.innerHTML = '<h1 style="margin:0px;">' + mxResources.get('heading') + ' 1</h1>';
		addItem('', 'h2').firstChild.nextSibling.innerHTML = '<h2 style="margin:0px;">' + mxResources.get('heading') + ' 2</h2>';
		addItem('', 'h3').firstChild.nextSibling.innerHTML = '<h3 style="margin:0px;">' + mxResources.get('heading') + ' 3</h3>';
		addItem('', 'h4').firstChild.nextSibling.innerHTML = '<h4 style="margin:0px;">' + mxResources.get('heading') + ' 4</h4>';
		addItem('', 'h5').firstChild.nextSibling.innerHTML = '<h5 style="margin:0px;">' + mxResources.get('heading') + ' 5</h5>';
		addItem('', 'h6').firstChild.nextSibling.innerHTML = '<h6 style="margin:0px;">' + mxResources.get('heading') + ' 6</h6>';

		addItem('', 'pre').firstChild.nextSibling.innerHTML = '<pre style="margin:0px;">' + mxResources.get('formatted') + '</pre>';
		addItem('', 'blockquote').firstChild.nextSibling.innerHTML = '<blockquote style="margin-top:0px;margin-bottom:0px;">' + mxResources.get('blockquote') + '</blockquote>';
	})));
	this.put('fontSize', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		var sizes = [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 36, 48, 72];

		var addItem = mxUtils.bind(this, function(fontsize)
		{
			this.styleChange(menu, fontsize, [mxConstants.STYLE_FONTSIZE], [fontsize], null, parent, () => {
				this.editorUi.applyFontSize(fontsize);
			})
		});

		for (var i = 0; i < sizes.length; i++)
		{
			addItem(sizes[i]);
		}
	})));
	this.put('direction', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		menu.addItem(mxResources.get('flipH'), null, function() { graph.toggleCellStyles(mxConstants.STYLE_FLIPH, false); }, parent);
		menu.addItem(mxResources.get('flipV'), null, function() { graph.toggleCellStyles(mxConstants.STYLE_FLIPV, false); }, parent);
		this.addMenuItems(menu, ['-', 'rotation'], parent);
	})));
	this.put('align', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		menu.addItem(mxResources.get('leftAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_LEFT); }, parent);
		menu.addItem(mxResources.get('center'), null, function() { graph.alignCells(mxConstants.ALIGN_CENTER); }, parent);
		menu.addItem(mxResources.get('rightAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_RIGHT); }, parent);
		menu.addSeparator(parent);
		menu.addItem(mxResources.get('topAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_TOP); }, parent);
		menu.addItem(mxResources.get('middle'), null, function() { graph.alignCells(mxConstants.ALIGN_MIDDLE); }, parent);
		menu.addItem(mxResources.get('bottomAlign'), null, function() { graph.alignCells(mxConstants.ALIGN_BOTTOM); }, parent);
	})));
	this.put('distribute', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		menu.addItem(mxResources.get('horizontal'), null, function() { graph.distributeCells(true); }, parent);
		menu.addItem(mxResources.get('vertical'), null, function() { graph.distributeCells(false); }, parent);
	})));
	this.put('layout', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		var promptSpacing = mxUtils.bind(this, function(defaultValue, fn)
		{
			var dlg = new FilenameDialog(this.editorUi, defaultValue, mxResources.get('apply'), function(newValue)
			{
				fn(parseFloat(newValue));
			}, mxResources.get('spacing'));
			this.editorUi.showDialog(dlg.container, 300, 80, true, true);
			dlg.init();
		});

		menu.addItem(mxResources.get('horizontalFlow'), null, mxUtils.bind(this, function()
		{
			var layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);

    		this.editorUi.executeLayout(function()
    		{
    			var selectionCells = graph.getSelectionCells();
    			layout.execute(graph.getDefaultParent(), selectionCells.length == 0 ? null : selectionCells);
    		}, true);
		}), parent);
		menu.addItem(mxResources.get('verticalFlow'), null, mxUtils.bind(this, function()
		{
			var layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_NORTH);

    		this.editorUi.executeLayout(function()
    		{
    			var selectionCells = graph.getSelectionCells();
    			layout.execute(graph.getDefaultParent(), selectionCells.length == 0 ? null : selectionCells);
    		}, true);
		}), parent);
		menu.addSeparator(parent);
		menu.addItem(mxResources.get('horizontalTree'), null, mxUtils.bind(this, function()
		{
			var tmp = graph.getSelectionCell();
			var roots = null;

			if (tmp == null || graph.getModel().getChildCount(tmp) == 0)
			{
				if (graph.getModel().getEdgeCount(tmp) == 0)
				{
					roots = graph.findTreeRoots(graph.getDefaultParent());
				}
			}
			else
			{
				roots = graph.findTreeRoots(tmp);
			}

			if (roots != null && roots.length > 0)
			{
				tmp = roots[0];
			}

			if (tmp != null)
			{
				var layout = new mxCompactTreeLayout(graph, true);
				layout.edgeRouting = false;
				layout.levelDistance = 30;

				promptSpacing(layout.levelDistance, mxUtils.bind(this, function(newValue)
				{
					layout.levelDistance = newValue;

					this.editorUi.executeLayout(function()
		    		{
						layout.execute(graph.getDefaultParent(), tmp);
		    		}, true);
				}));
			}
		}), parent);
		menu.addItem(mxResources.get('verticalTree'), null, mxUtils.bind(this, function()
		{
			var tmp = graph.getSelectionCell();
			var roots = null;

			if (tmp == null || graph.getModel().getChildCount(tmp) == 0)
			{
				if (graph.getModel().getEdgeCount(tmp) == 0)
				{
					roots = graph.findTreeRoots(graph.getDefaultParent());
				}
			}
			else
			{
				roots = graph.findTreeRoots(tmp);
			}

			if (roots != null && roots.length > 0)
			{
				tmp = roots[0];
			}

			if (tmp != null)
			{
				var layout = new mxCompactTreeLayout(graph, false);
				layout.edgeRouting = false;
				layout.levelDistance = 30;

				promptSpacing(layout.levelDistance, mxUtils.bind(this, function(newValue)
				{
					layout.levelDistance = newValue;

					this.editorUi.executeLayout(function()
		    		{
						layout.execute(graph.getDefaultParent(), tmp);
		    		}, true);
				}));
			}
		}), parent);
		menu.addItem(mxResources.get('radialTree'), null, mxUtils.bind(this, function()
		{
			var tmp = graph.getSelectionCell();
			var roots = null;

			if (tmp == null || graph.getModel().getChildCount(tmp) == 0)
			{
				if (graph.getModel().getEdgeCount(tmp) == 0)
				{
					roots = graph.findTreeRoots(graph.getDefaultParent());
				}
			}
			else
			{
				roots = graph.findTreeRoots(tmp);
			}

			if (roots != null && roots.length > 0)
			{
				tmp = roots[0];
			}

			if (tmp != null)
			{
				var layout = new mxRadialTreeLayout(graph, false);
				layout.levelDistance = 80;
				layout.autoRadius = true;

				promptSpacing(layout.levelDistance, mxUtils.bind(this, function(newValue)
				{
					layout.levelDistance = newValue;

					this.editorUi.executeLayout(function()
		    		{
		    			layout.execute(graph.getDefaultParent(), tmp);

		    			if (!graph.isSelectionEmpty())
		    			{
			    			tmp = graph.getModel().getParent(tmp);

			    			if (graph.getModel().isVertex(tmp))
			    			{
			    				graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
			    			}
		    			}
		    		}, true);
				}));
			}
		}), parent);
		menu.addSeparator(parent);
		menu.addItem(mxResources.get('organic'), null, mxUtils.bind(this, function()
		{
			var layout = new mxFastOrganicLayout(graph);

			promptSpacing(layout.forceConstant, mxUtils.bind(this, function(newValue)
			{
				layout.forceConstant = newValue;

	    		this.editorUi.executeLayout(function()
	    		{
	    			var tmp = graph.getSelectionCell();

	    			if (tmp == null || graph.getModel().getChildCount(tmp) == 0)
	    			{
	    				tmp = graph.getDefaultParent();
	    			}

	    			layout.execute(tmp);

	    			if (graph.getModel().isVertex(tmp))
	    			{
	    				graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
	    			}
	    		}, true);
			}));
		}), parent);
		menu.addItem(mxResources.get('circle'), null, mxUtils.bind(this, function()
		{
			var layout = new mxCircleLayout(graph);

    		this.editorUi.executeLayout(function()
    		{
    			var tmp = graph.getSelectionCell();

    			if (tmp == null || graph.getModel().getChildCount(tmp) == 0)
    			{
    				tmp = graph.getDefaultParent();
    			}

    			layout.execute(tmp);

    			if (graph.getModel().isVertex(tmp))
    			{
    				graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
    			}
    		}, true);
		}), parent);
	})));
	this.put('navigation', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['home', '-', 'exitGroup', 'enterGroup', '-', 'expand', 'collapse', '-', 'collapsible'], parent);
	})));
	this.put('arrange', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['toFront', 'toBack', '-'], parent);
		this.addSubmenu('direction', menu, parent);
		this.addMenuItems(menu, ['turn', '-'], parent);
		this.addSubmenu('align', menu, parent);
		this.addSubmenu('distribute', menu, parent);
		menu.addSeparator(parent);
		this.addSubmenu('navigation', menu, parent);
		this.addSubmenu('insert', menu, parent);
		this.addSubmenu('layout', menu, parent);
		this.addMenuItems(menu, ['-', 'group', 'ungroup', 'removeFromGroup', '-', 'clearWaypoints', 'autosize'], parent);
	}))).isEnabled = isGraphEnabled;
	this.put('insert', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['insertLink', 'insertImage'], parent);
	})));
	this.put('view', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ((this.editorUi.format != null) ? ['formatPanel'] : []).
			concat(['outline', 'layers', '-', 'pageView', 'pageScale', '-', 'scrollbars', 'tooltips', '-',
			        'grid', 'guides', '-', 'connectionArrows', 'connectionPoints', '-',
			        'resetView', 'zoomIn', 'zoomOut'], parent));
	})));
	// Two special dropdowns that are only used in the toolbar
	this.put('viewPanels', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		if (this.editorUi.format != null)
		{
			this.addMenuItems(menu, ['formatPanel'], parent);
		}

		this.addMenuItems(menu, ['outline', 'layers'], parent);
	})));
	this.put('viewZoom', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['resetView', '-'], parent);
		var scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

		for (var i = 0; i < scales.length; i++)
		{
			(function(scale)
			{
				menu.addItem((scale * 100) + '%', null, function()
				{
					graph.zoomTo(scale);
				}, parent);
			})(scales[i]);
		}

		this.addMenuItems(menu, ['-', 'fitWindow', 'fitPageWidth', 'fitPage', 'fitTwoPages', '-', 'customZoom'], parent);
	})));
	this.put('file', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['new', 'open', '-', 'save', 'saveAs', '-', 'import', 'export', '-', 'pageSetup', 'print'], parent);
	})));
	this.put('edit', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['undo', 'redo', '-', 'cut', 'copy', 'paste', 'delete', '-', 'duplicate', '-',
		                         'editData', 'editTooltip', 'editStyle', '-', 'edit', '-', 'editLink', 'openLink', '-',
		                         'selectVertices', 'selectEdges', 'selectAll', 'selectNone', '-', 'lockUnlock']);
	})));
	this.put('extras', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['copyConnect', 'collapseExpand', '-', 'editDiagram']);
	})));
	this.put('help', new Menu(mxUtils.bind(this, function(menu, parent)
	{
		this.addMenuItems(menu, ['help', '-', 'about']);
	})));
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.put = function(name, menu)
{
	this.menus[name] = menu;

	return menu;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.get = function(name)
{
	return this.menus[name];
};

/**
 * Adds the given submenu.
 */
Menus.prototype.addSubmenu = function(name, menu, parent, label)
{
	var entry = this.get(name);

	if (entry != null)
	{
		var enabled = entry.isEnabled();

		if (menu.showDisabled || enabled)
		{
			var submenu = menu.addItem(label || mxResources.get(name), null, null, parent, null, enabled);
			this.addMenu(name, menu, submenu);
		}
	}
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.addMenu = function(name, popupMenu, parent)
{
	var menu = this.get(name);

	if (menu != null && (popupMenu.showDisabled || menu.isEnabled()))
	{
		this.get(name).execute(popupMenu, parent);
	}
};

/**
 * Adds a menu item to insert a table.
 */
Menus.prototype.addInsertTableItem = function(menu)
{
	// KNOWN: Does not work in IE8 standards and quirks
	var graph = this.editorUi.editor.graph;

	function createTable(rows, cols)
	{
		var html = ['<table>'];

		for (var i = 0; i < rows; i++)
		{
			html.push('<tr>');

			for (var j = 0; j < cols; j++)
			{
				html.push('<td><br></td>');
			}

			html.push('</tr>');
		}

		html.push('</table>');

		return html.join('');
	};

	// Show table size dialog
	var elt2 = menu.addItem('', null, mxUtils.bind(this, function(evt)
	{
		var td = graph.getParentByName(mxEvent.getSource(evt), 'TD');

		if (td != null)
		{
			var row2 = graph.getParentByName(td, 'TR');

			// To find the new link, we create a list of all existing links first
    		// LATER: Refactor for reuse with code for finding inserted image below
			var tmp = graph.cellEditor.textarea.getElementsByTagName('table');
			var oldTables = [];

			for (var i = 0; i < tmp.length; i++)
			{
				oldTables.push(tmp[i]);
			}

			// Finding the new table will work with insertHTML, but IE does not support that
			graph.container.focus();
			graph.pasteHtmlAtCaret(createTable(row2.sectionRowIndex + 1, td.cellIndex + 1));

			// Moves cursor to first table cell
			var newTables = graph.cellEditor.textarea.getElementsByTagName('table');

			if (newTables.length == oldTables.length + 1)
			{
				// Inverse order in favor of appended tables
				for (var i = newTables.length - 1; i >= 0; i--)
				{
					if (i == 0 || newTables[i] != oldTables[i - 1])
					{
						graph.selectNode(newTables[i].rows[0].cells[0]);
						break;
					}
				}
			}
		}
	}));

	// Quirks mode does not add cell padding if cell is empty, needs good old spacer solution
	var quirksCellHtml = '<img src="' + mxClient.imageBasePath + '/transparent.gif' + '" width="16" height="16"/>';

	function createPicker(rows, cols)
	{
		var table2 = document.createElement('table');
		table2.setAttribute('border', '1');
		table2.style.borderCollapse = 'collapse';

		if (!mxClient.IS_QUIRKS)
		{
			table2.setAttribute('cellPadding', '8');
		}

		for (var i = 0; i < rows; i++)
		{
			var row = table2.insertRow(i);

			for (var j = 0; j < cols; j++)
			{
				var cell = row.insertCell(-1);

				if (mxClient.IS_QUIRKS)
				{
					cell.innerHTML = quirksCellHtml;
				}
			}
		}

		return table2;
	};

	function extendPicker(picker, rows, cols)
	{
		for (var i = picker.rows.length; i < rows; i++)
		{
			var row = picker.insertRow(i);

			for (var j = 0; j < picker.rows[0].cells.length; j++)
			{
				var cell = row.insertCell(-1);

				if (mxClient.IS_QUIRKS)
				{
					cell.innerHTML = quirksCellHtml;
				}
			}
		}

		for (var i = 0; i < picker.rows.length; i++)
		{
			var row = picker.rows[i];

			for (var j = row.cells.length; j < cols; j++)
			{
				var cell = row.insertCell(-1);

				if (mxClient.IS_QUIRKS)
				{
					cell.innerHTML = quirksCellHtml;
				}
			}
		}
	};

	elt2.firstChild.innerHTML = '';
	var picker = createPicker(5, 5);
	elt2.firstChild.appendChild(picker);

	var label = document.createElement('div');
	label.style.padding = '4px';
	label.style.fontSize = Menus.prototype.defaultFontSize + 'px';
	label.innerHTML = '1x1';
	elt2.firstChild.appendChild(label);

	mxEvent.addListener(picker, 'mouseover', function(e)
	{
		var td = graph.getParentByName(mxEvent.getSource(e), 'TD');

		if (td != null)
		{
			var row2 = graph.getParentByName(td, 'TR');
			extendPicker(picker, Math.min(20, row2.sectionRowIndex + 2), Math.min(20, td.cellIndex + 2));
			label.innerHTML = (td.cellIndex + 1) + 'x' + (row2.sectionRowIndex + 1);

			for (var i = 0; i < picker.rows.length; i++)
			{
				var r = picker.rows[i];

				for (var j = 0; j < r.cells.length; j++)
				{
					var cell = r.cells[j];

					if (i <= row2.sectionRowIndex && j <= td.cellIndex)
					{
						cell.style.backgroundColor = 'blue';
					}
					else
					{
						cell.style.backgroundColor = 'white';
					}
				}
			}

			mxEvent.consume(e);
		}
	});
};

/**
 * Adds a style change item to the given menu.
 */
Menus.prototype.edgeStyleChange = function(menu, label, keys, values, sprite, parent, reset, checkmark)
{
	var item = menu.addItem(label, null, mxUtils.bind(this, function()
	{
		var graph = this.editorUi.editor.graph;
		graph.stopEditing(false);

		graph.getModel().beginUpdate();
		try
		{
			var cells = graph.getSelectionCells();
			var edges = [];

			for (var i = 0; i < cells.length; i++)
			{
				var cell = cells[i];

				if (graph.getModel().isEdge(cell))
				{
					if (reset)
					{
						var geo = graph.getCellGeometry(cell);

						// Resets all edge points
						if (geo != null)
						{
							geo = geo.clone();
							geo.points = null;
							graph.getModel().setGeometry(cell, geo);
						}
					}

					for (var j = 0; j < keys.length; j++)
					{
						graph.setCellStyles(keys[j], values[j], [cell]);
					}

					edges.push(cell);
				}
			}

			this.editorUi.fireEvent(new mxEventObject('styleChanged', 'keys', keys,
				'values', values, 'cells', edges));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	}), parent, sprite);

	if(checkmark) {
		menu.addCheckmark(item, Editor.checkmarkImage);
	}
};

/**
 * Adds a style change item to the given menu.
 */
Menus.prototype.styleChange = function(menu, label, keys, values, sprite, parent, fn, post)
{
	var apply = this.createStyleChangeFunction(keys, values);

	return menu.addItem(label, null, mxUtils.bind(this, function()
	{
		var graph = this.editorUi.editor.graph;

		if (fn != null && graph.cellEditor.isContentEditing())
		{
			fn();
		}
		else
		{
			apply(post);
		}
	}), parent, sprite);
};

/**
 *
 */
Menus.prototype.createStyleChangeFunction = function(keys, values)
{
	return mxUtils.bind(this, function(post)
	{
		var graph = this.editorUi.editor.graph;
		var containers = [];
		graph.stopEditing(false);

		graph.getModel().beginUpdate();
		try
		{
			var cells = graph.getSelectionCells();
			if(cells && cells.length) {
				cells.forEach(cell => {
					if(inspectioUtils.isContainer(cell)) {
						containers.push(cell);
					}
				})
			}

			for (var i = 0; i < keys.length; i++)
			{
				graph.setCellStyles(keys[i], values[i]);
				containers.forEach(container => graph.syncContainerStyles(container, keys[i], values[i]));
			}

			if (post != null)
			{
				post();
			}

			this.editorUi.fireEvent(new mxEventObject('styleChanged', 'keys', keys, 'values', values,
				'cells', graph.getSelectionCells()));
		}
		finally
		{
			graph.getModel().endUpdate();
		}
	});
};

/**
 * Adds a style change item with a prompt to the given menu.
 */
Menus.prototype.promptChange = function(menu, label, hint, defaultValue, key, parent, enabled, fn, sprite)
{
	return menu.addItem(label, null, mxUtils.bind(this, function()
	{
		var graph = this.editorUi.editor.graph;
		var value = defaultValue;
    	var state = graph.getView().getState(graph.getSelectionCell());

    	if (state != null)
    	{
    		value = state.style[key] || value;
    	}

		var dlg = new FilenameDialog(this.editorUi, value, mxResources.get('apply'), mxUtils.bind(this, function(newValue)
		{
			if (newValue != null && newValue.length > 0)
			{
				graph.getModel().beginUpdate();
				try
				{
					graph.stopEditing(false);
					graph.setCellStyles(key, newValue);
				}
				finally
				{
					graph.getModel().endUpdate();
				}

				if (fn != null)
				{
					fn(newValue);
				}
			}
		}), mxResources.get('enterValue') + ((hint.length > 0) ? (' ' + hint) : ''));
		this.editorUi.showDialog(dlg.container, 300, 80, true, true);
		dlg.init();
	}), parent, sprite, enabled);
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menus.prototype.pickColor = function(key, cmd, defaultValue, onFinish)
{
	var graph = this.editorUi.editor.graph;
	var h = 285 + ((Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
			Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17);

	if (cmd != null && graph.cellEditor.isContentEditing())
	{
		// Saves and restores text selection for in-place editor
		var selState = graph.cellEditor.saveSelection();

		var dlg = new ColorDialog(this.editorUi, defaultValue || '000000', mxUtils.bind(this, function(color)
		{
			graph.cellEditor.restoreSelection(selState);

			color = (color != mxConstants.NONE) ? color : 'transparent';

			if(cmd === ispConst.CMD_PICK_COLOR_CELL_BACKGROUND) {
				let cellStyle = graph.cellEditor.editingCell.getStyle();
				if(inspectioUtils.isIcon(graph.cellEditor.editingCell)) {
					cellStyle = inspectioUtils.setIconColor(cellStyle, color);
				} else {
					cellStyle = mxUtils.setStyle(cellStyle, mxConstants.STYLE_FILLCOLOR, color);
				}

				graph.model.beginUpdate();
				graph.setCellStyle(cellStyle, [graph.cellEditor.editingCell]);
				graph.syncContainerStyles(graph.cellEditor.editingCell, mxConstants.STYLE_FILLCOLOR, color);
				graph.model.endUpdate();
			} else {
				document.execCommand(cmd, false, color);
			}

			if(onFinish) {
				onFinish(color);
			}
		}), function()
		{
			graph.cellEditor.restoreSelection(selState);
		});
		this.editorUi.showDialog(dlg.container, 300, h, true, true);
		dlg.init();
	}
	else
	{
		if (this.colorDialog == null)
		{
			this.colorDialog = new ColorDialog(this.editorUi);
		}

		this.colorDialog.currentColorKey = key;
		var state = graph.getView().getState(graph.getSelectionCell());
		var color = 'none';

		if (state != null)
		{
			color = state.style[key] || color;
		}

		if (color == 'none')
		{
			color = 'ffffff';
			this.colorDialog.picker.fromString('ffffff');
			this.colorDialog.colorInput.value = 'none';
		}
		else
		{
			this.colorDialog.picker.fromString(color);
		}

		this.editorUi.showDialog(this.colorDialog.container, 230, h, true, true);
		this.colorDialog.init();
	}
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menus.prototype.toggleStyle = function(key, defaultValue)
{
	var graph = this.editorUi.editor.graph;
	var value = graph.toggleCellStyles(key, defaultValue);
	this.editorUi.fireEvent(new mxEventObject('styleChanged', 'keys', [key], 'values', [value],
			'cells', graph.getSelectionCells()));
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addMenuItem = function(menu, key, parent, trigger, sprite, label, checkmark, icon)
{
	var action = this.editorUi.actions.get(key);

	if (action != null && (menu.showDisabled || action.isEnabled()) && action.visible)
	{
		if(!icon) {
			icon = null;
		}

		var item = menu.addItem(label || action.label, icon, function()
		{
			action.funct(trigger);
		}, parent, sprite, action.isEnabled());

		// Adds checkmark image
		if ((action.toggleAction && action.isSelected()) || checkmark)
		{
			menu.addCheckmark(item, Editor.checkmarkImage);
		}

		this.addShortcut(item, action);

		return item;
	}

	return null;
};

Menus.prototype.addColorPickerItem = function(menu, key, parent, currentColor)
{
	var action = this.editorUi.actions.get(key);

	if (action != null && (menu.showDisabled || action.isEnabled()) && action.visible) {
		var item = menu.addItem('Color Picker', null, function()
		{

		}, parent, undefined, action.isEnabled(), false);

		mxEvent.addGestureListeners(item, (e) => {
			e.stopPropagation();
			e.preventDefault();
		}, null, (e) => {
			e.stopPropagation();
			e.preventDefault();
		})


		var td = item.getElementsByTagName('td')[1];

		var colorPicker = document.createElement('input');

		colorPicker.setAttribute('type', 'color');
		colorPicker.setAttribute('value', currentColor);
		colorPicker.style.border = 'none';

		colorPicker.addEventListener('change', (e) => {
			action.funct(e.target.value);
			menu.hideMenu();
		})

		td.innerHTML = '';
		td.appendChild(colorPicker);

		this.addShortcut(item, action);

		return item;
	}

	return null;
}

/**
 * Adds a checkmark to the given menuitem.
 */
Menus.prototype.addShortcut = function(item, action)
{
	if (action.shortcut != null)
	{
		var td = item.firstChild.nextSibling.nextSibling;
		var span = document.createElement('span');
		span.style.color = 'gray';
		mxUtils.write(span, action.shortcut);
		td.appendChild(span);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addMenuItems = function(menu, keys, parent, trigger, sprites)
{
	for (var i = 0; i < keys.length; i++)
	{
		if (keys[i] == '-')
		{
			menu.addSeparator(parent);
		}
		else
		{
			this.addMenuItem(menu, keys[i], parent, trigger, (sprites != null) ? sprites[i] : null);
		}
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createPopupMenu = function(menu, cell, evt)
{
	var graph = this.editorUi.editor.graph;
	menu.smartSeparators = true;

	if (graph.isSelectionEmpty())
	{
		this.addMenuItem(menu, 'previousGraphPosition', null, evt, null, 'Goto last Position');
		this.addMenuItems(menu, ['undo', 'redo', 'pasteHere'], null, evt);

		if(graph.isVideoAvatarEnabled()) {
			menu.addSeparator();

			this.addMenuItem(menu, 'moveVideoAvatarHere', null, evt, null, 'Move Video Avatar Here');
			this.addMenuItem(menu, 'centerVideoAvatar', null, evt, null, 'Center Video Avatar');
		}
	}
	else
	{
		this.addMenuItem(menu, 'deeplink', null, evt, null, 'Direct Link');

		if(graph.hasCockpitBaseUrl() && [ispConst.TYPE_AGGREGATE, ispConst.TYPE_COMMAND, ispConst.TYPE_EVENT, ispConst.TYPE_DOCUMENT].includes(inspectioUtils.getType(cell))) {
			this.addMenuItem(menu, 'cockpit', null, evt, null, 'Open In Cockpit');
		}

		if(inspectioUtils.isBoundedContext(cell)) {
			this.addMenuItem(menu, 'linkboard', null, evt, null, 'Link To Board');
		}

		if(inspectioUtils.isFeature(cell)) {
			this.addMenuItem(menu, 'linktask', null, evt, null, 'Link To Task');
		}

		if(graph.getSelectionCount() === 1 && inspectioUtils.isSticky(cell)) {
			var typeMenu = menu.addItem('Sticky Type');

			var currentType = inspectioUtils.getType(cell);

			var shortcuts = {
				'event': 'ALT+E',
				'command': 'ALT+C',
				'aggregate': 'ALT+A',
				'role': 'ALT+R',
				'document': 'ALT+D',
				'externalSystem': 'ALT+S',
				'hotSpot': 'ALT+H',
				'policy': 'ALT+P',
				'ui': 'ALT+U',
			}

			inspectioUtils.STICKY_TYPES.forEach(type => {
				const label = type.charAt(0).toLocaleUpperCase() + type.slice(1).replaceAll(/[A-Z]/g, a => ' ' + a);
				const stickyItem = this.addMenuItem(menu, 'change_sticky_type', typeMenu, type, null, label, currentType === type);

				let col = stickyItem.getElementsByTagName('td')[2];

				if(shortcuts.hasOwnProperty(type)) {
					col.style.color = 'grey';
					col.innerHTML = '<span style="padding-right: 10px">' + shortcuts[type] + '</span>';
				}

				const stickyImage = document.createElement('img');
				stickyImage.setAttribute('src', inspectioUtils.getIconImageSrcForStickyType(type, 18));
				col.appendChild(stickyImage);
			})

			var stickyState = graph.view.getState(cell);
			var isStickyComicStyle = mxUtils.getValue(stickyState.style, 'comic', false);

			menu.addSeparator(typeMenu);

			this.addMenuItem(menu, isStickyComicStyle? 'remove_comic_style' : 'set_comic_style', typeMenu, evt, null, 'Comic Style', isStickyComicStyle);
		}

		this.addMenuItem(menu, 'lookup_element', null, evt, null, 'Find Similar');

		menu.addSeparator();

		if(inspectioUtils.isContainer(cell)) {
			var markAs = menu.addItem('Mark as');

			this.addMenuItem(menu, 'tagImportant', markAs, evt, null, 'Important', inspectioUtils.hasTag(cell, ispConst.TAG_IMPORTANT));
			// @TODO: Remove fallback "planed" after a while, corrected spelling: 2019-11-26
			this.addMenuItem(menu, 'tagPlanned', markAs, evt, null, 'Planned', inspectioUtils.hasTag(cell, ispConst.TAG_PLANNED) || inspectioUtils.hasTag(cell, 'planed'));
			this.addMenuItem(menu, 'tagReady', markAs, evt, null, 'Ready', inspectioUtils.hasTag(cell, ispConst.TAG_READY));
			this.addMenuItem(menu, 'tagDeployed', markAs, evt, null, 'Deployed', inspectioUtils.hasTag(cell, ispConst.TAG_DEPLOYED));

			if(inspectioUtils.isEventModel(cell)) {
				var swimLanes = menu.addItem('Swim lanes');
				this.addMenuItem(menu, 'change_default_event_model', swimLanes, evt, null, 'Blueprint', inspectioUtils.hasTag(cell, ispConst.TAG_DEFAULT_SLICE) || inspectioUtils.hasTag(cell, ispConst.TAG_DEFAULT_EVENT_MODEL));
				this.addMenuItem(menu, 'sync_lanes_from_default_event_model', swimLanes, evt, null, 'Copy from Blueprint');
				this.addMenuItem(menu, 'sync_slice_lanes', swimLanes, evt, null, 'Copy to all Event Models');
			}

			var liteMode = menu.addItem('Lite Mode');
			if(graph.hasAlternateStyle(cell)) {
				this.addMenuItem(menu, 'show_container_details', liteMode, evt, null, 'Show Details');
			} else {
				this.addMenuItem(menu, 'hide_container_details', liteMode, evt, null, 'Hide Details');
			}

			var birdView = menu.addItem('Bird View');
			this.addMenuItem(menu, 'toggleswimlane', birdView, evt, null, 'Hide Details', !inspectioUtils.isContainerSwimLane(cell));

			menu.addSeparator();
		}

		this.addMenuItems(menu, ['cut', 'copy', 'delete'], null, evt);

		if(inspectioUtils.isContainer(cell)) {
			this.addMenuItems(menu, ['pasteHere'], null, evt);
		}

		if(graph.getSelectionCount() > 0 && inspectioUtils.isEventModel(cell.parent)) {
			this.addMenuItem(menu, 'make_space_in_event_model', null, evt, null, 'Make Space');
		}

		menu.addSeparator();
	}

	if (!graph.isSelectionEmpty())
	{
		cell = graph.getSelectionCell();
		var state = graph.view.getState(cell);

		if (state != null)
		{
			var hasWaypoints = false;
			var cellStyle = graph.getCellStyle(cell);
			this.addMenuItems(menu, ['toFront', 'toBack'], null, evt);

			if(graph.getSelectionCount() > 1) {
				const alignMenu = menu.addItem('Align');


				const horizontalMenu = menu.addItem('horizontal', null, null, alignMenu);

				this.addMenuItem(menu, 'align_horizontal_left', horizontalMenu, evt, null, 'left');
				this.addMenuItem(menu, 'align_horizontal_center', horizontalMenu, evt, null, 'center');
				this.addMenuItem(menu, 'align_horizontal_right', horizontalMenu, evt, null, 'right');

				const verticalMenu = menu.addItem('vertical', null, null, alignMenu);

				this.addMenuItem(menu, 'align_vertical_up', verticalMenu, evt, null, 'up');
				this.addMenuItem(menu, 'align_vertical_middle', verticalMenu, evt, null, 'middle');
				this.addMenuItem(menu, 'align_vertical_down', verticalMenu, evt, null, 'down');
			}

			menu.addSeparator();

			var isComicStyle = mxUtils.getValue(state.style, 'comic', false);

			if(graph.getSelectionCount() > 1) {
				this.addMenuItem(menu, isComicStyle? 'remove_comic_style' : 'set_comic_style', null, evt, null, 'Comic Style', isComicStyle);
			}

			if (graph.getSelectionCount() === 1 && graph.getModel().isEdge(cell)) {
				menu.addSeparator();
				var cellStyle = graph.getCellStyle(cell);

				var currentEdgeType = mxUtils.getValue(state.style, mxConstants.STYLE_EDGE, null);
				var curved = mxUtils.getValue(state.style, mxConstants.STYLE_CURVED, null);
				var startArrow = mxUtils.getValue(state.style, mxConstants.STYLE_STARTARROW, null);
				var endArrow = mxUtils.getValue(state.style, mxConstants.STYLE_ENDARROW, null);
				var currentStrokeWidth = mxUtils.getValue(state.style, mxConstants.STYLE_STROKEWIDTH, null);
				var currentDashPattern = mxUtils.getValue(state.style, mxConstants.STYLE_DASH_PATTERN, null);
				var currentStrokeColor = mxUtils.getValue(state.style, mxConstants.STYLE_STROKECOLOR, '#000000');

				var edgeTypeMenu = menu.addItem('Edge Type');
				this.edgeStyleChange(menu, 'elbow', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE], ['orthogonalEdgeStyle', null, null], null, edgeTypeMenu, true, (currentEdgeType === 'orthogonalEdgeStyle' && curved === null) || currentEdgeType === null, true);
				this.edgeStyleChange(menu, 'straight', [mxConstants.STYLE_EDGE, mxConstants.STYLE_ELBOW, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE], ['isometricEdgeStyle', null, null, null], null, edgeTypeMenu, true, currentEdgeType === 'isometricEdgeStyle', true);
				this.edgeStyleChange(menu, 'curved', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE], ['orthogonalEdgeStyle', '1', null], null, edgeTypeMenu, true, currentEdgeType === 'orthogonalEdgeStyle' && curved === 1, true);
				this.edgeStyleChange(menu, 'relation', [mxConstants.STYLE_EDGE, mxConstants.STYLE_CURVED, mxConstants.STYLE_NOEDGESTYLE], ['entityRelationEdgeStyle', null, null], null, edgeTypeMenu, true, currentEdgeType === 'entityRelationEdgeStyle', true);

				var arrowMenu = menu.addItem('Arrows');
				var hasStartArrow = startArrow != null && startArrow !== 'none';
				var hasEndArrow = endArrow != null && endArrow !== 'none';
				this.edgeStyleChange(menu, 'Start Arrow', [mxConstants.STYLE_STARTARROW], [hasStartArrow? 'none' : mxConstants.ARROW_OPEN], null, arrowMenu, false, hasStartArrow);
				this.edgeStyleChange(menu, 'End Arrwo', [mxConstants.STYLE_ENDARROW], [hasEndArrow? 'none' : mxConstants.ARROW_OPEN], null, arrowMenu, false, hasEndArrow);

				var lineStyle = menu.addItem('Line Style');

				this.addColorPickerItem(menu, 'set_edge_color', lineStyle, currentStrokeColor);

				menu.addSeparator(lineStyle);

				if (mxUtils.getValue(cellStyle, mxConstants.STYLE_DASHED, false)) {
					if(currentDashPattern === '1 4') {
						this.addMenuItem(menu, 'set_dashed_style', lineStyle, evt, null, 'Dashed', currentDashPattern === null);
						this.addMenuItem(menu, 'set_non_dashed_style', lineStyle, evt, null, 'Dotted', currentDashPattern === '1 4');
					} else {
						this.addMenuItem(menu, 'set_non_dashed_style', lineStyle, evt, null, 'Dashed', currentDashPattern === null);
						this.addMenuItem(menu, 'set_dotted_style', lineStyle, evt, null, 'Dotted', currentDashPattern === '1 4');
					}
				} else {
					this.addMenuItem(menu, 'set_dashed_style', lineStyle, evt, null, 'Dashed', false);
					this.addMenuItem(menu, 'set_dotted_style', lineStyle, evt, null, 'Dotted', false);
				}

				this.addMenuItem(menu, isComicStyle? 'remove_comic_style' : 'set_comic_style', lineStyle, evt, null, 'Comic', isComicStyle);

				menu.addSeparator(lineStyle);

				var thickness = menu.addItem('Thickness', null, null, lineStyle);

				console.log("strokeWidth", currentStrokeWidth);
				this.edgeStyleChange(menu, '1x', [mxConstants.STYLE_STROKEWIDTH], '1', null, thickness, false, currentStrokeWidth === 1);
				this.edgeStyleChange(menu, '2x', [mxConstants.STYLE_STROKEWIDTH], '2', null, thickness, false, currentStrokeWidth === 2);
				this.edgeStyleChange(menu, '3x', [mxConstants.STYLE_STROKEWIDTH], '3', null, thickness, false, currentStrokeWidth === 3);
				this.edgeStyleChange(menu, '4x', [mxConstants.STYLE_STROKEWIDTH], '4', null, thickness, false, currentStrokeWidth === 4);
				this.edgeStyleChange(menu, '5x', [mxConstants.STYLE_STROKEWIDTH], '5', null, thickness, false, currentStrokeWidth === 5);
				this.edgeStyleChange(menu, '7x', [mxConstants.STYLE_STROKEWIDTH], '7', null, thickness, false, currentStrokeWidth === 7);
				this.edgeStyleChange(menu, '9x', [mxConstants.STYLE_STROKEWIDTH], '9', null, thickness, false, currentStrokeWidth === 9);
			}

			if (inspectioUtils.isIcon(cell)) {
				menu.addSeparator();

				var labelPositionMenu = menu.addItem('Label Position');
				var horizontalPositionMenu = menu.addItem('horizontal', null, null, labelPositionMenu);
				var verticalPositionMenu = menu.addItem('vertical', null, null, labelPositionMenu);

				var hPosition = mxUtils.getValue(state.style, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_BOTTOM);
				var vPosition = mxUtils.getValue(state.style, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_CENTER);

				this.addMenuItem(menu, 'set_label_top', verticalPositionMenu, evt, null, 'top', vPosition === mxConstants.ALIGN_TOP);
				this.addMenuItem(menu, 'set_label_middle', verticalPositionMenu, evt, null, 'middle', vPosition === mxConstants.ALIGN_MIDDLE);
				this.addMenuItem(menu, 'set_label_bottom', verticalPositionMenu, evt, null, 'bottom', vPosition === mxConstants.ALIGN_BOTTOM);

				this.addMenuItem(menu, 'set_label_left', horizontalPositionMenu, evt, null, 'left', hPosition === mxConstants.ALIGN_LEFT);
				this.addMenuItem(menu, 'set_label_center', horizontalPositionMenu, evt, null, 'center', hPosition === mxConstants.ALIGN_CENTER);
				this.addMenuItem(menu, 'set_label_right', horizontalPositionMenu, evt, null, 'right', hPosition === mxConstants.ALIGN_RIGHT);
			}

			if (graph.getModel().isEdge(cell) && mxUtils.getValue(state.style, mxConstants.STYLE_EDGE, null) != 'entityRelationEdgeStyle' &&
				mxUtils.getValue(state.style, mxConstants.STYLE_SHAPE, null) != 'arrow')
			{
				var handler = graph.selectionCellsHandler.getHandler(cell);
				var isWaypoint = false;

				if (handler instanceof mxEdgeHandler && handler.bends != null && handler.bends.length > 2)
				{
					var index = handler.getHandleForEvent(graph.updateMouseEvent(new mxMouseEvent(evt)));

					// Configures removeWaypoint action before execution
					// Using trigger parameter is cleaner but have to find waypoint here anyway.
					var rmWaypointAction = this.editorUi.actions.get('removeWaypoint');
					rmWaypointAction.handler = handler;
					rmWaypointAction.index = index;

					isWaypoint = index > 0 && index < handler.bends.length - 1;
				}
				this.addMenuItem(menu, 'turn', null, evt, null, mxResources.get('reverse'));
				this.addMenuItems(menu, [(isWaypoint) ? 'removeWaypoint' : 'addWaypoint'], null, evt);
				// Adds reset waypoints option if waypoints exist
				var geo = graph.getModel().getGeometry(cell);
				hasWaypoints = geo != null && geo.points != null && geo.points.length > 0;
			}

			if (graph.getSelectionCount() == 1 && (hasWaypoints || (graph.getModel().isVertex(cell) &&
				graph.getModel().getEdgeCount(cell) > 0)))
			{
				this.addMenuItems(menu, ['clearWaypoints'], null, evt);
			}

			/*
			if (graph.getSelectionCount() > 1)
			{
				menu.addSeparator();
				this.addMenuItems(menu, ['group'], null, evt);
			}
			else if (graph.getSelectionCount() == 1 && !graph.getModel().isEdge(cell) && !inspectioUtils.isContainer(cell) &&
					graph.getModel().getChildCount(cell) > 0)
			{
				menu.addSeparator();
				this.addMenuItems(menu, ['ungroup'], null, evt);
			}
			*/


			if (graph.getSelectionCount() == 1)
			{
				if (graph.getModel().isVertex(cell))
				{
					menu.addSeparator();

					if (inspectioUtils.isImage(cell))
					{
						this.addMenuItem(menu, 'replaceimage', null, evt, null, 'Replace Image');
					}

					if(inspectioUtils.isContainer(cell) || inspectioUtils.isTextField(cell)) {
						var shapeMenu = menu.addItem('Style');

						var currentShape = mxUtils.getValue(state.style, mxConstants.STYLE_SHAPE, null);

						this.addMenuItem(menu, isComicStyle? 'remove_comic_style' : 'set_comic_style', shapeMenu, evt, null, 'Comic', isComicStyle);

						menu.addSeparator(shapeMenu);

						this.addMenuItem(menu, 'set_shape_rectangle', shapeMenu, evt, null, 'Rectangle', currentShape === mxConstants.SHAPE_RECTANGLE || currentShape === mxConstants.SHAPE_LABEL);
						this.addMenuItem(menu, 'set_shape_ellipse', shapeMenu, evt, null, 'Ellipse', currentShape === mxConstants.SHAPE_ELLIPSE);
						this.addMenuItem(menu, 'set_shape_triangle', shapeMenu, evt, null, 'Triangle', currentShape === mxConstants.SHAPE_TRIANGLE);
						this.addMenuItem(menu, 'set_shape_rhombus', shapeMenu, evt, null, 'Rhombus', currentShape === mxConstants.SHAPE_RHOMBUS);
						this.addMenuItem(menu, 'set_shape_hexagon', shapeMenu, evt, null, 'Hexagon', currentShape === mxConstants.SHAPE_HEXAGON);
					}

					this.addMenuItem(menu, 'trigger_cody', null, evt, null, 'Trigger Cody');

					this.addMenuItem(menu, 'show_element_metadata', null, evt, null, 'Metadata');
				}
			} else if (graph.getSelectionCount() === 2) {
				menu.addSeparator();

				this.addMenuItem(menu, 'show_side_by_side', null, evt, null, 'Side-by-Side');
			}
		}
	}
	else
	{
		this.addMenuItems(menu, ['-', 'selectVertices', 'selectEdges',
			'selectAll', '-'], null, evt);
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createMenubar = function(container)
{
	var menubar = new Menubar(this.editorUi, container);
	var menus = this.defaultMenuItems;

	for (var i = 0; i < menus.length; i++)
	{
		(mxUtils.bind(this, function(menu)
		{
			var elt = menubar.addMenu(mxResources.get(menus[i]), mxUtils.bind(this, function()
			{
				// Allows extensions of menu.funct
				menu.funct.apply(this, arguments);
			}));

			this.menuCreated(menu, elt);
		}))(this.get(menus[i]));
	}

	return menubar;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.menuCreated = function(menu, elt, className)
{
	if (elt != null)
	{
		className = (className != null) ? className : 'geItem';

		menu.addListener('stateChanged', function()
		{
			elt.enabled = menu.enabled;

			if (!menu.enabled)
			{
				elt.className = className + ' mxDisabled';

				if (document.documentMode == 8)
				{
					elt.style.color = '#c3c3c3';
				}
			}
			else
			{
				elt.className = className;

				if (document.documentMode == 8)
				{
					elt.style.color = '';
				}
			}
		});
	}
};

/**
 * Construcs a new menubar for the given editor.
 */
function Menubar(editorUi, container)
{
	this.editorUi = editorUi;
	this.container = container;
};

/**
 * Adds the menubar elements.
 */
Menubar.prototype.hideMenu = function()
{
	this.editorUi.hideCurrentMenu();
};

/**
 * Adds a submenu to this menubar.
 */
Menubar.prototype.addMenu = function(label, funct, before)
{
	var elt = document.createElement('a');
	elt.className = 'geItem';
	mxUtils.write(elt, label);
	this.addMenuHandler(elt, funct);

    if (before != null)
    {
    	this.container.insertBefore(elt, before);
    }
    else
    {
    	this.container.appendChild(elt);
    }

	return elt;
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menubar.prototype.addMenuHandler = function(elt, funct)
{
	if (funct != null)
	{
		var show = true;

		var clickHandler = mxUtils.bind(this, function(evt)
		{
			if (show && elt.enabled == null || elt.enabled)
			{
				this.editorUi.editor.graph.popupMenuHandler.hideMenu();
				var menu = new mxPopupMenu(funct);
				menu.div.className += ' geMenubarMenu';
				menu.smartSeparators = true;
				menu.showDisabled = true;
				menu.autoExpand = true;

				// Disables autoexpand and destroys menu when hidden
				menu.hideMenu = mxUtils.bind(this, function()
				{
					mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
					this.editorUi.resetCurrentMenu();
					menu.destroy();
				});

				var offset = mxUtils.getOffset(elt);
				menu.popup(offset.x, offset.y + elt.offsetHeight, null, evt);
				this.editorUi.setCurrentMenu(menu, elt);
			}

			mxEvent.consume(evt);
		});

		// Shows menu automatically while in expanded state
		mxEvent.addListener(elt, 'mousemove', mxUtils.bind(this, function(evt)
		{
			if (this.editorUi.currentMenu != null && this.editorUi.currentMenuElt != elt)
			{
				this.editorUi.hideCurrentMenu();
				clickHandler(evt);
			}
		}));

		// Hides menu if already showing and prevents focus
        mxEvent.addListener(elt, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown',
        	mxUtils.bind(this, function(evt)
		{
			show = this.currentElt != elt;
			evt.preventDefault();
		}));

		mxEvent.addListener(elt, 'click', mxUtils.bind(this, function(evt)
		{
			clickHandler(evt);
			show = true;
		}));
	}
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menubar.prototype.destroy = function()
{
	// do nothing
};

/**
 * Constructs a new action for the given parameters.
 */
function Menu(funct, enabled)
{
	mxEventSource.call(this);
	this.funct = funct;
	this.enabled = (enabled != null) ? enabled : true;
};

// Menu inherits from mxEventSource
mxUtils.extend(Menu, mxEventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.isEnabled = function()
{
	return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.setEnabled = function(value)
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
Menu.prototype.execute = function(menu, parent)
{
	this.funct(menu, parent);
};

/**
 * "Installs" menus in EditorUi.
 */
EditorUi.prototype.createMenus = function()
{
	return new Menus(this);
};
