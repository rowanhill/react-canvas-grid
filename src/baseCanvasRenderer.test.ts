import { BaseCanvasRenderer } from './baseCanvasRenderer';
import { BaseCanvasProps, PreviousDrawInfo } from './BaseCanvas';
import { ColumnDef, CellDef, DataRow } from './types';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

// Some props can be derived from others, so they are in a sense 'denormalised'. To prevent these
// getting out of sync in the tests, we calculate the full props from a 'normalised' set of props.
type NormalisedProps<T> = Omit<Omit<BaseCanvasProps<T>, 'colBoundaries'>, 'gridHeight'>;

function calcProps<T>(props: NormalisedProps<T>): BaseCanvasProps<T> {
    let curLeft = 0;
    const colBoundaries = props.columns.map(col => {
        const boundary = { left: curLeft, right: curLeft + col.width };
        curLeft += col.width + 1;
        return boundary;
    });

    const gridHeight = ((props.rowHeight + props.borderWidth) * props.data.length) - props.borderWidth;

    return { ...props, colBoundaries, gridHeight };
}

let colIndex = 0;
function col(): ColumnDef {
    const col = {
        fieldName: `col${colIndex}`,
        width: 19
    };
    colIndex++;
    return col;
}

function cell(): CellDef<null> {
    return {
        data: null,
        getText: () => ''
    };
}
function row(): DataRow<null> {
    const row = {} as DataRow<null>;
    for (let i = 0; i < colIndex; i++) {
        row[`col${i}`] = cell();
    }
    return row;
}

describe('BaseCanvasRenderer', () => {
    const mockContext = {
        scale: jest.fn(),
        translate: jest.fn(),
        fillRect: jest.fn(),
        drawImage: jest.fn(),
        fillText: jest.fn(),
    };
    const mockCanvas = {
        getContext: () => mockContext
    };
    const dpr = 2;
    const renderer = new BaseCanvasRenderer<null>(mockCanvas as unknown as HTMLCanvasElement, dpr);

    describe('fixScale', () => {
        it('set the scale on the canvas to the device pixel ratio', () => {
            renderer.fixScale();

            expect(mockContext.scale).toHaveBeenCalledWith(dpr, dpr);
        });
    });

    describe('draw', () => {
        const props: BaseCanvasProps<null> = calcProps({
            borderWidth: 1,
            columns: [col(), col(), col(), col(), col(), col(), col(), col(), col(), col()],
            data: [row(), row(), row(), row(), row(), row(), row(), row(), row(), row()],
            gridOffset: { x: 10, y: 10 },
            height: 50,
            width: 50,
            rowHeight: 9,
            visibleRect: { top: 10, left: 10, width: 50, height: 50, right: 50, bottom: 50 }
        });

        describe('with no previous draw info', () => {
            it('fills the entire canvas with border colour (before drawing cells)', () => {
                jest.spyOn(renderer, 'drawWholeBorderBackground');
                jest.spyOn(renderer, 'shiftExistingCanvas');

                renderer.draw(props, null);

                expect(renderer.drawWholeBorderBackground).toHaveBeenCalledTimes(1);
                expect(renderer.shiftExistingCanvas).not.toHaveBeenCalled();
            });
        });
    });
});