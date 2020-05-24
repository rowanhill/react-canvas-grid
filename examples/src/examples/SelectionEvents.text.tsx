import * as React from 'react';

export const SelectionEventsText = () => {
    return (
        <>
            <h1>Selection Events</h1>
            <p>
                The three callbacks <code>onSelectionChange[Start|Update|End]</code> allow consumers
                of react-canvas-grid to take action in response to the user changing the selected area.
                This can be useful for keeping track of the selection, in order to act upon the data.
            </p>
            <p>
                Note that clicking / dragging on frozen headers allows the user to select entire rows / columns.
            </p>
        </>
    );
};
