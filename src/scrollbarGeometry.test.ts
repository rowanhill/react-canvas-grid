import * as ScrollbarGeometry from './scrollbarGeometry';

describe('ScrollbarGeometry', () => {
    describe('calculateLength', () => {
        it('returns 1px less than the max length if the grid is 1px smaller than the canvas', () => {
            const canvasLength = 499;
            const gridLength = 500;
            const frozenLength = 0;

            const length = ScrollbarGeometry.calculateLength(canvasLength, gridLength, frozenLength);

            const maxLength = canvasLength -
                ScrollbarGeometry.barWidth -
                ScrollbarGeometry.barCapMargin * 2 -
                ScrollbarGeometry.barMarginToEdge;
            expect(length).toBe(maxLength - 1);
        });

        it('returns a minimum of 10px when the grid is vastly larger than the canvas', () => {
            const canvasLength = 100;
            const gridLength = 100000;
            const frozenLength = 0;

            const length = ScrollbarGeometry.calculateLength(canvasLength, gridLength, frozenLength);

            expect(length).toBe(10);
        });

        it('returns half the available length when the canvas is half the length of the grid', () => {
            const canvasLength = 100;
            const gridLength = 200;
            const frozenLength = 0;

            const length = ScrollbarGeometry.calculateLength(canvasLength, gridLength, frozenLength);

            const maxLength = canvasLength -
                ScrollbarGeometry.barWidth -
                ScrollbarGeometry.barCapMargin * 2 -
                ScrollbarGeometry.barMarginToEdge;
            expect(length).toBe(Math.round(maxLength / 2));
        });

        it('discounts the space taken by frozen cells', () => {
            const canvasLength = 100;
            const gridLength = 200;
            const frozenLength = 50;

            const length = ScrollbarGeometry.calculateLength(canvasLength, gridLength, frozenLength);

            const maxLength = canvasLength -
                ScrollbarGeometry.barWidth -
                ScrollbarGeometry.barCapMargin * 2 -
                ScrollbarGeometry.barMarginToEdge;
            expect(length).toBe(Math.round((maxLength - frozenLength) / 2));
        });
    });

    describe('calculateExtent', () => {
        it('places the scrollbar to the start of the canvas when at the origin', () => {
            const gridOffset = 0;
            const canvasLength = 500;
            const gridLength = 1500;
            const barLength = 100;
            const frozenLength = 0;

            const position =
                ScrollbarGeometry.calculateExtent(gridOffset, canvasLength, gridLength, barLength, frozenLength);

            expect(position.start).toBe(ScrollbarGeometry.barCapMargin);
        });

        it('places the scrollbar to the end of the canvas when the grid is scrolled all the way to the end', () => {
            const canvasLength = 500;
            const gridLength = 1500;
            const gridOffset = gridLength - canvasLength;
            const barLength = 100;
            const frozenLength = 0;

            const position =
                ScrollbarGeometry.calculateExtent(gridOffset, canvasLength, gridLength, barLength, frozenLength);

            const margin = ScrollbarGeometry.barWidth +
                ScrollbarGeometry.barMarginToEdge +
                ScrollbarGeometry.barCapMargin;
            expect(position.end).toBe(Math.round(canvasLength - margin));
        });

        it('places the scrollbar just past the frozen elements when at the origin with frozen cells', () => {
            const gridOffset = 0;
            const canvasLength = 500;
            const gridLength = 1500;
            const barLength = 100;
            const frozenLength = 50;

            const position =
                ScrollbarGeometry.calculateExtent(gridOffset, canvasLength, gridLength, barLength, frozenLength);

            expect(position.start).toBe(50 + ScrollbarGeometry.barCapMargin);
        });
    });

    describe('calculateFractionFromStartPos', () => {
        it('returns 0 when the start pos is within the frozen length', () => {
            const frozenLength = 100;
            const canvasLength = 500;
            const barLength = 80;
            const start = 50;

            const fraction =
                ScrollbarGeometry.calculateFractionFromStartPos(start, frozenLength, canvasLength, barLength);

            expect(fraction).toEqual(0);
        });

        it('returns 0 when the start pos is just to the right of the frozen length', () => {
            const frozenLength = 100;
            const canvasLength = 500;
            const barLength = 80;
            const start = frozenLength + ScrollbarGeometry.barCapMargin;

            const fraction =
                ScrollbarGeometry.calculateFractionFromStartPos(start, frozenLength, canvasLength, barLength);

            expect(fraction).toEqual(0);
        });

        it('returns a small fraction when the start pos is only 1px to the right of the leftmost possible', () => {
            const frozenLength = 100;
            const canvasLength = 500;
            const barLength = 80;
            const start = frozenLength + ScrollbarGeometry.barCapMargin + 1;

            const fraction =
                ScrollbarGeometry.calculateFractionFromStartPos(start, frozenLength, canvasLength, barLength);

            expect(fraction).toBeGreaterThan(0);
        });

        it('returns nearly 1 when the start pos is only 1px to the left of the rightmost possible', () => {
            const frozenLength = 100;
            const canvasLength = 500;
            const barLength = 80;
            const rightMargin = ScrollbarGeometry.barCapMargin +
                ScrollbarGeometry.barWidth +
                ScrollbarGeometry.barMarginToEdge;
            const start = canvasLength - rightMargin - barLength - 1;

            const fraction =
                ScrollbarGeometry.calculateFractionFromStartPos(start, frozenLength, canvasLength, barLength);

            expect(fraction).toBeCloseTo(1);
            expect(fraction).toBeLessThan(1);
        });

        it('returns 1 when the start is the rightmost possible', () => {
            const frozenLength = 100;
            const canvasLength = 500;
            const barLength = 80;
            const rightMargin = ScrollbarGeometry.barCapMargin +
                ScrollbarGeometry.barWidth +
                ScrollbarGeometry.barMarginToEdge;
            const start = canvasLength - rightMargin - barLength;

            const fraction =
                ScrollbarGeometry.calculateFractionFromStartPos(start, frozenLength, canvasLength, barLength);

            expect(fraction).toEqual(1);
        });

        it('returns 1 when the start is to the right of the rightmost possible', () => {
            const frozenLength = 100;
            const canvasLength = 500;
            const barLength = 80;
            const rightMargin = ScrollbarGeometry.barCapMargin +
                ScrollbarGeometry.barWidth +
                ScrollbarGeometry.barMarginToEdge;
            const start = canvasLength - rightMargin - barLength + 50;

            const fraction =
                ScrollbarGeometry.calculateFractionFromStartPos(start, frozenLength, canvasLength, barLength);

            expect(fraction).toEqual(1);
        });
    });
});
