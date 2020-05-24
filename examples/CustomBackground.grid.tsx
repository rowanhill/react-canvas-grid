import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const renderBackgroundLightGreen = (context: CanvasRenderingContext2D, cellBounds: ClientRect) => {
    context.fillStyle = 'lightgreen';
    context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
};

export const CustomBackgroundGrid = () => {
    const options = { renderBackground: renderBackgroundLightGreen };
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */}, options);

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
