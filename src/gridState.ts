import { activeSource, ActiveSource, ReactiveFn, transformer } from 'instigator';
import { CursorState } from './cursorState';
import * as cursorState from './cursorState';
import { ColumnBoundary, GridGeometry } from './gridGeometry';
import * as ScrollbarGeometry from './scrollbarGeometry';
import { ScrollbarExtent, ScrollbarPosition } from './scrollbarGeometry';
import { ColumnDef, Coord, DataRow, Size } from './types';

export class GridState<T> {
    // ReactCanvasGrid props
    public columns: ActiveSource<ColumnDef[]>;
    public data: ActiveSource<Array<DataRow<T>>>;
    public rowHeight: ActiveSource<number>;
    public borderWidth: ActiveSource<number>;
    public frozenRows: ActiveSource<number>;
    public frozenCols: ActiveSource<number>;

    // Other inputs
    public dpr: ActiveSource<number>;
    public rootSize: ActiveSource<Size | null>;
    public gridOffsetRaw: ActiveSource<Coord>; // Based on CSS pixels
    public cursorState: ActiveSource<CursorState>;
    public hoveredScrollbar: ActiveSource<'x'|'y'|null>;

    // Grid geometry derived properties
    public gridOffset: ReactiveFn<Coord>; // Quantized to values that result in integer canvas pixel coords
    public columnBoundaries: ReactiveFn<ColumnBoundary[]>;
    public gridSize: ReactiveFn<Size>;
    public canvasSize: ReactiveFn<Size>;
    public frozenColsWidth: ReactiveFn<number>;
    public frozenRowsHeight: ReactiveFn<number>;

    // Scrollbar derived properties
    public horizontalScrollbarLength: ReactiveFn<number>;
    public verticalScrollbarLength: ReactiveFn<number>;
    public horizontalScrollbarExtent: ReactiveFn<ScrollbarExtent>;
    public verticalScrollbarExtent: ReactiveFn<ScrollbarExtent>;
    public horizontalScrollbarPos: ReactiveFn<ScrollbarPosition|null>;
    public verticalScrollbarPos: ReactiveFn<ScrollbarPosition|null>;

    constructor(
        columns: ColumnDef[],
        data: Array<DataRow<T>>,
        rowHeight: number,
        borderWidth: number,
        frozenRows: number,
        frozenCols: number,
    ) {
        this.columns = activeSource(columns);
        this.data = activeSource(data);
        this.rowHeight = activeSource(rowHeight);
        this.borderWidth = activeSource(borderWidth);
        this.frozenRows = activeSource(frozenRows);
        this.frozenCols = activeSource(frozenCols);

        this.dpr = activeSource(window.devicePixelRatio);
        this.rootSize = activeSource<Size|null>(null);
        this.gridOffsetRaw = activeSource({ x: 0, y: 0 });
        this.cursorState = activeSource(cursorState.createDefault());
        this.hoveredScrollbar = activeSource<'x'|'y'|null>(null);

        this.gridOffset = transformer([this.gridOffsetRaw, this.dpr], GridGeometry.quantiseGridOffset);
        this.columnBoundaries = transformer([this.columns, this.borderWidth], GridGeometry.calculateColumnBoundaries);
        this.gridSize = transformer(
            [this.data, this.columnBoundaries, this.rowHeight, this.borderWidth],
            GridGeometry.calculateGridSize);
        this.canvasSize = transformer([this.gridSize, this.rootSize], GridGeometry.calculateCanvasSize);
        this.frozenColsWidth = transformer(
            [this.columnBoundaries, this.frozenCols, this.borderWidth],
            GridGeometry.calculateFrozenColsWidth);
        this.frozenRowsHeight = transformer(
            [this.rowHeight, this.borderWidth, this.frozenRows],
            GridGeometry.calculateFrozenRowsHeight);

        this.horizontalScrollbarLength = transformer(
            [this.canvasSize, this.gridSize, this.frozenColsWidth],
            this.getHorizontalScrollbarLength);
        this.verticalScrollbarLength = transformer(
            [this.canvasSize, this.gridSize, this.frozenRowsHeight],
            this.getVerticalScrollbarLength);
        this.horizontalScrollbarExtent = transformer(
            [this.gridOffset, this.canvasSize, this.gridSize, this.horizontalScrollbarLength, this.frozenColsWidth],
            this.getHorizontalScrollbarExtent);
        this.verticalScrollbarExtent = transformer(
            [this.gridOffset, this.canvasSize, this.gridSize, this.verticalScrollbarLength, this.frozenRowsHeight],
            this.getVerticalScrollbarExtent);
        this.horizontalScrollbarPos = transformer(
            [this.horizontalScrollbarExtent, this.canvasSize, this.gridSize],
            this.getHorizontalScrollbarPos);
        this.verticalScrollbarPos = transformer(
            [this.verticalScrollbarExtent, this.canvasSize, this.gridSize],
            this.getVerticalScrollbarPos);
    }

    private getHorizontalScrollbarLength = (canvasSize: Size, gridSize: Size, frozenColsWidth: number) => {
        return ScrollbarGeometry.calculateLength(canvasSize.width, gridSize.width, frozenColsWidth);
    }

    private getVerticalScrollbarLength = (canvasSize: Size, gridSize: Size, frozenRowsHeight: number) => {
        return ScrollbarGeometry.calculateLength(canvasSize.height, gridSize.height, frozenRowsHeight);
    }

    private getHorizontalScrollbarExtent = (
        gridOffset: Coord,
        canvasSize: Size,
        gridSize: Size,
        horizontalBarLength: number,
        frozenColsWidth: number,
    ) => {
        return ScrollbarGeometry
            .calculateExtent(gridOffset.x, canvasSize.width, gridSize.width, horizontalBarLength, frozenColsWidth);
    }

    private getVerticalScrollbarExtent = (
        gridOffset: Coord,
        canvasSize: Size,
        gridSize: Size,
        verticalBarLength: number,
        frozenRowsHeight: number,
    ) => {
        return ScrollbarGeometry
            .calculateExtent(gridOffset.y, canvasSize.height, gridSize.height, verticalBarLength, frozenRowsHeight);
    }

    private getHorizontalScrollbarPos = (extent: ScrollbarExtent, canvasSize: Size, gridSize: Size) => {
        if (gridSize.width > canvasSize.width) {
            const transverse = ScrollbarGeometry.calculateTransversePosition(canvasSize.height);
            return { extent, transverse };
        } else {
            return null;
        }
    }

    private getVerticalScrollbarPos = (extent: ScrollbarExtent, canvasSize: Size, gridSize: Size) => {
        if (gridSize.height > canvasSize.height) {
            const transverse = ScrollbarGeometry.calculateTransversePosition(canvasSize.width);
            return { extent, transverse };
        } else {
            return null;
        }
    }
}
