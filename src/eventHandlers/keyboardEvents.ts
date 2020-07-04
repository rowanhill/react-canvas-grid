import * as React from 'react';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { AllSelectionStates } from '../selectionState/selectionStateFactory';
import { CellCoordBounds } from '../selectionState/selectionTypes';
import { equalSelectRange } from '../utils';

interface ShiftNoShiftActions {
    shift: (cellBounds: CellCoordBounds) => AllSelectionStates;
    noShift: (cellBounds: CellCoordBounds) => AllSelectionStates;
}
interface StateArrowActions {
    [arrowKey: string]: ShiftNoShiftActions;
}

export const keyDownOnGrid = <T>(
    event: React.KeyboardEvent<any>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
) => {
    const selectionState = gridState.selectionState();

    // Find the appropriate method to call on the selection state
    const actions: StateArrowActions = {
        ArrowRight : { shift: selectionState.shiftArrowRight, noShift: selectionState.arrowRight },
        ArrowLeft : { shift: selectionState.shiftArrowLeft, noShift: selectionState.arrowLeft },
        ArrowUp : { shift: selectionState.shiftArrowUp, noShift: selectionState.arrowUp },
        ArrowDown : { shift: selectionState.shiftArrowDown, noShift: selectionState.arrowDown },
    };
    const selectionArrowActions = actions[event.key];
    if (!selectionArrowActions) {
        return;
    }
    const selectionArrowAction = selectionArrowActions[event.shiftKey ? 'shift' : 'noShift'];

    const cellBounds = gridState.cellBounds();

    // Create the new state
    const newSelState = selectionArrowAction(cellBounds);

    const selectionRange = newSelState.getSelectionRange(cellBounds);
    const newOffset = newSelState.getFocusGridOffset(gridState);

    const oldSelectionRange = selectionState.getSelectionRange(cellBounds);

    if (selectionRange !== null && !equalSelectRange(oldSelectionRange, selectionRange)) {
        // Start / update prop callback
        const onStartOrUpdate = event.shiftKey ? props.onSelectionChangeUpdate : props.onSelectionChangeStart;
        if (onStartOrUpdate) {
            onStartOrUpdate(selectionRange);
        }

        // Scroll
        if (newOffset !== null) {
            gridState.gridOffsetRaw(newOffset);
        }

        // End prop callback
        if (props.onSelectionChangeEnd) {
            props.onSelectionChangeEnd(selectionRange);
        }

        // Update selection state
        gridState.selectionState(newSelState);

        // Prevent the arrow key from scrolling the page (as we've scrolled in the grid instead)
        event.preventDefault();
    }
};
