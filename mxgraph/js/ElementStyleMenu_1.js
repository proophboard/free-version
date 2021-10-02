function ElementStyleMenu(editorUi, container) {
    this.editorUi = editorUi;
    this.container = container;

    this.init();
}

ElementStyleMenu.prototype.init = () => {
    const menuDiv = document.createElement('div');
    menuDiv.className = 'ui compact vertical menu';


}