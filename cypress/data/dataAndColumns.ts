import { ColumnDef, DataRow } from '../../src/types';

export function createFakeDataAndColumns<T>(numRows: number, numCols: number, dataGen: (x: number, y: number) => T) {
    const cols: ColumnDef[] = [];
    for (let i = 0; i < numCols; i++) {
        cols.push({
            fieldName: `col-${i}`,
            width: 50,
        });
    }

    const rows: Array<DataRow<T>> = [];
    for (let i = 0; i < numRows; i++) {
        const row: DataRow<T> = {};
        for (let j = 0; j < numCols; j++) {
            row[`col-${j}`] = {
                getText: () => `${i + 1}x${j + 1}`,
                data: dataGen(j, i),
            };
        }
        rows.push(row);
    }

    return {
        columns: cols,
        rows,
    };
}
