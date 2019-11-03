import { Coord } from './types';

interface EmptyCursorState {
    editCursorCell: null;
    selection: null;
    isSelectionInProgress: false;
}
export interface CursorStateWithSelection<T extends SelectionState = SelectionState> {
    editCursorCell: Coord;
    selection: T;
    isSelectionInProgress: boolean;
}

export type CursorState<T extends SelectionState = SelectionState> = EmptyCursorState | CursorStateWithSelection<T>;

type RangeSelectionType = 'grid' | 'rows' | 'columns' | 'cells';
export interface SelectionState {
    selectionStartCell: Coord;
    selectionEndCell: Coord;
    selectedRange: SelectRange;
    selectionType: RangeSelectionType;
}
export type SelectionStateCorner = SelectionState & { selectionType: 'grid'; };
export type SelectionStateRow = SelectionState & { selectionType: 'rows'; };
export type SelectionStateColumn = SelectionState & { selectionType: 'columns'; };
export type SelectionStateCell = SelectionState & { selectionType: 'cells'; };

export interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

export function hasSelectionState(cursorState: CursorState): cursorState is CursorStateWithSelection {
    return cursorState.selection !== null;
}
export function hasSelectionCellState(cursorState: CursorState):
cursorState is CursorStateWithSelection<SelectionStateCell> {
    return cursorState.selection !== null && cursorState.selection.selectionType === 'cells';
}
export function hasSelectionRowState(cursorState: CursorState):
cursorState is CursorStateWithSelection<SelectionStateRow> {
    return cursorState.selection !== null && cursorState.selection.selectionType === 'rows';
}
export function hasSelectionColumnState(cursorState: CursorState):
cursorState is CursorStateWithSelection<SelectionStateColumn> {
    return cursorState.selection !== null && cursorState.selection.selectionType === 'columns';
}
export function hasSelectionFrozenState(cursorState: CursorState) {
    return hasSelectionRowState(cursorState) || hasSelectionColumnState(cursorState);
}

export function createDefault(): CursorState {
    return {
        editCursorCell: null,
        selection: null,
        isSelectionInProgress: false,
    };
}

export function startDrag(
    gridCoords: Coord,
    selectionType: RangeSelectionType = 'cells',
): CursorStateWithSelection {
    const selectedRange = {
        topLeft: gridCoords,
        bottomRight: gridCoords,
    };
    return {
        editCursorCell: gridCoords,
        selection: {
            selectedRange,
            selectionStartCell: gridCoords,
            selectionEndCell: gridCoords,
            selectionType,
        },
        isSelectionInProgress: true,
    };
}

export function updateDrag(cursorState: CursorStateWithSelection, gridCoords: Coord): CursorStateWithSelection {
    const selectedRange = {
        topLeft: {
            x: Math.min(cursorState.selection.selectionStartCell.x, gridCoords.x),
            y: Math.min(cursorState.selection.selectionStartCell.y, gridCoords.y),
        },
        bottomRight: {
            x: Math.max(cursorState.selection.selectionStartCell.x, gridCoords.x),
            y: Math.max(cursorState.selection.selectionStartCell.y, gridCoords.y),
        },
    };
    return {
        ...cursorState,
        selection: {
            ...cursorState.selection,
            selectedRange,
            selectionEndCell: gridCoords,
        },
        isSelectionInProgress: true,
    };
}

function startRange(fromCoords: Coord, toCoords: Coord, selectionType: RangeSelectionType): CursorStateWithSelection {
    const fromState = startDrag(fromCoords, selectionType);
    return updateDrag(fromState, toCoords);
}

export function startRangeCorner(fromCoords: Coord, toCoords: Coord): CursorStateWithSelection {
    return startRange(fromCoords, toCoords, 'grid');
}
export function startRangeRow(fromCoords: Coord, toCoords: Coord): CursorStateWithSelection {
    return startRange(fromCoords, toCoords, 'rows');
}
export function startRangeColumn(fromCoords: Coord, toCoords: Coord): CursorStateWithSelection {
    return startRange(fromCoords, toCoords, 'columns');
}

export function updateRangeRow(
    cursorState: CursorStateWithSelection<SelectionStateRow>,
    gridCoords: Coord,
): CursorStateWithSelection<SelectionStateRow> {
    const selectedRange = {
        topLeft: {
            x: cursorState.selection.selectedRange.topLeft.x,
            y: Math.min(cursorState.selection.selectionStartCell.y, gridCoords.y),
        },
        bottomRight: {
            x: cursorState.selection.selectedRange.bottomRight.x,
            y: Math.max(cursorState.selection.selectionStartCell.y, gridCoords.y),
        },
    };
    return {
        ...cursorState,
        selection: {
            ...cursorState.selection,
            selectedRange,
            selectionEndCell: {
                ...cursorState.selection.selectionEndCell,
                y: gridCoords.y,
            },
        },
        isSelectionInProgress: true,
    };
}

export function updateRangeColumn(
    cursorState: CursorStateWithSelection<SelectionStateColumn>,
    gridCoords: Coord,
): CursorStateWithSelection<SelectionStateColumn> {
    const selectedRange = {
        topLeft: {
            x: Math.min(cursorState.selection.selectionStartCell.x, gridCoords.x),
            y: cursorState.selection.selectedRange.topLeft.y,
        },
        bottomRight: {
            x: Math.max(cursorState.selection.selectionStartCell.x, gridCoords.x),
            y: Math.max(cursorState.selection.selectedRange.bottomRight.y),
        },
    };
    return {
        ...cursorState,
        selection: {
            ...cursorState.selection,
            selectedRange,
            selectionEndCell: {
                ...cursorState.selection.selectionEndCell,
                x: gridCoords.x,
            },
        },
        isSelectionInProgress: true,
    };
}

export function endSelection<T extends SelectionState>(
    cursorState: CursorStateWithSelection<T>,
): CursorStateWithSelection<T> {
    return {
        ...cursorState,
        isSelectionInProgress: false,
    };
}

export function isSelectRangeDifferent(oldRange: SelectRange, newRange: SelectRange) {
    return oldRange.bottomRight.x !== newRange.bottomRight.x ||
        oldRange.bottomRight.y !== newRange.bottomRight.y ||
        oldRange.topLeft.x !== newRange.topLeft.x ||
        oldRange.topLeft.y !== newRange.topLeft.y;
}
