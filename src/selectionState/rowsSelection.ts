import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { Coord } from '../types';
import { AllGridSelection } from './allGridSelection';
import { CellsSelection, createSingleCell } from './cellsSelection';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta, SelectRange } from './selectionTypes';

export function createSingleRowSelection(targetCell: Coord, cellBounds: CellCoordBounds) {
    const newCell = { x: cellBounds.frozenCols, y: truncateRow(targetCell.y, cellBounds) };
    return new RowsSelection(newCell, newCell.y, newCell.y, false, newCell.y);
}

export class RowsSelection extends BaseSelectionState {
    private readonly editCursorCell: Coord;
    private readonly selectionStartRowIndex: number;
    private readonly selectionCursorRowIndex: number;
    private readonly focusRowIndex: number;

    constructor(
        editCursorCell: Coord,
        selectionStartRowIndex: number,
        selectionCursorRowIndex: number,
        isSelectionInProgress: boolean,
        focusRowIndex: number,
    ) {
        super(isSelectionInProgress);
        this.editCursorCell = editCursorCell;
        this.selectionStartRowIndex = selectionStartRowIndex;
        this.selectionCursorRowIndex = selectionCursorRowIndex;
        this.focusRowIndex = focusRowIndex;
    }

    public arrowUp = (cellBounds: CellCoordBounds): RowsSelection | AllGridSelection => {
        if (this.editCursorCell.y === cellBounds.frozenRows && this.editCursorCell.y > 0) {
            return new AllGridSelection(false);
        } else {
            return createSingleRowSelection({ x: this.editCursorCell.x, y: this.editCursorCell.y - 1 }, cellBounds);
        }
    }

    public arrowDown = (cellBounds: CellCoordBounds): RowsSelection => {
        return createSingleRowSelection({ x: this.editCursorCell.x, y: this.editCursorCell.y + 1 }, cellBounds);
    }

    public arrowLeft = (): RowsSelection => {
        return this;
    }

    public arrowRight = (cellBounds: CellCoordBounds): CellsSelection => {
        return createSingleCell(this.editCursorCell, cellBounds);
    }

    public shiftArrowUp = (cellBounds: CellCoordBounds): RowsSelection => {
        const newRowIndex = truncateRow(this.selectionCursorRowIndex - 1, cellBounds);
        return new RowsSelection(
            this.editCursorCell,
            this.selectionStartRowIndex,
            newRowIndex,
            false,
            newRowIndex,
        );
    }

    public shiftArrowDown = (cellBounds: CellCoordBounds): RowsSelection => {
        const newRowIndex = truncateRow(this.selectionCursorRowIndex + 1, cellBounds);
        return new RowsSelection(
            this.editCursorCell,
            this.selectionStartRowIndex,
            newRowIndex,
            false,
            newRowIndex,
        );
    }

    public shiftArrowLeft = (): RowsSelection => {
        return this;
    }

    public shiftArrowRight = (): RowsSelection => {
        return this;
    }

    public mouseDown = (cell: Coord, meta: ClickMeta) => createSelectionStateForMouseDown(cell, meta);

    public shiftMouseDown = (cell: Coord, meta: ClickMeta): RowsSelection => {
        if (meta.region !== 'frozen-cols') {
            return this;
        }
        return new RowsSelection(
            this.editCursorCell,
            this.selectionStartRowIndex,
            cell.y,
            true,
            cell.y,
        );
    }

    public mouseMove = (cell: Coord): RowsSelection => {
        if (this.isSelectionInProgress && cell.y !== this.selectionCursorRowIndex) {
            return new RowsSelection(
                this.editCursorCell,
                this.selectionStartRowIndex,
                cell.y,
                true,
                cell.y,
            );
        } else {
            return this;
        }
    }

    public mouseUp = (): RowsSelection => {
        if (!this.isSelectionInProgress) {
            return this;
        } else {
            return new RowsSelection(
                this.editCursorCell,
                this.selectionStartRowIndex,
                this.selectionCursorRowIndex,
                false,
                this.selectionCursorRowIndex,
            );
        }
    }

    public getSelectionRange = (cellBounds: CellCoordBounds): SelectRange => {
        return {
            topLeft: {
                x: 0,
                y: Math.min(this.selectionStartRowIndex, this.selectionCursorRowIndex),
            },
            bottomRight: {
                x: cellBounds.numCols - 1,
                y: Math.max(this.selectionStartRowIndex, this.selectionCursorRowIndex),
            },
        };
    }

    public getFocusGridOffset = <T>(gridState: GridState<T>): Coord|null => {
        return GridGeometry.calculateGridOffsetForTargetRow(
            gridState.gridOffset(),
            gridState.canvasSize(),
            gridState.frozenRowsHeight(),
            this.focusRowIndex,
            gridState.rowHeight(),
            gridState.borderWidth(),
            gridState.data().length,
            gridState.horizontalGutterBounds(),
        );
    }

    public getCursorCell = () => this.editCursorCell;
}

const truncateRow = (rowIndex: number, cellBounds: CellCoordBounds): number => {
    return Math.min(Math.max(rowIndex, cellBounds.frozenRows), cellBounds.numRows - 1);
};
