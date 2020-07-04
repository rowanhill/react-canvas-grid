import { GridState } from '../gridState';
import { Bounds, Coord } from '../types';
import { equalBounds, equalCoord } from '../utils';
import { calculateGridOffsetForTargetCell } from './focusOffset';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta, SelectRange } from './selectionTypes';

function createSingleCell(cell: Coord): CellsSelection {
    return new CellsSelection(cell, { left: cell.x, right: cell.x, top: cell.y, bottom: cell.y }, cell, false);
}

export class CellsSelection extends BaseSelectionState {
    private readonly editCursorCell: Coord;
    private readonly selection: Bounds;
    private readonly focusCell: Coord;
    private readonly autofillDragCell: Coord | null;

    constructor(
        editCursorCell: Coord,
        selection: Bounds,
        focusCell: Coord,
        isSelectionInProgress: boolean,
        autofillDragCell: Coord | null = null,
    ) {
        super(isSelectionInProgress);
        this.editCursorCell = editCursorCell;
        this.selection = selection;
        this.focusCell = focusCell,
        this.autofillDragCell = autofillDragCell;
    }

    public arrowUp = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x, y: this.editCursorCell.y - 1 }, cellBounds);
        return createSingleCell(newCell);
    }

    public arrowDown = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x, y: this.editCursorCell.y + 1 }, cellBounds);
        return createSingleCell(newCell);
    }

    public arrowLeft = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x - 1, y: this.editCursorCell.y }, cellBounds);
        return createSingleCell(newCell);
    }

    public arrowRight = (cellBounds: CellCoordBounds): CellsSelection => {
        const newCell = truncateCoord({ x: this.editCursorCell.x + 1, y: this.editCursorCell.y }, cellBounds);
        return createSingleCell(newCell);
    }

    public shiftArrowUp = (cellBounds: CellCoordBounds): CellsSelection => {
        if (this.editCursorCell.y === this.selection.bottom) {
            const newY = truncateY(this.selection.top - 1, cellBounds);
            const bounds = {
                ...this.selection,
                top: newY,
            };
            const focusCell = { x: this.focusCell.x, y: newY };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        } else {
            const newY = truncateY(this.selection.bottom - 1, cellBounds);
            const bounds = {
                ...this.selection,
                bottom: newY,
            };
            const focusCell = { x: this.focusCell.x, y: newY };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        }
    }

    public shiftArrowDown = (cellBounds: CellCoordBounds): CellsSelection => {
        if (this.editCursorCell.y === this.selection.top) {
            const newY = truncateY(this.selection.bottom + 1, cellBounds);
            const bounds = {
                ...this.selection,
                bottom: newY,
            };
            const focusCell = { x: this.focusCell.x, y: newY };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        } else {
            const newY = truncateY(this.selection.top + 1, cellBounds);
            const bounds = {
                ...this.selection,
                top: newY,
            };
            const focusCell = { x: this.focusCell.x, y: newY };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        }
    }

    public shiftArrowLeft = (cellBounds: CellCoordBounds): CellsSelection => {
        if (this.editCursorCell.x === this.selection.right) {
            const newX = truncateX(this.selection.left - 1, cellBounds);
            const bounds = {
                ...this.selection,
                left: newX,
            };
            const focusCell = { y: this.focusCell.y, x: newX };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        } else {
            const newX = truncateX(this.selection.right - 1, cellBounds);
            const bounds = {
                ...this.selection,
                right: newX,
            };
            const focusCell = { y: this.focusCell.y, x: newX };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        }
    }

    public shiftArrowRight = (cellBounds: CellCoordBounds): CellsSelection => {
        if (this.editCursorCell.x === this.selection.left) {
            const newX = truncateX(this.selection.right + 1, cellBounds);
            const bounds = {
                ...this.selection,
                right: newX,
            };
            const focusCell = { y: this.focusCell.y, x: newX };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        } else {
            const newX = truncateX(this.selection.left + 1, cellBounds);
            const bounds = {
                ...this.selection,
                left: newX,
            };
            const focusCell = { y: this.focusCell.y, x: newX };
            return new CellsSelection(this.editCursorCell, bounds, focusCell, false);
        }
    }

    public mouseDown = (cell: Coord, meta: ClickMeta) => createSelectionStateForMouseDown(cell, meta);

    public shiftMouseDown = (cell: Coord, meta: ClickMeta): CellsSelection => {
        if (meta.region !== 'cells') {
            return this;
        }
        const bounds = this.selectionBoundsTo(cell);
        return new CellsSelection(this.editCursorCell, bounds, cell, true);
    }

    public mouseMove = (cell: Coord): CellsSelection => {
        if (this.autofillDragCell !== null) {
            if (!equalCoord(cell, this.autofillDragCell)) {
                return new CellsSelection(
                    this.editCursorCell,
                    this.selection,
                    cell,
                    true,
                    cell,
                );
            }
        } else if (this.isSelectionInProgress) {
            const bounds = this.selectionBoundsTo(cell);
            if (!equalBounds(this.selection, bounds)) {
                return new CellsSelection(
                    this.editCursorCell,
                    bounds,
                    cell,
                    true,
                );
            }
        }
        return this;
    }

    public mouseUp = (): CellsSelection => {
        if (this.autofillDragCell !== null) {
            const fillRange = this.getAutofillRange();
            if (fillRange) {
                const mergedRange = mergeBounds(this.selection, fillRange);
                return new CellsSelection(
                    this.editCursorCell,
                    mergedRange,
                    this.focusCell,
                    false,
                    null,
                );
            } else {
                return new CellsSelection(
                    this.editCursorCell,
                    this.selection,
                    this.focusCell,
                    false,
                    null,
                );
            }
        } else if (this.isSelectionInProgress) {
            return new CellsSelection(
                this.editCursorCell,
                this.selection,
                this.focusCell,
                false,
            );
        } else {
            return this;
        }
    }

    public mouseDownOnAutofillHandle = (): CellsSelection => {
        return new CellsSelection(
            this.editCursorCell,
            this.selection,
            this.focusCell,
            true,
            this.editCursorCell,
        );
    }

    public getSelectionRange = (): SelectRange => {
        return {
            topLeft: {
                x: this.selection.left,
                y: this.selection.top,
            },
            bottomRight: {
                x: this.selection.right,
                y: this.selection.bottom,
            },
        };
    }

    public getFocusGridOffset = <T>(gridState: GridState<T>): Coord|null => {
        return calculateGridOffsetForTargetCell(gridState, this.focusCell);
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

    private selectionBoundsTo = (cell: Coord): Bounds => {
        return {
            left: Math.min(this.editCursorCell.x, cell.x),
            right: Math.max(this.editCursorCell.x, cell.x),
            top: Math.min(this.editCursorCell.y, cell.y),
            bottom: Math.max(this.editCursorCell.y, cell.y),
        };
    }
}

const truncateCoord = (coord: Coord, cellBounds: CellCoordBounds): Coord => {
    return {
        x: Math.min(Math.max(coord.x, cellBounds.frozenCols), cellBounds.numCols - 1),
        y: Math.min(Math.max(coord.y, cellBounds.frozenRows), cellBounds.numRows - 1),
    };
};

const truncateX = (x: number, cellBounds: CellCoordBounds): number => {
    return Math.min(Math.max(x, cellBounds.frozenCols), cellBounds.numCols - 1);
};

const truncateY = (y: number, cellBounds: CellCoordBounds): number => {
    return Math.min(Math.max(y, cellBounds.frozenRows), cellBounds.numRows - 1);
};

const mergeBounds = (a: Bounds, b: SelectRange): Bounds => {
    return {
        top: Math.min(a.top, b.topLeft.y),
        bottom: Math.max(a.bottom, b.bottomRight.y),
        left: Math.min(a.left, b.topLeft.x),
        right: Math.max(a.right, b.bottomRight.x),
    };
};
