import * as React from 'react';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { NoSelection } from '../selectionState/noSelection';
import { CellCoordBounds } from '../selectionState/selectionState';
import { AllSelectionStates } from '../selectionState/selectionStateFactory';

interface ShiftNoShiftActions {
    shift: (cellBounds: CellCoordBounds) => AllSelectionStates | NoSelection;
    noShift: (cellBounds: CellCoordBounds) => AllSelectionStates | NoSelection;
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

    // Create the new state
    const newSelState = selectionArrowAction({
        frozenCols: gridState.frozenCols(),
        frozenRows: gridState.frozenRows(),
        numCols: gridState.columns().length,
        numRows: gridState.data().length,
    });

    const selectionRange = newSelState.getSelectionRange(gridState.cellBounds());
    const newOffset = newSelState.getFocusGridOffset(gridState);

    if (newSelState !== selectionState && selectionRange !== null && newOffset !== null) {
        // Start / update prop callback
        const onStartOrUpdate = event.shiftKey ? props.onSelectionChangeUpdate : props.onSelectionChangeStart;
        if (onStartOrUpdate) {
            onStartOrUpdate(selectionRange);
        }

        // Scroll
        gridState.gridOffsetRaw(newOffset);

        // End prop callback
        if (props.onSelectionChangeEnd) {
            props.onSelectionChangeEnd(selectionRange);
        }

        // Update selection state
        gridState.selectionState(newSelState);
    }
};
