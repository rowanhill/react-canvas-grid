import { CellsSelection } from './cellsSelection';
import { CellCoordBounds } from './selectionTypes';

function cellSelection(from: [number, number], to: [number, number], autofill: [number, number]|null = null) {
    return new CellsSelection(
        { x: from[0], y: from[1] },
        { x: to[0], y: to[1] },
        true,
        autofill ? { x: autofill[0], y: autofill[1] } : null,
    );
}

function singleCell(cell: [number, number]) {
    return cellSelection(cell, cell);
}

function singleCellRange(cell: [number, number]) {
    return {
        topLeft: { x: cell[0], y: cell[1] },
        bottomRight: { x: cell[0], y: cell[1] },
    };
}

function cellRange(from: [number, number], to: [number, number]) {
    return {
        topLeft: { x: Math.min(from[0], to[0]), y: Math.min(from[1], to[1]) },
        bottomRight: { x: Math.max(from[0], to[0]), y: Math.max(from[1], to[1]) },
    };
}

const bounds: CellCoordBounds = {
    frozenCols: 0,
    frozenRows: 0,
    numCols: 10,
    numRows: 10,
};

describe('CellsSelection', () => {
    describe.each`
        keyName | simpleCoords | simpleResult | truncatedCoords
        ${'arrowUp'} | ${[1, 1]} | ${[1, 0]} | ${[1, 0]}
        ${'arrowDown'} | ${[1, 1]} | ${[1, 2]} | ${[1, 9]}
        ${'arrowLeft'} | ${[1, 1]} | ${[0, 1]} | ${[0, 1]}
        ${'arrowRight'} | ${[1, 1]} | ${[2, 1]} | ${[9, 1]}
    `('$keyName', ({ keyName, simpleCoords, simpleResult, truncatedCoords }) => {
        it('moves the cell', () => {
            const sel = singleCell(simpleCoords);

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(singleCellRange(simpleResult));
        });

        it('is truncated if attempting to move out of bounds', () => {
            const sel = singleCell(truncatedCoords);

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(singleCellRange(truncatedCoords));
        });
    });

    describe.each`
        keyName | simpleCoords | simpleResult | truncatedCoords
        ${'shiftArrowUp'} | ${[1, 1]} | ${[[1, 0], [1, 1]]} | ${[[1, 2], [1, 0]]}
        ${'shiftArrowDown'} | ${[1, 1]} | ${[[1, 1], [1, 2]]} | ${[[1, 8], [1, 9]]}
        ${'shiftArrowLeft'} | ${[1, 1]} | ${[[0, 1], [1, 1]]} | ${[[2, 1], [0, 1]]}
        ${'shiftArrowRight'} | ${[1, 1]} | ${[[1, 1], [2, 1]]} | ${[[8, 1], [9, 1]]}
    `('$keyName', ({ keyName, simpleCoords, simpleResult, truncatedCoords }) => {
        it('extends the selection', () => {
            const sel = singleCell(simpleCoords);

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(cellRange(simpleResult[0], simpleResult[1]));
        });

        it('is truncated if attempting to extend the selection out of bounds', () => {
            const sel = cellSelection(truncatedCoords[0], truncatedCoords[1]);

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(cellRange(truncatedCoords[0], truncatedCoords[1]));
        });
    });

    describe('getAutofillRange', () => {
        it('returns null if not autofill dragging', () => {
            const sel = cellSelection([1, 1], [1, 1]);

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual(null);
        });

        it('returns the range below the selection if dragging down', () => {
            const sel = cellSelection([0, 0], [3, 2], [5, 7]); // dragged down and right

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 0, y: 3 },
                bottomRight: {x: 3, y: 7 },
            });
        });

        it('returns the range above the selection if dragging up', () => {
            const sel = cellSelection([0, 3], [3, 5], [5, 0]); // dragged up and right

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 0, y: 0 },
                bottomRight: {x: 3, y: 2 },
            });
        });

        it('returns the range above the selection if dragging right (and not up or down)', () => {
            const sel = cellSelection([0, 0], [3, 2], [5, 1]); // dragged right

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 4, y: 0 },
                bottomRight: {x: 5, y: 2 },
            });
        });

        it('returns the range above the selection if dragging left (and not up or down)', () => {
            const sel = cellSelection([2, 0], [5, 2], [0, 1]); // dragged left

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 0, y: 0 },
                bottomRight: {x: 1, y: 2 },
            });
        });
    });
});
