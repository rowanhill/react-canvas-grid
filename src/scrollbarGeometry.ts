import { Coord } from './types';

export const barWidth = 7;
export const barMarginToEdge = 2;
export const barCapMargin = 4;
const minBarLength = 10;

export interface ScrollbarPosition {
    start: number;
    end: number;
}

export function calculateLength(canvasLength: number, gridLength: number, frozenLength: number): number {
    const availableLength = canvasLength - frozenLength - barWidth - 2 * barCapMargin - barMarginToEdge;
    const contentRatio = canvasLength / gridLength;
    const length = Math.round(availableLength * contentRatio);

    return Math.max(length, minBarLength);
}

export function calculatePosition(
    gridOffset: number,
    canvasLength: number,
    gridLength: number,
    barLength: number,
    frozenLength: number,
): ScrollbarPosition {
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
    scrollbarPostions: {
        horizontal: { extent: ScrollbarPosition, y: number } | null,
        vertical: { extent: ScrollbarPosition, x: number } | null,
    },
): 'x' | 'y' | null {
    const halfBarHeight = Math.floor(barWidth / 2);

    if (scrollbarPostions.horizontal) {
        const hTop = scrollbarPostions.horizontal.y - halfBarHeight;
        const hBottom = scrollbarPostions.horizontal.y + halfBarHeight;
        const hExtent = scrollbarPostions.horizontal.extent;
        if (coord.x >= hExtent.start && coord.x <= hExtent.end && coord.y >= hTop && coord.y <= hBottom) {
            return 'x';
        }
    }
    if (scrollbarPostions.vertical) {
        const vLeft = scrollbarPostions.vertical.x - halfBarHeight;
        const vRight = scrollbarPostions.vertical.x + halfBarHeight;
        const vExtent = scrollbarPostions.vertical.extent;
        if (coord.y >= vExtent.start && coord.y <= vExtent.end && coord.x >= vLeft && coord.x <= vRight) {
            return 'y';
        }
    }

    return null;
}
