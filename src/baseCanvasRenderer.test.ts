import { BaseCanvasProps, PreviousDrawInfo } from './BaseCanvas';
import { BaseCanvasRenderer } from './baseCanvasRenderer';
import { CellDef, ColumnDef, DataRow } from './types';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

// Some props can be derived from others, so they are in a sense 'denormalised'. To prevent these
// getting out of sync in the tests, we calculate the full props from a 'normalised' set of props.
type NormalisedProps<T> = Omit<Omit<BaseCanvasProps<T>, 'colBoundaries'>, 'gridHeight'>;

function calcProps<T>(props: NormalisedProps<T>): BaseCanvasProps<T> {
    let curLeft = 0;
    const colBoundaries = props.columns.map((column) => {
        const boundary = { left: curLeft, right: curLeft + column.width };
        curLeft += column.width + 1;
        return boundary;
    });

    const gridHeight = ((props.rowHeight + props.borderWidth) * props.data.length) - props.borderWidth;

    return { ...props, colBoundaries, gridHeight };
}

let colIndex = 0;
function col(): ColumnDef {
    const column = {
        fieldName: `col${colIndex}`,
        width: 19,
    };
    colIndex++;
    return column;
}

function cell(): CellDef<null> {
    return {
        data: null,
        getText: () => '',
    };
}
function row(): DataRow<null> {
    const dataRow = {} as DataRow<null>;
    for (let i = 0; i < colIndex; i++) {
        dataRow[`col${i}`] = cell();
    }
    return dataRow;
}

describe('BaseCanvasRenderer', () => {
    beforeEach(() => {
        mockContext = {
            scale: jest.fn(),
            translate: jest.fn(),
            fillRect: jest.fn(),
            drawImage: jest.fn(),
            fillText: jest.fn(),
        } as unknown as CanvasRenderingContext2D;
        mockCanvas = {
            getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
        renderer = new BaseCanvasRenderer<null>(mockCanvas, dpr);
    });

    afterEach(() => {
        jest.resetAllMocks(); // reset spies
    });

    const dpr = 2;
    let mockContext: CanvasRenderingContext2D;
    let mockCanvas: HTMLCanvasElement;
    let renderer: BaseCanvasRenderer<null>;

    describe('fixScale', () => {
        it('set the scale on the canvas to the device pixel ratio', () => {
            renderer.fixScale();

            expect(mockContext.scale).toHaveBeenCalledWith(dpr, dpr);
        });
    });

    describe('draw', () => {
        const normalisedProps: NormalisedProps<null> = {
            borderWidth: 1,
            columns: [col(), col(), col(), col(), col(), col(), col(), col(), col(), col()],
            data: [row(), row(), row(), row(), row(), row(), row(), row(), row(), row()],
            gridOffset: { x: 10, y: 10 },
            height: 50,
            width: 50,
            rowHeight: 9,
            visibleRect: { left: 10, top: 10, width: 50, height: 50, right: 60, bottom: 60 },
        };
        const props: BaseCanvasProps<null> = calcProps(normalisedProps);

        function getDrawnCellRects() {
            const mockDrawCell = renderer.drawCell as jest.Mock<typeof renderer.drawCell>;
            const calls = mockDrawCell.mock.calls as Array<[CellDef<null>, ClientRect, ColumnDef]>;
            return calls.map((c) => c[1]);
        }

        describe('with no previous draw info', () => {
            it('fills the entire canvas with border colour (before drawing cells)', () => {
                jest.spyOn(renderer, 'drawWholeBorderBackground');
                jest.spyOn(renderer, 'shiftExistingCanvas');

                renderer.draw(props, null);

                expect(renderer.drawWholeBorderBackground).toHaveBeenCalledTimes(1);
                expect(renderer.shiftExistingCanvas).not.toHaveBeenCalled();
            });

            it('only draws (at least partially) visible cells', () => {
                jest.spyOn(renderer, 'drawCell');
                const shiftedNormalisedProps = {
                    ...normalisedProps,
                    gridOffset: { x: 25, y: 25 },
                    visibleRect: {
                        left: 25, // scrolled right to quarter-way through 2nd col
                        top: 25, // scrolled down to half-way through 3rd row
                        width: 50, // enough to see 1 partial, 1 full, 1 partial col
                        height: 50, // enough to see 1 partial, 4 full, 1 partial row
                        right: 75,
                        bottom: 75,
                    },
                };
                const shiftedProps = calcProps(shiftedNormalisedProps);

                renderer.draw(shiftedProps, null);

                expect(renderer.drawCell).toHaveBeenCalledTimes(18);
                getDrawnCellRects().forEach((r) => {
                    // Cell is in view horizontally
                    expect(r.right).toBeGreaterThanOrEqual(shiftedProps.visibleRect.left);
                    expect(r.left).toBeLessThanOrEqual(shiftedProps.visibleRect.right);

                    // Cell is in view vertically
                    expect(r.bottom).toBeGreaterThanOrEqual(shiftedProps.visibleRect.top);
                    expect(r.top).toBeLessThanOrEqual(shiftedProps.visibleRect.bottom);
                });
            });
        });

        describe('with previous draw info', () => {
            const prevDraw: PreviousDrawInfo = {
                gridOffset: props.gridOffset,
                rect: props.visibleRect,
            };
            function getNewProps(dx: number, dy: number) {
                return {
                    ...props,
                    gridOffset: {
                        x: props.gridOffset.x + dx,
                        y: props.gridOffset.y + dy,
                    },
                    visibleRect: {
                        ...props.visibleRect,
                        left: props.visibleRect.left + dx,
                        right: props.visibleRect.right + dx,
                        top: props.visibleRect.top + dy,
                        bottom: props.visibleRect.bottom + dy,
                    },
                };
            }

            it('shifts the old image and paints the newly revealed areas in border colour', () => {
                jest.spyOn(renderer, 'drawNewBorderBackground');
                jest.spyOn(renderer, 'shiftExistingCanvas');
                const newProps = getNewProps(3, 5);

                renderer.draw(newProps, prevDraw);

                expect(renderer.shiftExistingCanvas).toHaveBeenCalledWith(-3, -5);
                expect(renderer.drawNewBorderBackground).toHaveBeenCalledWith(-3, -5, newProps.width, newProps.height);
            });

            describe('cell redrawing', () => {
                it('redraws cells on the bottom when scrolling down', () => {
                    jest.spyOn(renderer, 'drawCell');
                    const newProps = getNewProps(0, 5);

                    renderer.draw(newProps, prevDraw);

                    expect(renderer.drawCell).toHaveBeenCalledTimes(4);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.top).toBe(60);
                    });
                });

                it('redraws cells on the top when scrolling up', () => {
                    jest.spyOn(renderer, 'drawCell');
                    const newProps = getNewProps(0, -5);

                    renderer.draw(newProps, prevDraw);

                    expect(renderer.drawCell).toHaveBeenCalledTimes(4);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.top).toBe(0);
                    });
                });

                it('redraws cells on the right when scrolling right`', () => {
                    jest.spyOn(renderer, 'drawCell');
                    const newProps = getNewProps(5, 0);

                    renderer.draw(newProps, prevDraw);

                    expect(renderer.drawCell).toHaveBeenCalledTimes(5);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.left).toBe(60);
                    });
                });

                it('redraws cells on the left when scrolling left`', () => {
                    jest.spyOn(renderer, 'drawCell');
                    const newProps = getNewProps(-5, 0);

                    renderer.draw(newProps, prevDraw);

                    expect(renderer.drawCell).toHaveBeenCalledTimes(5);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.left).toBe(0);
                    });
                });
            });
        });
    });

    describe('drawWholeBorderBackground', () => {
        it('fills the entire canvas', () => {
            renderer.drawWholeBorderBackground(100, 100);

            expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
            expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
        });
    });

    describe('drawNewBorderBackground', () => {
        it('only fills the bottom edge when scrolling down', () => {
            renderer.drawNewBorderBackground(0, -5, 100, 100);

            expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
            expect(mockContext.fillRect).toHaveBeenCalledWith(0, 95, 100, 5);
        });

        it('only fills the top edge when scrolling up', () => {
            renderer.drawNewBorderBackground(0, 5, 100, 100);

            expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
            expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 100, 5);
        });

        it('only fills the right edge when scrolling right', () => {
            renderer.drawNewBorderBackground(-5, 0, 100, 100);

            expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
            expect(mockContext.fillRect).toHaveBeenCalledWith(95, 0, 5, 100);
        });

        it('only fills the left edge when scrolling left', () => {
            renderer.drawNewBorderBackground(5, 0, 100, 100);

            expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
            expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 5, 100);
        });
    });
});
