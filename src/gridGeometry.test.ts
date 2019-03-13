import { GridGeometry } from './gridGeometry';
import { ReactCanvasGridProps } from './ReactCanvasGrid';

describe('GridGeomtry', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

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

    describe('calculateViewRect', () => {
        it('can be bounded by the scroll parent (i.e. the grid is in a small scrolling div)', () => {
            const scrollParent = {
                getBoundingClientRect: () => ({
                    top: 200, left: 200, height: 500, width: 500, bottom: 700, right: 700,
                }),
            } as unknown as HTMLElement;
            const sizer = {
                getBoundingClientRect: () => ({
                    top: 100, left: 100, height: 700, width: 700, bottom: 800, right: 800,
                }),
            } as unknown as HTMLDivElement;
            const screen: Screen = { availHeight: 1000, availWidth: 1000 } as unknown as Screen;

            const rect = GridGeometry.calculateViewRect(scrollParent, sizer, screen);

            expect(rect).toEqual({
                top: 100, left: 100, height: 500, width: 500, bottom: 600, right: 600,
            });
        });

        it('can be bounded by the screen (i.e. the grid is large)', () => {
            const scrollParent = {
                getBoundingClientRect: () => ({
                    top: -200, left: -200, bottom: 1700, right: 1700,
                }),
            } as unknown as HTMLElement;
            const sizer = {
                getBoundingClientRect: () => ({
                    top: -100, left: -100, bottom: 1800, right: 1800,
                }),
            } as unknown as HTMLDivElement;
            const screen: Screen = { availHeight: 1000, availWidth: 1000 } as unknown as Screen;

            const rect = GridGeometry.calculateViewRect(scrollParent, sizer, screen);

            expect(rect).toEqual({
                top: 100, left: 100, height: 1000, width: 1000, bottom: 1100, right: 1100,
            });
        });

        it('can be bounded by the sizer (i.e. there is not much data in the grid)', () => {
            const scrollParent = {
                getBoundingClientRect: () => ({
                    top: -200, left: -200, bottom: 1700, right: 1700,
                }),
            } as unknown as HTMLElement;
            const sizer = {
                getBoundingClientRect: () => ({
                    top: -100, left: -100, bottom: 1800, right: 1800,
                }),
            } as unknown as HTMLDivElement;
            const screen: Screen = { availHeight: 1000, availWidth: 1000 } as unknown as Screen;

            const rect = GridGeometry.calculateViewRect(scrollParent, sizer, screen);

            expect(rect).toEqual({
                top: 100, left: 100, height: 1000, width: 1000, bottom: 1100, right: 1100,
            });
        });

        it('can be bounded by all of the above (so can be smaller than the maxViewSize)', () => {
            const scrollParent = {
                getBoundingClientRect: () => ({
                    top: 800, left: 800, bottom: 1200, right: 1200, // Scroll parent in bottom right
                }),
            } as unknown as HTMLElement;
            const sizer = {
                getBoundingClientRect: () => ({
                    top: 600, left: 800, bottom: 1800, right: 900, // Narrow grid (but tall)
                }),
            } as unknown as HTMLDivElement;
            const screen: Screen = { availHeight: 1000, availWidth: 1000 } as unknown as Screen;

            const rect = GridGeometry.calculateViewRect(scrollParent, sizer, screen);

            expect(rect).toEqual({
                top: 200, // Scroll parent truncates grid at top
                left: 0,  // Scroll parent is left-aligned with sizer, both on screen
                bottom: 400, // Screen truncates grid at bottom
                right: 100, // Screen truncates grid at right
                height: 200,
                width: 100, // Grid is only 100px wide, so nothing truncates it
            });
        });
    });

    describe('calculateGridOffset', () => {
        function defaultNum(arg: number|undefined, def: number) {
            return arg !== undefined ? arg : def;
        }
        function createElements(positions: Partial<{
             gridLeft: number; gridRight: number;
             scrollParentLeft: number; scrollParentRight: number;
             maxViewSizeWidth: number;
             gridTop: number; gridBottom: number;
             scrollParentTop: number; scrollParentBottom: number;
             maxViewSizeHeight: number;
        }>) {
            jest.spyOn(GridGeometry, 'calculateMaxViewSize').mockImplementation(() => ({
                width: 300,
                height: positions.maxViewSizeWidth || 300,
            }));
            const props = { dummy: 'fake props' } as any;
            const scrollParent = {
                getBoundingClientRect: () => ({
                    top: defaultNum(positions.scrollParentTop, 0),
                    bottom: defaultNum(positions.scrollParentBottom, 300),
                    height: defaultNum(positions.scrollParentBottom, 300) - defaultNum(positions.scrollParentTop, 0),
                    left: defaultNum(positions.scrollParentLeft, 0),
                    right: defaultNum(positions.scrollParentRight, 300),
                    width: defaultNum(positions.scrollParentRight, 300) - defaultNum(positions.scrollParentLeft, 0),
                }),
            } as unknown as HTMLElement;
            const sizer = {
                getBoundingClientRect: () => ({
                    top: defaultNum(positions.gridTop, -100),
                    bottom: defaultNum(positions.gridBottom, 500),
                    height: defaultNum(positions.gridBottom, 500) - defaultNum(positions.gridTop, -100),
                    left: defaultNum(positions.gridLeft, -100),
                    right: defaultNum(positions.gridRight, 500),
                    width: defaultNum(positions.gridRight, 500) - defaultNum(positions.gridLeft, -100),
                }),
            } as unknown as HTMLDivElement;

            return { props, scrollParent, sizer };
        }

        describe('x-axis', () => {

            it('pushes the canvas right far enough to align its left with the scroll parent', () => {
                const { props, scrollParent, sizer } = createElements({ gridLeft: 200, scrollParentLeft: 300 });

                const offset = GridGeometry.calculateGridOffset(props, scrollParent, sizer);

                // A canvas element absolutely positioned within the sizer needs to be pushed 100px to the
                // right to have its left edge aligned with the scroll parent's left edge
                expect(offset.x).toEqual(100);
            });

            it('never pulls the canvas left, even if there is space in the scroll parent', () => {
                const { props, scrollParent, sizer } = createElements({ scrollParentLeft: 100, gridLeft: 200 });

                const offset = GridGeometry.calculateGridOffset(props, scrollParent, sizer);

                // The canvas is pinned to the left of the sizer, even if there is space to the left of the
                // sizer within the scroll parent (e.g. a margin, or a sibling element)
                expect(offset.x).toEqual(0);
            });

            it('never pushes the canvas beyond the right edge of the sizer, even if there is space', () => {
                const { props, scrollParent, sizer } = createElements({
                    gridLeft: 0, gridRight: 700,
                    scrollParentLeft: 100, scrollParentRight: 800, // scroll parent right is beyond grid
                    maxViewSizeWidth: 300,
                });

                const offset = GridGeometry.calculateGridOffset(props, scrollParent, sizer);

                // The canvas is pinned to the right of the sizer, even if there is space to the right of the
                // sizer within the scroll parent (e.g. a margin, or a sibling element)
                expect(offset.x).toEqual(400); // grid width - max view width
            });
        });

        describe('y-axis', () => {
            it('pushes the canvas down far enough to align its top with the scroll parent', () => {
                const { props, scrollParent, sizer } = createElements({ gridTop: 200, scrollParentTop: 300 });

                const offset = GridGeometry.calculateGridOffset(props, scrollParent, sizer);

                // A canvas element absolutely positioned within the sizer needs to be pushed down 100px
                // to have its top edge aligned with the scroll parent's top edge
                expect(offset.y).toEqual(100);
            });

            it('never pulls the canvas up, even if there is space in the scroll parent', () => {
                const { props, scrollParent, sizer } = createElements({ scrollParentTop: 100, gridTop: 200 });

                const offset = GridGeometry.calculateGridOffset(props, scrollParent, sizer);

                // The canvas is pinned to the top of the sizer, even if there is space above the
                // sizer within the scroll parent (e.g. a margin, or a sibling element)
                expect(offset.y).toEqual(0);
            });

            it('never pushes the canvas beyond the bottom edge of the sizer, even if there is space', () => {
                const { props, scrollParent, sizer } = createElements({
                    gridTop: 0, gridBottom: 700,
                    scrollParentTop: 100, scrollParentBottom: 800, // scroll parent right is beyond grid
                    maxViewSizeHeight: 300,
                });

                const offset = GridGeometry.calculateGridOffset(props, scrollParent, sizer);

                // The canvas is pinned to the bottom of the sizer, even if there is space below the
                // sizer within the scroll parent (e.g. a margin, or a sibling element)
                expect(offset.y).toEqual(400); // grid height - max view height
            });
        });
    });

    describe('calculateGridCellCoords', () => {
        it('maps a click in the top left of the grid to (0,0), when the scroll parent aligns to the window', () => {
            const props = { rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }] } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 0 }, props, sizer);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('accounts for the scroll parent\'s offset within the window', () => {
            const props = { rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }] } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 100, left: 100 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 100, clientY: 100 }, props, sizer);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the rightmost pixel of (0,0) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 9, clientY: 0 }, props, sizer);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between cell (0,0) and (1,0) to the cell on the right', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 10, clientY: 0 }, props, sizer);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the leftmost pixel of (1,0) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 11, clientY: 0 }, props, sizer);

            expect(coords).toEqual({ x: 1, y: 0 });
        });

        it('maps a click on the bottommost pixel of (0,0) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 19 }, props, sizer);

            expect(coords).toEqual({ x: 0, y: 0 });
        });

        it('maps a click on the border between (0,0) and (0,1) to the cell on the bottom', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 20 }, props, sizer);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click on the topmost pixel of (0,1) to that cell coord', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 0, clientY: 21 }, props, sizer);

            expect(coords).toEqual({ x: 0, y: 1 });
        });

        it('maps a click in the top left of (1,1) to that cell\'s coords', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 11, clientY: 21 }, props, sizer);

            expect(coords).toEqual({ x: 1, y: 1 });
        });

        it('maps a click in the bottom right of (1,1) to that cell\'s coords', () => {
            const props = {
                rowHeight: 20, borderWidth: 1, columns: [{ width: 10 }, { width: 10 }],
            } as ReactCanvasGridProps<any>;
            const sizer = { getBoundingClientRect: () => ({ top: 0, left: 0 })} as unknown as HTMLDivElement;

            const coords = GridGeometry.calculateGridCellCoords({ clientX: 20, clientY: 40 }, props, sizer);

            expect(coords).toEqual({ x: 1, y: 1 });
        });
    });
});
