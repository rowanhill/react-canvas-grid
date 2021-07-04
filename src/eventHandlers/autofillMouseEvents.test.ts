import { GridGeometry } from '../gridGeometry';
import { AllGridSelection } from '../selectionState/allGridSelection';
import { CellsSelection } from '../selectionState/cellsSelection';
import { ColsSelection } from '../selectionState/colsSelection';
import { NoSelection } from '../selectionState/noSelection';
import { RowsSelection } from '../selectionState/rowsSelection';
import { mouseDownOnAutofillHandle, mouseHoverOnAutofillHandle } from './autofillMouseEvents';

jest.mock('../gridGeometry');

describe('mouseDownOnAutofillHandle', () => {
    it.each`
    selStateType | selState
    ${'AllGridSelection'} | ${new AllGridSelection(false)}
    ${'ColsSelection'} | ${new ColsSelection(null as any, 1, 2, false, 3)}
    ${'NoSelection'} | ${new NoSelection(false)}
    ${'RowsSelection'} | ${new RowsSelection(null as any, 1, 2, false, 3)}
    `('returns false when the selection state is a $selStateType', ({selState}) => {
        const result = mouseDownOnAutofillHandle(null as any, { selectionState: () => selState } as any, null as any);

        expect(result).toBeFalsy();
    });

    describe('with CellsSelection', () => {
        it('returns false when shouldAllowAutofill is false', () => {
            const cellsSelection = new CellsSelection(null as any, null as any, null as any, false, null as any);
            jest.spyOn(cellsSelection, 'getSelectionRange').mockReturnValue({
                topLeft: { x: 1, y: 2 },
                bottomRight: { x: 10, y: 12 },
            });
            const gridState = { selectionState: () => cellsSelection, shouldAllowAutofill: () => () => false };

            const result = mouseDownOnAutofillHandle(null as any, gridState as any, null as any);

            expect(result).toBeFalsy();
        });

        it('returns false when the click is not on the autofill handle', () => {
            const cellsSelection = new CellsSelection(null as any, null as any, null as any, false, null as any);
            jest.spyOn(cellsSelection, 'getSelectionRange').mockReturnValue({
                topLeft: { x: 1, y: 2 },
                bottomRight: { x: 10, y: 12 },
            });
            const gridState = {
                selectionState: () => cellsSelection,
                shouldAllowAutofill: () => () => true,
                rowHeight: () => 10,
                frozenColsWidth: () => 0,
                frozenRowsHeight: () => 0,
                borderWidth: () => 1,
                columnBoundaries: () => [],
                gridOffset: () => null,
            };
            jest.spyOn(GridGeometry, 'calculateCellBounds').mockReturnValue({ right: 10, bottom: 10 } as any);
            jest.spyOn(GridGeometry, 'calculateGridPixelCoords').mockReturnValue({ x: 15, y: 15 } as any);

            const result = mouseDownOnAutofillHandle(null as any, gridState as any, { current: null } as any);

            expect(result).toBeFalsy();
        });

        it('updates the selection state and returns true when the click is on the autofill handle', () => {
            const cellsSelection = new CellsSelection(null as any, null as any, null as any, false, null as any);
            jest.spyOn(cellsSelection, 'getSelectionRange').mockReturnValue({
                topLeft: { x: 1, y: 2 },
                bottomRight: { x: 10, y: 12 },
            });
            jest.spyOn(cellsSelection, 'mouseDownOnAutofillHandle').mockReturnValue('dummy new sel state' as any);
            const selStateSpy = jest.fn().mockReturnValue(cellsSelection);
            const gridState = {
                selectionState: selStateSpy,
                shouldAllowAutofill: () => () => true,
                rowHeight: () => 10,
                frozenColsWidth: () => 0,
                frozenRowsHeight: () => 0,
                borderWidth: () => 1,
                columnBoundaries: () => [],
                gridOffset: () => null,
            };
            jest.spyOn(GridGeometry, 'calculateCellBounds').mockReturnValue({ right: 10, bottom: 10 } as any);
            jest.spyOn(GridGeometry, 'calculateGridPixelCoords').mockReturnValue({ x: 13, y: 13 } as any);

            const result = mouseDownOnAutofillHandle(null as any, gridState as any, { current: null } as any);

            expect(selStateSpy).toHaveBeenCalledWith('dummy new sel state');
            expect(result).toBeTruthy();
        });
    });
});

describe('mouseHoverOnAutofillHandle', () => {
    it.each`
    selStateType | selState
    ${'AllGridSelection'} | ${new AllGridSelection(false)}
    ${'ColsSelection'} | ${new ColsSelection(null as any, 1, 2, false, 3)}
    ${'NoSelection'} | ${new NoSelection(false)}
    ${'RowsSelection'} | ${new RowsSelection(null as any, 1, 2, false, 3)}
    `('returns false when the selection state is a $selStateType', ({selState}) => {
        const gridState = {
            selectionState: () => selState,
            autofillHandleIsHovered: jest.fn(),
        };
        const result = mouseHoverOnAutofillHandle(null as any, gridState as any, null as any);

        expect(result).toBeFalsy();
        expect(gridState.autofillHandleIsHovered).toHaveBeenCalledWith(false);
    });

    describe('with CellsSelection', () => {
        it('returns false when shouldAllowAutofill is false', () => {
            const cellsSelection = new CellsSelection(null as any, null as any, null as any, false, null as any);
            jest.spyOn(cellsSelection, 'getSelectionRange').mockReturnValue({
                topLeft: { x: 1, y: 2 },
                bottomRight: { x: 10, y: 12 },
            });
            const gridState = {
                selectionState: () => cellsSelection,
                shouldAllowAutofill: () => () => false,
                autofillHandleIsHovered: jest.fn(),
            };

            const result = mouseHoverOnAutofillHandle(null as any, gridState as any, null as any);

            expect(result).toBeFalsy();
            expect(gridState.autofillHandleIsHovered).toHaveBeenCalledWith(false);
        });

        it('returns false when the mouse is not on the autofill handle', () => {
            const cellsSelection = new CellsSelection(null as any, null as any, null as any, false, null as any);
            jest.spyOn(cellsSelection, 'getSelectionRange').mockReturnValue({
                topLeft: { x: 1, y: 2 },
                bottomRight: { x: 10, y: 12 },
            });
            const gridState = {
                selectionState: () => cellsSelection,
                shouldAllowAutofill: () => () => true,
                rowHeight: () => 10,
                frozenColsWidth: () => 0,
                frozenRowsHeight: () => 0,
                borderWidth: () => 1,
                columnBoundaries: () => [],
                gridOffset: () => null,
                autofillHandleIsHovered: jest.fn(),
            };
            jest.spyOn(GridGeometry, 'calculateCellBounds').mockReturnValue({ right: 10, bottom: 10 } as any);
            jest.spyOn(GridGeometry, 'calculateGridPixelCoords').mockReturnValue({ x: 15, y: 15 } as any);

            const result = mouseHoverOnAutofillHandle(null as any, gridState as any, { current: null } as any);

            expect(result).toBeFalsy();
            expect(gridState.autofillHandleIsHovered).toHaveBeenCalledWith(false);
        });

        it('updates the hover state to true and returns true when the mouse is over the autofill handle', () => {
            const cellsSelection = new CellsSelection(null as any, null as any, null as any, false, null as any);
            jest.spyOn(cellsSelection, 'getSelectionRange').mockReturnValue({
                topLeft: { x: 1, y: 2 },
                bottomRight: { x: 10, y: 12 },
            });
            const gridState = {
                selectionState: () => cellsSelection,
                shouldAllowAutofill: () => () => true,
                rowHeight: () => 10,
                frozenColsWidth: () => 0,
                frozenRowsHeight: () => 0,
                borderWidth: () => 1,
                columnBoundaries: () => [],
                gridOffset: () => null,
                autofillHandleIsHovered: jest.fn(),
            };
            jest.spyOn(GridGeometry, 'calculateCellBounds').mockReturnValue({ right: 10, bottom: 10 } as any);
            jest.spyOn(GridGeometry, 'calculateGridPixelCoords').mockReturnValue({ x: 13, y: 13 } as any);

            const result = mouseHoverOnAutofillHandle(null as any, gridState as any, { current: null } as any);

            expect(result).toBeTruthy();
            expect(gridState.autofillHandleIsHovered).toHaveBeenCalledWith(true);
        });
    });
});
