import * as React from 'react';

export const CustomTitleText = () => {
    return (
        <>
            <h1>Custom Title Text</h1>
            <p>
                When specifying a cell definition, you can provide either a <code>getTitle</code> function
                or a <code>title</code> property to specify the title text shown when hovering over that cell.
            </p>
            <p>
                The title text is displayed via the browser's native title text mechanism.
            </p>
        </>
    );
};
