import * as React from 'react';

export const FrozenCellsText = () => {
    return (
        <>
            <h1>Frozen Rows &amp; Columns</h1>
            <p>
                By setting the <code>frozenRows</code> and <code>frozenCols</code> props, rows
                and columns of cells can be 'frozen' - i.e. fixed in place, even as the rest of
                the grid scrolls.
            </p>
            <p>
                This can be useful for creating column or row headers.
            </p>
        </>
    );
};
