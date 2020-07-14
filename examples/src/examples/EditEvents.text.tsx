import * as React from 'react';
import { Link } from 'react-router-dom';

export const EditEventsText = () => {
    return (
        <>
            <h1>Edit Events</h1>
            <p>
                The callback <code>onCellDataChanged</code> allow consumers of react-canvas-grid to
                respond to the user making changes to the data. Typically, this is used to update the
                data passed to the grid in the <code>data</code> prop. Without doing so, the grid's
                data will not be changed. See the <Link to="/examples/editable">Editable Data</Link> example
                for further detail. This example does not update the data, but merely logs event.
            </p>
            <p>
                Note that the callback is fired when the user hits enter on the inline editor, or when
                the inline editor loses focus, regardless of whether the data has been changed. The
                inline editor can be dismissed with the escape key, regardless of whether the data has
                been changed.
            </p>
        </>
    );
};
