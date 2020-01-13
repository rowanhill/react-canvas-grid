import { CellsSelection } from './cellsSelection';

function cellSelection(from: [number, number], to: [number, number], autofill: [number, number]|null = null) {
    return new CellsSelection(
        { x: from[0], y: from[1] },
        { x: to[0], y: to[1] },
        true,
        autofill ? { x: autofill[0], y: autofill[1] } : null,
    );
}

describe('CellsSelection', () => {
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
