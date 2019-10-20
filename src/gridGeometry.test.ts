import { ColumnBoundary, GridGeometry } from './gridGeometry';
import { Coord, Size } from './types';

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

    describe('calculateGridPlusGutterSize', () => {
        const gutterWidth = 11;

        it('returns the plain grid size if the root element size is not known', () => {
            const gridSize = { width: 100, height: 100 };
            const rootSize = null;

            const size = GridGeometry.calculateGridPlusGutterSize(gridSize, rootSize);

            expect(size).toEqual(gridSize);
        });

        it('adds (horizontal) space for a vertical gutter if the grid is taller than the root element', () => {
            const gridSize = { width: 100, height: 1000 };
            const rootSize = { width: 100, height: 100 };

            const size = GridGeometry.calculateGridPlusGutterSize(gridSize, rootSize);

            expect(size).toEqual({ width: 100 + gutterWidth, height: 1000 });
        });

        it('adds (vertical) space for a horitontal gutter if the grid is wider than the root element', () => {
            const gridSize = { width: 1000, height: 100 };
            const rootSize = { width: 100,  height: 100 };

            const size = GridGeometry.calculateGridPlusGutterSize(gridSize, rootSize);

            expect(size).toEqual({ width: 1000, height: 100 + gutterWidth });
        });
    });

    describe('calculateGridCellCoords', () => {
        it('maps a click in the top left of the grid to (0,0), when the grid is not scrolled from the origin', () => {
            const colBoundaries = [{left: 0, right: 10}];
            const borderWidth =  1;
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the root element\'s offset within the window', () => {
            const colBoundaries = [{left: 0, right: 10}];
            const borderWidth =  1;
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 100, left: 100 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 100, clientY: 100 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the grid having been scrolled away from the origin', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 15, y: 25 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click on the rightmost pixel of (0,0) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 9, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between cell (0,0) and (1,0) to the cell on the right', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 10, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the leftmost pixel of (1,0) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 11, clientY: 0 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the bottommost pixel of (0,0) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 19 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between (0,0) and (0,1) to the cell on the bottom', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 20 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click on the topmost pixel of (0,1) to that cell coord', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 0, clientY: 21 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click in the top left of (1,1) to that cell\'s coords', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 11, clientY: 21 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click in the bottom right of (1,1) to that cell\'s coords', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 20, clientY: 40 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click to below the bottom cell to the bottom cell', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 20, clientY: maxRow * (rowHeight + borderWidth) + 10 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: maxRow });
        });

        it('maps a click to the right of the cells to the rightmost cell', () => {
            const borderWidth =  1;
            const colBoundaries =
                GridGeometry.calculateColumnBoundaries([{width: 10}, {width: 10}] as any, borderWidth);
            const rowHeight = 20;
            const gridOffset: Coord = { x: 0, y: 0 };
            const maxRow = 100;
            const root = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords(
                { clientX: 20000, clientY: 40 },
                colBoundaries,
                borderWidth,
                rowHeight,
                gridOffset,
                maxRow,
                root);

            expect(coords).toEqual({ x: 1, y: 1 });
        });
    });

    describe('calculateGridOffsetForTargetColumn', () => {
        it('returns the old offset if the focused column spans the view', () => {
            const colBoundaries: ColumnBoundary[] = [
                { left: 0, right: 10 },
                { left: 11, right: 811 },
                { left: 812, right: 822 },
            ];
            const oldOffset: Coord = { x: 50, y: 0 };
            const canvasSize: Size = { width: 500, height: 400 };
            const frozenColsWidth = 0;
            const focusedColIndex = 1;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual(oldOffset);
        });

        it('returns the old offset if the focused column is within the view', () => {
            const colBoundaries: ColumnBoundary[] = [
                { left: 0, right: 100 },
                { left: 101, right: 201 },
                { left: 202, right: 302 },
            ];
            const oldOffset: Coord = { x: 50, y: 0 };
            const canvasSize: Size = { width: 200, height: 400 };
            const frozenColsWidth = 0;
            const focusedColIndex = 1;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual(oldOffset);
        });

        it('aligns the focused column to the left (right of the frozen cols) when focused col is to left', () => {
            const colBoundaries: ColumnBoundary[] = [
                { left: 0, right: 50 },
                { left: 51, right: 500 },
                { left: 501, right: 601 },
                { left: 602, right: 1500 },
            ];
            const oldOffset: Coord = { x: 620, y: 0 };
            const canvasSize: Size = { width: 200, height: 400 };
            const frozenColsWidth = 50;
            const focusedColIndex = 2;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual({ x: (501 - 50), y: 0 });
        });

        it('aligns the focused column to the right when focused col is to the right', () => {
            const colBoundaries: ColumnBoundary[] = [
                { left: 0, right: 100 },
                { left: 101, right: 201 },
                { left: 202, right: 302 },
            ];
            const oldOffset: Coord = { x: 50, y: 0 };
            const canvasSize: Size = { width: 100, height: 400 };
            const frozenColsWidth = 0;
            const focusedColIndex = 1;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual({ x: 101, y: 0 });
        });

        it('accounts for the scrollbar when aligning to the right', () => {
            const colBoundaries: ColumnBoundary[] = [
                { left: 0, right: 100 },
                { left: 101, right: 201 },
                { left: 202, right: 302 },
            ];
            const oldOffset: Coord = { x: 50, y: 0 };
            const canvasSize: Size = { width: 100, height: 400 };
            const frozenColsWidth = 0;
            const focusedColIndex = 1;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                { width: 10 } as ClientRect,
            );

            expect(offset).toEqual({ x: 111, y: 0 });
        });

        it('returns a minimum x offset of 0, even when trying to bring a frozen col into view', () => {
            const colBoundaries: ColumnBoundary[] = [
                { left: 0, right: 50 },
                { left: 51, right: 500 },
                { left: 501, right: 601 },
                { left: 602, right: 1500 },
            ];
            const oldOffset: Coord = { x: 620, y: 0 };
            const canvasSize: Size = { width: 200, height: 400 };
            const frozenColsWidth = 50;
            const focusedColIndex = 0;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual({ x: 0, y: 0 });
        });

        it('returns the old offset if the focusedColIndex is < 0', () => {
            const colBoundaries: ColumnBoundary[] = [{ left: 0, right: 50 }];
            const oldOffset: Coord = { x: 620, y: 0 };
            const canvasSize: Size = { width: 200, height: 400 };
            const frozenColsWidth = 0;
            const focusedColIndex = -1;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual(oldOffset);
        });

        it('returns the old offset if the focusedColIndex is higher than the current highest column index', () => {
            const colBoundaries: ColumnBoundary[] = [{ left: 0, right: 50 }];
            const oldOffset: Coord = { x: 620, y: 0 };
            const canvasSize: Size = { width: 200, height: 400 };
            const frozenColsWidth = 0;
            const focusedColIndex = 1;

            const offset = GridGeometry.calculateGridOffsetForTargetColumn(
                oldOffset,
                canvasSize,
                frozenColsWidth,
                focusedColIndex,
                colBoundaries,
                null,
            );

            expect(offset).toEqual(oldOffset);
        });
    });
});
