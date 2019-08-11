import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

export const SimpleGrid = () => {
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

    return (
        <PaddedPage>
            <h1>Simple Grid</h1>
            <p>
                This is a basic usage of react-canvas-grid: a read-only grid of static values, held
                within a <code>div</code> of fixed size.
            </p>
            <p>
                Note that because the <code>cssHeight</code> and <code>cssWidth</code> props of&#160;
                <code>ReactCanvasGrid</code> default to <code>100%</code>, the grid is constrained
                to the size of its parent. Since the data in the grid requires a larger area than
                that, the grid becomes scrollable.
            </p>
            <FixedSizeHolder>
                <ReactCanvasGrid<void>
                    columns={columns}
                    data={data}
                    rowHeight={20}
                />
            </FixedSizeHolder>
        </PaddedPage>
    );
};
