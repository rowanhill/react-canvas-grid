import { BaseCanvasProps, PreviousDrawInfo } from './BaseCanvas';
import { Coord, CellDef, ColumnDef } from './types';

export class BaseCanvasRenderer<T> {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly dpr: number;

    constructor(canvas: HTMLCanvasElement, dpr: number) {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha: false });
        if (!context) {
            throw new Error('Could not create canvas contex')
        }
        this.context = context;
        this.dpr = dpr;
    }

    fixScale() {
        this.context.scale(this.dpr, this.dpr);
    }

    draw(props: BaseCanvasProps<T>, prevDraw: PreviousDrawInfo|null): PreviousDrawInfo {
        if (prevDraw) {
            // Translate according to difference from previous draw
            const xDiff = (prevDraw.gridOffset.x - props.gridOffset.x);
            const yDiff = (prevDraw.gridOffset.y - props.gridOffset.y);
            this.shiftExistingCanvas(xDiff, yDiff);
            this.drawNewBorderBackground(xDiff, yDiff, props.width, props.height);
        } else {
            this.drawWholeBorderBackground();
        }

        // Translate the canvas context so that it's covering the visibleRect
        this.translateToGridOffset(props.gridOffset);

        // Draw cells
        let colIndex = 0;
        const minRowIndex = Math.floor(props.visibleRect.top / (props.rowHeight + props.borderWidth));
        const maxRowIndex = Math.ceil(props.visibleRect.bottom / (props.rowHeight + props.borderWidth));
        for (let {left: cellLeft, right: cellRight} of props.colBoundaries) {
            if (cellRight < props.visibleRect.left) {
                // Cell is off screen to left, so skip this column
                colIndex++;
                continue;
            }
            if (cellLeft > props.visibleRect.right) {
                // Cell is off screen to right, so skip this and all future columns
                break;
            }
            const col = props.columns[colIndex];
            for (let rowIndex = minRowIndex; rowIndex < maxRowIndex; rowIndex++) {
                const row = props.data[rowIndex];
                const cell = row[col.fieldName];

                const cellBounds = {
                    left: cellLeft,
                    top: rowIndex * (props.rowHeight + props.borderWidth),
                    right: cellLeft + col.width,
                    bottom: (rowIndex + 1) * (props.rowHeight + props.borderWidth) - props.borderWidth,
                    width: col.width,
                    height: props.rowHeight
                };

                if (prevDraw &&
                    Math.max(cellLeft, props.visibleRect.left) >= prevDraw.rect.left &&
                    Math.min(cellRight, props.visibleRect.right) <= prevDraw.rect.right &&
                    Math.max(cellBounds.top, props.visibleRect.top) >= prevDraw.rect.top &&
                    Math.min(cellBounds.bottom, props.visibleRect.bottom) <= prevDraw.rect.bottom
                ) {
                    // Visible portion of cell is entirely contained within previously drawn region, so we can skip
                    continue;
                }

                this.drawCell(cell, cellBounds, col);
            }
            colIndex++;
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        this.translateToOrigin(props.gridOffset);

        // Remember what area is now drawn
        return {
            gridOffset: props.gridOffset,
            rect: {
                left: Math.max(props.gridOffset.x, props.visibleRect.left),
                top: Math.max(props.gridOffset.y, props.visibleRect.top),
                right: Math.min(props.gridOffset.x + props.width, props.visibleRect.right),
                bottom: Math.min(props.gridOffset.y + props.height, props.visibleRect.bottom)
            }
        };
    }

    translateToGridOffset(gridOffset: Coord) {
        this.context.translate(-gridOffset.x, -gridOffset.y);
    }

    translateToOrigin(gridOffset: Coord) {
        this.context.translate(gridOffset.x, gridOffset.y);
    }

    /*
     * Fill the entire canvas with the border colour
     */
    drawWholeBorderBackground() {
        // Draw base in border colour; cells will draw over this, leaving only the borders
        this.context.fillStyle = 'lightgrey';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /*
     * Copy the current image on the canvas back onto the canvas, shifted by the given delta
     */
    shiftExistingCanvas(xDiff: number, yDiff: number) {
        this.context.drawImage(
            this.canvas,
            0, 0, this.canvas.width * this.dpr, this.canvas.height * this.dpr,
            xDiff, yDiff, this.canvas.width, this.canvas.height
        );
    }

    /*
     * Fill with the border colour along any areas of the canvas that are 'new', i.e. need repainting
     * because they represent areas of the grid that have just become visible after a scroll
     */
    drawNewBorderBackground(xDiff: number, yDiff: number, propsWidth: number, propsHeight: number) {
        // Draw base in border colour in new areas; cells will draw over this, leaving only the borders
        // (Note, we might fill a corner twice if scrolling diagnally, but the perf cost seems minimal)
        this.context.fillStyle = 'lightgrey';
        if (yDiff < 0) {
            // Moved down - draw bottom
            const top = propsHeight + yDiff;
            const height = -yDiff;
            this.context.fillRect(0, top, this.canvas.width, height);
        } else if (yDiff > 0) {
            // Moved up - draw top
            const top = 0;
            const height = yDiff;
            this.context.fillRect(0, top, this.canvas.width, height);
        }
        if (xDiff < 0) {
            // Moved right - draw right
            const left = propsWidth + xDiff;
            const width = -xDiff;
            this.context.fillRect(left, 0, width, this.canvas.height);
        } else if (xDiff > 0) {
            // Moved left - draw left
            const left = 0;
            const width = xDiff;
            this.context.fillRect(left, 0, width, this.canvas.height);
        }
    }

    drawCell(cell: CellDef<T>, cellBounds: ClientRect, col: ColumnDef) {
        const renderBackground = cell.renderBackground || this.drawCellBackgroundDefault;
        const renderText = cell.renderText || this.drawCellTextDefault;

        renderBackground(this.context, cellBounds, cell, col);
        renderText(this.context, cellBounds, cell, col);
    }

    private drawCellBackgroundDefault = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CellDef<T>, column: ColumnDef) => {
        context.fillStyle = 'white';
        context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
    }

    private drawCellTextDefault = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: CellDef<T>, column: ColumnDef) => {
        context.fillStyle = 'black';
        context.fillText(cell.getText(), cellBounds.left + 2, cellBounds.top + 15, cellBounds.width - 4);
    }
}