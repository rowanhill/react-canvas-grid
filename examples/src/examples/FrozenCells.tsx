import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

export const FrozenCellsGrid = () => {
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

    return (
        <PaddedPage>
            <h1>Frozen Rows &amp; Columns</h1>
            <p>
                By setting the <code>frozenRows</code> and <code>frozenCols</code> props, rows
                and columns of cells can be 'frozen' - i.e. fixed in place, even as the rest of
                the grid scrolls.
            </p>
            <p>
                This can be useful for creating column or row headers.
            </p>
            <FixedSizeHolder>
                <ReactCanvasGrid<void>
                    columns={columns}
                    data={data}
                    rowHeight={20}
                    frozenRows={1}
                    frozenCols={1}
                />
            </FixedSizeHolder>
        </PaddedPage>
    );
};
