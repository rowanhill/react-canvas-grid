import { RefObject } from 'react';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { mouseDownOnGrid, mouseDragOnGrid, mouseUpOnGrid } from './gridMouseEvents';
import {
    mouseDownOnScrollbar,
    mouseDragOnScrollbar,
    mouseHoverOnScrollbar,
    mouseUpOnScrollbar,
} from './scrollbarMouseEvents';
import { updateOffsetByDelta } from './scrolling';

export function isLeftButton(event: MouseEvent | React.MouseEvent<any, any>): boolean {
    // tslint:disable-next-line: no-bitwise
    return (event.buttons & 1) === 1;
}

export function handleWheel<T>(e: WheelEvent, gridState: GridState<T>) {
    // Browsers may use a 'delta mode' when wheeling, requesting multi-pixel movement
    // See https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
    const scaleFactors: { [index: number]: number; } = {
        0: 1,  // DOM_DELTA_PIXEL: 1-to-1
        1: 16, // DOM_DELTA_LINE: 16 seems a decent guess. See https://stackoverflow.com/q/20110224
    };
    const scaleFactor = scaleFactors[e.deltaMode || 0];
    const willUpdate = updateOffsetByDelta(e.deltaX * scaleFactor, e.deltaY * scaleFactor, gridState);

    if (willUpdate) {
        // The grid is going to move, so we want to prevent any other scrolling from happening
        e.preventDefault();
    }
}

export function handleMouseDown<T>(
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    coord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    gridState: GridState<T>,
    props: ReactCanvasGridProps<T>,
    editingCell: EditingCell<T> | null,
) {
    if (mouseDownOnScrollbar(coord, gridState)) {
        return;
    } else {
        mouseDownOnGrid(event, coord, rootRef, props, gridState, editingCell);
    }
}

export function handleMouseMove<T>(
    event: MouseEvent,
    coord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    gridState: GridState<T>,
    props: ReactCanvasGridProps<T>,
    editingCell: EditingCell<T> | null,
) {
    if (mouseDragOnScrollbar(coord, gridState)) {
        return;
    } else if (mouseDragOnGrid(event, rootRef, props, gridState, editingCell)) {
        return;
    } else {
        mouseHoverOnScrollbar(coord, gridState);
    }
}

export function handleMouseUp<T>(
    coord: Coord,
    gridState: GridState<T>,
    props: ReactCanvasGridProps<T>,
    editingCell: EditingCell<T> | null,
) {
    if (mouseUpOnScrollbar()) {
        mouseHoverOnScrollbar(coord, gridState);
        return;
    } else {
        mouseUpOnGrid(props, gridState, editingCell);
    }
}
