import * as React from 'react';
import { CellDef, cellHasTextFunction, ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const renderTextRed = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CellDef<void>) => {
    context.fillStyle = 'red';
    const text = cellHasTextFunction(cell) ? cell.getText(cell.data) : cell.text;
    context.fillText(text, cellBounds.left + 2, cellBounds.top + 15, cellBounds.width - 4);
};

export const CustomTextGrid = () => {
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

    const dataWithRenderer = data.map((row) => {
        return Object.keys(row).reduce((acc, fieldName) => {
            const cell = row[fieldName];
            acc[fieldName] = { ...cell, renderText: renderTextRed };
            return acc;
        }, {} as typeof row);
    });

    return (
        <PaddedPage>
            <h1>Custom Text Renderer</h1>
            <p>
                When specifying a cell definition, you can provide a <code>renderText</code> function
                to customise drawing the cell's text.
            </p>
            <p>
                Here, all cells use the same text renderer in order to draw the text as red.
            </p>
            <FixedSizeHolder>
                <ReactCanvasGrid<void>
                    columns={columns}
                    data={dataWithRenderer}
                    rowHeight={20}
                />
            </FixedSizeHolder>
        </PaddedPage>
    );
};
