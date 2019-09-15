import * as React from 'react';
import { hasSelectionState } from '../cursorState';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { startOrUpdateSelection } from './selection';

export const keyDownOnGrid = <T>(
    event: React.KeyboardEvent<any>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
) => {
    const cursor = gridState.cursorState();
    if (hasSelectionState(cursor)) {
        const cursorCell = event.shiftKey ? cursor.selection.selectionEndCell : cursor.editCursorCell;

        let newCoord: Coord | undefined;
        if (event.key === 'ArrowRight') {
            newCoord = { x: cursorCell.x + 1, y: cursorCell.y };
        } else if (event.key === 'ArrowLeft') {
            newCoord = { x: cursorCell.x - 1, y: cursorCell.y };
        } else if (event.key === 'ArrowUp') {
            newCoord = { x: cursorCell.x, y: cursorCell.y - 1 };
        } else if (event.key === 'ArrowDown') {
            newCoord = { x: cursorCell.x, y: cursorCell.y + 1 };
        }

        if (newCoord !== undefined) {
            startOrUpdateSelection(event, props, gridState, newCoord);
        }
    }
};
