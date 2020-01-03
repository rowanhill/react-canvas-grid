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

    const bottomRightCellBounds = GridGeometry.calculateCellBounds(
        selectionRange.bottomRight.x,
        selectionRange.bottomRight.y,
        gridState.rowHeight(),
        gridState.borderWidth(),
        gridState.columnBoundaries(),
    );
    const gridPixelCoord = GridGeometry.calculateGridPixelCoords(event, gridState.gridOffset(), rootRef.current);
    const dx = gridPixelCoord.x - bottomRightCellBounds.right;
    const dy = gridPixelCoord.y - bottomRightCellBounds.bottom;

    if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
        // Start tracking autofill drag
        const newSelState = selectionState.mouseDownOnAutofillHandle();
        gridState.selectionState(newSelState);
        return true;
    } else {
        return false;
    }
};
