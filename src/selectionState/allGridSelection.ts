import { GridState } from '../gridState';
import { Coord } from '../types';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta, SelectRange } from './selectionTypes';

export class AllGridSelection extends BaseSelectionState<AllGridSelection> {
    public arrowUp = (_: CellCoordBounds) => this;
    public arrowDown = (_: CellCoordBounds) => this;
    public arrowLeft = (_: CellCoordBounds) => this;
    public arrowRight = (_: CellCoordBounds) => this;
    public shiftArrowUp = (_: CellCoordBounds) => this;
    public shiftArrowDown = (_: CellCoordBounds) => this;
    public shiftArrowLeft = (_: CellCoordBounds) => this;
    public shiftArrowRight = (_: CellCoordBounds) => this;

    public mouseMove = () => this;
    public mouseUp = () => {
        if (!this.isSelectionInProgress) {
            return this;
        } else {
            return new AllGridSelection(false);
        }
    }

    public mouseDown = (cell: Coord, meta: ClickMeta) => createSelectionStateForMouseDown(cell, meta);

    public shiftMouseDown = (cell: Coord, meta: ClickMeta) => {
        return this.mouseDown(cell, meta);
    }

    public getSelectionRange = (cellBounds: CellCoordBounds): SelectRange  => {
        return {
            topLeft: {
                x: cellBounds.frozenCols,
                y: cellBounds.frozenRows,
            },
            bottomRight: {
                x: cellBounds.numCols - 1,
                y: cellBounds.numRows - 1,
            },
        };
    }

    public getCursorCell = (cellBounds: CellCoordBounds) => ({
        x: cellBounds.frozenCols,
        y: cellBounds.frozenRows,
    })

    public getFocusGridOffset = <D>(_: GridState<D>): Coord|null => null;
}
