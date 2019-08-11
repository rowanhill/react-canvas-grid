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
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

    const dataWithRenderer = data.map((row) => {
        return Object.keys(row).reduce((acc, fieldName) => {
            const cell = row[fieldName];
            acc[fieldName] = { ...cell, renderBackground: renderBackgroundLightGreen };
            return acc;
        }, {} as typeof row);
    });

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
                    data={dataWithRenderer}
                    rowHeight={20}
                />
            </FixedSizeHolder>
        </PaddedPage>
    );
};
