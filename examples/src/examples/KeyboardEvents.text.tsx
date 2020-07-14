import * as React from 'react';
import { Link } from 'react-router-dom';

export const KeyboardEventsText = () => {
    return (
        <>
            <h1>Keyboard Events</h1>
            <p>
                Keyboard events bubble up, so can be captured the parent element of the grid (when
                the grid has focus).
            </p>
            <p>
                Note that keyboard events will also bubble up when the user interacts with the
                inline editor, which you may wish to ignore. To do so, you may wish to observe
                the grid's <Link to="/examples/edit-events">edit events</Link>.
            </p>
            <p>
                Also note that the editing functionality provided in this example is incomplete;
                changes are not persisted. To see a more complete example, see
                the <Link to="/examples/editable">Editable Data</Link> example.
            </p>
        </>
    );
};
