import { RefObject } from 'react';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { NoSelection } from '../selectionState/noSelection';
import { CellCoordBounds, GridClickRegion } from '../selectionState/selectionState';
import { mouseDown } from '../selectionState/selectionStateFactory';
import { Coord } from '../types';
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
    const process = event.shiftKey ? selectionState.shiftMouseDown : mouseDown;
    const callback = event.shiftKey && !(selectionState instanceof NoSelection) ?
        props.onSelectionChangeUpdate :
        props.onSelectionChangeStart;
    const cellBounds: CellCoordBounds = {
        frozenCols: gridState.frozenCols(),
        frozenRows: gridState.frozenRows(),
        numCols: gridState.columns().length,
        numRows: gridState.data().length,
    };
    const newSelState = process(truncatedCoord, { region }, cellBounds);
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

const getMouseCellCoordAndRegion = <T>(
    event: { clientX: number; clientY: number; },
    componentPixelCoord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
) => {
    // Find the cell coordinates of the mouse event. This is untruncated, and ignoring frozen cell overlays
    const gridCoords = GridGeometry.calculateGridCellCoordsFromGridState(event, rootRef.current, gridState);

    // Figure out if the mouse event is in a frozen cell to determine the region
    const clickInFrozenCols = componentPixelCoord.x < gridState.frozenColsWidth();
    const clickInFrozenRows = componentPixelCoord.y < gridState.frozenRowsHeight();
    const region: GridClickRegion = clickInFrozenCols ?
                        (clickInFrozenRows ? 'frozen-corner' : 'frozen-cols') :
                        (clickInFrozenRows ? 'frozen-rows' : 'cells');

    // If the mouse event was on a frozen cell, the gridCoords will be for the cell coords 'underneath' the
    // frozen cell, so we need to update to coordinate to zero
    switch (region) {
        case 'frozen-corner':
            gridCoords.x = 0;
            gridCoords.y = 0;
            break;
        case 'frozen-rows':
            gridCoords.y = 0;
            break;
        case 'frozen-cols':
            gridCoords.x = 0;
            break;
    }

    // The mouse event may be beyond the grid's actual size, so we need to truncate it (to avoid selections that
    // include fictional cells)
    return {
        truncatedCoord: truncateCoord(gridCoords, props),
        region,
    };
};

const truncateCoord = <T>(coord: Coord, props: ReactCanvasGridProps<T>): Coord => {
    return {
        x: Math.min(Math.max(coord.x, props.frozenCols), props.columns.length - 1),
        y: Math.min(Math.max(coord.y, props.frozenRows), props.data.length - 1),
    };
};
