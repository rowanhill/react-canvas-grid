import { AllGridSelection } from './allGridSelection';
import { ColsSelection } from './colsSelection';
import { RowsSelection } from './rowsSelection';
import { CellCoordBounds } from './selectionTypes';

describe('AllGridSelection', () => {
    const bounds: CellCoordBounds = { numCols: 20, numRows: 100, frozenCols: 2, frozenRows: 2 };

    describe('arrowRight', () => {
        it('selects the first unfrozen column', () => {
            const sel = new AllGridSelection(false);

            const newSel = sel.arrowRight(bounds);

            expect(newSel).toBeInstanceOf(ColsSelection);
            expect(newSel.getSelectionRange(bounds).topLeft.x).toBe(2);
            expect(newSel.getSelectionRange(bounds).bottomRight.x).toBe(2);
        });
    });

    describe('arrowDown', () => {
        it('selects the first unfrozen row', () => {
            const sel = new AllGridSelection(false);

            const newSel = sel.arrowDown(bounds);

            expect(newSel).toBeInstanceOf(RowsSelection);
            expect(newSel.getSelectionRange(bounds).topLeft.y).toBe(2);
            expect(newSel.getSelectionRange(bounds).bottomRight.y).toBe(2);
        });
    });
});
