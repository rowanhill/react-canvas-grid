import { hasSelectionCellState, hasSelectionRowState, hasSelectionState } from '../cursorState';
import * as cursorState from '../cursorState';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';

/*******************************************************************
 * Start or update methods.
 * Either creates a new selection, or extends an existing selection
 *******************************************************************/

export const startOrUpdateSelection = <T>(
    event: { shiftKey: boolean },
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    gridCoords: Coord,
) => {
    if (event.shiftKey && hasSelectionState(gridState.cursorState())) {
        updateSelection(props, gridState, gridCoords);
    } else {
        startSelection(props, gridState, gridCoords);
    }
};

export const selectOrUpdateRow = <T>(
    event: { shiftKey: boolean },
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    gridCoords: Coord,
) => {
    if (event.shiftKey && hasSelectionState(gridState.cursorState())) {
        updateSelectionRow(props, gridState, gridCoords);
    } else {
        selectRow(props, gridState, gridCoords);
    }
};

export const selectOrUpdateCol = <T>(
    event: { shiftKey: boolean },
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    gridCoords: Coord,
) => {
    if (event.shiftKey && hasSelectionState(gridState.cursorState())) {
        updateSelectionCol(props, gridState, gridCoords);
    } else {
        selectCol(props, gridState, gridCoords);
    }
};

/******************************
 * Create selection methods
 * Start a new selection range
 ******************************/

export const startSelection = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>, gridCoords: Coord) => {
    const truncatedCoords = truncateCoord(gridCoords, props);
    const newCursorState = cursorState.startDrag(truncatedCoords);
    startSelectionWithCursorState(props, gridState, newCursorState);
};

export const selectAll = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>) => {
    const newCursorState = cursorState.startRangeCorner(
        { x: props.frozenCols, y: props.frozenRows },
        { x: props.columns.length - 1, y: props.data.length - 1 });
    startSelectionWithCursorState(props, gridState, newCursorState);
};

export const selectRow = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>, coord: Coord) => {
    const truncatedCoords = truncateCoord(coord, props);
    const newCursorState = cursorState.startRangeRow(
        { x: props.frozenCols, y: truncatedCoords.y },
        { x: props.columns.length - 1, y: truncatedCoords.y });
    startSelectionWithCursorState(props, gridState, newCursorState);
};

export const selectCol = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>, coord: Coord) => {
    const truncatedCoords = truncateCoord(coord, props);
    const newCursorState = cursorState.startRangeColumn(
        { x: truncatedCoords.x, y: props.frozenRows },
        { x: truncatedCoords.x, y: props.data.length - 1 });
    startSelectionWithCursorState(props, gridState, newCursorState);
};

const startSelectionWithCursorState = <T>(
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    newCursorState: cursorState.CursorStateWithSelection,
) => {
    if (props.onSelectionChangeStart) {
        props.onSelectionChangeStart(newCursorState.selection.selectedRange);
    }
    gridState.cursorState(newCursorState);
};

/**************************************
 * Extend existing selection methods
 * Do nothing if no existing selection
 **************************************/

export const updateSelection = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>, gridCoords: Coord) => {
    const oldCursorState = gridState.cursorState();
    if (!hasSelectionCellState(oldCursorState)) {
        return;
    }

    const truncatedCoords = truncateCoord(gridCoords, props);

    const newCursorState = cursorState.updateDrag(oldCursorState, truncatedCoords);
    updateCursorStateIfDifferent(props, gridState, oldCursorState, newCursorState);
};

export const updateSelectionRow = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>, coord: Coord) => {
    const oldCursorState = gridState.cursorState();
    if (!hasSelectionRowState(oldCursorState)) {
        return;
    }

    const truncatedCoords = truncateCoord(coord, props);
    const newCursorState = cursorState.updateRangeRow(oldCursorState, truncatedCoords);
    updateCursorStateIfDifferent(props, gridState, oldCursorState, newCursorState);
};

export const updateSelectionCol = <T>(props: ReactCanvasGridProps<T>, gridState: GridState<T>, coord: Coord) => {
    const oldCursorState = gridState.cursorState();
    if (!cursorState.hasSelectionColumnState(oldCursorState)) {
        return;
    }

    const truncatedCoords = truncateCoord(coord, props);
    const newCursorState = cursorState.updateRangeColumn(oldCursorState, truncatedCoords);
    updateCursorStateIfDifferent(props, gridState, oldCursorState, newCursorState);
};

const updateCursorStateIfDifferent = <T>(
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    oldCursorState: cursorState.CursorStateWithSelection,
    newCursorState: cursorState.CursorStateWithSelection,
) => {
    if (props.onSelectionChangeUpdate) {
        const rangeChanged = cursorState.isSelectRangeDifferent(
            oldCursorState.selection.selectedRange,
            newCursorState.selection.selectedRange);
        if (rangeChanged) {
            props.onSelectionChangeUpdate(newCursorState.selection.selectedRange);
        }
    }
    gridState.cursorState(newCursorState);
};

/*****************************
 * Complete selection methods
 *****************************/

export const endSelection = <T>(
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
) => {
    const oldCursorState = gridState.cursorState();
    if (!hasSelectionState(oldCursorState)) {
        return;
    }

    const newCursorState = cursorState.endSelection(oldCursorState);
    if (props.onSelectionChangeEnd) {
        props.onSelectionChangeEnd(newCursorState.selection.selectedRange);
    }
    gridState.cursorState(newCursorState);
};

/***************
 * Util methods
 ***************/

const truncateCoord = <T>(coord: Coord, props: ReactCanvasGridProps<T>): Coord => {
    return {
        x: Math.min(Math.max(coord.x, props.frozenCols), props.columns.length - 1),
        y: Math.min(Math.max(coord.y, props.frozenRows), props.data.length - 1),
    };
};
