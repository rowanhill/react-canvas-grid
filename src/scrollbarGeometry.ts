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
