import { FrozenCanvasRenderer, FrozenCanvasRendererBasics, FrozenCanvasRendererPosition } from './frozenCanvasRenderer';
import { CellDef, ColumnDef, DataRow } from './types';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

// Some props can be derived from others, so they are in a sense 'denormalised'. To prevent these
// getting out of sync in the tests, we calculate the full props from a 'normalised' set of props.
type NormalisedProps<T> =
    Omit<Omit<Omit<FrozenCanvasRendererBasics<T>, 'colBoundaries'>, 'frozenColsWidth'>, 'frozenRowsHeight'>;

function calcProps<T>(props: NormalisedProps<T>): FrozenCanvasRendererBasics<T> {
    const result = {...props} as FrozenCanvasRendererBasics<T>;

    let curLeft = 0;
    const colBoundaries = props.columns.map((column) => {
        const boundary = { left: curLeft, right: curLeft + column.width };
        curLeft += column.width + 1;
        return boundary;
    });
    result.colBoundaries = colBoundaries;

    if (props.frozenCols !== null && props.frozenCols !== undefined) {
        if (props.frozenCols === 0) {
            result.frozenColsWidth = 0;
        } else {
            result.frozenColsWidth = colBoundaries[props.frozenCols - 1].right;
        }
    }

    if (props.frozenRows !== null && props.frozenRows !== undefined) {
        result.frozenRowsHeight = (props.rowHeight + props.borderWidth) * props.frozenRows;
    }

    return result;
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
function cols(n: number): ColumnDef[] {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(col());
    }
    return result;
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
function rows(n: number): Array<DataRow<null>> {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(row());
    }
    return result;
}

describe('FrozenCanvasRenderer', () => {
    beforeEach(() => {
        mockContext = {
            scale: jest.fn(),
            translate: jest.fn(),
            fillRect: jest.fn(),
            drawImage: jest.fn(),
            fillText: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            beginPath: jest.fn(),
            closePath: jest.fn(),
            rect: jest.fn(),
            clip: jest.fn(),
        } as unknown as CanvasRenderingContext2D;
        mockCanvas = {
            getContext: () => mockContext,
        } as unknown as HTMLCanvasElement;
        // renderer = new FrozenCanvasRenderer<null>(mockCanvas, dpr);
    });

    afterEach(() => {
        jest.resetAllMocks(); // reset spies
    });

    const dpr = 2;
    let mockContext: CanvasRenderingContext2D;
    let mockCanvas: HTMLCanvasElement;
    let renderer: FrozenCanvasRenderer<null>;

    describe('calculateInvalidatedAreaRows', () => {
        const props = {
            canvasSize: { width: 400 },
            frozenRowsHeight: 20,
            frozenColsWidth: 80,
        } as FrozenCanvasRendererBasics<any>;

        beforeEach(() => {
            renderer = new FrozenCanvasRenderer(mockCanvas, props, dpr);
        });

        it('returns null when there has been no horizontal movement', () => {
            const rect = renderer.calculateInvalidatedAreaRows(props, 0);

            expect(rect).toBeNull();
        });

        it('returns the right-hand portion of the frozen rows when moving right', () => {
            const rect = renderer.calculateInvalidatedAreaRows(props, -10);

            expect(rect).toEqual({
                left: 390, right: 400, width: 10,
                top: 0, bottom: 20, height: 20,
            });
        });

        it('returns the left-hand portion of the frozen rows (right of the frozen cols) when moving left', () => {
            const rect = renderer.calculateInvalidatedAreaRows(props, 10);

            expect(rect).toEqual({
                left: 80, right: 90, width: 10,
                top: 0, bottom: 20, height: 20,
            });
        });
    });

    describe('calculateInvalidatedAreaCols', () => {
        const props = {
            canvasSize: {height: 400},
            frozenRowsHeight: 20,
            frozenColsWidth: 80,
        } as FrozenCanvasRendererBasics<any>;

        beforeEach(() => {
            renderer = new FrozenCanvasRenderer(mockCanvas, props, dpr);
        });

        it('returns null when there has been no vertical movement', () => {
            const rect = renderer.calculateInvalidatedAreaCols(props, 0);

            expect(rect).toBeNull();
        });

        it('returns the bottom portion of the frozen cols when moving down', () => {
            const rect = renderer.calculateInvalidatedAreaCols(props, -10);

            expect(rect).toEqual({
                top: 390, bottom: 400, height: 10,
                left: 0, right: 80, width: 80,
            });
        });

        it('returns the top portion of the frozen cols (below the frozen rows) when moving up', () => {
            const rect = renderer.calculateInvalidatedAreaCols(props, 10);

            expect(rect).toEqual({
                top: 20, bottom: 30, height: 10,
                left: 0, right: 80, width: 80,
            });
        });
    });

    describe('drawInvalidatedCellsRows', () => {

        it('does nothing if there is no invalidated row area', () => {
            renderer = new FrozenCanvasRenderer(mockCanvas, {} as FrozenCanvasRendererBasics<any>, dpr);
            jest.spyOn(renderer, 'drawCell');

            renderer.drawInvalidatedCellsRows(
                {} as FrozenCanvasRendererBasics<any>,
                {} as FrozenCanvasRendererPosition,
                null,
            );

            expect(renderer.drawCell).not.toHaveBeenCalled();
            expect(mockContext.save).not.toHaveBeenCalled();
        });

        it('only draws cells intersecting with the invalidated area', () => {
            const props = calcProps({
                canvasSize: { width: 400, height: 400 },
                frozenRows: 1,
                frozenCols: 1,
                rowHeight: 20,
                borderWidth: 1,
                columns: cols(50),
                data: [ row(), row() ],
                dpr,
            } as NormalisedProps<any>);
            const posProps: FrozenCanvasRendererPosition = {
                gridOffset: { x: 100, y: 100 },
            };
            const invalidArea = { left: 390, right: 400, top: 0, bottom: props.frozenRowsHeight } as ClientRect;
            renderer = new FrozenCanvasRenderer(mockCanvas, props, dpr);
            jest.spyOn(renderer, 'drawCell');

            renderer.drawInvalidatedCellsRows(props, posProps, invalidArea);

            expect(renderer.drawCell).toHaveBeenCalledTimes(1);
        });
    });

    describe('drawInvalidatedCellsCols', () => {

        it('does nothing if there is no invalidated row area', () => {
            renderer = new FrozenCanvasRenderer(mockCanvas, {} as FrozenCanvasRendererBasics<any>, dpr);
            jest.spyOn(renderer, 'drawCell');

            renderer.drawInvalidatedCellsRows(
                {} as FrozenCanvasRendererBasics<any>,
                {} as FrozenCanvasRendererPosition,
                null,
            );

            expect(renderer.drawCell).not.toHaveBeenCalled();
            expect(mockContext.save).not.toHaveBeenCalled();
        });

        it('only draws cells intersecting with the invalidated area', () => {
            const props = calcProps({
                canvasSize: { width: 400, height: 400 },
                frozenRows: 1,
                frozenCols: 1,
                rowHeight: 20,
                borderWidth: 1,
                columns: cols(50),
                data: rows(100),
                dpr,
            } as NormalisedProps<any>);
            const posProps: FrozenCanvasRendererPosition = {
                gridOffset: { x: 100, y: 100 },
            };
            const invalidArea = { top: 390, bottom: 400, left: 0, right: props.frozenColsWidth } as ClientRect;
            jest.spyOn(renderer, 'drawCell');

            renderer.drawInvalidatedCellsCols(props, posProps, invalidArea);

            expect(renderer.drawCell).toHaveBeenCalledTimes(1);
        });
    });
});
