import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { FrozenCanvasProps, FrozenPreviousDrawInfo } from './FrozenCanvas';

export class FrozenCanvasRenderer<T> extends CommonCanvasRenderer<T> {
    constructor(canvas: HTMLCanvasElement, dpr: number) {
        super(canvas, dpr, true);
    }

    public drawFrozenCells(props: FrozenCanvasProps<T>, prevDraw: FrozenPreviousDrawInfo|null): FrozenPreviousDrawInfo {
        let rowAreaToPaint: ClientRect|null;
        let colAreaToPaint: ClientRect|null;
        if (!prevDraw) {
            // It's the first draw, the entire area is 'invalidated'
            rowAreaToPaint = {
                left: 0, right: props.width, width: props.width,
                top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
            };
            colAreaToPaint = {
                left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
                top: props.frozenRowsHeight, bottom: props.height, height: props.height - props.frozenRowsHeight,
            };

            // Fill the background with border colour
            this.drawInvalidatedAreaBackground(rowAreaToPaint, colAreaToPaint);

            // Draw immobile cell(s) in top left; these will not be redrawn (or overdrawn) when scrolling
            this.drawTopLeftCells(props);
        } else {
            const xDiff = (prevDraw.gridOffset.x - props.gridOffset.x);
            const yDiff = (prevDraw.gridOffset.y - props.gridOffset.y);

            // Translate rows and cols according to difference from previous draw
            this.shiftRowsHorizontally(props, xDiff);
            this.shiftColsVertically(props, yDiff);

            // Work out the rects that have been revealed since the last drawn
            rowAreaToPaint = this.calculateInvalidatedAreaRows(props, xDiff);
            colAreaToPaint = this.calculateInvalidatedAreaCols(props, yDiff);

            // Fill the newly revealed part of the rows and cols with border colour as background
            this.drawInvalidatedAreaBackground(rowAreaToPaint, colAreaToPaint);
        }

        // Draw frozen rows
        this.drawInvalidatedCellsRows(props, rowAreaToPaint);

        // Draw frozen cols
        this.drawInvalidatedCellsCols(props, colAreaToPaint);

        return { gridOffset: props.gridOffset };
    }

    public drawInvalidatedAreaBackground(rowAreaToPaint: ClientRect|null, colAreaToPaint: ClientRect|null) {
        this.context.fillStyle = 'lightgrey';
        if (rowAreaToPaint) {
            this.context.fillRect(
                rowAreaToPaint.left,
                rowAreaToPaint.top,
                rowAreaToPaint.width,
                rowAreaToPaint.height,
            );
        }
        if (colAreaToPaint) {
            this.context.fillRect(
                colAreaToPaint.left,
                colAreaToPaint.top,
                colAreaToPaint.width,
                colAreaToPaint.height,
            );
        }
    }

    public shiftRowsHorizontally(props: FrozenCanvasProps<T>, xDiff: number) {
        this.context.drawImage(
            this.canvas,
            // source rows from right of top-left immobile cell(s) plus the delta
            (props.frozenColsWidth - xDiff) * this.dpr, 0,
            (this.canvas.width - props.frozenColsWidth) * this.dpr, props.frozenRowsHeight * this.dpr,
            // destination to right of top-left immobile cell(s)
            props.frozenColsWidth, 0,
            this.canvas.width - props.frozenColsWidth, props.frozenRowsHeight,
        );
    }

    public shiftColsVertically(props: FrozenCanvasProps<T>, yDiff: number) {
        this.context.drawImage(
            this.canvas,
            // source rows from bottom of top-left immobile cell(s) plus the delta
            0, (props.frozenRowsHeight - yDiff) * this.dpr,
            props.frozenColsWidth * this.dpr, (this.canvas.height - props.frozenRowsHeight) * this.dpr ,
            // destination to bottom of top-left immobile cell(s)
            0, props.frozenRowsHeight,
            props.frozenColsWidth, this.canvas.height - props.frozenRowsHeight,
        );
    }

    public calculateInvalidatedAreaRows(props: FrozenCanvasProps<T>, xDiff: number): ClientRect|null {
        if (xDiff < 0) {
            // Moved right - draw right
            const left = props.width + xDiff;
            const width = -xDiff;
            return {
                left, width, right: left + width,
                top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
            };
        } else if (xDiff > 0) {
            // Moved left - draw left
            const left = props.frozenColsWidth;
            const width = xDiff;
            return {
                left, width, right: left + width,
                top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
            };
        } else {
            // Didn't move horiztonally - no area to invalidate
            return null;
        }
    }

    public calculateInvalidatedAreaCols(props: FrozenCanvasProps<T>, yDiff: number): ClientRect|null {
        if (yDiff < 0) {
            // Moved down - draw bottom
            const top = props.height + yDiff;
            const height = -yDiff;
            return {
                top, height, bottom: top + height,
                left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
            };
        } else if (yDiff > 0) {
            // Moved up - draw top
            const top = props.frozenRowsHeight;
            const height = yDiff;
            return {
                top, height, bottom: top + height,
                left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
            };
        } else {
            // Didn't move vertically - no area to invalidate
            return null;
        }
    }

    public drawTopLeftCells(props: FrozenCanvasProps<T>) {
        for (let colIndex = 0; colIndex < props.frozenCols; colIndex++) {
            const col = props.columns[colIndex];
            for (let rowIndex = 0; rowIndex < props.frozenRows; rowIndex++) {
                const cellBounds = calculateCellBounds(props, rowIndex, colIndex);

                const row = props.data[rowIndex];
                const cell = row[col.fieldName];
                this.drawCell(cell, cellBounds, col);
            }
        }
    }

    public drawInvalidatedCellsRows(props: FrozenCanvasProps<T>, rowAreaToPaint: ClientRect|null) {
        this.context.save();

        // Set the clip area to the frozen rows part of the canvas
        this.context.beginPath();
        this.context.rect(props.frozenColsWidth, 0, props.width - props.frozenColsWidth, props.frozenRowsHeight);
        this.context.closePath();
        this.context.clip();

        // Translate the context (and invalidated rect) to go from canvas coords to grid coords
        this.context.translate(-props.gridOffset.x, 0);
        if (rowAreaToPaint) {
            rowAreaToPaint = translateRectX(rowAreaToPaint, props.gridOffset.x);
        }

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
                const cellBounds = calculateCellBounds(props, rowIndex, colIndex);

                if (!rowAreaToPaint || rectsInsersect(cellBounds, rowAreaToPaint)) {
                    // Cell overlaps with redraw area, so needs drawing
                    const row = props.data[rowIndex];
                    const cell = row[col.fieldName];

                    this.drawCell(cell, cellBounds, col);
                }
            }
        }

        this.context.restore();
    }

    public drawInvalidatedCellsCols(props: FrozenCanvasProps<T>, colAreaToPaint: ClientRect|null) {
        this.context.save();

        // Set the clip area to the frozen cols part of the canvas
        this.context.beginPath();
        this.context.rect(0, props.frozenRowsHeight, props.frozenColsWidth, props.height - props.frozenRowsHeight);
        this.context.closePath();
        this.context.clip();

        // Translate the context (and invalidated rect) to go from canvas coords to grid coords
        this.context.translate(0, -props.gridOffset.y);
        if (colAreaToPaint) {
            colAreaToPaint = translateRectY(colAreaToPaint, props.gridOffset.y);
        }

        const visibleTop = props.gridOffset.y + props.frozenRowsHeight;
        const visibleBottom = props.gridOffset.y + props.height;
        const minRowIndex = Math.floor(visibleTop / (props.rowHeight + props.borderWidth));
        const maxRowIndex = Math.ceil(visibleBottom / (props.rowHeight + props.borderWidth));
        for (let colIndex = 0; colIndex < props.frozenCols; colIndex++) {
            const col = props.columns[colIndex];
            for (let rowIndex = minRowIndex; rowIndex < maxRowIndex; rowIndex++) {
                const cellBounds = calculateCellBounds(props, rowIndex, colIndex);

                if (!colAreaToPaint || rectsInsersect(cellBounds, colAreaToPaint)) {
                    // Cell overlaps with redraw area, so needs drawing
                    const row = props.data[rowIndex];
                    const cell = row[col.fieldName];

                    this.drawCell(cell, cellBounds, col);
                }
            }
        }

        this.context.restore();
    }
}

function calculateCellBounds(props: FrozenCanvasProps<any>, rowIndex: number, colIndex: number) {
    const col = props.columns[colIndex];
    const {left: cellLeft} = props.colBoundaries[colIndex];
    return {
        left: cellLeft,
        top: rowIndex * (props.rowHeight + props.borderWidth),
        right: cellLeft + col.width,
        bottom: rowIndex * (props.rowHeight + props.borderWidth) + props.rowHeight,
        width: col.width,
        height: props.rowHeight,
    };
}

function rectsInsersect(rect1: ClientRect, rect2: ClientRect) {
    return rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top;
}

function translateRectX(rect: ClientRect, x: number): ClientRect {
    return {
        ...rect,
        left: rect.left + x,
        right: rect.right + x,
    };
}

function translateRectY(rect: ClientRect, y: number): ClientRect {
    return {
        ...rect,
        top: rect.top + y,
        bottom: rect.bottom + y,
    };
}
