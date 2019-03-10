import { GridGeometry } from './gridGeometry';
import { ReactCanvasGridProps } from './ReactCanvasGrid';

describe('GridGeomtry', () => {
    describe('calculateColumnBoundaries', () => {
        it('returns boundaries inclusive on the left, exclusive on the right, and excluding borders', () => {
            const props: ReactCanvasGridProps<any> = {
                borderWidth: 1,
                columns: [
                    { width: 10, fieldName: '1' },
                    { width: 10, fieldName: '2' },
                    { width: 10, fieldName: '3' },
                ],
                data: [],
                rowHeight: 19,
            };

            const boundaries = GridGeometry.calculateColumnBoundaries(props);

            expect(boundaries).toEqual([
                { left: 0, right: 10 },
                { left: 11, right: 21 },
                { left: 22, right: 32 },
            ]);
        });
    });

    describe('calculateGridSize', () => {
        it('calculates the size of the entire grid (including borders, etc)', () => {
            const props: ReactCanvasGridProps<any> = {
                borderWidth: 1,
                columns: [
                    { width: 49, fieldName: '1' },
                    { width: 39, fieldName: '2' },
                    { width: 59, fieldName: '3' },
                ],
                data: [ {}, {}, {}, {}, {} ],
                rowHeight: 19,
            };

            const size = GridGeometry.calculateGridSize(props);

            // rows are 19 + 1 for border; last row has no border; 5 rows; so 5 * 20 - 1 = 99
            // cols are (49 + 1) + (39 + 1) + 59 = 149
            expect(size).toEqual({ height: 99, width: 149 });
        });
    });

    describe('calculateMaxViewSize', () => {
        it('can be bounded by the grid size (i.e. there is not much data to display)', () => {
            const props: ReactCanvasGridProps<any> = {
                borderWidth: 1,
                columns: [{ width: 10, fieldName: '1' }],
                data: [ {} ],
                rowHeight: 10,
            };
            const scrollParent: HTMLElement = {
                getBoundingClientRect: () => ({ height: 200, width: 300 }),
            } as unknown as HTMLElement;
            const screen: Screen = { availHeight: 1000, availWidth: 1000 } as unknown as Screen;

            const size = GridGeometry.calculateMaxViewSize(props, scrollParent, screen);

            expect(size).toEqual({ width: 10, height: 10 });
        });

        it('can be bounded by the scroll parent size (i.e. the grid is in a small scrolling div)', () => {
            const props: ReactCanvasGridProps<any> = {
                borderWidth: 1,
                columns: [{ width: 500, fieldName: '1' }],
                data: [ {} ],
                rowHeight: 500,
            };
            const scrollParent: HTMLElement = {
                getBoundingClientRect: () => ({ height: 200, width: 300 }),
            } as unknown as HTMLElement;
            const screen: Screen = { availHeight: 1000, availWidth: 1000 } as unknown as Screen;

            const size = GridGeometry.calculateMaxViewSize(props, scrollParent, screen);

            expect(size).toEqual({ width: 300, height: 200 });
        });

        it('can be bounded by the window size (i.e. the data is large and/or the scroll parent other children)', () => {
            const props: ReactCanvasGridProps<any> = {
                borderWidth: 1,
                columns: [{ width: 500, fieldName: '1' }],
                data: [ {} ],
                rowHeight: 500,
            };
            const scrollParent: HTMLElement = {
                getBoundingClientRect: () => ({ height: 700, width: 700 }),
            } as unknown as HTMLElement;
            const screen: Screen = { availHeight: 400, availWidth: 400 } as unknown as Screen;

            const size = GridGeometry.calculateMaxViewSize(props, scrollParent, screen);

            expect(size).toEqual({ width: 400, height: 400 });
        });
    });

    // TODO: Test remaining public methods
});
