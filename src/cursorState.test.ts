import {
    createDefault,
    CursorStateWithSelection,
    isSelectRangeDifferent,
    SelectionStateColumn,
    SelectionStateRow,
    SelectRange,
    startDrag,
    startRangeColumn,
    startRangeCorner,
    startRangeRow,
    updateDrag,
    updateRangeColumn,
    updateRangeRow,
} from './cursorState';
import { Coord } from './types';

describe('createDefault', () => {
    it('returns an empty state, with nothing selected', () => {
        const state = createDefault();

        expect(state.editCursorCell).toBeNull();
        expect(state.selection).toBeNull();
    });
});

describe('startDrag', () => {
    it('returns a cursor state that starts & ends at the coord provided', () => {
        const coord = { x: 3, y: 5 };

        const state = startDrag(coord);

        expect(state.editCursorCell).toBe(coord);
        expect(state.selection.selectionStartCell).toBe(coord);
        expect(state.selection.selectedRange!.topLeft).toBe(coord);
        expect(state.selection.selectedRange!.bottomRight).toBe(coord);
        expect(state.selection.selectionType).toEqual('cells');
    });

    it('can be provided with a frozen start cell', () => {
        const coord = { x: 0, y: 5 };

        const state = startDrag(coord, 'rows');

        expect(state.selection.selectionType).toBe('rows');
    });
});

describe('updateDrag', () => {
    let startCoord: Coord;
    let oldState: CursorStateWithSelection;

    beforeEach(() => {
        startCoord = { x: 3, y: 5 };
        oldState = startDrag(startCoord);
    });

    it('keeps the original selection start cell', () => {
        const newCoord = { x: 2, y: 5 };

        const state = updateDrag(oldState, newCoord);

        expect(state.selection.selectionStartCell).toEqual(startCoord);
    });

    it('merges the prior selected range with a coord to the left', () => {
        const newCoord = { x: 2, y: 5 };

        const state = updateDrag(oldState, newCoord);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 2, y: 5 },
            bottomRight: { x: 3, y: 5 },
        });
    });

    it('merges the prior selected range with a coord to the right', () => {
        const newCoord = { x: 4, y: 5 };

        const state = updateDrag(oldState, newCoord);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 3, y: 5 },
            bottomRight: { x: 4, y: 5 },
        });
    });

    it('merges the prior selected range with a coord above', () => {
        const newCoord = { x: 3, y: 4 };

        const state = updateDrag(oldState, newCoord);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 3, y: 4 },
            bottomRight: { x: 3, y: 5 },
        });
    });

    it('merges the prior selected range with a coord below', () => {
        const newCoord = { x: 3, y: 6 };

        const state = updateDrag(oldState, newCoord);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 3, y: 5 },
            bottomRight: { x: 3, y: 6 },
        });
    });
});

describe('startRangeCorner', () => {
    it('creates a selected range with frozen type corner', () => {
        const from: Coord = { x: 1, y: 1 };
        const to: Coord = { x: 10, y: 15 };

        const state = startRangeCorner(from, to);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 1, y: 1 },
            bottomRight: { x: 10, y: 15 },
        });
        expect(state.selection.selectionType).toEqual('grid');
    });
});

describe('startRangeRow', () => {
    it('creates a selected range with frozen type row', () => {
        const from: Coord = { x: 1, y: 5 };
        const to: Coord = { x: 10, y: 5 };

        const state = startRangeRow(from, to);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 1, y: 5 },
            bottomRight: { x: 10, y: 5 },
        });
        expect(state.selection.selectionType).toEqual('rows');
    });
});

describe('startRangeColumn', () => {
    it('creates a selected range with frozen type column', () => {
        const from: Coord = { x: 10, y: 1 };
        const to: Coord = { x: 10, y: 15 };

        const state = startRangeColumn(from, to);

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 10, y: 1 },
            bottomRight: { x: 10, y: 15 },
        });
        expect(state.selection.selectionType).toEqual('columns');
    });
});

describe('updateRangeRow', () => {
    it('merges the prior selected range with the new coord below, ignoring the coord\'s column', () => {
        const oldState = startRangeRow({ x: 1, y: 3 }, { x: 10, y: 3 }) as CursorStateWithSelection<SelectionStateRow>;

        const state = updateRangeRow(oldState, { x: 20, y: 4 });

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 1, y: 3 },
            bottomRight: { x: 10, y: 4 },
        });
    });

    it('merges the prior selected range with the new coord above, ignoring the coord\'s column', () => {
        const oldState = startRangeRow({ x: 1, y: 3 }, { x: 10, y: 3 }) as CursorStateWithSelection<SelectionStateRow>;

        const state = updateRangeRow(oldState, { x: 20, y: 2 });

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 1, y: 2 },
            bottomRight: { x: 10, y: 3 },
        });
    });
});

describe('updateRangeColumn', () => {
    it('merges the prior selected range with the new coord to left, ignoring the coord\'s row', () => {
        const oldState = startRangeColumn({ x: 3, y: 1 }, { x: 3, y: 10 }) as
            CursorStateWithSelection<SelectionStateColumn>;

        const state = updateRangeColumn(oldState, { x: 2, y: 20 });

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 2, y: 1 },
            bottomRight: { x: 3, y: 10 },
        });
    });

    it('merges the prior selected range with the new coord to right, ignoring the coord\'s row', () => {
        const oldState = startRangeColumn({ x: 3, y: 1 }, { x: 3, y: 10 }) as
            CursorStateWithSelection<SelectionStateColumn>;
        const state = updateRangeColumn(oldState, { x: 4, y: 20 });

        expect(state.selection.selectedRange).toEqual({
            topLeft: { x: 3, y: 1 },
            bottomRight: { x: 4, y: 10 },
        });
    });
});

describe('isSelectRangeDifferent', () => {
    const createRange = (): SelectRange => ({
        topLeft: { x: 1, y: 2 },
        bottomRight: { x: 3, y: 4 },
    });

    it('finds range different if topLeft x has changed', () => {
        const oldRange = createRange();

        const diffRange = createRange();
        diffRange.topLeft.x = 10;

        expect(isSelectRangeDifferent(oldRange, diffRange)).toBe(true);
    });

    it('finds range different if topLeft y has changed', () => {
        const oldRange = createRange();

        const diffRange = createRange();
        diffRange.topLeft.y = 10;

        expect(isSelectRangeDifferent(oldRange, diffRange)).toBe(true);
    });

    it('finds range different if bottomRight x has changed', () => {
        const oldRange = createRange();

        const diffRange = createRange();
        diffRange.bottomRight.x = 10;

        expect(isSelectRangeDifferent(oldRange, diffRange)).toBe(true);
    });

    it('finds range different if bottomRight y has changed', () => {
        const oldRange = createRange();

        const diffRange = createRange();
        diffRange.bottomRight.y = 10;

        expect(isSelectRangeDifferent(oldRange, diffRange)).toBe(true);
    });
});
