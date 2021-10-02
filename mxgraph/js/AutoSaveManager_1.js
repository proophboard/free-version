var oldAutoSaveManager = mxAutoSaveManager.prototype;
mxAutoSaveManager = function (graph) {
    // Notifies the manager of a change
    this.changeHandler = mxUtils.bind(this, function(sender, evt)
    {
        if (this.isEnabled())
        {
            var edit = evt.getProperty('edit');
            var changes = [];

            changes.push(...edit.changes);

            if(edit.undone && !edit.redone) {
                changes.reverse();
            }

            this.graphModelChanged(changes);
        }
    });

    this.setGraph(graph);
};
mxAutoSaveManager.prototype = oldAutoSaveManager;