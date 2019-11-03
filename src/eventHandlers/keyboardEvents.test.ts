import {
    createDefault,
    CursorStateWithSelection,
    SelectionStateCell,
    SelectionStateColumn,
    SelectionStateCorner,
    SelectionStateRow,
    startDrag,
    startRangeColumn,
    startRangeCorner,
    startRangeRow,
    updateDrag,
    updateRangeColumn,
    updateRangeRow,
} from '../cursorState';
import { keyDownOnGrid } from './keyboardEvents';
import { scrollToCell, scrollToColumn, scrollToRow } from './scrolling';
import { endSelection, selectOrUpdateCol, selectOrUpdateRow, startOrUpdateSelection } from './selection';

jest.mock('./scrolling');
jest.mock('./selection');

function expectNoSelectionToHaveHappened() {
    expect(selectOrUpdateCol).not.toHaveBeenCalled();
    expect(selectOrUpdateRow).not.toHaveBeenCalled();
    expect(startOrUpdateSelection).not.toHaveBeenCalled();
    expect(endSelection).not.toHaveBeenCalled();
}

function expectNoScrollToHaveHappened() {
    expect(scrollToRow).not.toHaveBeenCalled();
    expect(scrollToColumn).not.toHaveBeenCalled();
    expect(scrollToCell).not.toHaveBeenCalled();
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('keyDownOnGrid', () => {
    describe.each`
        cursorType | cursor
        ${'no selection'} | ${createDefault()}
        ${'simple cell selection'} | ${startDrag({ x: 5, y: 5 })}
        ${'row selection'} | ${startRangeRow({ x: 0, y: 5 }, { x: 10, y: 5 })}
        ${'col selection'} | ${startRangeColumn({ x: 5, y: 0 }, { x: 5, y: 10 })}
        ${'corner selection'} | ${startRangeColumn({ x: 0, y: 0 }, { x: 10, y: 10 })}
    `('with $cursorType', ({ cursor }) => {
        it('does nothing if a key other than an arrow key is pressed', () => {
            const event = { shiftKey: false, key: 'a' } as React.KeyboardEvent<any>;

            keyDownOnGrid(event, {} as any, { cursorState: () => cursor } as any);

            expectNoSelectionToHaveHappened();
        });
    });

    describe('with simple cell selection at 5,5', () => {
        let cellCursor: CursorStateWithSelection<SelectionStateCell>;

        beforeEach(() => {
            cellCursor = startDrag({ x: 5, y: 5 }) as CursorStateWithSelection<SelectionStateCell>;
        });

        it.each`
            key             | x    | y
            ${'ArrowRight'} | ${6} | ${5}
            ${'ArrowLeft'}  | ${4} | ${5}
            ${'ArrowUp'}    | ${5} | ${4}
            ${'ArrowDown'}  | ${5} | ${6}
        `('updates the edit cursor cell and scrolls to it on $key', ({ key, x, y }) => {
            const event = { shiftKey: false, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => cellCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expect(startOrUpdateSelection).toHaveBeenCalledWith(event, props, gridState, {x, y});
            expect(scrollToCell).toHaveBeenCalledWith({x, y}, gridState);
            expect(endSelection).toHaveBeenCalledWith(props, gridState);
        });
    });

    describe('with cell selection between 4,4 and 5,5', () => {
        let cellCursor: CursorStateWithSelection<SelectionStateCell>;

        beforeEach(() => {
            cellCursor = startDrag({ x: 4, y: 4 }) as CursorStateWithSelection<SelectionStateCell>;
            cellCursor = updateDrag(cellCursor, { x: 5, y: 5 }) as CursorStateWithSelection<SelectionStateCell>;
        });

        it.each`
            key             | x    | y
            ${'ArrowRight'} | ${6} | ${5}
            ${'ArrowLeft'}  | ${4} | ${5}
            ${'ArrowUp'}    | ${5} | ${4}
            ${'ArrowDown'}  | ${5} | ${6}
        `('updates the end selection cell and scrolls to it on shift + $key', ({ key, x, y }) => {
            const event = { shiftKey: true, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => cellCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expect(startOrUpdateSelection).toHaveBeenCalledWith(event, props, gridState, {x, y});
            expect(scrollToCell).toHaveBeenCalledWith({x, y}, gridState);
            expect(endSelection).toHaveBeenCalledWith(props, gridState);
        });
    });

    describe('with row selection at index 5 (and edit cursor at 1, 5)', () => {
        let rowCursor: CursorStateWithSelection<SelectionStateRow>;

        beforeEach(() => {
            rowCursor = startRangeRow({ x: 1, y: 5 }, { x: 10, y: 5 }) as CursorStateWithSelection<SelectionStateRow>;
        });

        it.each`
            key             | x    | y
            ${'ArrowRight'} | ${1} | ${5}
            ${'ArrowLeft'}  | ${1} | ${5}
            ${'ArrowUp'}    | ${1} | ${4}
            ${'ArrowDown'}  | ${1} | ${6}
        `('updates the row and scrolls to it on $key', ({ key, x, y }) => {
            const event = { shiftKey: false, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => rowCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expect(selectOrUpdateRow).toHaveBeenCalledWith(event, props, gridState, {x, y});
            expect(scrollToRow).toHaveBeenCalledWith(y, gridState);
            expect(endSelection).toHaveBeenCalledWith(props, gridState);
        });
    });

    describe('with row selection between index 4 and 5', () => {
        let rowCursor: CursorStateWithSelection<SelectionStateRow>;

        beforeEach(() => {
            rowCursor = startRangeRow({ x: 1, y: 4 }, { x: 10, y: 4 }) as CursorStateWithSelection<SelectionStateRow>;
            rowCursor = updateRangeRow(rowCursor, { x: 1, y: 5 });
        });

        it.each`
            key             | x    | y
            ${'ArrowRight'} | ${10} | ${5}
            ${'ArrowLeft'}  | ${10} | ${5}
            ${'ArrowUp'}    | ${10} | ${4}
            ${'ArrowDown'}  | ${10} | ${6}
        `('updates the row and scrolls to it on $key', ({ key, x, y }) => {
            const event = { shiftKey: true, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => rowCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expect(selectOrUpdateRow).toHaveBeenCalledWith(event, props, gridState, {x, y});
            expect(scrollToRow).toHaveBeenCalledWith(y, gridState);
            expect(endSelection).toHaveBeenCalledWith(props, gridState);
        });
    });

    describe('with col selection at index 5 (and edit cursor at 5, 1)', () => {
        let colCursor: CursorStateWithSelection<SelectionStateColumn>;

        beforeEach(() => {
            colCursor = startRangeColumn({ x: 5, y: 1 }, { x: 5, y: 10 }) as
                CursorStateWithSelection<SelectionStateColumn>;
        });

        it.each`
            key             | x    | y
            ${'ArrowRight'} | ${6} | ${1}
            ${'ArrowLeft'}  | ${4} | ${1}
            ${'ArrowUp'}    | ${5} | ${1}
            ${'ArrowDown'}  | ${5} | ${1}
        `('updates the column and scrolls to it on $key', ({ key, x, y }) => {
            const event = { shiftKey: false, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => colCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expect(selectOrUpdateCol).toHaveBeenCalledWith(event, props, gridState, {x, y});
            expect(scrollToColumn).toHaveBeenCalledWith(x, gridState);
            expect(endSelection).toHaveBeenCalledWith(props, gridState);
        });
    });

    describe('with col selection between 4 and 5', () => {
        let colCursor: CursorStateWithSelection<SelectionStateColumn>;

        beforeEach(() => {
            colCursor = startRangeColumn({ x: 4, y: 1 }, { x: 4, y: 10 }) as
                CursorStateWithSelection<SelectionStateColumn>;
            colCursor = updateRangeColumn(colCursor, { x: 5, y: 1 });
        });

        it.each`
            key             | x    | y
            ${'ArrowRight'} | ${6} | ${10}
            ${'ArrowLeft'}  | ${4} | ${10}
            ${'ArrowUp'}    | ${5} | ${10}
            ${'ArrowDown'}  | ${5} | ${10}
        `('updates the column and scrolls to it on $key', ({ key, x, y }) => {
            const event = { shiftKey: true, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => colCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expect(selectOrUpdateCol).toHaveBeenCalledWith(event, props, gridState, {x, y});
            expect(scrollToColumn).toHaveBeenCalledWith(x, gridState);
            expect(endSelection).toHaveBeenCalledWith(props, gridState);
        });
    });

    describe('with "corner" (i.e. whole table) selection', () => {
        let cornerCursor: CursorStateWithSelection<SelectionStateCorner>;

        beforeEach(() => {
            cornerCursor = startRangeCorner({ x: 1, y: 1 }, { x: 10, y: 10 }) as
                CursorStateWithSelection<SelectionStateCorner>;
        });

        it.each`
            key             | shiftKey
            ${'ArrowRight'} | ${true}
            ${'ArrowLeft'}  | ${true}
            ${'ArrowUp'}    | ${true}
            ${'ArrowDown'}  | ${true}
            ${'ArrowRight'} | ${false}
            ${'ArrowLeft'}  | ${false}
            ${'ArrowUp'}    | ${false}
            ${'ArrowDown'}  | ${false}
        `('does not update selection or scroll on $key', ({ key, shiftKey }) => {
            const event = { shiftKey, key } as React.KeyboardEvent<any>;
            const props = 'dummy props' as any;
            const gridState = { cursorState: () => cornerCursor } as any;

            keyDownOnGrid(event, props, gridState);

            expectNoSelectionToHaveHappened();
            expectNoScrollToHaveHappened();
        });
    });
});
