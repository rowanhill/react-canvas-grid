import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { FrozenCanvasProps, FrozenPreviousDrawInfo } from './FrozenCanvas';
import { MainCanvasProps, PreviousDrawInfo } from './MainCanvas';
import { CellDef, ColumnDef, Coord } from './types';

export class FrozenCanvasRenderer<T> extends CommonCanvasRenderer<T> {
    constructor(canvas: HTMLCanvasElement, dpr: number) {
        super(canvas, dpr, true);
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
}
