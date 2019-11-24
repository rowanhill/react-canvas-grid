import { GridState } from '../gridState';
import { Coord } from '../types';

export type GridClickRegion = 'frozen-rows' | 'frozen-cols' | 'frozen-corner' | 'cells';

export interface ClickMeta {
    region: GridClickRegion;
}

export interface CellCoordBounds {
    frozenRows: number;
    frozenCols: number;
    numRows: number;
    numCols: number;
}

export interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

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

    public abstract mouseMove: (cell: Coord) => T;
    public abstract mouseUp: () => T;

    public abstract getFocusGridOffset: <D>(gridState: GridState<D>) => Coord | null;

    constructor(
        isSelectionInProgress: boolean,
    ) {
        this.isSelectionInProgress = isSelectionInProgress;
    }
}
