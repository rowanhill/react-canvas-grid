import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { Coord } from '../types';
import { equal } from '../utils';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta, SelectRange } from './selectionTypes';

export class CellsSelection extends BaseSelectionState<CellsSelection> {
    private readonly editCursorCell: Coord;
    private readonly selectionStartCell: Coord;
    private readonly selectionCursorCell: Coord;
    private readonly focusCell: Coord;
    private readonly autofillDragCell: Coord | null;

    constructor(
        editCursorCell: Coord,
        selectionStartCell: Coord,
        selectionCursorCell: Coord,
        isSelectionInProgress: boolean,
        focusCell: Coord,
        autofillDragCell: Coord | null = null,
    ) {
        super(isSelectionInProgress);
        this.editCursorCell = editCursorCell;
        this.selectionStartCell = selectionStartCell;
        this.selectionCursorCell = selectionCursorCell;
        this.focusCell = focusCell;
        this.autofillDragCell = autofillDragCell;
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

    public mouseDown = (cell: Coord, meta: ClickMeta) => createSelectionStateForMouseDown(cell, meta);

    public shiftMouseDown = (cell: Coord, meta: ClickMeta): CellsSelection => {
        if (meta.region !== 'cells') {
            return this;
        }
        return new CellsSelection(this.editCursorCell, this.selectionStartCell, cell, true, cell);
    }

    public mouseMove = (cell: Coord): CellsSelection => {
        if (this.autofillDragCell !== null) {
            if (!equal(cell, this.autofillDragCell)) {
                return new CellsSelection(
                    this.editCursorCell,
                    this.selectionStartCell,
                    this.selectionCursorCell,
                    true,
                    this.focusCell,
                    cell,
                );
            }
        } else if (this.isSelectionInProgress) {
            if (!equal(cell, this.selectionCursorCell)) {
                return new CellsSelection(
                    this.editCursorCell,
                    this.selectionStartCell,
                    cell,
                    true,
                    cell,
                );
            }
        }
        return this;
    }

    public mouseUp = (): CellsSelection => {
        if (this.autofillDragCell !== null) {
            // TODO: Allow selection ranges where the edit cursor is not at a corner
            const fillRange = this.getAutofillRange();
            if (fillRange) {
                return new CellsSelection(
                    this.editCursorCell,
                    this.selectionStartCell,
                    this.autofillDragCell,
                    false,
                    this.autofillDragCell,
                    null,
                );
            } else {
                return this;
            }
        } else if (this.isSelectionInProgress) {
            return new CellsSelection(
                this.editCursorCell,
                this.selectionStartCell,
                this.selectionCursorCell,
                false,
                this.selectionCursorCell,
            );
        } else {
            return this;
        }
    }

    public mouseDownOnAutofillHandle = (): CellsSelection => {
        return new CellsSelection(
            this.editCursorCell,
            this.selectionStartCell,
            this.selectionCursorCell,
            true,
            this.focusCell,
            this.selectionCursorCell,
        );
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

    public isAutofillDragging = () => this.autofillDragCell !== null;

    public getAutofillRange = (): SelectRange | null => {
        if (this.autofillDragCell === null) {
            return null;
        }

        const selRange = this.getSelectionRange();

        if (this.autofillDragCell.y > selRange.bottomRight.y) {
            // Below the selection
            return {
                topLeft: {
                    x: selRange.topLeft.x,
                    y: selRange.bottomRight.y + 1,
                },
                bottomRight: {
                    x: selRange.bottomRight.x,
                    y: this.autofillDragCell.y,
                },
            };
        } else if (this.autofillDragCell.y < selRange.topLeft.y) {
            // Above the selection
            return {
                topLeft: {
                    x: selRange.topLeft.x,
                    y: this.autofillDragCell.y,
                },
                bottomRight: {
                    x: selRange.bottomRight.x,
                    y: selRange.topLeft.y - 1,
                },
            };
        } else if (this.autofillDragCell.x > selRange.bottomRight.x) {
            // Right of the selection
            return {
                topLeft: {
                    x: selRange.bottomRight.x + 1,
                    y: selRange.topLeft.y,
                },
                bottomRight: {
                    x: this.autofillDragCell.x,
                    y: selRange.bottomRight.y,
                },
            };
        } else if (this.autofillDragCell.x < selRange.topLeft.x) {
            // Left of the selection
            return {
                topLeft: {
                    x: this.autofillDragCell.x,
                    y: selRange.topLeft.y,
                },
                bottomRight: {
                    x: selRange.topLeft.x - 1,
                    y: selRange.bottomRight.y,
                },
            };
        } else {
            return null;
        }
    }
}

const truncateCoord = (coord: Coord, cellBounds: CellCoordBounds): Coord => {
    return {
        x: Math.min(Math.max(coord.x, cellBounds.frozenCols), cellBounds.numCols - 1),
        y: Math.min(Math.max(coord.y, cellBounds.frozenRows), cellBounds.numRows - 1),
    };
};
