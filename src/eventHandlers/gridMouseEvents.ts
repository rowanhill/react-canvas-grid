import { RefObject } from 'react';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { NoSelection } from '../selectionState/noSelection';
import { Coord } from '../types';
import { getMouseCellCoordAndRegion } from './mouseCellAndRegionCalc';
import { isLeftButton } from './mouseEvents';
import { clearScrollByDragTimer, startScrollBySelectionDragIfNeeded } from './scrollingTimer';

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

    const {truncatedCoord, region} = getMouseCellCoordAndRegion(event, componentPixelCoord, rootRef, props, gridState);

    // Now we can process the click and update the selection state
    const selectionState = gridState.selectionState();
    const process = event.shiftKey ? selectionState.shiftMouseDown : selectionState.mouseDown;
    const callback = event.shiftKey && !(selectionState instanceof NoSelection) ?
        props.onSelectionChangeUpdate :
        props.onSelectionChangeStart;
    const newSelState = process(truncatedCoord, { region });
    if (selectionState !== newSelState) {
        if (callback) {
            callback(newSelState.getSelectionRange(gridState.cellBounds()));
        }
        gridState.selectionState(newSelState);
    }
};

export const mouseDragOnGrid = <T>(
    event: MouseEvent,
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
    const selectionState = gridState.selectionState();
    if (!selectionState.isSelectionInProgress) {
        // We're not dragging anything, so ignore the mouse move
        return false;
    }

    const componentPixelCoord = GridGeometry.calculateComponentPixel(event, rootRef.current);

    const recalculateAndUpdateSelection = () => {
        const {truncatedCoord} = getMouseCellCoordAndRegion(event, componentPixelCoord, rootRef, props, gridState);

        // Now we can process the click and update the selection state
        const newSelState = selectionState.mouseMove(truncatedCoord);
        const selectionRange = newSelState.getSelectionRange(gridState.cellBounds());
        if (selectionState !== newSelState && selectionRange !== null) {
            if (props.onSelectionChangeUpdate) {
                props.onSelectionChangeUpdate(selectionRange);
            }
            gridState.selectionState(newSelState);
        }
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
    const selectionState = gridState.selectionState();
    if (!selectionState.isSelectionInProgress) {
        return false;
    }

    const newSelState = selectionState.mouseUp();
    if (selectionState !== newSelState) {
        if (props.onSelectionChangeEnd) {
            props.onSelectionChangeEnd(newSelState.getSelectionRange(gridState.cellBounds()));
        }
        gridState.selectionState(newSelState);
    }
};
