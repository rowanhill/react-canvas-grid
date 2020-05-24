import * as React from 'react';

export const SimpleText = () => {
    return (
        <>
            <h1>Simple Grid</h1>
            <p>
                This is a basic usage of react-canvas-grid: a read-only grid of static values, held
                within a <code>div</code> of fixed size.
            </p>
            <p>
                Note that because the <code>cssHeight</code> and <code>cssWidth</code> props of&#160;
                <code>ReactCanvasGrid</code> default to <code>100%</code>, the grid is constrained
                to the size of its parent. Since the data in the grid requires a larger area than
                that, the grid becomes scrollable.
            </p>
        </>
    );
};
