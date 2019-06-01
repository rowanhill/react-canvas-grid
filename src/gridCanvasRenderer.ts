import shallowEqual from 'shallow-equals';
import { borderColour, CommonCanvasRenderer } from './commonCanvasRenderer';
import { Bounds, ColumnDef, Coord, DataRow, Size } from './types';

export interface GridCanvasRendererBasics<T> {
    data: Array<DataRow<T>>;
    rowHeight: number;
    colBoundaries: Array<{left: number; right: number}>;
    columns: ColumnDef[];
    gridInnerSize: Size;
    borderWidth: number;
}

export interface GridCanvasRendererPosition {
    gridOffset: Coord;
    visibleRect: ClientRect;
}

interface PreviousDrawInfo {
    gridOffset: Coord;
    rect: Bounds;
}

const defaultPosProps = {
    gridOffset: { x: 0, y: 0 },
    visibleRect: { left: 0, top: 0, right: 0, bottom: 0, height: 0, width: 0 },
};

export class GridCanvasRenderer<T> extends CommonCanvasRenderer<T> {
    private canvasSize: Size;
    private basicProps: GridCanvasRendererBasics<T>;
    private posProps: GridCanvasRendererPosition = defaultPosProps;
    private prevDraw: PreviousDrawInfo|null = null;

    constructor(canvas: HTMLCanvasElement, canvasSize: Size, basicProps: GridCanvasRendererBasics<T>, dpr: number) {
        super(canvas, dpr, false);
        this.canvasSize = canvasSize;
        this.basicProps = basicProps;
    }

    public updateProps = (
        canvasSize: Size,
        basicProps: GridCanvasRendererBasics<T>,
        posProps: GridCanvasRendererPosition,
    ) => {
        if (!shallowEqual(this.canvasSize, canvasSize) || !shallowEqual(this.basicProps, basicProps)) {
            this.prevDraw = null;
        }
        this.canvasSize = canvasSize;
        this.basicProps = basicProps;
        this.posProps = posProps;
        this.drawScaled(this.draw);
    }

    public draw = () => {
        const prevDraw = this.prevDraw;
        const basicProps = this.basicProps;
        const posProps = this.posProps;
        if (prevDraw) {
            // Translate according to difference from previous draw
            const xDiff = (prevDraw.gridOffset.x - posProps.gridOffset.x);
            const yDiff = (prevDraw.gridOffset.y - posProps.gridOffset.y);
            this.shiftExistingCanvas(xDiff, yDiff);
            this.drawNewBorderBackground(xDiff, yDiff, this.canvasSize.width, this.canvasSize.height);
        } else {
            this.drawWholeBorderBackground(this.canvasSize.width, this.canvasSize.height);
        }

        // Translate the canvas context so that it's covering the visibleRect
        this.translateToGridOffset(posProps.gridOffset);

        // Draw cells
        let colIndex = 0;
        const minRowIndex = Math.floor(posProps.visibleRect.top / (basicProps.rowHeight + basicProps.borderWidth));
        const maxRowIndex = Math.min(
            Math.ceil(posProps.visibleRect.bottom / (basicProps.rowHeight + basicProps.borderWidth)),
            basicProps.gridInnerSize.height / (basicProps.rowHeight + basicProps.borderWidth),
        );
        for (const {left: cellLeft, right: cellRight} of basicProps.colBoundaries) {
            if (cellRight < posProps.visibleRect.left) {
                // Cell is off screen to left, so skip this column
                colIndex++;
                continue;
            }
            if (cellLeft > posProps.visibleRect.right) {
                // Cell is off screen to right, so skip this and all future columns
                break;
            }
            const col = basicProps.columns[colIndex];
            for (let rowIndex = minRowIndex; rowIndex < maxRowIndex; rowIndex++) {
                const row = basicProps.data[rowIndex];
                const cell = row[col.fieldName];

                const cellBounds = {
                    left: cellLeft,
                    top: rowIndex * (basicProps.rowHeight + basicProps.borderWidth),
                    right: cellLeft + col.width,
                    bottom: rowIndex * (basicProps.rowHeight + basicProps.borderWidth) + basicProps.rowHeight,
                    width: col.width,
                    height: basicProps.rowHeight,
                };

                if (prevDraw &&
                    Math.max(cellLeft, posProps.visibleRect.left) >= prevDraw.rect.left &&
                    Math.min(cellRight, posProps.visibleRect.right) <= prevDraw.rect.right &&
                    Math.max(cellBounds.top, posProps.visibleRect.top) >= prevDraw.rect.top &&
                    Math.min(cellBounds.bottom, posProps.visibleRect.bottom) <= prevDraw.rect.bottom
                ) {
                    // Visible portion of cell is entirely contained within previously drawn region, so we can skip
                    continue;
                }

                this.drawCell(cell, cellBounds, {column: col, rowIndex, colIndex});
            }
            colIndex++;
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        this.translateToOrigin(posProps.gridOffset);

        // Remember what area is now drawn
        this.prevDraw = {
            gridOffset: posProps.gridOffset,
            rect: {
                left: Math.max(posProps.gridOffset.x, posProps.visibleRect.left),
                top: Math.max(posProps.gridOffset.y, posProps.visibleRect.top),
                right: Math.min(posProps.gridOffset.x + this.canvasSize.width, posProps.visibleRect.right),
                bottom: Math.min(posProps.gridOffset.y + this.canvasSize.height, posProps.visibleRect.bottom),
            },
        };
    }

    public translateToGridOffset(gridOffset: Coord) {
        this.context.translate(-gridOffset.x, -gridOffset.y);
    }

    public translateToOrigin(gridOffset: Coord) {
        this.context.translate(gridOffset.x, gridOffset.y);
    }

    /*
     * Fill the entire canvas with the border colour
     */
    public drawWholeBorderBackground(propsWidth: number, propsHeight: number) {
        // Draw base in border colour; cells will draw over this, leaving only the borders
        this.context.fillStyle = borderColour;
        this.context.fillRect(0, 0, propsWidth, propsHeight);
    }

    /*
     * Copy the current image on the canvas back onto the canvas, shifted by the given delta
     */
    public shiftExistingCanvas(xDiff: number, yDiff: number) {
        this.context.drawImage(
            this.canvas,
            0, 0, this.canvas.width * this.dpr, this.canvas.height * this.dpr,
            xDiff, yDiff, this.canvas.width, this.canvas.height,
        );
    }

    /*
     * Fill with the border colour along any areas of the canvas that are 'new', i.e. need repainting
     * because they represent areas of the grid that have just become visible after a scroll
     */
    public drawNewBorderBackground(xDiff: number, yDiff: number, propsWidth: number, propsHeight: number) {
        // Draw base in border colour in new areas; cells will draw over this, leaving only the borders
        // (Note, we might fill a corner twice if scrolling diagnally, but the perf cost seems minimal)
        this.context.fillStyle = borderColour;
        if (yDiff < 0) {
            // Moved down - draw bottom
            const top = propsHeight + yDiff;
            const height = -yDiff;
            this.context.fillRect(0, top, propsWidth, height);
        } else if (yDiff > 0) {
            // Moved up - draw top
            const top = 0;
            const height = yDiff;
            this.context.fillRect(0, top, propsWidth, height);
        }
        if (xDiff < 0) {
            // Moved right - draw right
            const left = propsWidth + xDiff;
            const width = -xDiff;
            this.context.fillRect(left, 0, width, propsHeight);
        } else if (xDiff > 0) {
            // Moved left - draw left
            const left = 0;
            const width = xDiff;
            this.context.fillRect(left, 0, width, propsHeight);
        }
    }
}
