import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import PaddedPage from '../components/PaddedPage';

export const SmallGrid = () => {
    return (
        <PaddedPage>
            <h1>Small Grid</h1>
            <p>
                This is a minimal usage of react-canvas-grid: a small, read-only grid of
                static values.
            </p>
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
        </PaddedPage>
    );
};
