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
