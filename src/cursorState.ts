import { Coord } from './types';

export interface CursorState {
    editCursorCell: Coord|null;
    selection: SelectionState|null;
}

interface FrozenStartCellCorner { type: 'corner'; }
interface FrozenStartCellRow { type: 'row'; rowIndex: number; }
interface FrozenStartCellColumn { type: 'column'; colIndex: number; }
interface FrozenStartCellNone { type: 'none'; }
type FrozenStartCell = FrozenStartCellCorner | FrozenStartCellRow | FrozenStartCellColumn | FrozenStartCellNone;
export interface SelectionState {
    selectionStartCell: Coord;
    selectedRange: SelectRange;
    frozenStartCell: FrozenStartCell;
}
type SelectionStateCorner = SelectionState & { frozenStartCell: FrozenStartCellCorner; };
type SelectionStateRow = SelectionState & { frozenStartCell: FrozenStartCellRow; };
type SelectionStateColumn = SelectionState & { frozenStartCell: FrozenStartCellColumn; };
type SelectionStateCell = SelectionState & { frozenStartCell: FrozenStartCellNone; };

export interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

export type CursorStateWithSelection = CursorState & { selection: SelectionState };
export type CursorStateWithCellSelection = CursorState & { selection: SelectionStateCell; };
export type CursorStateWithCornerSelection = CursorState & { selection: SelectionStateCorner; };
export type CursorStateWithRowSelection = CursorState & { selection: SelectionStateRow; };
export type CursorStateWithColumnSelection = CursorState & { selection: SelectionStateColumn; };

export function hasSelectionState(cursorState: CursorState): cursorState is CursorStateWithSelection {
    return cursorState.selection !== null;
}
export function hasSelectionCellState(cursorState: CursorState): cursorState is CursorStateWithCellSelection {
    return cursorState.selection !== null && cursorState.selection.frozenStartCell.type === 'none';
}
export function hasSelectionRowState(cursorState: CursorState): cursorState is CursorStateWithRowSelection {
    return cursorState.selection !== null && cursorState.selection.frozenStartCell.type === 'row';
}
export function hasSelectionColumnState(cursorState: CursorState): cursorState is CursorStateWithColumnSelection {
    return cursorState.selection !== null && cursorState.selection.frozenStartCell.type === 'column';
}

export function createDefault(): CursorState {
    return {
        editCursorCell: null,
        selection: null,
    };
}

export function startDrag(
    gridCoords: Coord,
    frozenStartCell: FrozenStartCell = { type: 'none' },
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
            frozenStartCell,
        },
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
        },
    };
}

function startRange(fromCoords: Coord, toCoords: Coord, frozenStart: FrozenStartCell): CursorStateWithSelection {
    const fromState = startDrag(fromCoords, frozenStart);
    return updateDrag(fromState, toCoords);
}

export function startRangeCorner(fromCoords: Coord, toCoords: Coord): CursorStateWithSelection {
    return startRange(fromCoords, toCoords, { type: 'corner' });
}
export function startRangeRow(fromCoords: Coord, toCoords: Coord): CursorStateWithSelection {
    return startRange(fromCoords, toCoords, { type: 'row', rowIndex: fromCoords.y });
}
export function startRangeColumn(fromCoords: Coord, toCoords: Coord): CursorStateWithSelection {
    return startRange(fromCoords, toCoords, { type: 'column', colIndex: fromCoords.x });
}

export function updateRangeRow(
    cursorState: CursorStateWithRowSelection,
    gridCoords: Coord,
): CursorStateWithRowSelection {
    const selectedRange = {
        topLeft: {
            x: cursorState.selection.selectedRange.topLeft.x,
            y: Math.min(cursorState.selection.frozenStartCell.rowIndex, gridCoords.y),
        },
        bottomRight: {
            x: cursorState.selection.selectedRange.bottomRight.x,
            y: Math.max(cursorState.selection.frozenStartCell.rowIndex, gridCoords.y),
        },
    };
    return {
        ...cursorState,
        selection: {
            ...cursorState.selection,
            selectedRange,
        },
    };
}

export function updateRangeColumn(
    cursorState: CursorStateWithColumnSelection,
    gridCoords: Coord,
): CursorStateWithColumnSelection {
    const selectedRange = {
        topLeft: {
            x: Math.min(cursorState.selection.frozenStartCell.colIndex, gridCoords.x),
            y: cursorState.selection.selectedRange.topLeft.y,
        },
        bottomRight: {
            x: Math.max(cursorState.selection.frozenStartCell.colIndex, gridCoords.x),
            y: Math.max(cursorState.selection.selectedRange.bottomRight.y),
        },
    };
    return {
        ...cursorState,
        selection: {
            ...cursorState.selection,
            selectedRange,
        },
    };
}

export function isSelectRangeDifferent(oldRange: SelectRange, newRange: SelectRange) {
    return oldRange.bottomRight.x !== newRange.bottomRight.x ||
        oldRange.bottomRight.y !== newRange.bottomRight.y ||
        oldRange.topLeft.x !== newRange.topLeft.x ||
        oldRange.topLeft.y !== newRange.topLeft.y;
}
