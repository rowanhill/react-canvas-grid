import { CanvasRendererPosition } from './baseGridOffsetRenderer';
import * as cellRenderer from './cellRenderer';
import { GridCanvasRenderer, GridCanvasRendererBasics } from './gridCanvasRenderer';
import { execRaf, mockRaf, resetRaf } from './rafTestHelper';
import { CellDef, ColumnDef, DataRow, Size } from './types';

jest.mock('./cellRenderer', () => {
    return {
        drawCell: jest.fn(),
    };
});

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

// Some props can be derived from others, so they are in a sense 'denormalised'. To prevent these
// getting out of sync in the tests, we calculate the full props from a 'normalised' set of props.
type NormalisedProps<T> = Omit<Omit<GridCanvasRendererBasics<T>, 'colBoundaries'>, 'gridInnerSize'>;

function calcProps<T>(props: NormalisedProps<T>): GridCanvasRendererBasics<T> {
    let curLeft = 0;
    const colBoundaries = props.columns.map((column) => {
        const boundary = { left: curLeft, right: curLeft + column.width };
        curLeft += column.width + 1;
        return boundary;
    });

    const gridHeight = ((props.rowHeight + props.borderWidth) * props.data.length) - props.borderWidth;
    const gridWidth = colBoundaries[colBoundaries.length - 1].right;

    return { ...props, colBoundaries, gridInnerSize: { width: gridWidth, height: gridHeight } };
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

describe('GridCanvasRenderer', () => {
    beforeEach(() => {
        mockContext = {
            scale: jest.fn(),
            translate: jest.fn(),
            fillRect: jest.fn(),
            drawImage: jest.fn(),
            fillText: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
        } as unknown as CanvasRenderingContext2D;
        mockCanvas = {
            getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
        renderer = new GridCanvasRenderer<null>(mockCanvas, canvasSize, props, dpr, 'test');

        mockRaf();
    });

    afterEach(() => {
        jest.resetAllMocks(); // reset spies
        resetRaf();
    });

    const dpr = 2;
    const canvasSize: Size = { height: 50, width: 50 };
    let mockContext: CanvasRenderingContext2D;
    let mockCanvas: HTMLCanvasElement;
    let renderer: GridCanvasRenderer<null>;

    const normalisedProps: NormalisedProps<null> = {
        borderWidth: 1,
        columns: [col(), col(), col(), col(), col(), col(), col(), col(), col(), col()],
        data: [row(), row(), row(), row(), row(), row(), row(), row(), row(), row()],
        rowHeight: 9,
    };
    const props: GridCanvasRendererBasics<null> = calcProps(normalisedProps);

    describe('draw', () => {
        const posProps: CanvasRendererPosition = {
            gridOffset: { x: 10, y: 10 },
            visibleRect: {
                left: 10,
                top: 10,
                width: canvasSize.width,
                height: canvasSize.height,
                right: 10 + canvasSize.width,
                bottom: 10 + canvasSize.height,
            },
        };

        function getDrawnCellRects() {
            const mockDrawCell = cellRenderer.drawCell as jest.Mock<typeof cellRenderer.drawCell>;
            const calls = mockDrawCell.mock.calls as Array<[any, CellDef<null>, ClientRect, ColumnDef]>;
            return calls.map((c) => c[2]);
        }

        describe('with no previous draw', () => {
            it('fills the entire canvas with border colour (before drawing cells)', () => {
                jest.spyOn(renderer, 'drawWholeBorderBackground');
                jest.spyOn(renderer, 'shiftExistingCanvas');

                renderer.drawUntranslated();

                expect(renderer.drawWholeBorderBackground).toHaveBeenCalledTimes(1);
                expect(renderer.shiftExistingCanvas).not.toHaveBeenCalled();
            });

            it('only draws (at least partially) visible cells', () => {
                const shiftedPosProps = {
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

                renderer.updateProps(mockCanvas, canvasSize, props, shiftedPosProps);
                execRaf();

                expect(cellRenderer.drawCell).toHaveBeenCalledTimes(18);
                getDrawnCellRects().forEach((r) => {
                    // Cell is in view horizontally
                    expect(r.right).toBeGreaterThanOrEqual(shiftedPosProps.visibleRect.left);
                    expect(r.left).toBeLessThanOrEqual(shiftedPosProps.visibleRect.right);

                    // Cell is in view vertically
                    expect(r.bottom).toBeGreaterThanOrEqual(shiftedPosProps.visibleRect.top);
                    expect(r.top).toBeLessThanOrEqual(shiftedPosProps.visibleRect.bottom);
                });
            });
        });

        describe('with previous draw', () => {
            function getNewPosProps(dx: number, dy: number): CanvasRendererPosition {
                const x = posProps.gridOffset.x + dx;
                const y = posProps.gridOffset.y + dy;
                return {
                    gridOffset: { x, y },
                    visibleRect: {
                        left: x,
                        top: y,
                        width: posProps.visibleRect.width,
                        height: posProps.visibleRect.height,
                        right: x + posProps.visibleRect.width,
                        bottom: y + posProps.visibleRect.height,
                    },
                };
            }

            it('shifts the old image and paints the newly revealed areas in border colour', () => {
                jest.spyOn(renderer, 'drawNewBorderBackground');
                jest.spyOn(renderer, 'shiftExistingCanvas');
                const newProps = getNewPosProps(3, 5);
                renderer.updateProps(mockCanvas, canvasSize, props, posProps);
                execRaf();

                renderer.updateProps(mockCanvas, canvasSize, props, newProps);
                execRaf();

                expect(renderer.shiftExistingCanvas).toHaveBeenCalledWith(-3, -5);
                expect(renderer.drawNewBorderBackground)
                    .toHaveBeenCalledWith(-3, -5, canvasSize.width, canvasSize.height);
            });

            it('ignores the old image and redraws everything if basic props change', () => {
                jest.spyOn(renderer, 'drawNewBorderBackground');
                jest.spyOn(renderer, 'shiftExistingCanvas');
                jest.spyOn(renderer, 'drawWholeBorderBackground');
                const newProps = calcProps({...normalisedProps, borderWidth: 2});
                renderer.updateProps(mockCanvas, canvasSize, props, posProps);
                execRaf();

                renderer.updateProps(mockCanvas, canvasSize, newProps, posProps);
                execRaf();

                expect(renderer.shiftExistingCanvas).not.toHaveBeenCalled();
                expect(renderer.drawNewBorderBackground).not.toHaveBeenCalled();
                expect(renderer.drawWholeBorderBackground).toHaveBeenCalled();
            });

            describe('cell redrawing', () => {
                it('redraws cells on the bottom when scrolling down', () => {
                    const newProps = getNewPosProps(0, 5);
                    renderer.updateProps(mockCanvas, canvasSize, props, posProps);
                    execRaf();
                    (cellRenderer.drawCell as jest.Mock).mockReset();

                    renderer.updateProps(mockCanvas, canvasSize, props, newProps);
                    execRaf();

                    expect(cellRenderer.drawCell).toHaveBeenCalledTimes(4);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.top).toBe(60);
                    });
                });

                it('redraws cells on the top when scrolling up', () => {
                    const newProps = getNewPosProps(0, -5);
                    renderer.updateProps(mockCanvas, canvasSize, props, posProps);
                    execRaf();
                    (cellRenderer.drawCell as jest.Mock).mockReset();

                    renderer.updateProps(mockCanvas, canvasSize, props, newProps);
                    execRaf();

                    expect(cellRenderer.drawCell).toHaveBeenCalledTimes(4);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.top).toBe(0);
                    });
                });

                it('redraws cells on the right when scrolling right`', () => {
                    const newProps = getNewPosProps(5, 0);
                    renderer.updateProps(mockCanvas, canvasSize, props, posProps);
                    execRaf();
                    (cellRenderer.drawCell as jest.Mock).mockReset();

                    renderer.updateProps(mockCanvas, canvasSize, props, newProps);
                    execRaf();

                    expect(cellRenderer.drawCell).toHaveBeenCalledTimes(5);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.left).toBe(60);
                    });
                });

                it('redraws cells on the left when scrolling left`', () => {
                    const newProps = getNewPosProps(-5, 0);
                    renderer.updateProps(mockCanvas, canvasSize, props, posProps);
                    execRaf();
                    (cellRenderer.drawCell as jest.Mock).mockReset();

                    renderer.updateProps(mockCanvas, canvasSize, props, newProps);
                    execRaf();

                    expect(cellRenderer.drawCell).toHaveBeenCalledTimes(5);
                    getDrawnCellRects().forEach((r) => {
                        expect(r.left).toBe(0);
                    });
                });
            });
        });

        describe('with a different canvas', () => {
            it('updates the canvas and context member variables', () => {
                const mockNewContext = {
                    scale: jest.fn(),
                    translate: jest.fn(),
                    fillRect: jest.fn(),
                    drawImage: jest.fn(),
                    fillText: jest.fn(),
                    save: jest.fn(),
                    restore: jest.fn(),
                } as unknown as CanvasRenderingContext2D;
                const mockNewCanvas = {
                    getContext: () => mockNewContext,
                } as unknown as HTMLCanvasElement;

                renderer.updateProps(mockNewCanvas, canvasSize, props, posProps);
                execRaf();

                expect(mockNewContext.translate).toHaveBeenCalled();
                expect(mockContext.translate).not.toHaveBeenCalled();
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
