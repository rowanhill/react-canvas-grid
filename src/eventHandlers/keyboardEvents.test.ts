import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { NoSelection } from '../selectionState/noSelection';
import { AllSelectionStates } from '../selectionState/selectionStateFactory';
import { keyDownOnGrid } from './keyboardEvents';

beforeEach(() => {
    jest.clearAllMocks();
});

function createEvent(key: string, shiftKey: boolean = false): React.KeyboardEvent<any> {
    return { key, shiftKey } as React.KeyboardEvent<any>;
}

function expectNoUpdateToSelectionState(gridState: GridState<any>) {
    expect(gridState.selectionState).not.toHaveBeenCalledWith(expect.objectContaining({}));
}

function expectNoUpdateToGridOffset(gridState: GridState<any>) {
    expect(gridState.gridOffsetRaw).not.toHaveBeenCalled();
}

function expectNoCallToAnyOnSelectionCallback(props: ReactCanvasGridProps<any>) {
    expect(props.onSelectionChangeStart).not.toHaveBeenCalled();
    expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
    expect(props.onSelectionChangeEnd).not.toHaveBeenCalled();
}

function expectNothingToHaveHappened(gridState: GridState<any>, props: ReactCanvasGridProps<any>) {
    expectNoUpdateToSelectionState(gridState);
    expectNoUpdateToGridOffset(gridState);
    expectNoCallToAnyOnSelectionCallback(props);
}

describe('keyDownOnGrid', () => {
    let initialSelection: AllSelectionStates;
    let newSelection: AllSelectionStates;
    let gridState: GridState<any>;
    let props: ReactCanvasGridProps<any>;

    beforeEach(() => {
        initialSelection = new NoSelection(false);
        jest.spyOn(initialSelection, 'arrowUp').mockReturnValue(initialSelection);

        newSelection = new NoSelection(false);
        jest.spyOn(newSelection, 'getSelectionRange').mockReturnValue('dummy selection range' as any);
        jest.spyOn(newSelection, 'getFocusGridOffset').mockReturnValue('dummy new grid offset' as any);

        gridState = {
            cellBounds: (() => 'dummy cell bounds') as any,
            selectionState: jest.fn().mockReturnValue(initialSelection) as any,
            gridOffsetRaw: jest.fn() as any,
        } as GridState<any>;

        props = {
            onSelectionChangeStart: jest.fn() as any,
            onSelectionChangeUpdate: jest.fn() as any,
            onSelectionChangeEnd: jest.fn() as any,
        } as ReactCanvasGridProps<any>;
    });

    it('does nothing if a key other than an arrow key is pressed', () => {
        const event = createEvent('a');

        keyDownOnGrid(event, props, gridState);

        expectNothingToHaveHappened(gridState, props);
    });

    it('does nothing if the key press results in the same seleciton state', () => {
        const event = createEvent('ArrowUp');

        keyDownOnGrid(event, props, gridState);

        expectNothingToHaveHappened(gridState, props);
    });

    it('does nothing if the key press results in the a seleciton state with a null selected range', () => {
        const event = createEvent('ArrowUp');
        jest.spyOn(initialSelection, 'arrowUp').mockReturnValue(newSelection);
        jest.spyOn(newSelection, 'getSelectionRange').mockReturnValue(null);

        keyDownOnGrid(event, props, gridState);

        expectNothingToHaveHappened(gridState, props);
    });

    it('does nothing if the key press results in the a seleciton state with a null focus grid offset', () => {
        const event = createEvent('ArrowUp');
        jest.spyOn(initialSelection, 'arrowUp').mockReturnValue(newSelection);
        jest.spyOn(newSelection, 'getFocusGridOffset').mockReturnValue(null);

        keyDownOnGrid(event, props, gridState);

        expectNothingToHaveHappened(gridState, props);
    });

    it.each`
        key             | arrowMethod
        ${'ArrowUp'}    | ${'arrowUp'}
        ${'ArrowDown'}  | ${'arrowDown'}
        ${'ArrowRight'} | ${'arrowRight'}
        ${'ArrowLeft'}  | ${'arrowLeft'}
    `('calls on start / on end, scrolls the grid, and updates the selection on $key press without shift', ({
        key,
        arrowMethod,
    }) => {
        const event = createEvent(key);
        jest.spyOn(initialSelection, arrowMethod).mockReturnValue(newSelection);

        keyDownOnGrid(event, props, gridState);

        expect(props.onSelectionChangeStart).toHaveBeenCalledWith('dummy selection range');
        expect(props.onSelectionChangeUpdate).not.toHaveBeenCalled();
        expect(props.onSelectionChangeEnd).toHaveBeenCalledWith('dummy selection range');
        expect(gridState.gridOffsetRaw).toHaveBeenCalledWith('dummy new grid offset');
        expect(gridState.selectionState).toHaveBeenCalledWith(newSelection);
    });

    it.each`
        key             | arrowMethod
        ${'ArrowUp'}    | ${'shiftArrowUp'}
        ${'ArrowDown'}  | ${'shiftArrowDown'}
        ${'ArrowRight'} | ${'shiftArrowRight'}
        ${'ArrowLeft'}  | ${'shiftArrowLeft'}
    `('calls on update / on end, scrolls the grid, and updates the selection on $key press with shift', ({
        key,
        arrowMethod,
    }) => {
        const event = createEvent(key, true);
        jest.spyOn(initialSelection, arrowMethod).mockReturnValue(newSelection);

        keyDownOnGrid(event, props, gridState);

        expect(props.onSelectionChangeStart).not.toHaveBeenCalled();
        expect(props.onSelectionChangeUpdate).toHaveBeenCalledWith('dummy selection range');
        expect(props.onSelectionChangeEnd).toHaveBeenCalledWith('dummy selection range');
        expect(gridState.gridOffsetRaw).toHaveBeenCalledWith('dummy new grid offset');
        expect(gridState.selectionState).toHaveBeenCalledWith(newSelection);
    });
});
