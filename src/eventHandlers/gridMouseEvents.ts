import { RefObject } from 'react';
import { hasSelectionState } from '../cursorState';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { leftClickDragOnFrozenCell, leftClickOnFrozenCell } from './frozenCellMouseEvents';
import { isLeftButton } from './mouseEvents';
import { clearScrollByDragTimer, startScrollBySelectionDragIfNeeded } from './scrollingTimer';
import { endSelection, startSelection, updateSelection } from './selection';

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

    if (leftClickDragOnFrozenCell(currentCursorState, event, componentPixelCoord, rootRef, props, gridState)) {
        return true;
    }

    const { clientX, clientY } = event;
    const recalculateAndUpdateSelection = () => {
        const gridCoords = GridGeometry.calculateGridCellCoordsFromGridState(
            {clientX, clientY},
            rootRef.current,
            gridState);
        updateSelection(props, gridState, gridCoords);
    };
    startScrollBySelectionDragIfNeeded(gridState, componentPixelCoord, recalculateAndUpdateSelection);

    recalculateAndUpdateSelection();
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

    endSelection(props, gridState);
};
