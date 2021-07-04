import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import * as ScrollbarGeometry from '../scrollbarGeometry';
import { Coord } from '../types';

let draggedScrollbar: { bar: 'x' | 'y'; origScrollbarStart: number; origClick: number } | null = null;

export const mouseDownOnScrollbar = <T>(coord: Coord, gridState: GridState<T>): boolean => {
    const hitScrollbar = ScrollbarGeometry.getHitScrollBar(
        coord,
        gridState.horizontalScrollbarPos(),
        gridState.verticalScrollbarPos(),
    );

    if (hitScrollbar) {
        draggedScrollbar = {
            bar: hitScrollbar,
            origScrollbarStart: hitScrollbar === 'x' ?
                gridState.horizontalScrollbarPos()!.extent.start :
                gridState.verticalScrollbarPos()!.extent.start,
            origClick: hitScrollbar === 'x' ? coord.x : coord.y,
        };
        return true;
    } else {
        return false;
    }
};

export const mouseDragOnScrollbar = <T>(coord: Coord, gridState: GridState<T>): boolean => {
    if (!draggedScrollbar) {
        return false;
    }

    const values = draggedScrollbar.bar === 'x' ?
        {
            frozenLen: gridState.frozenColsWidth(),
            canvasLen: gridState.canvasSize().width,
            gridLen: gridState.gridSize().width,
            barLen: gridState.horizontalScrollbarLength(),
            clickCoord: coord.x,
        } :
        {
            frozenLen: gridState.frozenRowsHeight(),
            canvasLen: gridState.canvasSize().height,
            gridLen: gridState.gridSize().height,
            barLen: gridState.verticalScrollbarLength(),
            clickCoord: coord.y,
        };

    const dragDistance = values.clickCoord - draggedScrollbar.origClick;
    const desiredStart = draggedScrollbar.origScrollbarStart + dragDistance;
    const desiredFraction = ScrollbarGeometry.calculateFractionFromStartPos(
        desiredStart,
        values.frozenLen,
        values.canvasLen,
        values.barLen,
    );
    const newOffset = GridGeometry.calculateGridOffsetFromFraction(
        desiredFraction,
        values.gridLen,
        values.canvasLen,
    );
    if (draggedScrollbar.bar === 'x') {
        gridState.gridOffsetRaw({ x: newOffset, y: gridState.gridOffset().y });
    } else {
        gridState.gridOffsetRaw({ x: gridState.gridOffset().x, y: newOffset });
    }

    return true;
};

export const mouseHoverOnScrollbar = <T>(coord: Coord, gridState: GridState<T>) => {
    const hoveredScrollbar = ScrollbarGeometry.getHitScrollBar(
        coord,
        gridState.horizontalScrollbarPos(),
        gridState.verticalScrollbarPos(),
    );

    gridState.hoveredScrollbar(hoveredScrollbar);

    return hoveredScrollbar !== null;
};

export const mouseUpOnScrollbar = (): boolean => {
    if (draggedScrollbar) {
        draggedScrollbar = null;
        return true;
    } else {
        return false;
    }
};
