import { GridState } from '../gridState';
import { Coord } from '../types';
import { BaseSelectionState } from './selectionState';
import { createSelectionStateForMouseDown } from './selectionStateFactory';
import { CellCoordBounds, ClickMeta } from './selectionTypes';

export class NoSelection extends BaseSelectionState {
    public arrowUp = () => this;
    public arrowDown = () => this;
    public arrowLeft = () => this;
    public arrowRight = () => this;
    public shiftArrowUp = () => this;
    public shiftArrowDown = () => this;
    public shiftArrowLeft = () => this;
    public shiftArrowRight = () => this;

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
