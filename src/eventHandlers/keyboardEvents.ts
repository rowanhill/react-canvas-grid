import * as React from 'react';
import {
    hasSelectionCellState,
    hasSelectionColumnState,
    hasSelectionRowState,
    hasSelectionState,
} from '../cursorState';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { scrollToCell, scrollToColumn, scrollToRow } from './scrolling';
import { selectOrUpdateCol, selectOrUpdateRow, startOrUpdateSelection } from './selection';

export const keyDownOnGrid = <T>(
    event: React.KeyboardEvent<any>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
) => {
    const cursor = gridState.cursorState();
    if (hasSelectionState(cursor)) {
        const cursorCell = event.shiftKey ? cursor.selection.selectionEndCell : cursor.editCursorCell;

        if (hasSelectionColumnState(cursor)) {
            let newCoord: Coord | undefined;
            if (event.key === 'ArrowRight') {
                newCoord = { x: cursorCell.x + 1, y: cursorCell.y };
            } else if (event.key === 'ArrowLeft') {
                newCoord = { x: cursorCell.x - 1, y: cursorCell.y };
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                newCoord = cursorCell;
            } else {
                return;
            }

            selectOrUpdateCol(event, props, gridState, newCoord);
            scrollToColumn(newCoord.x, gridState);
        } else if (hasSelectionRowState(cursor)) {
            let newCoord: Coord | undefined;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                newCoord = cursorCell;
            } else if (event.key === 'ArrowUp') {
                newCoord = { x: cursorCell.x, y: cursorCell.y - 1 };
            } else if (event.key === 'ArrowDown') {
                newCoord = { x: cursorCell.x, y: cursorCell.y + 1 };
            } else {
                return;
            }

            selectOrUpdateRow(event, props, gridState, newCoord);
            scrollToRow(newCoord.y, gridState);
        } else if (hasSelectionCellState(cursor)) {
            let newCoord: Coord | undefined;
            if (event.key === 'ArrowRight') {
                newCoord = { x: cursorCell.x + 1, y: cursorCell.y };
            } else if (event.key === 'ArrowLeft') {
                newCoord = { x: cursorCell.x - 1, y: cursorCell.y };
            } else if (event.key === 'ArrowUp') {
                newCoord = { x: cursorCell.x, y: cursorCell.y - 1 };
            } else if (event.key === 'ArrowDown') {
                newCoord = { x: cursorCell.x, y: cursorCell.y + 1 };
            } else {
                return;
            }

            startOrUpdateSelection(event, props, gridState, newCoord);
            scrollToCell(newCoord, gridState);
        }
    }
};
