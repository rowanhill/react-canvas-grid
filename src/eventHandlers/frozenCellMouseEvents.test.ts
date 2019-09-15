import { RefObject } from 'react';
import { CursorState } from '../cursorState';
import * as cursorState from '../cursorState';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { Coord } from '../types';
import { leftClickDragOnFrozenCell, leftClickOnFrozenCell } from './frozenCellMouseEvents';
import * as scrollingTimer from './scrollingTimer';
import * as selection from './selection';

jest.mock('../cursorState');
jest.mock('../gridGeometry');
jest.mock('./selection');
jest.mock('./scrollingTimer');

const actualSelection = jest.requireActual('./selection') as typeof selection;

const expectNoSelectionsToHaveBeenMade = () => {
    for (const selectFn of Object.keys(actualSelection) as Array<keyof typeof actualSelection>) {
        expect(selection[selectFn]).not.toHaveBeenCalled();
    }
};

describe('leftClickOnFrozenCell', () => {
    interface ClickParams<T> {
        event: React.MouseEvent<any, any>;
        componentPixelCoord: Coord;
        rootRef: RefObject<HTMLDivElement>;
        props: ReactCanvasGridProps<T>;
        gridState: GridState<T>;
    }

    const invokeLeftClickOnFrozenCell = <T>(params: Partial<ClickParams<T>> = {}) => {
        const defaults: ClickParams<T> = {
            event: { buttons: 1, clientX: 0, clientY: 0 } as React.MouseEvent<any, any>,
            componentPixelCoord: { x: 0, y: 0 },
            rootRef: { current: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }),
            } as HTMLDivElement },
            props: { } as ReactCanvasGridProps<T>,
            gridState: {
                frozenColsWidth: (() => 50) as any,
                frozenRowsHeight: (() => 40) as any,
            } as GridState<T>,
        };

        const { event, componentPixelCoord, rootRef, props, gridState } = { ...defaults, ...params };

        return leftClickOnFrozenCell(event, componentPixelCoord, rootRef, props, gridState);
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('does nothing if the click is outside the frozen cells', () => {
        const componentPixelCoord: Coord = { x: 100, y: 100 };

        const result = invokeLeftClickOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(false);
        expectNoSelectionsToHaveBeenMade();
    });

    it('selects all if the click is in the top left, within both frozen rows and frozen columns', () => {
        const componentPixelCoord: Coord = { x: 0, y: 0 };

        const result = invokeLeftClickOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(true);
        expect(selection.selectAll).toHaveBeenCalled();
    });

    it('selects the whole row if the click is on the left, within the frozen columns', () => {
        const componentPixelCoord: Coord = { x: 0, y: 100 };

        const result = invokeLeftClickOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(true);
        expect(selection.selectOrUpdateRow).toHaveBeenCalled();
    });

    it('selects the whole column if the click is on the top, within the frozen rows', () => {
        const componentPixelCoord: Coord = { x: 100, y: 0 };

        const result = invokeLeftClickOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(true);
        expect(selection.selectOrUpdateCol).toHaveBeenCalled();
    });

    it('selects a range of rows when shift-clicking on the left, within the frozen columns', () => {
        const componentPixelCoord: Coord = { x: 0, y: 100 };
        const event: React.MouseEvent<any, any> = { shiftKey: true } as React.MouseEvent<any, any>;

        const result = invokeLeftClickOnFrozenCell({ componentPixelCoord, event });

        expect(result).toEqual(true);
        expect(selection.selectOrUpdateRow).toHaveBeenCalled();
    });

    it('selects a range of cols when shift-clicking on the top, within the frozen rows', () => {
        const componentPixelCoord: Coord = { x: 100, y: 0 };
        const event: React.MouseEvent<any, any> = { shiftKey: true } as React.MouseEvent<any, any>;

        const result = invokeLeftClickOnFrozenCell({ componentPixelCoord, event });

        expect(result).toEqual(true);
        expect(selection.selectOrUpdateCol).toHaveBeenCalled();
    });
});

describe('leftClickDragOnFrozenCell', () => {
    interface DragParams<T> {
        currentCursorState: CursorState;
        event: MouseEvent;
        componentPixelCoord: Coord;
        rootRef: RefObject<HTMLDivElement>;
        props: ReactCanvasGridProps<T>;
        gridState: GridState<T>;
    }

    const invokeLeftClickDragOnFrozenCell = <T>(params: Partial<DragParams<T>> = {}) => {
        const defaults: DragParams<T> = {
            currentCursorState: { editCursorCell: null, selection: null },
            event: { buttons: 1, clientX: 0, clientY: 0 } as MouseEvent,
            componentPixelCoord: { x: 0, y: 0 },
            rootRef: { current: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }),
            } as HTMLDivElement },
            props: { } as ReactCanvasGridProps<T>,
            gridState: {
                frozenColsWidth: (() => 50) as any,
                frozenRowsHeight: (() => 40) as any,
            } as GridState<T>,
        };

        const { currentCursorState, event, componentPixelCoord, rootRef, props, gridState } = {
            ...defaults,
            ...params,
        };

        return leftClickDragOnFrozenCell(currentCursorState, event, componentPixelCoord, rootRef, props, gridState);
    };

    beforeEach(() => {
        jest.resetAllMocks();

        (cursorState.hasSelectionFrozenState as jest.Mock).mockReturnValue(true);
    });

    it('does nothing if there is no prior frozen selection', () => {
        (cursorState.hasSelectionFrozenState as jest.Mock).mockReturnValue(false);

        const result = invokeLeftClickDragOnFrozenCell();

        expect(result).toEqual(false);
        expectNoSelectionsToHaveBeenMade();
    });

    it('does nothing if the mouse is not over frozen cells', () => {
        const componentPixelCoord: Coord = { x: 100, y: 100 };

        const result = invokeLeftClickDragOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(false);
        expectNoSelectionsToHaveBeenMade();
    });

    it('does nothing (but returns true) if the mouse is within both the frozen rows and columns', () => {
        const componentPixelCoord: Coord = { x: 0, y: 0 };

        const result = invokeLeftClickDragOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(true);
        expectNoSelectionsToHaveBeenMade();
    });

    it('updates the selected rows if the mouse is within the frozen columns', () => {
        const componentPixelCoord: Coord = { x: 0, y: 100 };

        const result = invokeLeftClickDragOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(true);
        expect(selection.updateSelectionRow).toHaveBeenCalled();
    });

    it('updates the selected cols if the mouse is within the frozen rows', () => {
        const componentPixelCoord: Coord = { x: 100, y: 0 };

        const result = invokeLeftClickDragOnFrozenCell({ componentPixelCoord });

        expect(result).toEqual(true);
        expect(selection.updateSelectionCol).toHaveBeenCalled();
    });

    it('starts scrolling horizontally if needed, if there is an existing column selection', () => {
        (cursorState.hasSelectionColumnState as any as jest.Mock).mockReturnValue(true);

        invokeLeftClickDragOnFrozenCell();

        expect(scrollingTimer.startScrollBySelectionDragIfNeeded)
            .toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Function), { suppressY: true });
    });

    it('starts scrolling vertically if needed, if there is an existing row selection', () => {
        (cursorState.hasSelectionRowState as any as jest.Mock).mockReturnValue(true);

        invokeLeftClickDragOnFrozenCell();

        expect(scrollingTimer.startScrollBySelectionDragIfNeeded)
            .toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Function), { suppressX: true });
    });
});
