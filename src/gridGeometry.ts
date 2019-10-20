import { GridState } from './gridState';
import { barMarginToEdge, barWidth } from './scrollbarGeometry';
import { ColumnDef, Coord, DataRow, Size } from './types';

export interface ColumnBoundary {
    /**
     * The left hand edge (inclusive) of the column (excluding border), from the grid origin
     */
    left: number;

    /**
     * The right hand edge (exclusive) of the column (excluding border), from the grid origin
     */
    right: number;
}

export class GridGeometry {
    /**
     * Calculate the boundaries of all columns in the grid, excluding borders. The 'left's are inclusive,
     * the 'right's are exclusive.
     */
    public static calculateColumnBoundaries = (columns: ColumnDef[], borderWidth: number): ColumnBoundary[] => {
        let curLeft = 0;
        return columns.map((col) => {
            // Left is 0-indexed and inclusive. Right is exclusive, so we can just add the width
            const boundary = { left: curLeft, right: curLeft + col.width};
            // Add the border width on to skip it - the border is not within the range of any column
            curLeft += col.width + borderWidth;
            return boundary;
        });
    }

    /**
     * Calculate the total size of the grid, including borders, but excluding gutters
     */
    public static calculateGridSize = (
        data: Array<DataRow<any>>,
        columnBoundaries: ColumnBoundary[],
        rowHeight: number,
        borderWidth: number,
    ): Size => {
        const numRows = data.length;
        const height = (numRows * rowHeight) + ((numRows - 1) * borderWidth);

        const width = columnBoundaries[columnBoundaries.length - 1].right;

        return { width, height };
    }

    /**
     * Calculates the total size of the grid, including scrollbar gutters
     */
    public static calculateGridPlusGutterSize = (gridSize: Size, rootSize: Size|null): Size => {
        // If we don't know how big the root element is yet, assume no gutters
        if (rootSize === null) {
            return gridSize;
        }
        return {
            width: gridSize.width + (gridSize.height > rootSize.height ? barWidth + barMarginToEdge * 2 : 0),
            height: gridSize.height + (gridSize.width > rootSize.width ? barWidth + barMarginToEdge * 2 : 0),
        };
    }

    public static calculateCanvasSize = (gridPlusGutterSize: Size, rootSize: Size|null): Size => {
        // First render is before componentDidMount, so before we have calculated the root element's size.
        // In this case, we just render as 0x0. componentDidMount will then update state,
        // and we'll re-render
        if (rootSize === null) {
            return { width: 0, height: 0 };
        }
        return {
            width: Math.min(rootSize.width, gridPlusGutterSize.width),
            height: Math.min(rootSize.height, gridPlusGutterSize.height),
        };
    }

    /*
     * Calculate the height of all the frozen rows and their bottom borders
     */
    public static calculateFrozenRowsHeight = (rowHeight: number, borderWidth: number, frozenRows: number) => {
        return (rowHeight + borderWidth) * frozenRows;
    }

    /*
     * Calculate the width of all the frozen rows and their right borders
     */
    public static calculateFrozenColsWidth = (
        columnBoundaries: ColumnBoundary[],
        frozenCols: number,
        borderWidth: number,
    ) => {
        const rightmostColIndex = frozenCols - 1;
        if (rightmostColIndex < 0) {
            return 0;
        }
        return columnBoundaries[rightmostColIndex].right + borderWidth;
    }

    public static calculateGridCellCoordsFromGridState = <T>(
        event: { clientX: number, clientY: number },
        rootRef: HTMLDivElement | null,
        gridState: GridState<T>,
    ) => {
        return GridGeometry.calculateGridCellCoords(
            event,
            gridState.columnBoundaries(),
            gridState.borderWidth(),
            gridState.rowHeight(),
            gridState.gridOffset(),
            gridState.data().length - 1,
            rootRef,
        );
    }

    /**
     * Calculate the column & row index (i.e. "grid cell coordinates") that contains a click. The click coordinates
     * are given in the window/viewport's frame of reference.
     */
    public static calculateGridCellCoords = (
        event: {clientX: number, clientY: number},
        columnBoundaries: ColumnBoundary[],
        borderWidth: number,
        rowHeight: number,
        gridOffset: Coord,
        maxRow: number,
        root: HTMLDivElement|null,
    ): Coord => {
        if (!root) {
            throw new Error('Cannot convert mouse event coords to grid coords because rootRef is not set');
        }
        return GridGeometry.gridPixelToGridCell(
            GridGeometry.windowPixelToGridPixel(
                {x: event.clientX, y: event.clientY},
                gridOffset,
                root,
            ),
            columnBoundaries,
            borderWidth,
            rowHeight,
            maxRow,
        );
    }

    public static calculateCellBounds = (
        colIndex: number,
        rowIndex: number,
        rowHeight: number,
        borderWidth: number,
        columnBoundaries: ColumnBoundary[],
        columns: ColumnDef[],
    ): ClientRect => {
        const cellLeft = columnBoundaries[colIndex].left;
        const col = columns[colIndex];

        return {
            left: cellLeft,
            top: rowIndex * (rowHeight + borderWidth),
            right: cellLeft + col.width,
            bottom: rowIndex * (rowHeight + borderWidth) + rowHeight,
            width: col.width,
            height: rowHeight,
        };
    }

    public static calculateGridOffsetFromFraction = (
        fraction: number,
        gridLength: number,
        canvasLength: number,
    ): number => {
        return Math.floor((gridLength - canvasLength) * fraction);
    }

    public static truncateGridOffset = (oldOffset: Coord, gridSize: Size, canvasSize: Size): Coord|null => {
        const maxX = gridSize.width - canvasSize.width;
        const maxY = gridSize.height - canvasSize.height;
        if (oldOffset.x > maxX || oldOffset.y > maxY) {
            return {
                x: Math.min(maxX, oldOffset.x),
                y: Math.min(maxY, oldOffset.y),
            };
        } else {
            return null;
        }
    }

    /**
     * Takes an offset in CSS pixels and returns an offset also in CSS pixels, but quantised to
     * values that produce an integer offset in canvas pixels. This avoids the canvas elements trying
     * to do any sub-pixel rendering, and thus avoids bluriness in the grid.
     */
    public static quantiseGridOffset = (offset: Coord, dpr: number) => {
        return {
            x: Math.floor(offset.x * dpr) / dpr,
            y: Math.floor(offset.y * dpr) / dpr,
        };
    }

    public static calculateGridOffsetForTargetColumn = (
        oldOffset: Coord,
        canvasSize: Size,
        frozenColsWidth: number,
        targetColIndex: number,
        columnBoundaries: ColumnBoundary[],
        verticalScrollGutter: ClientRect | null,
    ): Coord => {
        return {
            ...oldOffset,
            x: GridGeometry.calculateGridOffsetXForTargetColumn(
                oldOffset.x,
                canvasSize,
                frozenColsWidth,
                targetColIndex,
                columnBoundaries,
                verticalScrollGutter,
            ),
        };
    }

    public static calculateGridOffsetForTargetRow = (
        oldOffset: Coord,
        canvasSize: Size,
        frozenRowsHeight: number,
        targetRowIndex: number,
        rowHeight: number,
        borderWidth: number,
        numRows: number,
        horizontalScrollGutter: ClientRect | null,
    ): Coord => {
        return {
            ...oldOffset,
            y: GridGeometry.calculateGridOffsetYForTargetRow(
                oldOffset.y,
                canvasSize,
                frozenRowsHeight,
                targetRowIndex,
                rowHeight,
                borderWidth,
                numRows,
                horizontalScrollGutter,
            ),
        };
    }

    public static calculateGridOffsetForTargetCell = (
        oldOffset: Coord,
        canvasSize: Size,
        frozenColsWidth: number,
        frozenRowsHeight: number,
        targetCell: Coord,
        columnBoundaries: ColumnBoundary[],
        rowHeight: number,
        borderWidth: number,
        numRows: number,
        verticalScrollGutter: ClientRect | null,
        horizontalScrollGutter: ClientRect | null,
    ): Coord => {
        return {
            x: GridGeometry.calculateGridOffsetXForTargetColumn(
                oldOffset.x,
                canvasSize,
                frozenColsWidth,
                targetCell.x,
                columnBoundaries,
                verticalScrollGutter,
            ),
            y: GridGeometry.calculateGridOffsetYForTargetRow(
                oldOffset.y,
                canvasSize,
                frozenRowsHeight,
                targetCell.y,
                rowHeight,
                borderWidth,
                numRows,
                horizontalScrollGutter,
            ),
        };
    }

    public static calculateGridOffsetXForTargetColumn = (
        oldX: number,
        canvasSize: Size,
        frozenColsWidth: number,
        targetColIndex: number,
        columnBoundaries: ColumnBoundary[],
        verticalScrollGutter: ClientRect | null,
    ): number => {
        if (targetColIndex < 0 || targetColIndex >= columnBoundaries.length) {
            // The target column index is invalid, so ignore it
            return oldX;
        }
        const gutterWidth = verticalScrollGutter ? verticalScrollGutter.width : 0;
        const targetBoundaries = columnBoundaries[targetColIndex];
        const viewLeft = oldX + frozenColsWidth;
        const viewRight = oldX + canvasSize.width - gutterWidth;
        if (targetBoundaries.left < viewLeft && targetBoundaries.right > viewRight) {
            // The target column is wider than the canvas, but already visible - no change needed
            return oldX;
        } else if (targetBoundaries.left < viewLeft) {
            // The target column is to the left, so move offset so it's the leftmost column
            return Math.max(targetBoundaries.left - frozenColsWidth, 0);
        } else if (targetBoundaries.right > viewRight) {
            // The target column is to the right, so move offset so it's the rightmost column
            return targetBoundaries.right - canvasSize.width + gutterWidth;
        } else {
            // Otherwise, the target column must be in view, so no change is needed
            return oldX;
        }
    }

    public static calculateGridOffsetYForTargetRow = (
        oldY: number,
        canvasSize: Size,
        frozenRowsHeight: number,
        targetRowIndex: number,
        rowHeight: number,
        borderWidth: number,
        numRows: number,
        horizontalScrollGutter: ClientRect | null,
    ): number => {
        if (targetRowIndex < 0 || targetRowIndex >= (rowHeight + borderWidth) * numRows) {
            // The target row index is invalid, so ignore it
            return oldY;
        }
        const gutterHeight = horizontalScrollGutter ? horizontalScrollGutter.height : 0;
        const targetRowTop = (rowHeight + borderWidth) * targetRowIndex;
        const targetRowBottom = targetRowTop + rowHeight;
        const viewTop = oldY + frozenRowsHeight;
        const viewBottom = oldY + canvasSize.height - gutterHeight;
        if (targetRowTop < viewTop && targetRowBottom > viewBottom) {
            // The target row is taller than the canvas, but already visible - no change needed
            return oldY;
        } else if (targetRowTop < viewTop) {
            // The target column is upwards, so move offset so it's the topmost row
            return Math.max(targetRowTop - frozenRowsHeight, 0);
        } else if (targetRowBottom > viewBottom) {
            // The target row is downwards, so move offset so it's the bottommost column
            return targetRowBottom - canvasSize.height + gutterHeight;
        } else {
            // Otherwise, the target row must be in view, so no change is needed
            return oldY;
        }
    }

    /**
     * Calculates the area of the grid visible on the canvas
     */
    public static calculateVisibleRect = (gridOffset: Coord, canvasSize: Size): ClientRect => {
        return {
            top: gridOffset.y,
            bottom: gridOffset.y + canvasSize.height,
            height: canvasSize.height,
            left: gridOffset.x,
            right: gridOffset.x + canvasSize.width,
            width: canvasSize.width,
        };
    }

    public static isWindowPixelWithinComponent = (
        event: { clientX: number; clientY: number; },
        root: HTMLDivElement | null,
    ): boolean => {
        if (!root) {
            throw new Error('Cannot convert window coords to component coords because rootRef is not set');
        }
        const rootClientRect = root.getBoundingClientRect();
        return event.clientX >= rootClientRect.left && event.clientX <= rootClientRect.right &&
            event.clientY >= rootClientRect.top && event.clientY <= rootClientRect.bottom;
    }

    public static calculateComponentPixel = (
        event: { clientX: number; clientY: number; },
        root: HTMLDivElement | null,
    ): Coord => {
        return GridGeometry.windowPixelToComponentPixel({x: event.clientX, y: event.clientY }, root);
    }

    private static windowPixelToComponentPixel = ({x, y}: Coord, root: HTMLDivElement|null): Coord => {
        if (!root) {
            throw new Error('Cannot convert window coords to component coords because rootRef is not set');
        }
        const rootClientRect = root.getBoundingClientRect();
        return {
            x: x - rootClientRect.left,
            y: y - rootClientRect.top,
        };
    }

    private static windowPixelToGridPixel = ({x, y}: Coord, gridOffset: Coord, root: HTMLDivElement): Coord => {
        const rootClientRect = root.getBoundingClientRect();
        return {
            x: x + gridOffset.x - rootClientRect.left,
            y: y + gridOffset.y - rootClientRect.top,
        };
    }

    private static gridPixelToGridCell = (
        {x, y}: Coord,
        columnBoundaries: ColumnBoundary[],
        borderWidth: number,
        rowHeight: number,
        maxRow: number,
    ): Coord => {
        // Start with the rightmost col index; it'll be revised down, unless the coord is to the right of all cols
        let colIndex = columnBoundaries.length - 1;
        for (let i = 0; i < columnBoundaries.length; i++) {
            if (columnBoundaries[i].right > x) {
                colIndex = i;
                break;
            }
        }

        /*
        The following (dodgy?) algebra gives the formula for finding the row index, where borders belong to lower cells:
            Yclick <= (Ycell-1)b + (Ycell)c
            Yclick <= Ycell(b) - b + Ycell(c)
            Yclick <= Ycell(b + c) - b
            Yclick + b <= Ycell(b + c)
            (Yclick + b)/(b + c) <= Ycell
            Ycell >= (Yclick + b)/(b + c)
            Ycell = floor((Yclick + b)/(b + c))
        It's then truncated to maxRow, in case the coord is beyond the final row
        */
        const rowIndex = Math.min(maxRow, Math.floor((y + borderWidth) / (rowHeight + borderWidth)));

        return {
            y: rowIndex,
            x: colIndex,
        };
    }
}
