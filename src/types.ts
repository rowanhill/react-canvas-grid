export interface ColumnDef {
    fieldName: string;
    width: number;
}

export interface CustomDrawCallbackMetadata {
    column: ColumnDef;
    colIndex: number;
    rowIndex: number;
}
type CustomDrawCallback<T> = (
    context: CanvasRenderingContext2D,
    cellBounds: ClientRect,
    cell: CellDef<T>,
    metadata: CustomDrawCallbackMetadata,
) => void;

interface CellDefCommon<T> {
    data: T;
    renderBackground?: CustomDrawCallback<T>;
    renderText?: CustomDrawCallback<T>;
}

interface WithTextFunction<T> {
    getText: (data: T) => string;
}
interface WithTextString {
    text: string;
}
type TextAccessible<T> = WithTextFunction<T> | WithTextString;

interface WithSerialisers<T> {
    editor: {
        serialise: (data: T) => string;
        deserialise: (value: string, oldData: T) => T;
    };
}
type Serialisable<T> = WithSerialisers<T> | {};

export type CellDef<T> = CellDefCommon<T> & TextAccessible<T> & Serialisable<T>;
export type EditableCellDef<T> = CellDef<T> & WithSerialisers<T>;

export const cellHasTextFunction = <T> (cell: CellDef<T>): cell is CellDefCommon<T> & WithTextFunction<T> => {
    return !!(cell as any).getText;
};

export const getCellText = <T> (cell: CellDef<T>): string => {
    return cellHasTextFunction(cell) ? cell.getText(cell.data) : cell.text;
};

export const cellIsEditable = <T> (cell: CellDef<T>): cell is EditableCellDef<T> => {
    return !!(cell as EditableCellDef<T>).editor;
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
