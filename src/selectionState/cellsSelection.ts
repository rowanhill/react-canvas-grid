import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { Coord } from '../types';
import { equal } from '../utils';
import { BaseSelectionState, CellCoordBounds, ClickMeta, SelectRange } from './selectionState';

export class CellsSelection extends BaseSelectionState<CellsSelection> {
    private readonly editCursorCell: Coord;
    private readonly selectionStartCell: Coord;
    private readonly selectionCursorCell: Coord;
    private readonly focusCell: Coord;

    constructor(
        editCursorCell: Coord,
        selectionStartCell: Coord,
        selectionCursorCell: Coord,
        isSelectionInProgress: boolean,
        focusCell: Coord,
    ) {
        super(isSelectionInProgress);
        this.editCursorCell = editCursorCell;
        this.selectionStartCell = selectionStartCell;
        this.selectionCursorCell = selectionCursorCell;
        this.focusCell = focusCell;
    }

    public arrowUp = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x, y: this.editCursorCell.y - 1 }, cellBounds);
        return new CellsSelection(newCell, newCell, newCell, false, newCell);
    }

    public arrowDown = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x, y: this.editCursorCell.y + 1 }, cellBounds);
        return new CellsSelection(newCell, newCell, newCell, false, newCell);
    }

    public arrowLeft = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x - 1, y: this.editCursorCell.y }, cellBounds);
        return new CellsSelection(newCell, newCell, newCell, false, newCell);
    }

    public arrowRight = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x + 1, y: this.editCursorCell.y }, cellBounds);
        return new CellsSelection(newCell, newCell, newCell, false, newCell);
    }

    public shiftArrowUp = (cellBounds: CellCoordBounds): CellsSelection => {
        const cell = truncateCoord({ x: this.selectionCursorCell.x, y: this.selectionCursorCell.y - 1 }, cellBounds);
        return new CellsSelection(this.editCursorCell, this.selectionStartCell, cell, false, cell);
    }

    public shiftArrowDown = (cellBounds: CellCoordBounds): CellsSelection => {
        const cell = truncateCoord({ x: this.selectionCursorCell.x, y: this.selectionCursorCell.y + 1 }, cellBounds);
        return new CellsSelection(this.editCursorCell, this.selectionStartCell, cell, false, cell);
    }

    public shiftArrowLeft = (cellBounds: CellCoordBounds): CellsSelection => {
        const cell = truncateCoord({ x: this.selectionCursorCell.x - 1, y: this.selectionCursorCell.y }, cellBounds);
        return new CellsSelection(this.editCursorCell, this.selectionStartCell, cell, false, cell);
    }

    public shiftArrowRight = (cellBounds: CellCoordBounds): CellsSelection => {
        const cell = truncateCoord({ x: this.selectionCursorCell.x + 1, y: this.selectionCursorCell.y }, cellBounds);
        return new CellsSelection(this.editCursorCell, this.selectionStartCell, cell, false, cell);
    }

    public shiftMouseDown = (cell: Coord, meta: ClickMeta): CellsSelection => {
        if (meta.region !== 'cells') {
            return this;
        }
        return new CellsSelection(this.editCursorCell, this.selectionStartCell, cell, true, cell);
    }

    public mouseMove = (cell: Coord): CellsSelection => {
        if (this.isSelectionInProgress && !equal(cell, this.selectionCursorCell)) {
            return new CellsSelection(
                this.editCursorCell,
                this.selectionStartCell,
                cell,
                true,
                cell,
            );
        } else {
            return this;
        }
    }

    public mouseUp = (): CellsSelection => {
        if (!this.isSelectionInProgress) {
            return this;
        } else {
            return new CellsSelection(
                this.editCursorCell,
                this.selectionStartCell,
                this.selectionCursorCell,
                false,
                this.selectionCursorCell,
            );
        }
    }

    public getSelectionRange = (): SelectRange => {
        return {
            topLeft: {
                x: Math.min(this.selectionStartCell.x, this.selectionCursorCell.x),
                y: Math.min(this.selectionStartCell.y, this.selectionCursorCell.y),
            },
            bottomRight: {
                x: Math.max(this.selectionStartCell.x, this.selectionCursorCell.x),
                y: Math.max(this.selectionStartCell.y, this.selectionCursorCell.y),
            },
        };
    }

    public getFocusGridOffset = <T>(gridState: GridState<T>): Coord|null => {
        return GridGeometry.calculateGridOffsetForTargetCell(
            gridState.gridOffset(),
            gridState.canvasSize(),
            gridState.frozenColsWidth(),
            gridState.frozenRowsHeight(),
            this.focusCell,
            gridState.columnBoundaries(),
            gridState.rowHeight(),
            gridState.borderWidth(),
            gridState.data().length,
            gridState.verticalGutterBounds(),
            gridState.horizontalGutterBounds(),
        );
    }

    public getCursorCell = () => this.editCursorCell;
}

const truncateCoord = (coord: Coord, cellBounds: CellCoordBounds): Coord => {
    return {
        x: Math.min(Math.max(coord.x, cellBounds.frozenCols), cellBounds.numCols - 1),
        y: Math.min(Math.max(coord.y, cellBounds.frozenRows), cellBounds.numRows - 1),
    };
};
