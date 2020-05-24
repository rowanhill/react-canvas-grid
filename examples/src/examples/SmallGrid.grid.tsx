import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';

export const SmallGridGrid = () => {
    return (
        <ReactCanvasGrid<void>
            cssHeight={'45px'}
            columns={[ { fieldName: 'field-one', width: 50 }, { fieldName: 'field-two', width: 50 } ]}
            data={[{
                'field-one': { data: undefined, text: '1A' },
                'field-two': { data: undefined, text: '1B' },
            },
            {
                'field-one': { data: undefined, text: '2A' },
                'field-two': { data: undefined, text: '2B' },
            }]}
            rowHeight={20}
        />
    );
};
