import * as cursorState from '../cursorState';
import { CursorStateWithSelection } from '../cursorState';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import {
    endSelection, selectAll, selectRow, startSelection, updateSelection, updateSelectionCol, updateSelectionRow,
} from './selection';

jest.mock('../cursorState');

describe('iselection methods', () => {
    let props: ReactCanvasGridProps<any>;
    let gridState: GridState<any>;
    let oldCursorState: CursorStateWithSelection;
    let newCursorState: CursorStateWithSelection;

    beforeEach(() => {
        props = {
            frozenCols: 1,
            frozenRows: 1,
            columns: ['blah', 'blah', 'blah'] as any,
            data: ['foo', 'foo', 'foo'] as any,
            onSelectionChangeStart: jest.fn() as any,
            onSelectionChangeUpdate: jest.fn() as any,
            onSelectionChangeEnd: jest.fn() as any,
        } as ReactCanvasGridProps<any>;

        oldCursorState = { selection: { selectedRange: 'dummy-old' as any} as any } as CursorStateWithSelection;
        newCursorState = { selection: { selectedRange: 'dummy-new' as any} as any } as CursorStateWithSelection;

        const mockCursorState = jest.fn().mockReturnValue(oldCursorState);
        gridState = { cursorState: mockCursorState as any } as GridState<any>;
    });

    describe('startSelection', () => {
        beforeEach(() => {
            (cursorState.startDrag as jest.Mock).mockReturnValue(newCursorState);
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            startSelection(props, gridState, { x: 1, y: 1 });

            expect(props.onSelectionChangeStart).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeStart = undefined;

            startSelection(props, gridState, { x: 1, y: 1 });

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });
    });

    describe('selectAll', () => {
        beforeEach(() => {
            (cursorState.startRangeCorner as jest.Mock).mockReturnValue(newCursorState);
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            selectAll(props, gridState);

            expect(props.onSelectionChangeStart).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeStart = undefined;

            selectAll(props, gridState);

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });
    });

    describe('selectRow', () => {
        beforeEach(() => {
            (cursorState.startRangeRow as jest.Mock).mockReturnValue(newCursorState);
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            selectRow(props, gridState, { x: 0, y: 3 });

            expect(props.onSelectionChangeStart).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeStart = undefined;

            selectRow(props, gridState, { x: 0, y: 3 });

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });
    });

    describe('selectCol', () => {
        beforeEach(() => {
            (cursorState.startRangeColumn as jest.Mock).mockReturnValue(newCursorState);
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            selectRow(props, gridState, { x: 0, y: 3 });

            expect(props.onSelectionChangeStart).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeStart = undefined;

            selectRow(props, gridState, { x: 0, y: 3 });

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });
    });

    describe('updateSelection', () => {
        beforeEach(() => {
            (cursorState.updateDrag as jest.Mock).mockReturnValue(newCursorState);
            (cursorState.hasSelectionCellState as any as jest.Mock).mockReturnValue(true);
            (cursorState.isSelectRangeDifferent as any as jest.Mock).mockReturnValue(true);
        });

        it('does nothing if there is no prior (not-frozen) cell selection', () => {
            (cursorState.hasSelectionCellState as any as jest.Mock).mockReturnValue(false);

            updateSelection(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
            expect(gridState.cursorState).not.toHaveBeenCalledWith(expect.any(Object));
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            updateSelection(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeUpdate = undefined;

            updateSelection(props, gridState, { x: 2, y: 2 });

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if the selected range has not changed', () => {
            (cursorState.isSelectRangeDifferent as any as jest.Mock).mockReturnValue(false);

            updateSelection(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('truncates the coordinates if they would select frozen cells', () => {
            updateSelection(props, gridState, { x: 0, y: 0 });

            expect(cursorState.updateDrag).toHaveBeenCalledWith(oldCursorState, { x: 1, y: 1 });
        });
    });

    describe('updateSelectionRow', () => {
        beforeEach(() => {
            (cursorState.updateRangeRow as jest.Mock).mockReturnValue(newCursorState);
            (cursorState.hasSelectionRowState as any as jest.Mock).mockReturnValue(true);
            (cursorState.isSelectRangeDifferent as any as jest.Mock).mockReturnValue(true);
        });

        it('does nothing if there is no prior whole-row selection', () => {
            (cursorState.hasSelectionRowState as any as jest.Mock).mockReturnValue(false);

            updateSelectionRow(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
            expect(gridState.cursorState).not.toHaveBeenCalledWith(expect.any(Object));
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            updateSelectionRow(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeUpdate = undefined;

            updateSelectionRow(props, gridState, { x: 2, y: 2 });

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if the selected range has not changed', () => {
            (cursorState.isSelectRangeDifferent as any as jest.Mock).mockReturnValue(false);

            updateSelectionRow(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });
    });

    describe('updateSelectionCol', () => {
        beforeEach(() => {
            (cursorState.updateRangeColumn as jest.Mock).mockReturnValue(newCursorState);
            (cursorState.hasSelectionColumnState as any as jest.Mock).mockReturnValue(true);
            (cursorState.isSelectRangeDifferent as any as jest.Mock).mockReturnValue(true);
        });

        it('does nothing if there is no prior whole-row selection', () => {
            (cursorState.hasSelectionColumnState as any as jest.Mock).mockReturnValue(false);

            updateSelectionCol(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
            expect(gridState.cursorState).not.toHaveBeenCalledWith(expect.any(Object));
        });

        it('updates the cursor info, calls the props callback, and updates grid state', () => {
            updateSelectionCol(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).toHaveBeenCalledWith(newCursorState.selection.selectedRange);
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if it is not provided', () => {
            props.onSelectionChangeUpdate = undefined;

            updateSelectionCol(props, gridState, { x: 2, y: 2 });

            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });

        it('does not call the props callback if the selected range has not changed', () => {
            (cursorState.isSelectRangeDifferent as any as jest.Mock).mockReturnValue(false);

            updateSelectionCol(props, gridState, { x: 2, y: 2 });

            expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
            expect(gridState.cursorState).toHaveBeenCalledWith(newCursorState);
        });
    });

    describe('endSelection', () => {
        beforeEach(() => {
            (cursorState.hasSelectionState as any as jest.Mock).mockReturnValue(true);
        });

        it('calls the props callback if there is an existing selection', () => {
            endSelection(props, gridState);

            expect(props.onSelectionChangeEnd).toHaveBeenCalledWith(oldCursorState.selection.selectedRange);
        });

        it('calls the props callback with null if there is no existing selection', () => {
            (cursorState.hasSelectionState as any as jest.Mock).mockReturnValue(false);

            endSelection(props, gridState);

            expect(props.onSelectionChangeEnd).toHaveBeenCalledWith(null);
        });

        it('does nothing if the props callback is not provided', () => {
            props.onSelectionChangeEnd = undefined;

            endSelection(props, gridState);

            expect(gridState.cursorState).not.toHaveBeenCalled();
        });
    });
});
