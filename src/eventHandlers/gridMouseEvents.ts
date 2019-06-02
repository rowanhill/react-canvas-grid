import { RefObject } from 'react';
import {
    hasSelectionColumnState,
    hasSelectionFrozenState,
    hasSelectionRowState,
    hasSelectionState,
} from '../cursorState';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { isLeftButton } from './mouseEvents';
import { clearScrollByDragTimer, startScrollBySelectionDragIfNeeded } from './scrolling';
import {
    selectAll,
    selectCol,
    selectRow,
    startSelection,
    updateSelection,
    updateSelectionCol,
    updateSelectionRow,
} from './selection';

export const mouseDownOnGrid = <T>(
    event: React.MouseEvent<any, any>,
    componentPixelCoord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    editingCell: EditingCell<T> | null,
) => {
    if (!isLeftButton(event)) {
        return;
    }
    if (editingCell !== null) {
        // We're editing a cell, so ignore clicks on grid
        return;
    }

    if (leftClickOnFrozenCell(event, componentPixelCoord, rootRef, props, gridState)) {
        return;
    }

    const gridCoords = GridGeometry.calculateGridCellCoordsFromGridState(event, rootRef.current, gridState);

    if (event.shiftKey && hasSelectionState(gridState.cursorState())) {
        updateSelection(props, gridState, gridCoords);
    } else {
        startSelection(props, gridState, gridCoords);
    }
};

const leftClickOnFrozenCell = <T>(
    event: React.MouseEvent<any, any>,
    componentPixelCoord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
): boolean => {
    const clickInFrozenCols = componentPixelCoord.x < gridState.frozenColsWidth();
    const clickInFrozenRows = componentPixelCoord.y < gridState.frozenRowsHeight();
    if (!clickInFrozenCols && !clickInFrozenRows) {
        return false;
    }

    if (clickInFrozenCols && clickInFrozenRows) {
        selectAll(props, gridState);
    } else if (clickInFrozenCols) {
        const coord = GridGeometry.calculateGridCellCoordsFromGridState(
            { clientX: 0, clientY: event.clientY }, rootRef.current, gridState);
        if (event.shiftKey) {
            updateSelectionRow(props, gridState, coord);
        } else {
            selectRow(props, gridState, coord);
        }
    } else if (clickInFrozenRows) {
        const coord = GridGeometry.calculateGridCellCoordsFromGridState(
            { clientX: event.clientX, clientY: 0 }, rootRef.current, gridState);
        if (event.shiftKey) {
            updateSelectionCol(props, gridState, coord);
        } else {
            selectCol(props, gridState, coord);
        }
    }

    return true;
};

export const mouseDragOnGrid = <T>(
    event: React.MouseEvent<any, any>,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    editingCell: EditingCell<T> | null,
): boolean => {
    if (!isLeftButton(event)) {
        return false;
    }
    if (editingCell !== null) {
        // We're editing a cell, so ignore grid drags
        return false;
    }
    const currentCursorState = gridState.cursorState();
    if (!hasSelectionState(currentCursorState)) {
        return false;
    }
    const componentPixelCoord = GridGeometry.calculateComponentPixel(event, rootRef.current);

    if (
        hasSelectionFrozenState(currentCursorState) &&
        leftClickDragOnFrozenCell(event, componentPixelCoord, rootRef, props, gridState)
    ) {
        return true;
    }

    startScrollBySelectionDragIfNeeded(gridState, componentPixelCoord);

    const gridCoords = GridGeometry.calculateGridCellCoordsFromGridState(event, rootRef.current, gridState);
    updateSelection(props, gridState, gridCoords);
    return true;
};

const leftClickDragOnFrozenCell = <T>(
    event: React.MouseEvent<any, any>,
    componentPixelCoord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
): boolean => {
    const clickInFrozenCols = componentPixelCoord.x < gridState.frozenColsWidth();
    const clickInFrozenRows = componentPixelCoord.y < gridState.frozenRowsHeight();
    if (!clickInFrozenCols && !clickInFrozenRows) {
        return false;
    }

    const currentCursorState = gridState.cursorState();
    if (hasSelectionRowState(currentCursorState)) {
        startScrollBySelectionDragIfNeeded(gridState, componentPixelCoord, { suppressX: true });
    } else if (hasSelectionColumnState(currentCursorState)) {
        startScrollBySelectionDragIfNeeded(gridState, componentPixelCoord, { suppressY: true });
    }

    if (clickInFrozenCols && clickInFrozenRows) {
        // Can't drag onto corner to select all, so ignore
    } else if (clickInFrozenCols) {
        const coord = GridGeometry.calculateGridCellCoordsFromGridState(
            { clientX: 0, clientY: event.clientY }, rootRef.current, gridState);
        updateSelectionRow(props, gridState, coord);
    } else if (clickInFrozenRows) {
        const coord = GridGeometry.calculateGridCellCoordsFromGridState(
            { clientX: event.clientX, clientY: 0 }, rootRef.current, gridState);
        updateSelectionCol(props, gridState, coord);
    }

    return true;
};

export const mouseUpOnGrid = <T>(
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
    editingCell: EditingCell<T> | null,
) => {
    clearScrollByDragTimer();

    if (editingCell !== null) {
        // We're editing a cell, so ignore grid clicks
        return;
    }

    const currentCursorState = gridState.cursorState();

    if (props.onSelectionChangeEnd) {
        props.onSelectionChangeEnd(
            hasSelectionState(currentCursorState) ?
                currentCursorState.selection.selectedRange :
                null,
        );
    }
};
