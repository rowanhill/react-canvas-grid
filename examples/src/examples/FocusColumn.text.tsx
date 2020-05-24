import * as React from 'react';

export const FocusColumnText = () => {
    return (
        <>
            <h1>Focused Columns</h1>
            <p>
                Updates to the <code>focusedColIndex</code> cause the grid to automatically scroll
                to ensure the indicated column is displayed. The scrolling behaviour is aware of
                frozen columns.
            </p>
            <p>
                This can be useful for building a 'search' feature.
            </p>
        </>
    );
};
