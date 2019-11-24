import { GridState } from '../gridState';
import { Coord } from '../types';
import { BaseSelectionState, CellCoordBounds, ClickMeta } from './selectionState';
import { mouseDown } from './selectionStateFactory';

export class NoSelection extends BaseSelectionState<NoSelection> {
    public arrowUp = (_: CellCoordBounds) => this;
    public arrowDown = (_: CellCoordBounds) => this;
    public arrowLeft = (_: CellCoordBounds) => this;
    public arrowRight = (_: CellCoordBounds) => this;
    public shiftArrowUp = (_: CellCoordBounds) => this;
    public shiftArrowDown = (_: CellCoordBounds) => this;
    public shiftArrowLeft = (_: CellCoordBounds) => this;
    public shiftArrowRight = (_: CellCoordBounds) => this;

    public mouseMove = () => this;
    public mouseUp = () => this;

    public shiftMouseDown = (cell: Coord, meta: ClickMeta, _: CellCoordBounds) => {
        return mouseDown(cell, meta);
    }

    public getSelectionRange = () => null;

    public getCursorCell = () => null;

    public getFocusGridOffset = <D>(_: GridState<D>): Coord|null => null;
}
