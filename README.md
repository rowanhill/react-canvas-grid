# [react-canvas-grid](https://rowanhill.github.io/react-canvas-grid)
A canvas-powered, React-friendly datagrid component

Note: This library is still considered beta, because it currently has few consumers. Feel free to give it a try and report any issues!

There are already lots of excellent grid / table components that can be used with React, so why another one? Well, react-canvas-grid's
particular goals are:
* First-class support for complex data objects - rather than assuming every cell's value is a simple scalar
* High performance handling of all major operations (data editing, scrolling, selecting, etc) even with large grids - no visible redaws, lag, or hanging the main thead
* Range selection (although only a single range at a time), including the possibility to bulk update the selected area of the grid
* Arbitrary numbers of frozen rows / columns
* Support for column reordering / filtering (even if that's largely handled externally to the component)
* Column reordering by dragging (i.e. internally to the component)
* Focus/scroll to a column (for use with an external 'search' function)

There was also originally a goal of making use of browser-native scrolling, although that ultimately wasn't quite tennable. :man_shrugging:

## TODO :memo:
* Middle-click "auto-scrolling"
* Column dragging (callback to with suggested reordering of ColumnDefs, up to parent to actually re-order & re-render)
