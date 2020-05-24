import * as React from 'react';

export const CustomBackgroundText = () => {
    return (
        <>
            <h1>Custom Background Renderer</h1>
            <p>
                When specifying a cell definition, you can provide a <code>renderBackground</code> function
                to customise drawing the cell's background.
            </p>
            <p>
                Here, all cells use the same background renderer in order to draw the background as
                light green.
            </p>
        </>
    );
};
