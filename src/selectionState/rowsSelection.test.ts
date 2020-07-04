import { AllGridSelection } from './allGridSelection';
import { CellsSelection } from './cellsSelection';
import { ColsSelection, createSingleColSelection } from './colsSelection';
import { createSingleRowSelection, RowsSelection } from './rowsSelection';
import { CellCoordBounds } from './selectionTypes';

describe('RowsSelection', () => {
    const bounds: CellCoordBounds = { numCols: 20, numRows: 100, frozenCols: 2, frozenRows: 2 };

    describe('arrowRight', () => {
        it('selects a single cell at the (unfrozen) left of the selected row', () => {
            const leftOfRow = { y: 10, x: 2 };
            const sel = createSingleRowSelection(leftOfRow, bounds);

            const newSel = sel.arrowRight(bounds);

            expect(newSel).toBeInstanceOf(CellsSelection);
            expect(newSel.getCursorCell()).toEqual(leftOfRow);
            expect(newSel.getSelectionRange()).toEqual({ topLeft: leftOfRow, bottomRight: leftOfRow });
        });
    });

    describe('arrowUp', () => {
        it('selects one row above where available', () => {
            const leftOfRow = { y: 10, x: 2 };
            const sel = createSingleRowSelection(leftOfRow, bounds);

            const newSel = sel.arrowUp(bounds);

            expect(newSel).toBeInstanceOf(RowsSelection);
            expect(newSel.getSelectionRange(bounds).topLeft.y).toBe(9);
            expect(newSel.getSelectionRange(bounds).bottomRight.y).toBe(9);
        });

        it('selects all cells when moving into frozen rows', () => {
            const leftOfRow = { x: 2, y: 2 };
            const sel = createSingleRowSelection(leftOfRow, bounds);

            const newSel = sel.arrowUp(bounds);

            expect(newSel).toBeInstanceOf(AllGridSelection);
        });

        it('does nothing when at the top of the grid', () => {
            const boundsWithoutFrozenRows = { ...bounds, frozenRows: 0 };
            const leftOfRow = { y: 0, x: 2 };
            const sel = createSingleRowSelection(leftOfRow, boundsWithoutFrozenRows);

            const newSel = sel.arrowUp(boundsWithoutFrozenRows);

            expect(JSON.parse(JSON.stringify(newSel))).toMatchObject(JSON.parse(JSON.stringify(sel)));
        });
    });
});
