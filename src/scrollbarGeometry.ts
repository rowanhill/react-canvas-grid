import { Coord } from './types';

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

export function calculateLength(canvasLength: number, gridLength: number, frozenLength: number): number {
    const availableLength = canvasLength - frozenLength - barWidth - 2 * barCapMargin - barMarginToEdge;
    const contentRatio = canvasLength / gridLength;
    const length = Math.round(availableLength * contentRatio);

    return Math.max(length, minBarLength);
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

export function calculateTransversePosition(canvasTransverse: number): number {
    return canvasTransverse - barWidth;
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
