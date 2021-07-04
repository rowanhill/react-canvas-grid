import { RefObject } from 'react';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { CellsSelection } from '../selectionState/cellsSelection';

export const mouseDownOnAutofillHandle = <T>(
    event: React.MouseEvent<any, any>,
    gridState: GridState<T>,
    rootRef: RefObject<HTMLDivElement>,
): boolean => {
    const selectionState = gridState.selectionState();
    if (!(selectionState instanceof CellsSelection)) {
        return false;
    }
    const selectionRange = selectionState.getSelectionRange();

    const shouldAllowAutofill = gridState.shouldAllowAutofill();
    if (!shouldAllowAutofill(selectionRange)) {
        return false;
    }

    const isHandleHit = isOverAutofillHandle(selectionState, event, gridState, rootRef);

    if (isHandleHit) {
        // Start tracking autofill drag
        const newSelState = selectionState.mouseDownOnAutofillHandle();
        gridState.selectionState(newSelState);
        return true;
    } else {
        return false;
    }
};

export const mouseHoverOnAutofillHandle = <T>(
    event: MouseEvent,
    gridState: GridState<T>,
    rootRef: RefObject<HTMLDivElement>,
): boolean => {
    const selectionState = gridState.selectionState();
    if (selectionState instanceof CellsSelection) {
        const selectionRange = selectionState.getSelectionRange();
        const shouldAllowAutofill = gridState.shouldAllowAutofill();
        if (shouldAllowAutofill(selectionRange)) {
            const isHandleHit = isOverAutofillHandle(selectionState, event, gridState, rootRef);
            if (isHandleHit) {
                gridState.autofillHandleIsHovered(true);
                return true;
            }
        }
    }

    gridState.autofillHandleIsHovered(false);
    return false;
};

const isOverAutofillHandle = <T>(
    selectionState: CellsSelection,
    event: {clientX: number, clientY: number},
    gridState: GridState<T>,
    rootRef: RefObject<HTMLDivElement>,
): boolean => {
    const selectionRange = selectionState.getSelectionRange();

    const bottomRightCellBounds = GridGeometry.calculateCellBounds(
        selectionRange.bottomRight.x,
        selectionRange.bottomRight.y,
        gridState.rowHeight(),
        gridState.borderWidth(),
        gridState.columnBoundaries(),
    );
    const gridPixelCoord = GridGeometry.calculateGridPixelCoords(
        event,
        gridState.gridOffset(),
        gridState.frozenColsWidth(),
        gridState.frozenRowsHeight(),
        rootRef.current,
    );
    const dx = gridPixelCoord.x - bottomRightCellBounds.right;
    const dy = gridPixelCoord.y - bottomRightCellBounds.bottom;

    return Math.abs(dx) <= 3 && Math.abs(dy) <= 3;
};
