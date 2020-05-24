import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

export const SimpleGrid = () => {
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

    return (
        <FixedSizeHolder>
            <ReactCanvasGrid<void>
                columns={columns}
                data={data}
                rowHeight={20}
            />
        </FixedSizeHolder>
    );
};
