export interface ColumnDef {
    fieldName: string;
    width: number;
}

export interface CellDef<T> {
    data: T;
    getText: () => string;
    renderBackground?: (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CellDef<T>, column: ColumnDef) => void;
    renderText?: (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CellDef<T>, column: ColumnDef) => void;
}

export type DataRow<T> = {
    [fieldName: string]: CellDef<T>;
}

export interface Coord {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}