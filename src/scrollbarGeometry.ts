import { Coord, Size } from './types';

export const barWidth = 7;
export const barMarginToEdge = 2;
export const barCapMargin = 4;
const minBarLength = 10;

export interface ScrollbarExtent {
    start: number;
    end: number;
}

export interface ScrollbarPosition {
    extent: ScrollbarExtent;
    transverse: number;
}

export function getHorizontalScrollbarLength(canvasSize: Size, gridSize: Size, frozenColsWidth: number) {
    return calculateLength(canvasSize.width, gridSize.width, frozenColsWidth);
}

export function getVerticalScrollbarLength(canvasSize: Size, gridSize: Size, frozenRowsHeight: number) {
    return calculateLength(canvasSize.height, gridSize.height, frozenRowsHeight);
}

export function calculateLength(canvasLength: number, gridLength: number, frozenLength: number): number {
    const availableLength = canvasLength - frozenLength - barWidth - 2 * barCapMargin - barMarginToEdge;
    const contentRatio = canvasLength / gridLength;
    const length = Math.round(availableLength * contentRatio);

    return Math.max(length, minBarLength);
}

export function getHorizontalScrollbarExtent(
    gridOffset: Coord,
    canvasSize: Size,
    gridSize: Size,
    horizontalBarLength: number,
    frozenColsWidth: number,
) {
    return calculateExtent(gridOffset.x, canvasSize.width, gridSize.width, horizontalBarLength, frozenColsWidth);
}

export function getVerticalScrollbarExtent(
    gridOffset: Coord,
    canvasSize: Size,
    gridSize: Size,
    verticalBarLength: number,
    frozenRowsHeight: number,
) {
    return calculateExtent(gridOffset.y, canvasSize.height, gridSize.height, verticalBarLength, frozenRowsHeight);
}

export function calculateExtent(
    gridOffset: number,
    canvasLength: number,
    gridLength: number,
    barLength: number,
    frozenLength: number,
): ScrollbarExtent {
    const scrollableGridLength = gridLength - canvasLength;
    const scrollFraction = gridOffset / scrollableGridLength;
    const scrollableCanvasLength =
        canvasLength - frozenLength - barLength - barWidth - 2 * barCapMargin - barMarginToEdge;
    const start = Math.round(scrollableCanvasLength * scrollFraction) + frozenLength + barCapMargin;
    return { start, end: start + barLength };
}

export function getHorizontalScrollbarPos(extent: ScrollbarExtent, canvasSize: Size, gridSize: Size):
ScrollbarPosition | null {
    if (gridSize.width > canvasSize.width) {
        const transverse = calculateTransversePosition(canvasSize.height);
        return { extent, transverse };
    } else {
        return null;
    }
}

export function getVerticalScrollbarPos(extent: ScrollbarExtent, canvasSize: Size, gridSize: Size):
ScrollbarPosition | null {
    if (gridSize.height > canvasSize.height) {
        const transverse = calculateTransversePosition(canvasSize.width);
        return { extent, transverse };
    } else {
        return null;
    }
}

function calculateTransversePosition(canvasTransverse: number): number {
    return canvasTransverse - (barWidth / 2) - barMarginToEdge;
}

export function getVerticalGutterBounds(canvasSize: Size, gridSize: Size): ClientRect|null {
    if (gridSize.height > canvasSize.height) {
        return {
            top: 0,
            left: canvasSize.width - (barWidth + barMarginToEdge * 2),
            height: canvasSize.height,
            width: barWidth + barMarginToEdge * 2,
            bottom: canvasSize.height,
            right: canvasSize.width,
        };
    } else {
        return null;
    }
}

export function getHorizontalGutterBounds(canvasSize: Size, gridSize: Size): ClientRect|null {
    if (gridSize.width > canvasSize.width) {
        return {
            left: 0,
            top: canvasSize.height - (barWidth + barMarginToEdge * 2),
            width: canvasSize.width,
            height: barWidth + barMarginToEdge * 2,
            right: canvasSize.width,
            bottom: canvasSize.height,
        };
    } else {
        return null;
    }
}

export function calculateFractionFromStartPos(
    start: number,
    frozenLength: number,
    canvasLength: number,
    barLength: number,
): number {
    const scrollableCanvasLength =
        canvasLength - frozenLength - barLength - barWidth - 2 * barCapMargin - barMarginToEdge;
    return Math.min(Math.max((start - frozenLength - barCapMargin) / scrollableCanvasLength, 0), 1);
}

export function getHitScrollBar(
    coord: Coord,
    horizontalPosition: ScrollbarPosition | null,
    verticalPosition: ScrollbarPosition | null,
): 'x' | 'y' | null {
    const halfBarHeight = Math.floor(barWidth / 2);

    if (horizontalPosition) {
        const hTop = horizontalPosition.transverse - halfBarHeight;
        const hBottom = horizontalPosition.transverse + halfBarHeight;
        const hExtent = horizontalPosition.extent;
        if (coord.x >= hExtent.start && coord.x <= hExtent.end && coord.y >= hTop && coord.y <= hBottom) {
            return 'x';
        }
    }
    if (verticalPosition) {
        const vLeft = verticalPosition.transverse - halfBarHeight;
        const vRight = verticalPosition.transverse + halfBarHeight;
        const vExtent = verticalPosition.extent;
        if (coord.y >= vExtent.start && coord.y <= vExtent.end && coord.x >= vLeft && coord.x <= vRight) {
            return 'y';
        }
    }

    return null;
}
