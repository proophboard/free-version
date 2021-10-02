## Key Bindings

### mxKeyHandler

Event handler that listens to keystroke events. This is not a singleton,
however, it is normally only required once if the target is the document
element (default).

```js
var keyHandler = new mxKeyHandler(graph);
 keyHandler.bindKey(46, function(evt)
 {
   if (graph.isEnabled())
   {
     graph.removeCells();
   }
 });
 ```
 
### mxVertexHandler
 
Responsible for resizing verticies and groups
 
### mxGraphHandler

Responsible for selection and moving of cells.