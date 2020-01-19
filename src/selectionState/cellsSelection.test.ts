import { Coord } from '../types';
import { CellsSelection } from './cellsSelection';
import { CellCoordBounds } from './selectionTypes';

function coord(c: [number, number]): Coord {
    return { x: c[0], y: c[1] };
}

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

    describe('shiftMouseDown', () => {
        it.each`
            region
            ${'frozen-rows'}
            ${'frozen-cols'}
            ${'frozen-corner'}
        `('does nothing if the click region is $region', ({ region }) => {
            const sel = singleCell([4, 4]);

            const newSel = sel.shiftMouseDown(coord([2, 6]), { region });

            expect(newSel).toBe(sel);
        });

        describe.each`
            direction | clickCoord
            ${'top-left'} | ${[2, 2]}
            ${'top-right'} | ${[6, 2]}
            ${'bottom-right'} | ${[6, 6]}
            ${'bottom-left'} | ${[2, 6]}
        `('clicking a cell to the $direction', ({ clickCoord }) => {
            it('updates a 1-cell selection to a range spanning from the original cell to the clicked cell', () => {
                const sel = singleCell([4, 4]);

                const newSel = sel.shiftMouseDown(coord(clickCoord), { region: 'cells' });

                expect(newSel.getSelectionRange()).toEqual(cellRange([4, 4], clickCoord));
            });

            it('updates a multi-cell seleciton to a range from the cursor cell to the clicked cell', () => {
                const sel = cellSelection([3, 3], [4, 4]);

                const newSel = sel.shiftMouseDown(coord(clickCoord), { region: 'cells' });

                expect(newSel.getSelectionRange()).toEqual(cellRange([3, 3], clickCoord));
            });
        });
    });

    describe('mouseMove', () => {
        it('does nothing if there is no ongoing selection of any type', () => {
            const sel = singleCell([4, 4]).mouseUp();

            const newSel = sel.mouseMove(coord([1, 1]));

            expect(newSel).toBe(sel);
        });

        describe('with an ongoing selection drag', () => {
            it('does nothing if moving over the single selected cell', () => {
                const sel = singleCell([4, 4]);

                const newSel = sel.mouseMove(coord([4, 4]));

                expect(newSel).toBe(sel);
            });

            it('does nothing if moving over the most recently selected cell in the range', () => {
                const sel = cellSelection([1, 1], [4, 4]);

                const newSel = sel.mouseMove(coord([4, 4]));

                expect(newSel).toBe(sel);
            });

            it.each`
                direction | coords
                ${'top-right'} | ${[6, 2]}
                ${'right'} | ${[6, 4]}
                ${'bottom-right'} | ${[6, 6]}
                ${'bottom'} | ${[4, 6]}
                ${'bottom-left'} | ${[2, 6]}
                ${'left'} | ${[2, 4]}
                ${'top-left'} | ${[2, 2]}
                ${'top'} | ${[4, 2]}
            `('updates the selected range when moving to the $direction of the edit cell', ({ coords }) => {
                const sel = singleCell([4, 4]);

                const newSel = sel.mouseMove(coord(coords));

                expect(newSel.getSelectionRange()).toEqual(cellRange([4, 4], coords));
            });
        });

        describe('with an ongoing autofill drag', () => {
            it('does nothing if moving over the most recently autofill-dragged cell', () => {
                const sel = cellSelection([4, 4], [4, 4], [6, 6]);

                const newSel = sel.mouseMove(coord([6, 6]));

                expect(newSel).toBe(sel);
            });

            it.each`
                direction | coords | resultDir| from | to
                ${'top-left'} | ${[1, 1]} | ${'upwards'} | ${[3, 1]} | ${[4, 2]}
                ${'top'} | ${[4, 1]} | ${'upwards'} | ${[3, 1]} | ${[4, 2]}
                ${'top-right'} | ${[6, 1]} | ${'upwards'} | ${[3, 1]} | ${[4, 2]}
                ${'right'} | ${[6, 4]} | ${'rightwards'} | ${[5, 3]} | ${[6, 4]}
                ${'bottom-right'} | ${[6, 6]} | ${'downwards'} | ${[3, 5]} | ${[4, 6]}
                ${'bottom'} | ${[4, 6]} | ${'downwards'} | ${[3, 5]} | ${[4, 6]}
                ${'bottom-left'} | ${[1, 6]} | ${'downwards'} | ${[3, 5]} | ${[4, 6]}
                ${'left'} | ${[1, 4]} | ${'leftwards'} | ${[1, 3]} | ${[2, 4]}
            `('updates the autofill range $resultDir when moving to the $direction of the selection', ({
                coords,
                from,
                to,
            }) => {
                const sel = cellSelection([3, 3], [4, 4], [4, 4]);

                const newSel = sel.mouseMove(coord(coords));

                expect(newSel.getAutofillRange()).toEqual(cellRange(from, to));
            });
        });
    });

    describe('mouseUp', () => {
        it('does nothing if there is no type of drag in progress', () => {
            const sel = singleCell([4, 4]).mouseUp();

            const newSel = sel.mouseUp();

            expect(newSel).toBe(sel);
        });

        describe('with an ongoing selection drag', () => {
            it('ends the selection drag', () => {
                const sel = singleCell([4, 4]);

                const newSel = sel.mouseUp();

                expect(newSel).toHaveProperty('isSelectionInProgress', false);
                expect(newSel.getSelectionRange()).toEqual(sel.getSelectionRange());
            });
        });

        describe('with an ongoing autofill drag', () => {
            // TODO: Update cellsSelection.ts to get this to pass!
            xit('ends the autofill drag', () => {
                const sel = new CellsSelection(
                    coord([2, 2]),
                    coord([4, 4]),
                    false,
                    coord([3, 3]),
                );

                const newSel = sel.mouseUp();

                expect(newSel).toHaveProperty('isSelectionInProgress', false);
                expect(newSel).toHaveProperty('autofillDragCell', null);
            });

            it('does not update the selected range if the autofill-drag was to within the previous selection', () => {
                const sel = new CellsSelection(
                    coord([2, 2]),
                    coord([4, 4]),
                    false,
                    coord([3, 3]),
                );

                const newSel = sel.mouseUp();

                expect(newSel.getSelectionRange()).toEqual(sel.getSelectionRange());
            });
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
