import * as React from 'react';
import { CellDef, ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface CellData {
    x: number;
    y: number;
}

export const CustomTitleGrid = () => {
    const titleGenerator = (data: CellData) => `Title for ${data.y + 1}x${data.x + 1}`;
    const options: Partial<CellDef<CellData>> = { getTitle: titleGenerator };
    const dataGenerator = (x: number, y: number) => ({ x, y });
    const { columns, rows: data } = createFakeDataAndColumns(100, 20, dataGenerator, options);

    return (
        <FixedSizeHolder>
            <ReactCanvasGrid<CellData>
                columns={columns}
                data={data}
                rowHeight={20}
            />
        </FixedSizeHolder>
    );
};
