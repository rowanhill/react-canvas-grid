import { AllGridSelection } from './allGridSelection';
import { CellsSelection } from './cellsSelection';
import { ColsSelection, createSingleColSelection } from './colsSelection';
import { CellCoordBounds } from './selectionTypes';

describe('ColsSelection', () => {
    const bounds: CellCoordBounds = { numCols: 20, numRows: 100, frozenCols: 2, frozenRows: 2 };

    describe('arrowDown', () => {
        it('selects a single cell at the (unfrozen) top of the selected column', () => {
            const topOfCol = { x: 10, y: 2 };
            const sel = createSingleColSelection(topOfCol, bounds);

            const newSel = sel.arrowDown(bounds);

            expect(newSel).toBeInstanceOf(CellsSelection);
            expect(newSel.getCursorCell()).toEqual(topOfCol);
            expect(newSel.getSelectionRange()).toEqual({ topLeft: topOfCol, bottomRight: topOfCol });
        });
    });

    describe('arrowLeft', () => {
        it('selects one column to the left where available', () => {
            const topOfCol = { x: 10, y: 2 };
            const sel = createSingleColSelection(topOfCol, bounds);

            const newSel = sel.arrowLeft(bounds);

            expect(newSel).toBeInstanceOf(ColsSelection);
            expect(newSel.getSelectionRange(bounds).topLeft.x).toBe(9);
            expect(newSel.getSelectionRange(bounds).bottomRight.x).toBe(9);
        });

        it('selects all cells when moving into frozen columns', () => {
            const topOfCol = { x: 2, y: 2 };
            const sel = createSingleColSelection(topOfCol, bounds);

            const newSel = sel.arrowLeft(bounds);

            expect(newSel).toBeInstanceOf(AllGridSelection);
        });

        it('does nothing when at the left of the grid', () => {
            const boundsWithoutFrozenCols = { ...bounds, frozenCols: 0 };
            const topOfCol = { x: 0, y: 2 };
            const sel = createSingleColSelection(topOfCol, boundsWithoutFrozenCols);

            const newSel = sel.arrowLeft(boundsWithoutFrozenCols);

            expect(JSON.parse(JSON.stringify(newSel))).toMatchObject(JSON.parse(JSON.stringify(sel)));
        });
    });
});
