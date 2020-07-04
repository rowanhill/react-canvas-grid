import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { Coord } from '../types';
import { AllGridSelection } from './allGridSelection';
import { CellsSelection, createSingleCell } from './cellsSelection';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta, SelectRange } from './selectionTypes';

export function createSingleColSelection(targetCell: Coord, cellBounds: CellCoordBounds) {
    const newCell = { x: truncateCol(targetCell.x, cellBounds), y: cellBounds.frozenRows };
    return new ColsSelection(newCell, newCell.x, newCell.x, false, newCell.x);
}

export class ColsSelection extends BaseSelectionState {
    private readonly editCursorCell: Coord;
    private readonly selectionStartColIndex: number;
    private readonly selectionCursorColIndex: number;
    private readonly focusColIndex: number;

    constructor(
        editCursorCell: Coord,
        selectionStartColIndex: number,
        selectionCursorColIndex: number,
        isSelectionInProgress: boolean,
        focusColIndex: number,
    ) {
        super(isSelectionInProgress);
        this.editCursorCell = editCursorCell;
        this.selectionStartColIndex = selectionStartColIndex;
        this.selectionCursorColIndex = selectionCursorColIndex;
        this.focusColIndex = focusColIndex;
    }

    public arrowUp = (): ColsSelection => {
        return this;
    }

    public arrowDown = (cellBounds: CellCoordBounds): CellsSelection => {
        return createSingleCell(this.editCursorCell, cellBounds);
    }

    public arrowLeft = (cellBounds: CellCoordBounds): ColsSelection | AllGridSelection => {
        if (this.editCursorCell.x <= cellBounds.frozenCols && cellBounds.frozenCols > 0) {
            return new AllGridSelection(false);
        } else {
            return createSingleColSelection({ x: this.editCursorCell.x - 1, y: this.editCursorCell. y }, cellBounds);
        }
    }

    public arrowRight = (cellBounds: CellCoordBounds): ColsSelection => {
        return createSingleColSelection({ x: this.editCursorCell.x + 1, y: this.editCursorCell. y }, cellBounds);
    }

    public shiftArrowUp = (): ColsSelection => {
        return this;
    }

    public shiftArrowDown = (): ColsSelection => {
        return this;
    }

    public shiftArrowLeft = (cellBounds: CellCoordBounds): ColsSelection => {
        const newColIndex = truncateCol(this.selectionCursorColIndex - 1, cellBounds);
        return new ColsSelection(
            this.editCursorCell,
            this.selectionStartColIndex,
            newColIndex,
            false,
            newColIndex,
        );
    }

    public shiftArrowRight = (cellBounds: CellCoordBounds): ColsSelection => {
        const neColIndex = truncateCol(this.selectionCursorColIndex + 1, cellBounds);
        return new ColsSelection(
            this.editCursorCell,
            this.selectionStartColIndex,
            neColIndex,
            false,
            neColIndex,
        );
    }

    public mouseDown = (cell: Coord, meta: ClickMeta) => createSelectionStateForMouseDown(cell, meta);

    public shiftMouseDown = (cell: Coord, meta: ClickMeta): ColsSelection => {
        if (meta.region !== 'frozen-rows') {
            return this;
        }
        return new ColsSelection(
            this.editCursorCell,
            this.selectionStartColIndex,
            cell.x,
            true,
            cell.x,
        );
    }

    public mouseMove = (cell: Coord): ColsSelection => {
        if (this.isSelectionInProgress && cell.x !== this.selectionCursorColIndex) {
            return new ColsSelection(
                this.editCursorCell,
                this.selectionStartColIndex,
                cell.x,
                true,
                cell.x,
            );
        } else {
            return this;
        }
    }

    public mouseUp = (): ColsSelection => {
        if (!this.isSelectionInProgress) {
            return this;
        } else {
            return new ColsSelection(
                this.editCursorCell,
                this.selectionStartColIndex,
                this.selectionCursorColIndex,
                false,
                this.selectionCursorColIndex,
            );
        }
    }

    public getSelectionRange = (cellBounds: CellCoordBounds): SelectRange => {
        return {
            topLeft: {
                x: Math.min(this.selectionStartColIndex, this.selectionCursorColIndex),
                y: 0,
            },
            bottomRight: {
                x: Math.max(this.selectionStartColIndex, this.selectionCursorColIndex),
                y: cellBounds.numRows - 1,
            },
        };
    }

    public getFocusGridOffset = <T>(gridState: GridState<T>): Coord|null => {
        return GridGeometry.calculateGridOffsetForTargetColumn(
            gridState.gridOffset(),
            gridState.canvasSize(),
            gridState.frozenColsWidth(),
            this.focusColIndex,
            gridState.columnBoundaries(),
            gridState.verticalGutterBounds(),
        );
    }

    public getCursorCell = () => this.editCursorCell;
}

const truncateCol = (colIndex: number, cellBounds: CellCoordBounds): number => {
    return Math.min(Math.max(colIndex, cellBounds.frozenCols), cellBounds.numCols - 1);
};
