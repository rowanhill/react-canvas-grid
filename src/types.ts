export interface ColumnDef {
    fieldName: string;
    width: number;
}

export interface CellDef {
    getText: () => string;
}

export type DataRow<T extends CellDef> = {
    [fieldName: string]: T;
}

export interface Coord {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}