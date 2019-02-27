import * as React from 'react';
import { CellDef, DataRow, ColumnDef, Coord } from './types';

export interface BaseCanvasProps<T> {
    data: DataRow<T>[];
    width: number;
    height: number;
    visibleRect: ClientRect;
    gridOffset: Coord;
    rowHeight: number;
    colBoundaries: {left: number; right: number}[];
    columns: ColumnDef[];
    gridHeight: number;
    borderWidth: number;
}

const dpr =  window.devicePixelRatio;

export class BaseCanvas<T> extends React.Component<BaseCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;
    private prevDraw: {
        gridOffset: Coord;
        rect: { top: number; left: number; right: number; bottom: number };
    }|null = null;

    constructor(props: BaseCanvasProps<T>) {
        super(props);
    }

    render() {
        return (
            <canvas
                ref={this.canvasRef}
                width={this.props.width * dpr}
                height={this.props.height * dpr}
                style={{
                    position: 'absolute',
                    width: `${this.props.width}px`,
                    height: `${this.props.height}px`,
                    top: 0,
                    left: 0,
                }}
            />
        );
    };

    componentDidUpdate(prevProps: BaseCanvasProps<T>) {
        // Fix the scale if we haven't already.
        // (Note, we can't do this in componentDidMount for some reason - perhaps because the canvas mounts
        //  with a zero size?)
        if (!this.hasFixedScale) {
            const ctx = this.canvasRef.current!.getContext('2d');
            ctx!.scale(dpr, dpr);
            this.hasFixedScale = true;
        }

        // If anything that affects the grid other than the gridOffset / visibleRect has changed
        // then invalidate the previously drawn region
        for (const key of Object.keys(this.props) as (keyof BaseCanvasProps<T>)[]) {
            if (key === 'gridOffset' || key === 'visibleRect') {
                continue;
            }
            if (this.props[key] !== prevProps[key]) {
                this.prevDraw = null;
                break;
            }
        }

        this.draw();
    }

    private draw = () => {
        if (!this.canvasRef.current) {
            return;
        }
        const canvas = this.canvasRef.current;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
            return;
        }

        if (this.prevDraw) {
            // Translate according to difference from previous draw
            const xDiff = (this.prevDraw.gridOffset.x - this.props.gridOffset.x);
            const yDiff = (this.prevDraw.gridOffset.y - this.props.gridOffset.y);
            context.drawImage(canvas,
                0, 0, canvas.width * dpr, canvas.height * dpr,
                xDiff, yDiff, canvas.width, canvas.height
                );

            // Draw base in border colour in new areas; cells will draw over this, leaving only the borders
            // (Note, we might fill a corner twice if scrolling diagnally, but the perf cost seems minimal)
            context.fillStyle = 'lightgrey';
            if (yDiff < 0) {
                // Moved down - draw bottom
                const top = this.prevDraw.rect.bottom - this.props.gridOffset.y;
                const height = -yDiff;
                context.fillRect(0, top, canvas.width, height);
            } else if (yDiff > 0) {
                // Moved up - draw top
                const top = 0;
                const height = yDiff;
                context.fillRect(0, top, canvas.width, height);
            }
            if (xDiff < 0) {
                // Moved right - draw right
                const left = this.props.width + xDiff;
                const width = -xDiff;
                context.fillRect(left, 0, width, canvas.height);
            } else if (xDiff > 0) {
                // Moved left - draw left
                const left = 0;
                const width = xDiff;
                context.fillRect(left, 0, width, canvas.height);
            }
        } else {
            // Draw base in border colour; cells will draw over this, leaving only the borders
            context.fillStyle = 'lightgrey';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        context.translate(-this.props.gridOffset.x, -this.props.gridOffset.y);

        // Draw cells
        let colIndex = 0;
        const minRowIndex = Math.floor(this.props.visibleRect.top / (this.props.rowHeight + this.props.borderWidth));
        const maxRowIndex = Math.ceil(this.props.visibleRect.bottom / (this.props.rowHeight + this.props.borderWidth));
        for (let {left: cellLeft, right: cellRight} of this.props.colBoundaries) {
            if (cellRight < this.props.visibleRect.left) {
                // Cell is off screen to left, so skip this column
                colIndex++;
                continue;
            }
            if (cellLeft > this.props.visibleRect.right) {
                // Cell is off screen to right, so skip this and all future columns
                break;
            }
            const col = this.props.columns[colIndex];
            for (let rowIndex = minRowIndex; rowIndex < maxRowIndex; rowIndex++) {
                const row = this.props.data[rowIndex];
                const cell = row[col.fieldName];

                const cellBounds = {
                    left: cellLeft,
                    top: rowIndex * (this.props.rowHeight + this.props.borderWidth),
                    right: cellLeft + col.width,
                    bottom: (rowIndex + 1) * (this.props.rowHeight + this.props.borderWidth) - this.props.borderWidth,
                    width: col.width,
                    height: this.props.rowHeight
                };

                if (this.prevDraw &&
                    cellLeft >= this.prevDraw.rect.left && cellRight <= this.prevDraw.rect.right &&
                    cellBounds.top >= this.prevDraw.rect.top && cellBounds.bottom <= this.prevDraw.rect.bottom
                ) {
                    // Cell is entirely contained within previously drawn region, so we can skip
                    continue;
                }

                const renderBackground = cell.renderBackground || this.drawCellBackgroundDefault;
                const renderText = cell.renderText || this.drawCellTextDefault;

                renderBackground(context, cellBounds, cell, col);
                renderText(context, cellBounds, cell, col);
            }
            colIndex++;
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.props.gridOffset.x, this.props.gridOffset.y);

        // Remember what area is now drawn
        this.prevDraw = {
            gridOffset: this.props.gridOffset,
            rect: {
                left: Math.max(this.props.gridOffset.x, this.props.visibleRect.left),
                top: Math.max(this.props.gridOffset.y, this.props.visibleRect.top),
                right: Math.min(this.props.gridOffset.x + this.props.width, this.props.visibleRect.right),
                bottom: Math.min(this.props.gridOffset.y + this.props.height, this.props.visibleRect.bottom)
            }
        };
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