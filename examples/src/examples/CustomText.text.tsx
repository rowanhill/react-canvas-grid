import * as React from 'react';

export const CustomTextText = () => {
    return (
        <>
            <h1>Custom Text Renderer</h1>
            <p>
                When specifying a cell definition, you can provide a <code>renderText</code> function
                to customise drawing the cell's text.
            </p>
            <p>
                Here, all cells use the same text renderer in order to draw the text as red.
            </p>
        </>
    );
};
