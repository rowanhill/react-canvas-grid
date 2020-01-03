import { activeSource, ActiveSource, ReactiveFn, transformer } from 'instigator';
import shallowEquals from 'shallow-equals';
import { ColumnBoundary, GridGeometry } from './gridGeometry';
import * as ScrollbarGeometry from './scrollbarGeometry';
import { ScrollbarExtent, ScrollbarPosition } from './scrollbarGeometry';
import { NoSelection } from './selectionState/noSelection';
import { AllSelectionStates } from './selectionState/selectionStateFactory';
import { CellCoordBounds, SelectRange } from './selectionState/selectionTypes';
import { ColumnDef, Coord, DataRow, Size } from './types';

export const refEquals = <T>(a: T, b: T) => a === b;

export const shallowEqualsExceptFunctions = (a: any, b: any): boolean => {
    if (typeof a === 'function' && typeof b === 'function') {
        return a === b;
    } else {
        return shallowEquals(a, b);
    }
};

export class GridState<T> {
    // ReactCanvasGrid props
    public columns: ActiveSource<ColumnDef[]>;
    public data: ActiveSource<Array<DataRow<T>>>;
    public rowHeight: ActiveSource<number>;
    public borderWidth: ActiveSource<number>;
    public frozenRows: ActiveSource<number>;
    public frozenCols: ActiveSource<number>;
    public shouldAllowAutofill: ActiveSource<(selectRange: SelectRange) => boolean>;

    // Other inputs
    public dpr: ActiveSource<number>;
    public rootSize: ActiveSource<Size | null>;
    public gridOffsetRaw: ActiveSource<Coord>; // Based on CSS pixels
    public selectionState: ActiveSource<AllSelectionStates>;
    public hoveredScrollbar: ActiveSource<'x'|'y'|null>;

    // Grid geometry derived properties
    public gridOffset: ReactiveFn<Coord>; // Quantized to values that result in integer canvas pixel coords
    public visibleRect: ReactiveFn<ClientRect>;
    public columnBoundaries: ReactiveFn<ColumnBoundary[]>;
    public gridInnerSize: ReactiveFn<Size>;
    public gridSize: ReactiveFn<Size>;
    public cellBounds: ReactiveFn<CellCoordBounds>;
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
    public horizontalGutterBounds: ReactiveFn<ClientRect|null>;
    public verticalGutterBounds: ReactiveFn<ClientRect|null>;

    constructor(
        columns: ColumnDef[],
        data: Array<DataRow<T>>,
        rowHeight: number,
        borderWidth: number,
        frozenRows: number,
        frozenCols: number,
        shouldAllowAutofill: (selectRange: SelectRange) => boolean,
    ) {
        this.columns = activeSource(columns);
        this.data = activeSource(data);
        this.rowHeight = activeSource(rowHeight);
        this.borderWidth = activeSource(borderWidth);
        this.frozenRows = activeSource(frozenRows);
        this.frozenCols = activeSource(frozenCols);
        this.shouldAllowAutofill = activeSource(shouldAllowAutofill, refEquals);

        this.dpr = activeSource(window.devicePixelRatio);
        this.rootSize = activeSource<Size|null>(null);
        this.gridOffsetRaw = activeSource({ x: 0, y: 0 });
        this.selectionState = activeSource(
            new NoSelection(false) as AllSelectionStates,
        );
        this.hoveredScrollbar = activeSource<'x'|'y'|null>(null);

        this.gridOffset = transformer([this.gridOffsetRaw, this.dpr], GridGeometry.quantiseGridOffset);
        this.columnBoundaries = transformer([this.columns, this.borderWidth], GridGeometry.calculateColumnBoundaries);
        this.gridInnerSize = transformer(
            [this.data, this.columnBoundaries, this.rowHeight, this.borderWidth],
            GridGeometry.calculateGridSize);
        this.gridSize = transformer([this.gridInnerSize, this.rootSize], GridGeometry.calculateGridPlusGutterSize);
        this.cellBounds = transformer([this.data, this.columns, this.frozenRows, this.frozenCols], (d, c, fr, fc) => ({
            numCols: c.length,
            numRows: d.length,
            frozenCols: fc,
            frozenRows: fr,
        }));
        this.canvasSize = transformer([this.gridSize, this.rootSize], GridGeometry.calculateCanvasSize);
        this.visibleRect = transformer([this.gridOffset, this.canvasSize], GridGeometry.calculateVisibleRect);
        this.frozenColsWidth = transformer(
            [this.columnBoundaries, this.frozenCols, this.borderWidth],
            GridGeometry.calculateFrozenColsWidth);
        this.frozenRowsHeight = transformer(
            [this.rowHeight, this.borderWidth, this.frozenRows],
            GridGeometry.calculateFrozenRowsHeight);

        this.horizontalScrollbarLength = transformer(
            [this.canvasSize, this.gridSize, this.frozenColsWidth],
            ScrollbarGeometry.getHorizontalScrollbarLength);
        this.verticalScrollbarLength = transformer(
            [this.canvasSize, this.gridSize, this.frozenRowsHeight],
            ScrollbarGeometry.getVerticalScrollbarLength);
        this.horizontalScrollbarExtent = transformer(
            [this.gridOffset, this.canvasSize, this.gridSize, this.horizontalScrollbarLength, this.frozenColsWidth],
            ScrollbarGeometry.getHorizontalScrollbarExtent);
        this.verticalScrollbarExtent = transformer(
            [this.gridOffset, this.canvasSize, this.gridSize, this.verticalScrollbarLength, this.frozenRowsHeight],
            ScrollbarGeometry.getVerticalScrollbarExtent);
        this.horizontalScrollbarPos = transformer(
            [this.horizontalScrollbarExtent, this.canvasSize, this.gridSize],
            ScrollbarGeometry.getHorizontalScrollbarPos);
        this.verticalScrollbarPos = transformer(
            [this.verticalScrollbarExtent, this.canvasSize, this.gridSize],
            ScrollbarGeometry.getVerticalScrollbarPos);
        this.horizontalGutterBounds = transformer(
            [this.canvasSize, this.gridInnerSize],
            ScrollbarGeometry.getHorizontalGutterBounds);
        this.verticalGutterBounds = transformer(
            [this.canvasSize, this.gridInnerSize],
            ScrollbarGeometry.getVerticalGutterBounds);
    }
}
