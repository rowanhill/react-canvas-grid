import { GridGeometry, ColumnBoundary } from './gridGeometry';
import { ReactCanvasGridProps } from './ReactCanvasGrid';
import { Coord } from './types';

describe('GridGeomtry', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('calculateColumnBoundaries', () => {
        it('returns boundaries inclusive on the left, exclusive on the right, and excluding borders', () => {
            const borderWidth = 1;
            const columns = [
                { width: 10, fieldName: '1' },
                { width: 10, fieldName: '2' },
                { width: 10, fieldName: '3' },
            ];

            const boundaries = GridGeometry.calculateColumnBoundaries(columns, borderWidth);

            expect(boundaries).toEqual([
                { left: 0, right: 10 },
                { left: 11, right: 21 },
                { left: 22, right: 32 },
            ]);
        });
    });

    describe('calculateGridSize', () => {
        it('calculates the size of the entire grid (including borders, etc)', () => {
            const data = [ {}, {}, {}, {}, {} ];
            const columnBoundaries: ColumnBoundary[] =  [
                { left: 0, right: 49 },
                { left: 50, right: 89 },
                { left: 90, right: 149 },
            ];
            const rowHeight = 19;
            const borderWidth = 1;

            const size = GridGeometry.calculateGridSize(data, columnBoundaries, rowHeight, borderWidth);

            // rows are 19 + 1 for border; last row has no border; 5 rows; so 5 * 20 - 1 = 99
            // cols are (49 + 1) + (39 + 1) + 59 = 149
            expect(size).toEqual({ height: 99, width: 149 });
        });
    });

    describe('calculateGridCellCoords', () => {
        it('maps a click in the top left of the grid to (0,0), when the grid is not scrolled from the origin', () => {
            const colBoundaries = [{left: 0, right: 10}];
            const borderWidth =  1;
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the root element\'s offset within the window', () => {
            const colBoundaries = [{left: 0, right: 10}];
            const borderWidth =  1;
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 100, left: 100 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 100, clientY: 100 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the grid having been scrolled away from the origin', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 15, y: 25 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click on the rightmost pixel of (0,0) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 9, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between cell (0,0) and (1,0) to the cell on the right', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 10, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the leftmost pixel of (1,0) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 11, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the bottommost pixel of (0,0) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 19 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between (0,0) and (0,1) to the cell on the bottom', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 20 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click on the topmost pixel of (0,1) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 21 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click in the top left of (1,1) to that cell\'s coords', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 11, clientY: 21 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click in the bottom right of (1,1) to that cell\'s coords', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 20, clientY: 40 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });
    });
});
