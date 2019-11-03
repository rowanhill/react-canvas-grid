import * as React from 'react';
import * as cursorState from '../cursorState';
import { GridState } from '../gridState';
import { EditingCell, ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import * as frozenEvents from './frozenCellMouseEvents';
import { mouseDownOnGrid, mouseDragOnGrid, mouseUpOnGrid } from './gridMouseEvents';
import * as scrollingTimer from './scrollingTimer';
import * as selection from './selection';

jest.mock('../cursorState');
jest.mock('../gridGeometry');
jest.mock('./frozenCellMouseEvents');
jest.mock('./selection');
jest.mock('./scrollingTimer');

const actualSelection = jest.requireActual('./selection') as typeof selection;

const expectNoSelectionsToHaveBeenMade = () => {
    for (const selectFn of Object.keys(actualSelection) as Array<keyof typeof actualSelection>) {
        expect(selection[selectFn]).not.toHaveBeenCalled();
    }
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

    const invokeMouseDown = <T>(params: Partial<MouseDownParams<T>> = {}) => {
        const defaults: MouseDownParams<T> = {
            event: { buttons: 1, clientX: 0, clientY: 0 } as React.MouseEvent<any, any>,
            componentPixelCoord: { x: 0, y: 0 },
            rootRef: { current: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }),
            } as HTMLDivElement },
            props: { } as ReactCanvasGridProps<T>,
            gridState: { cursorState: (() => null) as any } as GridState<T>,
            editingCell: null,
        };

        const { event, componentPixelCoord, rootRef, props, gridState, editingCell } = { ...defaults, ...params };

        mouseDownOnGrid(event, componentPixelCoord, rootRef, props, gridState, editingCell);
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('does nothing if it is not a left click', () => {
        const event: React.MouseEvent<any, any> = { buttons: 0 } as React.MouseEvent<any, any>;

        invokeMouseDown({ event });

        expectNoSelectionsToHaveBeenMade();
    });

    it('does nothing if a cell is being edited', () => {
        const editingCell: EditingCell<any> = { } as EditingCell<any>;

        invokeMouseDown({ editingCell });

        expectNoSelectionsToHaveBeenMade();
    });

    it('does nothing if the click is handled by the frozen cell click handler', () => {
        (frozenEvents.leftClickOnFrozenCell as jest.Mock).mockReturnValue(true);

        invokeMouseDown();

        expectNoSelectionsToHaveBeenMade();
    });

    it('starts a selection when left clicking on the grid', () => {
        invokeMouseDown();

        expect(selection.startOrUpdateSelection).toHaveBeenCalled();
    });

    it('starts a selection when shift-clicking on the grid with no prior selection', () => {
        invokeMouseDown({ event: { buttons: 1, shiftKey: true } as React.MouseEvent<any, any> });

        expect(selection.startOrUpdateSelection).toHaveBeenCalled();
    });

    it('updates the selection when shift-clicking in the grid with a prior selection', () => {
        (cursorState.hasSelectionState as any as jest.Mock).mockReturnValue(true);
        invokeMouseDown({ event: { buttons: 1, shiftKey: true } as React.MouseEvent<any, any> });

        expect(selection.startOrUpdateSelection).toHaveBeenCalled();
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

    const invokeMouseDrag = <T>(params: Partial<MouseDragParams<T>> = {}) => {
        const defaults: MouseDragParams<T> = {
            event: { buttons: 1, clientX: 0, clientY: 0 } as MouseEvent,
            rootRef: { current: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }),
            } as HTMLDivElement },
            props: { } as ReactCanvasGridProps<T>,
            gridState: { cursorState: (() => ({ isSelectionInProgress: true })) as any } as GridState<T>,
            editingCell: null,
        };

        const { event, rootRef, props, gridState, editingCell } = { ...defaults, ...params };

        return mouseDragOnGrid(event, rootRef, props, gridState, editingCell);
    };

    beforeEach(() => {
        jest.resetAllMocks();
        (cursorState.hasSelectionState as any as jest.Mock).mockReturnValue(true);
    });

    it('does nothing if it is not a left click', () => {
        const event: MouseEvent = { buttons: 0 } as MouseEvent;

        const dragResult = invokeMouseDrag({ event });

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade();
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('does nothing if a cell is being edited', () => {
        const editingCell: EditingCell<any> = { } as EditingCell<any>;

        const dragResult = invokeMouseDrag({ editingCell });

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade();
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('does nothing if there is no existing selection', () => {
        (cursorState.hasSelectionState as any as jest.Mock).mockReturnValue(false);

        const dragResult = invokeMouseDrag();

        expect(dragResult).toEqual(false);
        expectNoSelectionsToHaveBeenMade();
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('does nothing (else) if the click is handled by the frozen cell click handler', () => {
        (frozenEvents.leftClickDragOnFrozenCell as jest.Mock).mockReturnValue(true);

        const dragResult = invokeMouseDrag();

        expect(dragResult).toEqual(true);
        expectNoSelectionsToHaveBeenMade();
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).not.toHaveBeenCalled();
    });

    it('updates the existing selection and starts scrolling if needed when dragging on the grid', () => {
        const dragResult = invokeMouseDrag();

        expect(dragResult).toEqual(true);
        expect(selection.updateSelection).toHaveBeenCalled();
        expect(scrollingTimer.startScrollBySelectionDragIfNeeded).toHaveBeenCalled();
    });
});

describe('mouseUpOnGrid', () => {
    interface MouseUpParams<T> {
        props: ReactCanvasGridProps<T>;
        gridState: GridState<T>;
        editingCell: EditingCell<T> | null;
    }
    const invokeMouseDrag = <T>(params: Partial<MouseUpParams<T>> = {}) => {
        const defaults: MouseUpParams<T> = {
            props: { } as ReactCanvasGridProps<T>,
            gridState: { cursorState: (() => ({ isSelectionInProgress: true })) as any } as GridState<T>,
            editingCell: null,
        };

        const { props, gridState, editingCell } = { ...defaults, ...params };

        return mouseUpOnGrid(props, gridState, editingCell);
    };

    beforeEach(() => {
        jest.resetAllMocks();
        (cursorState.hasSelectionState as any as jest.Mock).mockReturnValue(true);
    });

    it('stops any ongoing scrolling-by-dragging', () => {
        invokeMouseDrag();

        expect(scrollingTimer.clearScrollByDragTimer).toHaveBeenCalled();
    });

    it('does nothing if a cell is being edited', () => {
        const editingCell = { } as EditingCell<any>;

        invokeMouseDrag({ editingCell });

        expectNoSelectionsToHaveBeenMade();
    });

    it('ends the selection', () => {
        invokeMouseDrag({ editingCell: null });

        expect(selection.endSelection).toBeCalled();
    });
});
