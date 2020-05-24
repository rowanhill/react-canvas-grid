import * as React from 'react';

export const DyanmicDataText = () => {
    return (
        <>
            <h1>Dynamic Data</h1>
            <p>
                Updates to the <code>columns</code> and <code>data</code> props cause the grid to
                re-render with new values.
            </p>
            <p>
                The selected cells are cleared if <code>columns</code> changes or the number of rows
                (in <code>data</code>) changes. The selection is not cleared, however, if <code>columns</code>
                &#160;stays the same and <code>data</code> is replaced with an array of the same length (even if the
                contents within the array is different). I.e. if the <em>structure</em> of the grid has changed
                then the selection is cleared, but if only the <em>contents</em> change then the selection is
                retained.
            </p>
            <p>
                The scroll position is maintained as long as it is valid in the newly rendered grid. If not
                (because there are fewer columns or rows) the scroll position is truncated.
            </p>
        </>
    );
};
