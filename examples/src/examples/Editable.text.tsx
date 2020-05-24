import * as React from 'react';

export const EditableDataText = () => {
    return (
        <>
            <h1>Editable Data</h1>
            <p>
                A cell is editable if its definition includes an <code>editor</code> property.
                If the grid also has a <code>onCellDataChanged</code> prop, that can persist
                changes made to data to be shown on the grid.
            </p>
            <p>
                The <code>editor</code> provides two functions, <code>serialise</code> and
                &#160;<code>deserialise</code>, that translate between the <code>data</code> stored
                on the cell definition and the text displayed in the editor <code>input</code>.
            </p>
            <p>
                Displaying the inline editor is not enough, however, as react-canvas-grid does not
                manage the data; instead, when data changes, it will call the function provided as
                the <code>onCellDataChanged</code> prop. This function can then update the contents
                of the <code>data</code> prop, causing the grid to render the changes.
            </p>
            <p>
                Note that the text displayed in the editor need not be the same as the text
                displayed in the cell itself (as defined by <code>text</code> or <code>getText</code>).
                In this example, the editor text is of the form <code>A,B</code> (i.e. comma separated),
                but cells are displayed as <code>AxB</code> (i.e. with an x).
            </p>
            <p>
                To edit a cell, double click it. Invalid values will be ignored.
            </p>
        </>
    );
};
