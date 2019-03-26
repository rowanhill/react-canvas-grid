import memoizeOne from 'memoize-one';
import { ReactCanvasGridProps } from './ReactCanvasGrid';
import { ColumnDef, Coord, Size } from './types';

export interface ColumnBoundary {
    /**
     * The left hand edge (inclusive) of the column (excluding border), in the sizer div's frame of reference
     */
    left: number;

    /**
     * The right hand edge (exclusive) of the column (excluding border), in the sizer div's frame of reference
     */
    right: number;
}

const memoizedCalcColumnBoundaries = memoizeOne((columns: ColumnDef[], borderWidth: number) => {
    let curLeft = 0;
    return columns.map((col) => {
        // Left is 0-indexed and inclusive. Right is exclusive, so we can just add the width
        const boundary = { left: curLeft, right: curLeft + col.width};
        // Add the border width on to skip it - the border is not within the range of any column
        curLeft += col.width + borderWidth;
        return boundary;
    });
});

export class GridGeometry {
    /**
     * Calculate the boundaries of all columns in the grid, excluding borders. The 'left's are inclusive,
     * the 'right's are exclusive.
     */
    public static calculateColumnBoundaries = (props: ReactCanvasGridProps<any>): ColumnBoundary[] => {
        return memoizedCalcColumnBoundaries(props.columns, props.borderWidth);
    }

    /**
     * Calculate the total size of the grid, including borders, etc
     */
    public static calculateGridSize = (props: ReactCanvasGridProps<any>): Size => {
        const numRows = props.data.length;
        const height = (numRows * props.rowHeight) + ((numRows - 1) * props.borderWidth);

        const columnBoundaries = GridGeometry.calculateColumnBoundaries(props);
        const width = columnBoundaries[columnBoundaries.length - 1].right;

        return { width, height };
    }

    /**
     * Calculate the largest amount of grid (including frozen cells) that could potentially be visible
     */
    public static calculateMaxViewSize = (
        props: ReactCanvasGridProps<any>,
        scrollParent: HTMLElement,
        screen: Screen = window.screen,
    ): Size => {
        const dataSize = GridGeometry.calculateGridSize(props);
        const scrollParentClientRect = GridGeometry.getScrollParentClientRect(scrollParent, screen);
        return {
            height: Math.min(dataSize.height, scrollParentClientRect.height, screen.availHeight),
            width: Math.min(dataSize.width, scrollParentClientRect.width, screen.availWidth),
        };
    }

    /**
     * Calculate the (unfrozen) portion of the grid that is currently visible. The result is in the sizer div's
     * frame of reference.
     */
    public static calculateViewRect = (
        props: ReactCanvasGridProps<any>,
        gridOffset: Coord,
        scrollParent: HTMLElement|null,
        sizer: HTMLDivElement,
        screen: Screen = window.screen,
    ): ClientRect => {
        const sizerClientRect = sizer.getBoundingClientRect();
        const scrollParentClientRect = GridGeometry.getScrollParentClientRect(scrollParent, screen);

        const frozenRowHeight = GridGeometry.calculateFrozenRowsHeight(props);
        const frozenColWidth = GridGeometry.calculateFrozenColsWidth(props);

        const bounds = {
            top: Math.max(sizerClientRect.top + gridOffset.y + frozenRowHeight, scrollParentClientRect.top, 0) -
                sizerClientRect.top,
            left: Math.max(sizerClientRect.left + gridOffset.x + frozenColWidth, scrollParentClientRect.left, 0) -
                sizerClientRect.left,
            bottom: Math.min(sizerClientRect.bottom, scrollParentClientRect.bottom, screen.availHeight) -
                sizerClientRect.top,
            right: Math.min(sizerClientRect.right, scrollParentClientRect.right, screen.availWidth) -
                sizerClientRect.left,
        };
        return { ...bounds, height: bounds.bottom - bounds.top, width: bounds.right - bounds.left };
    }

    /*
     * Calculate the height of all the frozen rows and their bottom borders
     */
    public static calculateFrozenRowsHeight = (props: ReactCanvasGridProps<any>): number => {
        return (props.rowHeight + props.borderWidth) * props.frozenRows;
    }

    /*
     * Calculate the width of all the frozen rows and their right borders
     */
    public static calculateFrozenColsWidth = (props: ReactCanvasGridProps<any>): number => {
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(props);
        const rightmostColIndex = props.frozenCols - 1;
        if (rightmostColIndex < 0) {
            return 0;
        }
        return columnBoundaries[rightmostColIndex].right + props.borderWidth;
    }

    /**
     * Calculate the coordinate of the top-left corner of the canvas in the grid's frame of reference
     */
    public static calculateGridOffset = (
        props: ReactCanvasGridProps<any>,
        scrollParent: HTMLElement,
        sizer: HTMLDivElement,
        screen: Screen = window.screen,
    ): Coord => {
        const canvasSize = GridGeometry.calculateMaxViewSize(props, scrollParent, screen);
        const sizerClientRect = sizer.getBoundingClientRect();
        const scrollParentClientRect = GridGeometry.getScrollParentClientRect(scrollParent, screen);

        const x = GridGeometry.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, canvasSize);
        const y = GridGeometry.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, canvasSize);

        return { x, y };
    }

    /**
     * Calculate the column & row index (i.e. "grid cell coordinates") that contains a click. The click coordinates
     * are given in the window/viewport's frame of reference.
     */
    public static calculateGridCellCoords = (
        event: {clientX: number, clientY: number},
        props: ReactCanvasGridProps<any>,
        sizer: HTMLDivElement,
    ): Coord => {
        return GridGeometry.gridPixelToGridCell(
            GridGeometry.windowPixelToGridPixel(
                {x: event.clientX, y: event.clientY},
                sizer,
            ),
            props,
        );
    }

    private static calcCanvasXOffset = (
        sizerClientRect: ClientRect,
        scrollParentClientRect: ClientRect,
        canvasSize: Size,
    ): number => {
        if (sizerClientRect.left >= scrollParentClientRect.left) {
            // The sizer is to the right of the left of the scroll parent, so no need to offset the canvas
            return 0;
        } else if (sizerClientRect.right <= scrollParentClientRect.right) {
            // The sizer is to the left of the right of the scroll parent, so offset the canvas to align the rights
            return sizerClientRect.width - canvasSize.width;
        } else {
            // The sizer spans across the scroll parent, so offset the canvas to align the lefts
            return scrollParentClientRect.left - sizerClientRect.left;
        }
    }

    private static calcCanvasYOffset = (
        sizerClientRect: ClientRect,
        scrollParentClientRect: ClientRect,
        canvasSize: Size,
    ): number => {
        if (sizerClientRect.top >= scrollParentClientRect.top) {
            // The sizer is below the top of the scroll parent, so no need to offset the canvas
            return 0;
        } else if (sizerClientRect.bottom <= scrollParentClientRect.bottom) {
            // The sizer is above the bottom of the scroll parent, so offset the canvas to align the bottoms
            return sizerClientRect.height - canvasSize.height;
        } else {
            // The sizer spans across the scroll parent, so offset the canvas to align the tops
            return scrollParentClientRect.top - sizerClientRect.top;
        }
    }

    private static windowPixelToGridPixel = ({x, y}: Coord, sizer: HTMLDivElement): Coord => {
        const sizerClientRect = sizer.getBoundingClientRect();
        return {
            x: x - sizerClientRect.left,
            y: y - sizerClientRect.top,
        };
    }

    private static gridPixelToGridCell = (
        {x, y}: Coord,
        props: ReactCanvasGridProps<any>,
    ): Coord => {
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(props);
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
        const rowIndex = Math.floor((y + props.borderWidth) / (props.rowHeight + props.borderWidth));

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
