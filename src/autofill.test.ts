import { mapValues } from 'lodash';
import { repeatSelectionIntoFill } from './autofill';
import { CellDef, getCellText } from './types';

function text(data: string): string {
    return data;
}

function cell(y: number, x: number): CellDef<string> {
    return {
        data: `${y}x${x}`,
        getText: text,
    };
}

describe('repeatSelectionIntoFill', () => {
    it('copies from the selection into the autofill area, wrapping horizontally if needed', () => {
        const newData = repeatSelectionIntoFill(
            { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 } },
            { topLeft: { x: 2, y: 0 }, bottomRight: { x: 4, y: 1 } },
            [
                { a: cell(0, 0), b: cell(0, 1), c: cell(0, 2), d: cell(0, 3), e: cell(0, 4) },
                { a: cell(1, 0), b: cell(1, 1), c: cell(1, 2), d: cell(1, 3), e: cell(1, 4) },
            ],
            [
                { fieldName: 'a', width: 1 },
                { fieldName: 'b', width: 1 },
                { fieldName: 'c', width: 1 },
                { fieldName: 'd', width: 1 },
                { fieldName: 'e', width: 1 },
            ],
            (context) => ({ ...context.srcCellDef }),
        );

        // the c, d, e labels are copied from the a, b, a labels
        const expectedText = [
            { a: '0x0', b: '0x1', c: '0x0', d: '0x1', e: '0x0' },
            { a: '1x0', b: '1x1', c: '1x0', d: '1x1', e: '1x0' },
        ];
        const newDataText = newData.map((r) => mapValues(r, (c) => getCellText(c)));
        expect(newDataText).toEqual(expectedText);
    });

    it('copies from the selection into the autofill area, wrapping vertically if needed', () => {
        const newData = repeatSelectionIntoFill(
            { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 } },
            { topLeft: { x: 0, y: 2 }, bottomRight: { x: 1, y: 4 } },
            [
                { a: cell(0, 0), b: cell(0, 1) },
                { a: cell(1, 0), b: cell(1, 1) },
                { a: cell(2, 0), b: cell(2, 1) },
                { a: cell(3, 0), b: cell(3, 1) },
                { a: cell(4, 0), b: cell(4, 1) },
            ],
            [
                { fieldName: 'a', width: 1 },
                { fieldName: 'b', width: 1 },
            ],
            (context) => ({ ...context.srcCellDef }),
        );

        // the row 2, 3, 4 labels are copied from the row 0, 1, 0 labels
        const expectedText = [
            { a: '0x0', b: '0x1' },
            { a: '1x0', b: '1x1' },
            { a: '0x0', b: '0x1' },
            { a: '1x0', b: '1x1' },
            { a: '0x0', b: '0x1' },
        ];
        const newDataText = newData.map((r) => mapValues(r, (c) => getCellText(c)));
        expect(newDataText).toEqual(expectedText);
    });

    it('calls the celldef factory function with full context', () => {
        const factory = jest.fn((context) => ({ ...context.srcCellDef }));

        repeatSelectionIntoFill(
            { topLeft: { x: 0, y: 0 }, bottomRight: { x: 0, y: 0 } },
            { topLeft: { x: 0, y: 1 }, bottomRight: { x: 0, y: 1 } },
            [
                { a: cell(0, 0) },
                { a: cell(1, 0) },
            ],
            [
                { fieldName: 'a', width: 1 },
            ],
            factory,
        );

        expect(factory).toHaveBeenCalledWith({
            srcRowIndex: 0,
            srcColIndex: 0,
            srcColDef: { fieldName: 'a', width: 1 },
            srcCellDef: cell(0, 0),
            destRowIndex: 1,
            destColIndex: 0,
            destColDef: { fieldName: 'a', width: 1 },
            destCellDef: cell(1, 0),
        });
    });
});
