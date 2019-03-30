import { Coord } from './types';

export interface CursorState {
    editCursorCell: Coord|null;
    selection: SelectionState|null;
}

export interface SelectionState {
    selectionStartCell: Coord;
    selectedRange: SelectRange;
}

interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

export function createDefault(): CursorState {
    return {
        editCursorCell: null,
        selection: null,
    };
}

export function startDrag(cursorState: CursorState, gridCoords: Coord): CursorState {
    const selectedRange = {
        topLeft: gridCoords,
        bottomRight: gridCoords,
    };
    return {
        ...cursorState,
        editCursorCell: gridCoords,
        selection: {
            selectedRange,
            selectionStartCell: gridCoords,
        },
    };
}

export function updateDrag(cursorState: CursorState, gridCoords: Coord): CursorState {
    if (!cursorState.selection) {
        return cursorState;
    }
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
