import { GridState } from '../gridState';
import { Coord } from '../types';
import { CellCoordBounds } from './selectionTypes';

export abstract class BaseSelectionState<T extends BaseSelectionState<T>> {
    public readonly isSelectionInProgress: boolean;

    public abstract arrowUp: (cellBounds: CellCoordBounds) => T;
    public abstract arrowDown: (cellBounds: CellCoordBounds) => T;
    public abstract arrowLeft: (cellBounds: CellCoordBounds) => T;
    public abstract arrowRight: (cellBounds: CellCoordBounds) => T;
    public abstract shiftArrowUp: (cellBounds: CellCoordBounds) => T;
    public abstract shiftArrowDown: (cellBounds: CellCoordBounds) => T;
    public abstract shiftArrowLeft: (cellBounds: CellCoordBounds) => T;
    public abstract shiftArrowRight: (cellBounds: CellCoordBounds) => T;

    // mouseDown is defined on derived classes (to avoid circular file imports, annoyingly...)
    public abstract mouseMove: (cell: Coord) => T;
    public abstract mouseUp: () => T;

    public abstract getFocusGridOffset: <D>(gridState: GridState<D>) => Coord | null;

    constructor(
        isSelectionInProgress: boolean,
    ) {
        this.isSelectionInProgress = isSelectionInProgress;
    }
}
