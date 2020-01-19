import { Coord } from '../types';
import { cellsSelection } from './cellsSelectionBuilder';
import { calculateGridOffsetForTargetCell } from './focusOffset';
import { CellCoordBounds } from './selectionTypes';

jest.mock('./focusOffset');

function coord(c: [number, number]): Coord {
    return { x: c[0], y: c[1] };
}

function singleCellRange(cell: [number, number]) {
    return {
        topLeft: coord(cell),
        bottomRight: coord(cell),
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
            const sel = cellsSelection(simpleCoords).build();

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(singleCellRange(simpleResult));
        });

        it('is truncated if attempting to move out of bounds', () => {
            const sel = cellsSelection(truncatedCoords).build();

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(singleCellRange(truncatedCoords));
        });

        it('focuses on the new cell', () => {
            const sel = cellsSelection(simpleCoords).build();
            (calculateGridOffsetForTargetCell as jest.Mock).mockReset();
            (calculateGridOffsetForTargetCell as jest.Mock).mockReturnValue('dummy offset');

            const newSel = (sel as any)[keyName](bounds);
            const offset = newSel.getFocusGridOffset(null);

            expect(offset).toBe('dummy offset');
            expect(calculateGridOffsetForTargetCell).toHaveBeenCalledWith(null, coord(simpleResult));
        });
    });

    describe.each`
        keyName | simpleCoords | simpleResult
        ${'shiftArrowUp'} | ${[1, 1]} | ${[1, 0]}
        ${'shiftArrowDown'} | ${[1, 1]} | ${[1, 2]}
        ${'shiftArrowLeft'} | ${[1, 1]} | ${[0, 1]}
        ${'shiftArrowRight'} | ${[1, 1]} | ${[2, 1]}
    `('$keyName', ({ keyName, simpleCoords, simpleResult }) => {
        it('extends the selection', () => {
            const sel = cellsSelection(simpleCoords).build();

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(cellRange(simpleCoords, simpleResult));
        });

        it('focuses on the cell newly included in the selection', () => {
            const sel = cellsSelection(simpleCoords).build();
            (calculateGridOffsetForTargetCell as jest.Mock).mockReset();
            (calculateGridOffsetForTargetCell as jest.Mock).mockReturnValue('dummy offset');

            const newSel = (sel as any)[keyName](bounds);
            const offset = newSel.getFocusGridOffset(null);

            expect(offset).toBe('dummy offset');
            expect(calculateGridOffsetForTargetCell).toHaveBeenCalledWith(null, coord(simpleResult));
        });
    });

    describe.each`
        keyName | truncatedCoords
        ${'shiftArrowUp'} | ${[[1, 2], [1, 0]]}
        ${'shiftArrowDown'} | ${[[1, 8], [1, 9]]}
        ${'shiftArrowLeft'} | ${[[2, 1], [0, 1]]}
        ${'shiftArrowRight'} | ${[[8, 1], [9, 1]]}
    `('$keyName', ({ keyName, truncatedCoords }) => {
        it('is truncated if attempting to extend the selection out of bounds', () => {
            const sel = cellsSelection(truncatedCoords[0])
                .withSelectionFromCursorTo(truncatedCoords[1])
                .build();
            expect(sel.getSelectionRange()).toEqual(cellRange(truncatedCoords[0], truncatedCoords[1]));

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(cellRange(truncatedCoords[0], truncatedCoords[1]));
        });
    });

    describe.each`
        keyName | shrunkCoords
        ${'shiftArrowUp'} | ${[[1, 1], [5, 4]]}
        ${'shiftArrowDown'} | ${[[1, 2], [5, 5]]}
        ${'shiftArrowLeft'} | ${[[1, 1], [4, 5]]}
        ${'shiftArrowRight'} | ${[[2, 1], [5, 5]]}
    `('$keyName', ({ keyName, shrunkCoords }) => {
        it('shrinks the selection if the edit cell is not at the limit of the bounds', () => {
            const sel = cellsSelection([3, 3])
                .withSelection([1, 1], [5, 5])
                .withoutOngoingSelectionDrag()
                .build();

            const newSel = (sel as any)[keyName](bounds);

            expect(newSel.getSelectionRange()).toEqual(cellRange(shrunkCoords[0], shrunkCoords[1]));
        });
    });

    describe('shiftMouseDown', () => {
        it.each`
            region
            ${'frozen-rows'}
            ${'frozen-cols'}
            ${'frozen-corner'}
        `('does nothing if the click region is $region', ({ region }) => {
            const sel = cellsSelection(4, 4).build();

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
                const sel = cellsSelection(4, 4).build();

                const newSel = sel.shiftMouseDown(coord(clickCoord), { region: 'cells' });

                expect(newSel.getSelectionRange()).toEqual(cellRange([4, 4], clickCoord));
            });

            it('updates a multi-cell seleciton to a range from the cursor cell to the clicked cell', () => {
                const sel = cellsSelection(3, 3)
                    .withSelectionFromCursorTo(4, 4)
                    .withOngoingSelectionDrag()
                    .build();

                const newSel = sel.shiftMouseDown(coord(clickCoord), { region: 'cells' });

                expect(newSel.getSelectionRange()).toEqual(cellRange([3, 3], clickCoord));
            });

            it('focuses on the clicked cell', () => {
                const sel = cellsSelection(4, 4).build();
                (calculateGridOffsetForTargetCell as jest.Mock).mockReset();
                (calculateGridOffsetForTargetCell as jest.Mock).mockReturnValue('dummy offset');

                const newSel = sel.shiftMouseDown(coord(clickCoord), { region: 'cells' });
                const offset = newSel.getFocusGridOffset(null as any);

                expect(offset).toBe('dummy offset');
                expect(calculateGridOffsetForTargetCell).toHaveBeenCalledWith(null, coord(clickCoord));
            });
        });
    });

    describe('mouseMove', () => {
        it('does nothing if there is no ongoing selection of any type', () => {
            const sel = cellsSelection(4, 4).build();

            const newSel = sel.mouseMove(coord([1, 1]));

            expect(newSel).toBe(sel);
        });

        describe('with an ongoing selection drag', () => {
            it('does nothing if moving over the single selected cell', () => {
                const sel = cellsSelection(4, 4).withOngoingSelectionDrag().build();

                const newSel = sel.mouseMove(coord([4, 4]));

                expect(newSel).toBe(sel);
            });

            it('does nothing if moving over the most recently selected cell in the range', () => {
                const sel = cellsSelection(1, 1)
                    .withSelectionFromCursorTo(4, 4)
                    .withOngoingSelectionDrag()
                    .build();

                const newSel = sel.mouseMove(coord([4, 4]));

                expect(newSel).toBe(sel);
            });

            describe.each`
                direction | coords
                ${'top-right'} | ${[6, 2]}
                ${'right'} | ${[6, 4]}
                ${'bottom-right'} | ${[6, 6]}
                ${'bottom'} | ${[4, 6]}
                ${'bottom-left'} | ${[2, 6]}
                ${'left'} | ${[2, 4]}
                ${'top-left'} | ${[2, 2]}
                ${'top'} | ${[4, 2]}
            `('when dragging on a cell to the $direction of the edit cell', ({ coords }) => {
                it('updates the selected range', () => {
                    const sel = cellsSelection(4, 4).withOngoingSelectionDrag().build();

                    const newSel = sel.mouseMove(coord(coords));

                    expect(newSel.getSelectionRange()).toEqual(cellRange([4, 4], coords));
                });

                it('focuses on the newly dragged cell', () => {
                    const sel = cellsSelection(4, 4).withOngoingSelectionDrag().build();
                    (calculateGridOffsetForTargetCell as jest.Mock).mockReset();
                    (calculateGridOffsetForTargetCell as jest.Mock).mockReturnValue('dummy offset');

                    const newSel = sel.mouseMove(coord(coords));
                    const offset = newSel.getFocusGridOffset(null as any);

                    expect(offset).toBe('dummy offset');
                    expect(calculateGridOffsetForTargetCell).toHaveBeenCalledWith(null, coord(coords));
                });
            });
        });

        describe('with an ongoing autofill drag', () => {
            it('does nothing if moving over the most recently autofill-dragged cell', () => {
                const sel = cellsSelection(4, 4)
                    .withAutofillDragCell(6, 6)
                    .build();

                const newSel = sel.mouseMove(coord([6, 6]));

                expect(newSel).toBe(sel);
            });

            describe.each`
                direction | coords | resultDir| from | to
                ${'top-left'} | ${[1, 1]} | ${'upwards'} | ${[3, 1]} | ${[4, 2]}
                ${'top'} | ${[4, 1]} | ${'upwards'} | ${[3, 1]} | ${[4, 2]}
                ${'top-right'} | ${[6, 1]} | ${'upwards'} | ${[3, 1]} | ${[4, 2]}
                ${'right'} | ${[6, 4]} | ${'rightwards'} | ${[5, 3]} | ${[6, 4]}
                ${'bottom-right'} | ${[6, 6]} | ${'downwards'} | ${[3, 5]} | ${[4, 6]}
                ${'bottom'} | ${[4, 6]} | ${'downwards'} | ${[3, 5]} | ${[4, 6]}
                ${'bottom-left'} | ${[1, 6]} | ${'downwards'} | ${[3, 5]} | ${[4, 6]}
                ${'left'} | ${[1, 4]} | ${'leftwards'} | ${[1, 3]} | ${[2, 4]}
            `('when moving to the $direction of the selection', ({
                coords,
                resultDir,
                from,
                to,
            }) => {
                it(`updates the autofill range ${resultDir}`, () => {
                    const sel = cellsSelection(3, 3)
                        .withSelectionFromCursorTo(4, 4)
                        .withAutofillDragCell(4, 4)
                        .build();

                    const newSel = sel.mouseMove(coord(coords));

                    expect(newSel.getAutofillRange()).toEqual(cellRange(from, to));
                });

                it('focuses on the newly dragged cell', () => {
                    const sel = cellsSelection(3, 3)
                        .withSelectionFromCursorTo(4, 4)
                        .withAutofillDragCell(4, 4)
                        .build();
                    (calculateGridOffsetForTargetCell as jest.Mock).mockReset();
                    (calculateGridOffsetForTargetCell as jest.Mock).mockReturnValue('dummy offset');

                    const newSel = sel.mouseMove(coord(coords));
                    const offset = newSel.getFocusGridOffset(null as any);

                    expect(offset).toBe('dummy offset');
                    expect(calculateGridOffsetForTargetCell).toHaveBeenCalledWith(null, coord(coords));
                });
            });
        });
    });

    describe('mouseUp', () => {
        it('does nothing if there is no type of drag in progress', () => {
            const sel = cellsSelection(4, 4).build();

            const newSel = sel.mouseUp();

            expect(newSel).toBe(sel);
        });

        describe('with an ongoing selection drag', () => {
            it('ends the selection drag', () => {
                const sel = cellsSelection(4, 4).build();

                const newSel = sel.mouseUp();

                expect(newSel).toHaveProperty('isSelectionInProgress', false);
                expect(newSel.getSelectionRange()).toEqual(sel.getSelectionRange());
            });
        });

        describe('with an ongoing autofill drag', () => {
            // TODO: Update cellsSelection.ts to get this to pass!
            xit('ends the autofill drag', () => {
                const sel = cellsSelection(2, 2)
                    .withSelectionFromCursorTo(4, 4)
                    .withAutofillDragCell(5, 5)
                    .build();

                const newSel = sel.mouseUp();

                expect(newSel).toHaveProperty('isSelectionInProgress', false);
                expect(newSel).toHaveProperty('autofillDragCell', null);
            });

            it('does not update the selected range if the autofill-drag was to within the previous selection', () => {
                const sel = cellsSelection(2, 2)
                    .withSelectionFromCursorTo(4, 4)
                    .withAutofillDragCell(3, 3)
                    .build();

                const newSel = sel.mouseUp();

                expect(newSel.getSelectionRange()).toEqual(sel.getSelectionRange());
            });
        });
    });

    describe('getAutofillRange', () => {
        it('returns null if not autofill dragging', () => {
            const sel = cellsSelection(1, 1).build();

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual(null);
        });

        it('returns the range below the selection if dragging down', () => {
            const sel = cellsSelection(0, 0)
                .withSelectionFromCursorTo(3, 2)
                .withAutofillDragCell(5, 7) // dragged down and right
                .build();

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 0, y: 3 },
                bottomRight: {x: 3, y: 7 },
            });
        });

        it('returns the range above the selection if dragging up', () => {
            const sel = cellsSelection(0, 3)
                .withSelectionFromCursorTo(3, 5)
                .withAutofillDragCell(5, 0) // dragged up and right
                .build();

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 0, y: 0 },
                bottomRight: {x: 3, y: 2 },
            });
        });

        it('returns the range above the selection if dragging right (and not up or down)', () => {
            const sel = cellsSelection(0, 0)
                .withSelectionFromCursorTo(3, 2)
                .withAutofillDragCell(5, 1) // dragged right
                .build();

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 4, y: 0 },
                bottomRight: {x: 5, y: 2 },
            });
        });

        it('returns the range above the selection if dragging left (and not up or down)', () => {
            const sel = cellsSelection(2, 0)
                .withSelectionFromCursorTo(5, 2)
                .withAutofillDragCell(0, 1) // dragged left
                .build();

            const autofillRange = sel.getAutofillRange();

            expect(autofillRange).toEqual({
                topLeft: { x: 0, y: 0 },
                bottomRight: {x: 1, y: 2 },
            });
        });
    });
});
