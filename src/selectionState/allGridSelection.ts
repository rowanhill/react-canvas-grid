import { GridState } from '../gridState';
import { Coord } from '../types';
import { createSingleColSelection } from './colsSelection';
import { createSingleRowSelection } from './rowsSelection';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta, SelectRange } from './selectionTypes';

export class AllGridSelection extends BaseSelectionState {
    public arrowDown = (cellBounds: CellCoordBounds) => {
        return createSingleRowSelection({ x: cellBounds.frozenCols, y: cellBounds.frozenRows }, cellBounds);
    }
    public arrowRight = (cellBounds: CellCoordBounds) => {
        return createSingleColSelection({ x: cellBounds.frozenCols, y: cellBounds.frozenRows }, cellBounds);
    }

    public arrowUp = () => this;
    public arrowLeft = () => this;
    public shiftArrowUp = () => this;
    public shiftArrowDown = () => this;
    public shiftArrowLeft = () => this;
    public shiftArrowRight = () => this;

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
                x: 0,
                y: 0,
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
