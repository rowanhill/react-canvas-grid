import { FrozenCanvasProps, FrozenPreviousDrawInfo } from './FrozenCanvas';
import { MainCanvasProps, PreviousDrawInfo } from './MainCanvas';
import { CellDef, ColumnDef, Coord } from './types';

export class MainCanvasRenderer<T> {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly dpr: number;

    constructor(canvas: HTMLCanvasElement, dpr: number, alpha: boolean = false) {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha });
        if (!context) {
            throw new Error('Could not create canvas contex');
        }
        this.context = context;
        this.dpr = dpr;
    }

    public fixScale() {
        this.context.scale(this.dpr, this.dpr);
    }

    public draw(props: MainCanvasProps<T>, prevDraw: PreviousDrawInfo|null): PreviousDrawInfo {
        if (prevDraw) {
            // Translate according to difference from previous draw
            const xDiff = (prevDraw.gridOffset.x - props.gridOffset.x);
            const yDiff = (prevDraw.gridOffset.y - props.gridOffset.y);
            this.shiftExistingCanvas(xDiff, yDiff);
            this.drawNewBorderBackground(xDiff, yDiff, props.width, props.height);
        } else {
            this.drawWholeBorderBackground(props.width, props.height);
        }

        // Translate the canvas context so that it's covering the visibleRect
        this.translateToGridOffset(props.gridOffset);

        // Draw cells
        let colIndex = 0;
        const minRowIndex = Math.floor(props.visibleRect.top / (props.rowHeight + props.borderWidth));
        const maxRowIndex = Math.ceil(props.visibleRect.bottom / (props.rowHeight + props.borderWidth));
        for (const {left: cellLeft, right: cellRight} of props.colBoundaries) {
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
                    bottom: rowIndex * (props.rowHeight + props.borderWidth) + props.rowHeight,
                    width: col.width,
                    height: props.rowHeight,
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
                bottom: Math.min(props.gridOffset.y + props.height, props.visibleRect.bottom),
            },
        };
    }

    public drawFrozenCells(props: FrozenCanvasProps<T>, prevDraw: FrozenPreviousDrawInfo|null): FrozenPreviousDrawInfo {
        // Draw the background in border colour
        this.context.fillStyle = 'lightgrey';
        let rowAreaToPaint: ClientRect;
        let colAreaToPaint: ClientRect;
        if (!prevDraw) {
            // Draw the rows bg
            this.context.fillRect(0, 0, props.width, props.frozenRowsHeight);
            // Draw the cols bg, minus the overlap with rows
            const frozenColsHeight = props.height - props.frozenRowsHeight;
            this.context.fillRect(0, props.frozenRowsHeight, props.frozenColsWidth, frozenColsHeight);

            // Draw immobile cell(s) in top left
            for (let colIndex = 0; colIndex < props.frozenCols; colIndex++) {
                const col = props.columns[colIndex];
                const {left: cellLeft} = props.colBoundaries[colIndex];
                for (let rowIndex = 0; rowIndex < props.frozenRows; rowIndex++) {
                    const row = props.data[rowIndex];
                    const cell = row[col.fieldName];

                    const cellBounds = {
                        left: cellLeft,
                        top: rowIndex * (props.rowHeight + props.borderWidth),
                        right: cellLeft + col.width,
                        bottom: rowIndex * (props.rowHeight + props.borderWidth) + props.rowHeight,
                        width: col.width,
                        height: props.rowHeight,
                    };

                    this.drawCell(cell, cellBounds, col);
                }
            }

            // It's the first draw, so set the paint areas to the entire rects
            rowAreaToPaint = {
                left: props.frozenColsWidth + props.gridOffset.x, right: props.width + props.gridOffset.x,
                width: props.width - props.frozenColsWidth,
                top: props.gridOffset.y, bottom: props.frozenRowsHeight + props.gridOffset.y,
                height: props.frozenRowsHeight,
            };
            colAreaToPaint = {
                left: props.gridOffset.x, right: props.frozenColsWidth + props.gridOffset.x,
                width: props.frozenColsWidth,
                top: props.frozenRowsHeight + props.gridOffset.y, bottom: props.height + props.gridOffset.y,
                height: props.height - props.frozenRowsHeight,
            };
        } else {
            // Translate rows according to difference from previous draw
            const xDiff = (prevDraw.gridOffset.x - props.gridOffset.x);
            this.context.drawImage(
                this.canvas,
                // source rows from right of top-left immobile cell(s) plus the delta
                (props.frozenColsWidth - xDiff) * this.dpr, 0,
                (this.canvas.width - props.frozenColsWidth) * this.dpr, props.frozenRowsHeight * this.dpr,
                // destination to right of top-left immobile cell(s)
                props.frozenColsWidth, 0,
                this.canvas.width - props.frozenColsWidth, props.frozenRowsHeight,
            );

            // Fill the newly revealed part of the rows with border colour as background
            if (xDiff < 0) {
                // Moved right - draw right
                const left = props.width + xDiff;
                const width = -xDiff;
                this.context.fillRect(left, 0, width, props.frozenRowsHeight);

                rowAreaToPaint = {
                    left: left + props.gridOffset.x, width, right: left + width + props.gridOffset.x,
                    top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
                };
            } else if (xDiff > 0) {
                // Moved left - draw left
                const left = props.frozenColsWidth;
                const width = xDiff;
                this.context.fillRect(left, 0, width, props.frozenRowsHeight);

                rowAreaToPaint = {
                    left: left + props.gridOffset.x, width, right: left + width + props.gridOffset.x,
                    top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
                };
            } else {
                rowAreaToPaint = {
                    left: 0, width: 0, right: 0,
                    top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
                };
            }

            // Translate cols according to difference from previous draw
            const yDiff = (prevDraw.gridOffset.y - props.gridOffset.y);
            this.context.drawImage(
                this.canvas,
                // source rows from bottom of top-left immobile cell(s) plus the delta
                0, (props.frozenRowsHeight - yDiff) * this.dpr,
                props.frozenColsWidth * this.dpr, (this.canvas.height - props.frozenRowsHeight) * this.dpr ,
                // destination to bottom of top-left immobile cell(s)
                0, props.frozenRowsHeight,
                props.frozenColsWidth, this.canvas.height - props.frozenRowsHeight,
            );

            // Fill the newly revealed part of the cols with border colour as background
            if (yDiff < 0) {
                // Moved down - draw bottom
                const top = props.height + yDiff;
                const height = -yDiff;
                this.context.fillRect(0, top, props.frozenColsWidth, height);

                colAreaToPaint = {
                    top: top + props.gridOffset.y, height, bottom: top + height + props.gridOffset.y,
                    left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
                };
            } else if (yDiff > 0) {
                // Moved up - draw top
                const top = props.frozenRowsHeight;
                const height = yDiff;
                this.context.fillRect(0, top, props.frozenColsWidth, height);

                colAreaToPaint = {
                    top: top + props.gridOffset.y, height, bottom: top + height + props.gridOffset.y,
                    left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
                };
            } else {
                colAreaToPaint = {
                    top: 0, height: 0, bottom: 0,
                    left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
                };
            }
        }

        // Draw frozen rows
        this.context.save();
        this.context.beginPath();
        this.context.rect(props.frozenColsWidth, 0, props.width - props.frozenColsWidth, props.frozenRowsHeight);
        this.context.closePath();
        this.context.clip();
        this.context.translate(-props.gridOffset.x, 0);
        const visibleLeft = props.gridOffset.x + props.frozenColsWidth;
        const visibleRight = props.gridOffset.x + props.width;
        for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
            const {left: cellLeft, right: cellRight} = props.colBoundaries[colIndex];
            if (cellRight < visibleLeft) {
                // Cell is off screen to left, so skip this column
                continue;
            }
            if (cellLeft > visibleRight) {
                // Cell is off screen to right, so skip this and all future columns
                break;
            }
            const col = props.columns[colIndex];
            for (let rowIndex = 0; rowIndex < props.frozenRows; rowIndex++) {
                const row = props.data[rowIndex];
                const cell = row[col.fieldName];

                const cellBounds = {
                    left: cellLeft,
                    top: rowIndex * (props.rowHeight + props.borderWidth),
                    right: cellLeft + col.width,
                    bottom: rowIndex * (props.rowHeight + props.borderWidth) + props.rowHeight,
                    width: col.width,
                    height: props.rowHeight,
                };

                if (cellBounds.left < rowAreaToPaint.right &&
                    cellBounds.right > rowAreaToPaint.left &&
                    cellBounds.top < rowAreaToPaint.bottom &&
                    cellBounds.bottom > rowAreaToPaint.top
                ) {
                    // Cell overlaps with redraw area, so needs drawing
                    this.drawCell(cell, cellBounds, col);
                }
            }
        }
        this.context.restore();

        // Draw frozen cols
        this.context.save();
        this.context.beginPath();
        this.context.rect(0, props.frozenRowsHeight, props.frozenColsWidth, props.height - props.frozenRowsHeight);
        this.context.closePath();
        this.context.clip();
        this.context.translate(0, -props.gridOffset.y);
        const visibleTop = props.gridOffset.y + props.frozenRowsHeight;
        const visibleBottom = props.gridOffset.y + props.height;
        const minRowIndex = Math.floor(visibleTop / (props.rowHeight + props.borderWidth));
        const maxRowIndex = Math.ceil(visibleBottom / (props.rowHeight + props.borderWidth));
        for (let colIndex = 0; colIndex < props.frozenCols; colIndex++) {
            const col = props.columns[colIndex];
            const {left: cellLeft} = props.colBoundaries[colIndex];
            for (let rowIndex = minRowIndex; rowIndex < maxRowIndex; rowIndex++) {
                const row = props.data[rowIndex];
                const cell = row[col.fieldName];

                const cellBounds = {
                    left: cellLeft,
                    top: rowIndex * (props.rowHeight + props.borderWidth),
                    right: cellLeft + col.width,
                    bottom: rowIndex * (props.rowHeight + props.borderWidth) + props.rowHeight,
                    width: col.width,
                    height: props.rowHeight,
                };

                if (cellBounds.left < colAreaToPaint.right &&
                    cellBounds.right > colAreaToPaint.left &&
                    cellBounds.top < colAreaToPaint.bottom &&
                    cellBounds.bottom > colAreaToPaint.top
                ) {
                    // Cell overlaps with redraw area, so needs drawing
                    this.drawCell(cell, cellBounds, col);
                }
            }
        }
        this.context.restore();

        return { gridOffset: props.gridOffset };
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
        this.context.fillStyle = 'lightgrey';
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
        this.context.fillStyle = 'lightgrey';
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

    public drawCell(cell: CellDef<T>, cellBounds: ClientRect, col: ColumnDef) {
        const renderBackground = cell.renderBackground || this.drawCellBackgroundDefault;
        const renderText = cell.renderText || this.drawCellTextDefault;

        renderBackground(this.context, cellBounds, cell, col);
        renderText(this.context, cellBounds, cell, col);
    }

    private drawCellBackgroundDefault = (
        context: CanvasRenderingContext2D,
        cellBounds: ClientRect,
        cell: CellDef<T>,
        column: ColumnDef,
    ) => {
        context.fillStyle = 'white';
        context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
    }

    private drawCellTextDefault = (
        context: CanvasRenderingContext2D,
        cellBounds: ClientRect,
        cell: CellDef<T>,
        column: ColumnDef,
    ) => {
        context.fillStyle = 'black';
        context.fillText(cell.getText(), cellBounds.left + 2, cellBounds.top + 15, cellBounds.width - 4);
    }
}
