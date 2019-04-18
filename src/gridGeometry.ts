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
     * Calculate the total size of the grid, including borders, etc
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

    public static calculateCanvasSize = (gridSize: Size, rootSize: Size|null): Size => {
        // First render is before componentDidMount, so before we have calculated the root element's size.
        // In this case, we just render as 0x0. componentDidMount will then update state,
        // and we'll re-render
        if (rootSize === null) {
            return { width: 0, height: 0 };
        }
        return {
            width: Math.min(rootSize.width, gridSize.width),
            height: Math.min(rootSize.height, gridSize.height),
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
        root: HTMLDivElement,
    ): Coord => {
        return GridGeometry.gridPixelToGridCell(
            GridGeometry.windowPixelToGridPixel(
                {x: event.clientX, y: event.clientY},
                gridOffset,
                root,
            ),
            columnBoundaries,
            borderWidth,
            rowHeight,
        );
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

    public static windowPixelToCanvasPixel = ({x, y}: Coord, root: HTMLDivElement): Coord => {
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
    ): Coord => {
        let colIndex = -1;
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
        */
        const rowIndex = Math.floor((y + borderWidth) / (rowHeight + borderWidth));

        return {
            y: rowIndex,
            x: colIndex,
        };
    }

    private static getScrollParentClientRect = (scrollParent: HTMLElement|null, screen: Screen): ClientRect => {
        if (!scrollParent) {
            throw new Error('Cannot get scroll parent client rect: scrollParent not set');
        }
        if (scrollParent === document.body) {
            return {
                top: 0,
                height: screen.availHeight,
                bottom: screen.availHeight,
                left: 0,
                width: screen.availWidth,
                right: screen.availWidth,
            };
        } else {
            return scrollParent.getBoundingClientRect();
        }
    }
}
