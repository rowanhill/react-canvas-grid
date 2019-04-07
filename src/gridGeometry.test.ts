import { GridGeometry } from './gridGeometry';
import { ReactCanvasGridProps } from './ReactCanvasGrid';
import { Coord } from './types';

describe('GridGeomtry', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('calculateColumnBoundaries', () => {
        it('returns boundaries inclusive on the left, exclusive on the right, and excluding borders', () => {
            const props: ReactCanvasGridProps<any> = {
                cssWidth: '100%',
                cssHeight: '100%',
                borderWidth: 1,
                columns: [
                    { width: 10, fieldName: '1' },
                    { width: 10, fieldName: '2' },
                    { width: 10, fieldName: '3' },
                ],
                data: [],
                rowHeight: 19,
                frozenRows: 0,
                frozenCols: 0,
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
                cssWidth: '100%',
                cssHeight: '100%',
                borderWidth: 1,
                columns: [
                    { width: 49, fieldName: '1' },
                    { width: 39, fieldName: '2' },
                    { width: 59, fieldName: '3' },
                ],
                data: [ {}, {}, {}, {}, {} ],
                rowHeight: 19,
                frozenRows: 0,
                frozenCols: 0,
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
                cssWidth: '100%',
                cssHeight: '100%',
                borderWidth: 1,
                columns: [{ width: 10, fieldName: '1' }],
                data: [ {} ],
                rowHeight: 10,
                frozenRows: 0,
                frozenCols: 0,
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
                cssWidth: '100%',
                cssHeight: '100%',
                borderWidth: 1,
                columns: [{ width: 500, fieldName: '1' }],
                data: [ {} ],
                rowHeight: 500,
                frozenRows: 0,
                frozenCols: 0,
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
                cssWidth: '100%',
                cssHeight: '100%',
                borderWidth: 1,
                columns: [{ width: 500, fieldName: '1' }],
                data: [ {} ],
                rowHeight: 500,
                frozenRows: 0,
                frozenCols: 0,
            };
            const scrollParent: HTMLElement = {
                getBoundingClientRect: () => ({ height: 700, width: 700 }),
            } as unknown as HTMLElement;
            const screen: Screen = { availHeight: 400, availWidth: 400 } as unknown as Screen;

            const size = GridGeometry.calculateMaxViewSize(props, scrollParent, screen);

            expect(size).toEqual({ width: 400, height: 400 });
        });
    });

    describe('calculateGridCellCoords', () => {
        it('maps a click in the top left of the grid to (0,0), when the grid is not scrolled from the origin', () => {
            const props = { rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }] } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 0 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the root element\'s offset within the window', () => {
            const props = { rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }] } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 100, left: 100 })} as unknown as HTMLDivElement;

            const coords =
                GridGeometry.calculateGridCellCoords({ clientX: 100, clientY: 100 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the grid having been scrolled away from the origin', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 15, y: 25 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 0 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click on the rightmost pixel of (0,0) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 9, clientY: 0 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between cell (0,0) and (1,0) to the cell on the right', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 10, clientY: 0 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the leftmost pixel of (1,0) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 11, clientY: 0 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the bottommost pixel of (0,0) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 19 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between (0,0) and (0,1) to the cell on the bottom', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 20 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click on the topmost pixel of (0,1) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 21 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click in the top left of (1,1) to that cell\'s coords', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 11, clientY: 21 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click in the bottom right of (1,1) to that cell\'s coords', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 20, clientY: 40 }, props, gridOffset, root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });
    });
});
