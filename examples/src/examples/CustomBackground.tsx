import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const renderBackgroundLightGreen = (context: CanvasRenderingContext2D, cellBounds: ClientRect) => {
    context.fillStyle = 'lightgreen';
    context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
};

export const CustomBackgroundGrid = () => {
    const options = { renderBackground: renderBackgroundLightGreen };
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */}, options);

    return (
        <PaddedPage>
            <h1>Custom Background Renderer</h1>
            <p>
                When specifying a cell definition, you can provide a <code>renderBackground</code> function
                to customise drawing the cell's background.
            </p>
            <p>
                Here, all cells use the same background renderer in order to draw the background as
                light green.
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
