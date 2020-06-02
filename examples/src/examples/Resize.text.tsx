import * as React from 'react';

export const ResizeText = () => {
    return (
        <>
            <h1>Resizable Grid</h1>
            <p>
                The <code>cssWidth</code> and <code>cssHeight</code> props of react-canvas-grid control
                the grid's width and height. Both default to '100%', but accept any value that would be
                valid in CSS.
            </p>
            <p>
                If these props are updated, the grid will resize and redraw.
            </p>
            <p>
                Note, however, this is only true when <em>the value of the props passed to the grid</em> changes
                - so, for example, the grid will not automatically resize if <code>cssWidth</code>
                and <code>cssHeight</code> are set to percentages and their parent element changes size.
                If the grid must be reactive to the size of a parent element, the size of the grid must be
                set dynamically (e.g. triggered by a window resize event or via a ResizeObserver).
            </p>
        </>
    );
};
