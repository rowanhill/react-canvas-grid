import { RefObject } from 'react';
import { CursorState, hasSelectionColumnState, hasSelectionFrozenState, hasSelectionRowState } from '../cursorState';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { startScrollBySelectionDragIfNeeded } from './scrollingTimer';
import { selectAll, selectCol, selectRow, updateSelectionCol, updateSelectionRow } from './selection';

export const leftClickOnFrozenCell = <T>(
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

export const leftClickDragOnFrozenCell = <T>(
    currentCursorState: CursorState,
    event: React.MouseEvent<any, any>,
    componentPixelCoord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
): boolean => {
    if (!hasSelectionFrozenState(currentCursorState)) {
        return false;
    }

    const clickInFrozenCols = componentPixelCoord.x < gridState.frozenColsWidth();
    const clickInFrozenRows = componentPixelCoord.y < gridState.frozenRowsHeight();
    if (!clickInFrozenCols && !clickInFrozenRows) {
        return false;
    }

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
