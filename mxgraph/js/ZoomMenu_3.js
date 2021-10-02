function ZoomMenu(editorUi, container)
{
    this.editorUi = editorUi;
    this.graph = editorUi.editor.graph;
    this.container = container;
    this.menuDiv = null;

    this.init();
}

ZoomMenu.prototype.init = function () {
    this.addMenuBar();
    this.addTouchpadBtn();
}

ZoomMenu.prototype.addMenuBar = function () {
    const menuDiv = document.createElement('div');
    menuDiv.className = 'ui compact secondary menu';

    var zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'ui circular icon button big';
    zoomInBtn.title = 'Zoom In (' + this.editorUi.actions.get('zoomIn').shortcut + ')';
    var zoomInIcon = document.createElement('i');
    zoomInIcon.className = 'zoom-in icon';
    zoomInBtn.appendChild(zoomInIcon);

    var zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'ui circular icon button big';
    zoomOutBtn.title = 'Zoom Out (' + this.editorUi.actions.get('zoomOut').shortcut + ')';
    var zoomOutIcon = document.createElement('i');
    zoomOutIcon.className = 'zoom-out icon';
    zoomOutBtn.appendChild(zoomOutIcon);

    mxEvent.addListener(zoomInBtn, 'click', () => {
        this.editorUi.actions.get('zoomIn').funct();
    });

    mxEvent.addListener(zoomOutBtn, 'click', () => {
        this.editorUi.actions.get('zoomOut').funct();
    });

    menuDiv.appendChild(zoomOutBtn);
    menuDiv.appendChild(zoomInBtn);

    this.container.appendChild(menuDiv);
    this.menuDiv = menuDiv;
}

ZoomMenu.prototype.addTouchpadBtn = function () {
    var touchBtn = document.createElement('button');
    touchBtn.className = 'ui circular icon button big';
    var touchIcon = document.createElement('i');

    touchBtn.appendChild(touchIcon);

    var toggleBtn = () => {
        touchBtn.title = this.graph.isTouchpadEnabled() ? 'Touchpad detected. Click to toggle mode.' : 'Mouse mode. Click to toggle.';
        touchIcon.className = this.graph.isTouchpadEnabled() ? 'hand peace outline icon' : 'mouse pointer icon';
    }

    toggleBtn();

    mxEvent.addListener(touchBtn, 'click', () => {
        this.graph.setTouchpadEnabled(!this.graph.isTouchpadEnabled());
        toggleBtn();
    });

    this.graph.addListener(this.graph.EVT_TOUCHPAD_DETECTED, (sender, evt) => {
        toggleBtn();
    });

    this.menuDiv.prepend(touchBtn);
}

ZoomMenu.prototype.destroy = function () {

}
