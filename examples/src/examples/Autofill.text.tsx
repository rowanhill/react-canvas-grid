import * as React from 'react';

export const AutofillText = () => {
    return (
        <>
        <h1>Autofill</h1>
        <p>
            ReactCanvasGrid can 'autofill' values - i.e. copy the values from the current
            selection into a new area - when the autofill handle is dragged to define the new area.
            The callback <code>shouldAllowAutofill</code> must be supplied to control when the autofill handle
            is shown, along with the <code>onAutofill</code> callback to update the data.
        </p>
        <p>
            The <code>shouldAllowAutofill</code> callback is passed the currently selected range, and
            must return a boolean (<code>true</code> to show allow autofill and show the autofill
            handle, <code>false</code> to disallow and hide).
        </p>
        <p>
            The <code>onAutofill</code> is passed both the currently selected range and the range to be filled,
            and should update the <code>data</code> prop. ReactCanvasGrid provides
            the <code>repeatSelectionIntoFill</code> function as a convenience: it takes the selected range,
            range to be filled, current data, columns, and a 'factory' function; it returns a new
            copy of the data where the area to be filled has been overwritten with cells created by the
            'factory' from the selected range.
        </p>
        <p>
            The factory method could simply clone the source cell, or it could follow more complex logic.
            In the below example, some cell data (the text after the slash) is treated as invariate by the
            factory function, and some cell data (the text before the slash) is treated as copyable.
        </p>
        <p>
            The factory method is passed a single <code>context</code> object, which includes information
            on the source (from the selection) and destination (from the area to
            fill): <code>[src|dest]RowIndex</code>, <code>[src|dest]ColIndex</code>,{' '}
            <code>[src|dest]ColDef</code>, and <code>[src|dest]CellDef</code>.
        </p>
        </>
    );
};
