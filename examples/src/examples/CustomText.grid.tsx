import * as React from 'react';
import { CellDef, cellHasTextFunction, ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const renderTextRed = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CellDef<void>) => {
    context.fillStyle = 'red';
    const text = cellHasTextFunction(cell) ? cell.getText(cell.data) : cell.text;
    context.fillText(text, cellBounds.left + 2, cellBounds.top + 15, cellBounds.width - 4);
};

export const CustomTextGrid = () => {
    const options = { renderText: renderTextRed };
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
