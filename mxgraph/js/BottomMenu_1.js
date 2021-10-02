function BottomMenu(editorUi, container)
{
    this.editorUi = editorUi;
    this.container = container;

    this.init();
}

BottomMenu.prototype.init = function () {
    this.addMenuBar();
}

BottomMenu.prototype.addMenuBar = function () {
    const menuDiv = document.createElement('div');
    menuDiv.className = 'ui compact secondary menu';

    var undoBtn = document.createElement('button');
    undoBtn.className = 'ui circular icon button big';
    undoBtn.title = 'Undo (' + this.editorUi.actions.get('undo').shortcut + ')';
    var undoIcon = document.createElement('i');
    undoIcon.className = 'undo icon';
    undoBtn.appendChild(undoIcon);

    mxEvent.addListener(undoBtn, 'click', () => {
        this.editorUi.actions.get('undo').funct();
    });

    var redoBtn = document.createElement('button');
    redoBtn.className = 'ui circular icon button big';
    redoBtn.title = 'Redo (' + this.editorUi.actions.get('redo').shortcut + ')';
    var redoIcon = document.createElement('i');
    redoIcon.className = 'redo icon';
    redoBtn.appendChild(redoIcon);

    mxEvent.addListener(redoBtn, 'click', () => {
        this.editorUi.actions.get('redo').funct();
    });

    menuDiv.appendChild(undoBtn);
    menuDiv.appendChild(redoBtn);

    this.container.appendChild(menuDiv);
}

BottomMenu.prototype.destroy = function () {

}
