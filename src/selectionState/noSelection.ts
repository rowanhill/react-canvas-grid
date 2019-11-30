import { GridState } from '../gridState';
import { Coord } from '../types';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta } from './selectionTypes';

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

    public mouseDown = (cell: Coord, meta: ClickMeta) => createSelectionStateForMouseDown(cell, meta);

    public shiftMouseDown = (cell: Coord, meta: ClickMeta) => {
        return this.mouseDown(cell, meta);
    }

    public getSelectionRange = () => null;

    public getCursorCell = () => null;

    public getFocusGridOffset = <D>(_: GridState<D>): Coord|null => null;
}
