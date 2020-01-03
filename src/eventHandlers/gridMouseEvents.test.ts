import * as React from 'react';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { CellsSelection } from '../selectionState/cellsSelection';
import { NoSelection } from '../selectionState/noSelection';
import { AllSelectionStates } from '../selectionState/selectionStateFactory';
import { Coord } from '../types';
import { mouseDownOnGrid, mouseDragOnGrid, mouseUpOnGrid } from './gridMouseEvents';
import { getMouseCellCoordAndRegion } from './mouseCellAndRegionCalc';
import * as scrollingTimer from './scrollingTimer';

jest.mock('../gridGeometry');
jest.mock('./scrollingTimer');
jest.mock('./mouseCellAndRegionCalc.ts');

const expectNoSelectionsToHaveBeenMade = (selectionState: AllSelectionStates) => {
    expect(selectionState.mouseDown).not.toHaveBeenCalled();
    expect(selectionState.mouseMove).not.toHaveBeenCalled();
    expect(selectionState.mouseUp).not.toHaveBeenCalled();
};

const createDummyCellState = (isSelectionInProgress = true) => {
    const coord: Coord = { x: 1, y: 1 };
    return new CellsSelection(coord, coord, coord, isSelectionInProgress, coord);
};

const createSpiedOnCellSelectionState = (isSelectionInProgress = true) => {
    const state = createDummyCellState(isSelectionInProgress);
    jest.spyOn(state, 'mouseDown');
    jest.spyOn(state, 'shiftMouseDown');
    jest.spyOn(state, 'mouseMove');
    jest.spyOn(state, 'mouseUp');
    return state;
};

const createSpiedOnNoSelectionState = () => {
    const state = new NoSelection(false);
    jest.spyOn(state, 'mouseDown');
    jest.spyOn(state, 'shiftMouseDown');
    jest.spyOn(state, 'mouseMove');
    jest.spyOn(state, 'mouseUp');
    return state;
};

describe('mouseDownOnGrid', () => {
    interface MouseDownParams<T> {
        event: React.MouseEvent<any, any>;
        componentPixelCoord: Coord;
        rootRef: React.RefObject<HTMLDivElement>;
        props: ReactCanvasGridProps<T>;
        gridState: GridState<T>;
        editingCell: EditingCell<T> | null;
    }

    let initialState: AllSelectionStates;

    const invokeMouseDown = <T>(params: Partial<MouseDownParams<T>> = {}) => {
        const defaults: MouseDownParams<T> = {
            event: { buttons: 1, clientX: 0, clientY: 0 } as React.MouseEvent<any, any>,
            componentPixelCoord: { x: 0, y: 0 },
            rootRef: { current: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }),
            } as HTMLDivElement },
            props: {
                onSelectionChangeStart: jest.fn() as any,
                onSelectionChangeUpdate: jest.fn() as any,
            } as ReactCanvasGridProps<T>,
            gridState: {
                selectionState: jest.fn().mockReturnValue(initialState) as any,
                cellBounds: jest.fn() as any,
            } as GridState<T>,
            editingCell: null,
        };

        const merged = { ...defaults, ...params };
        const { event, componentPixelCoord, rootRef, props, gridState, editingCell } = merged;

        mouseDownOnGrid(event, componentPixelCoord, rootRef, props, gridState, editingCell);

        return merged;
    };

    beforeEach(() => {
        jest.resetAllMocks();

        initialState = createSpiedOnNoSelectionState();

        (getMouseCellCoordAndRegion as jest.Mock).mockReturnValue({
            truncatedCoord: { x: 0, y: 0 },
            region: 'cells',
        });
    });

    it('does nothing if it is not a left click', () => {
        const event: React.MouseEvent<any, any> = { buttons: 0 } as React.MouseEvent<any, any>;

        const params = invokeMouseDown({ event });

        expectNoSelectionsToHaveBeenMade(params.gridState.selectionState());
    });

    it('does nothing if a cell is being edited', () => {
        const editingCell: EditingCell<any> = { } as EditingCell<any>;

        const params = invokeMouseDown({ editingCell });

        expectNoSelectionsToHaveBeenMade(params.gridState.selectionState());
    });

    it('updates the selection when left clicking on the grid', () => {
        const newState = createDummyCellState();
        jest.spyOn(initialState, 'mouseDown').mockReturnValue(newState);

        const params = invokeMouseDown();

        expect(params.gridState.selectionState as unknown as jest.Mock).toHaveBeenCalledWith(newState);
    });

    it('updates the selection when shift left clicking on the grid', () => {
        const newState = createDummyCellState();
        jest.spyOn(initialState, 'shiftMouseDown').mockReturnValue(newState);

        const params = invokeMouseDown({ event: { buttons: 1, shiftKey: true } as React.MouseEvent<any, any> });

        expect(params.gridState.selectionState as unknown as jest.Mock).toHaveBeenCalledWith(newState);
    });

    it('does not update the selection if clicking does not change the selection', () => {
        jest.spyOn(initialState, 'mouseDown').mockReturnValue(initialState as any);

        const params = invokeMouseDown();

        expect(params.gridState.selectionState as unknown as jest.Mock)
            .not.toHaveBeenCalledWith(expect.objectContaining({}));
    });

    it('calls the selection started callback when left clicking on the grid', () => {
        const newState = createDummyCellState();
        jest.spyOn(initialState, 'mouseDown').mockReturnValue(newState);

        const params = invokeMouseDown();

        expect(params.props.onSelectionChangeStart as unknown as jest.Mock)
            .toHaveBeenCalledWith(newState.getSelectionRange());
    });

    it('calls the selection started callback when shift clicking with no prior selection', () => {
        const newState = createDummyCellState();
        jest.spyOn(initialState, 'shiftMouseDown').mockReturnValue(newState);

        const params = invokeMouseDown({ event: { buttons: 1, shiftKey: true } as React.MouseEvent<any, any> });

        expect(params.props.onSelectionChangeStart as unknown as jest.Mock)
            .toHaveBeenCalledWith(newState.getSelectionRange());
    });

    it('calls the selection updated callback when shift clicking with prior selection', () => {
        initialState = createDummyCellState();
        const newState = createDummyCellState();
        jest.spyOn(initialState, 'shiftMouseDown').mockReturnValue(newState);

        const params = invokeMouseDown({ event: { buttons: 1, shiftKey: true } as React.MouseEvent<any, any> });

        expect(params.props.onSelectionChangeUpdate as unknown as jest.Mock)
            .toHaveBeenCalledWith(newState.getSelectionRange());
    });
});

describe('mouseDragOnGrid', () => {
    interface MouseDragParams<T> {
        event: MouseEvent;
        rootRef: React.RefObject<HTMLDivElement>;
        props: ReactCanvasGridProps<T>;
        gridState: GridState<T>;
        editingCell: EditingCell<T> | null;
    }

    let initialState: AllSelectionStates;

    const invokeMouseDrag = <T>(params: Partial<MouseDragParams<T>> = {}) => {
        const defaults: MouseDragParams<T> = {
            event: { buttons: 1, clientX: 0, clientY: 0 } as MouseEvent,
            rootRef: { current: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }),
            } as HTMLDivElement },
            props: {
                onSelectionChangeUpdate: jest.fn() as any,
            } as ReactCanvasGridProps<T>,
            gridState: {
                cellBounds: jest.fn() as any,
                selectionState: jest.fn().mockReturnValue(initialState) as any,
            } as GridState<T>,
            editingCell: null,
        };

        const merged = { ...defaults, ...params };
        const { event, rootRef, props, gridState, editingCell } = merged;

        const dragResult = mouseDragOnGrid(event, rootRef, props, gridState, editingCell);

        return { dragResult, params: merged };
    };

    beforeEach(() => {
        jest.resetAllMocks();

        initialState = createSpiedOnNoSelectionState();

        (getMouseCellCoordAndRegion as jest.Mock).mockReturnValue({
            truncatedCoord: { x: 0, y: 0 },
            region: 'cells',
        });
    });

    it('does nothing if it is not a left click', () => {
        initialState = createSpiedOnCellSelectionState();
        const event: MouseEvent = { buttons: 0 } as MouseEvent;

        const { dragResult, params } = invokeMouseDrag({ event });

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade(params.gridState.selectionState());
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('does nothing if a cell is being edited', () => {
        initialState = createSpiedOnCellSelectionState();
        const editingCell: EditingCell<any> = { } as EditingCell<any>;

        const { dragResult, params } = invokeMouseDrag({ editingCell });

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade(params.gridState.selectionState());
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('does nothing if there is no existing selection', () => {
        const { dragResult, params } = invokeMouseDrag();

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade(params.gridState.selectionState());
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('does nothing if there is no in-progress selection', () => {
        initialState = createSpiedOnCellSelectionState(false);

        const { dragResult, params } = invokeMouseDrag();

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade(params.gridState.selectionState());
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('updates the existing selection, calls the selection updated callback,' +
    ' and starts scrolling if needed when dragging on the grid', () => {
        initialState = createSpiedOnCellSelectionState();
        const newState = createDummyCellState();
        jest.spyOn(initialState, 'mouseMove').mockReturnValue(newState);

        const { dragResult, params } = invokeMouseDrag();

        expect(dragResult).toEqual(true);
        expect(params.gridState.selectionState as unknown as jest.Mock).toHaveBeenCalledWith(newState);
        expect(params.props.onSelectionChangeUpdate).toHaveBeenCalledWith(newState.getSelectionRange());
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).toHaveBeenCalled();
    });

    it('does not update the selection or call the selection updated callback if the selection didn\'t change', () => {
        initialState = createSpiedOnCellSelectionState();
        jest.spyOn(initialState, 'mouseMove').mockReturnValue(initialState);

        const { dragResult, params } = invokeMouseDrag();

        expect(dragResult).toEqual(true);
        expect(params.gridState.selectionState as unknown as jest.Mock)
            .not.toHaveBeenCalledWith(expect.objectContaining({}));
        expect(params.props.onSelectionChangeUpdate).not.toHaveBeenCalled();
    });

    it('does not update the selection or call the selection updated callback if the selection range is null', () => {
        initialState = createSpiedOnCellSelectionState();
        const newState = createSpiedOnCellSelectionState();
        jest.spyOn(newState, 'getSelectionRange').mockReturnValue(null as any);
        jest.spyOn(initialState, 'mouseMove').mockReturnValue(newState);

        const { dragResult, params } = invokeMouseDrag();

        expect(dragResult).toEqual(true);
        expect(params.gridState.selectionState as unknown as jest.Mock)
            .not.toHaveBeenCalledWith(expect.objectContaining({}));
        expect(params.props.onSelectionChangeUpdate).not.toHaveBeenCalled();
    });
});

describe('mouseUpOnGrid', () => {
    interface MouseUpParams<T> {
        props: ReactCanvasGridProps<T>;
        gridState: GridState<T>;
        editingCell: EditingCell<T> | null;
    }

    let initialState: AllSelectionStates;

    const invokeMouseUp = <T>(params: Partial<MouseUpParams<T>> = {}) => {
        const defaults: MouseUpParams<T> = {
            props: {
                onSelectionChangeEnd: jest.fn() as any,
                onAutofill: jest.fn() as any,
            } as ReactCanvasGridProps<T>,
            gridState: {
                cellBounds: jest.fn() as any,
                selectionState: jest.fn().mockReturnValue(initialState) as any,
            } as GridState<T>,
            editingCell: null,
        };

        const merged = { ...defaults, ...params };
        const { props, gridState, editingCell } = merged;

        mouseUpOnGrid(props, gridState, editingCell);

        return { params: merged };
    };

    beforeEach(() => {
        jest.resetAllMocks();

        initialState = createSpiedOnCellSelectionState();
    });

    it('stops any ongoing scrolling-by-dragging', () => {
        invokeMouseUp();

        expect(scrollingTimer.clearScrollByDragTimer).toHaveBeenCalled();
    });

    it('does nothing if a cell is being edited', () => {
        const editingCell = { } as EditingCell<any>;

        const { params } = invokeMouseUp({ editingCell });

        expect(params.gridState.selectionState as unknown as jest.Mock)
            .not.toHaveBeenCalledWith(expect.objectContaining({}));
        expect(params.props.onSelectionChangeEnd).not.toHaveBeenCalled();
        expect(params.props.onAutofill).not.toHaveBeenCalled();
        expectNoSelectionsToHaveBeenMade(initialState);
    });

    it('does nothing if there is no prior selection', () => {
        initialState = createSpiedOnNoSelectionState();

        const { params } = invokeMouseUp({ editingCell: null });

        expect(params.gridState.selectionState as unknown as jest.Mock)
            .not.toHaveBeenCalledWith(expect.objectContaining({}));
        expect(params.props.onSelectionChangeEnd).not.toHaveBeenCalled();
        expect(params.props.onAutofill).not.toHaveBeenCalled();
        expectNoSelectionsToHaveBeenMade(initialState);
    });

    it('does not update the selection or call the selection updated callback if the selection didn\'t change', () => {
        initialState = createSpiedOnCellSelectionState();
        jest.spyOn(initialState, 'mouseUp').mockReturnValue(initialState);

        const { params } = invokeMouseUp({ editingCell: null });

        expect(params.gridState.selectionState as unknown as jest.Mock)
            .not.toHaveBeenCalledWith(expect.objectContaining({}));
        expect(params.props.onSelectionChangeEnd).not.toHaveBeenCalled();
        expect(params.props.onAutofill).not.toHaveBeenCalled();
    });

    it('ends the selection', () => {
        const newState = createSpiedOnCellSelectionState();
        jest.spyOn(initialState, 'mouseUp').mockReturnValue(newState);

        const { params } = invokeMouseUp({ editingCell: null });

        expect(params.gridState.selectionState as unknown as jest.Mock).toHaveBeenCalledWith(newState);
        expect(params.props.onSelectionChangeEnd).toHaveBeenCalledWith(newState.getSelectionRange());
        expect(initialState.mouseUp).toHaveBeenCalled();
    });

    it('calls the onAutofill callback on finishing an autofill drag', () => {
        const newState = createSpiedOnCellSelectionState();
        jest.spyOn(initialState, 'mouseUp').mockReturnValue(newState);
        jest.spyOn(initialState as CellsSelection, 'isAutofillDragging').mockReturnValue(true);
        jest.spyOn(newState, 'isAutofillDragging').mockReturnValue(false);
        jest.spyOn(initialState as CellsSelection, 'getSelectionRange').mockReturnValue('dummy selection range' as any);
        jest.spyOn(initialState as CellsSelection, 'getAutofillRange').mockReturnValue('dummy autofill range' as any);

        const { params } = invokeMouseUp({ editingCell: null });

        expect(params.props.onAutofill).toHaveBeenCalledWith('dummy selection range', 'dummy autofill range');
    });
});
