import { SelectRange } from './selectionState/selectionTypes';
import { CellDef, ColumnDef, DataRow } from './types';

export interface AutofillContext<T> {
    srcRowIndex: number;
    srcColIndex: number;
    srcColDef: ColumnDef;
    srcCellDef: CellDef<T>;
    destRowIndex: number;
    destColIndex: number;
    destColDef: ColumnDef;
    destCellDef: CellDef<T>;
}

export function repeatSelectionIntoFill<T>(
    selectRange: SelectRange,
    fillRange: SelectRange,
    data: Array<DataRow<T>>,
    columns: ColumnDef[],
    cloneCellDef: (context: AutofillContext<T>) => CellDef<T>,
): Array<DataRow<T>> {
    const selHeight = selectRange.bottomRight.y - selectRange.topLeft.y + 1;
    const selWidth = selectRange.bottomRight.x - selectRange.topLeft.x + 1;
    return data.map((row, y) => {
        if (y >= fillRange.topLeft.y && y <= fillRange.bottomRight.y) {
            return columns.reduce((acc, col, x) => {
                if (x >= fillRange.topLeft.x && x <= fillRange.bottomRight.x) {
                    const srcRowIndex = ((y - fillRange.topLeft.y) % selHeight) + selectRange.topLeft.y;
                    const srcColIndex = ((x - fillRange.topLeft.x) % selWidth) + selectRange.topLeft.x;
                    const srcColDef = columns[srcColIndex];
                    const srcCellDef = data[srcRowIndex][srcColDef.fieldName];
                    const destRowIndex = y;
                    const destColIndex = x;
                    const destColDef = columns[destColIndex];
                    const destCellDef = data[destRowIndex][destColDef.fieldName];
                    acc[col.fieldName] = cloneCellDef({
                        srcRowIndex,
                        srcColIndex,
                        srcColDef,
                        srcCellDef,
                        destRowIndex,
                        destColIndex,
                        destColDef,
                        destCellDef,
                    });
                } else {
                    acc[col.fieldName] = row[col.fieldName];
                }
                return acc;
            }, {} as DataRow<T>);
        } else {
            return row;
        }
    });
}
