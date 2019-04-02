export interface ColumnDef {
    fieldName: string;
    width: number;
}

type CustomDrawCallback<T> = (
    context: CanvasRenderingContext2D,
    cellBounds: ClientRect,
    cell: CellDef<T>,
    column: ColumnDef,
) => void;

interface CellDefCommon<T> {
    data: T;
    renderBackground?: CustomDrawCallback<T>;
    renderText?: CustomDrawCallback<T>;
}
interface CellDefWithTextFunction<T> extends CellDefCommon<T> {
    getText: (data: T) => string;
}
interface CellDefWithTextString<T> extends CellDefCommon<T> {
    text: string;
}
export type CellDef<T> = CellDefWithTextFunction<T> | CellDefWithTextString<T>;

export const cellHasTextFunction = <T> (cell: CellDef<T>): cell is CellDefWithTextFunction<T> => {
    return !!(cell as CellDefWithTextFunction<T>).getText;
};

export interface DataRow<T> {
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

export interface Bounds {
    top: number;
    left: number;
    right: number;
    bottom: number;
}
