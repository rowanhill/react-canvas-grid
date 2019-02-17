import * as React from 'react';
import { CellDef, DataRow, ColumnDef, Coord } from './types';

export interface BaseCanvasProps<T extends CellDef> {
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

export class BaseCanvas<T extends CellDef> extends React.Component<BaseCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;

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
                    height: `${this.props.height}px`
                }}
            />
        );
    };

    componentDidUpdate() {
        // Fix the scale if we haven't already.
        // (Note, we can't do this in componentDidMount for some reason - perhaps because the canvas mounts
        //  with a zero size?)
        if (!this.hasFixedScale) {
            const ctx = this.canvasRef.current!.getContext('2d');
            ctx!.scale(dpr, dpr);
            this.hasFixedScale = true;
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

        // Draw base in border colour; cells will draw over this, leaving only the borders
        context.fillStyle = 'lightgrey';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        context.translate(-this.props.gridOffset.x, -this.props.gridOffset.y);

        // Draw cells
        let colIndex = 0;
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
            for (let rowIndex = Math.floor(this.props.visibleRect.top / (this.props.rowHeight + this.props.borderWidth)); rowIndex < this.props.data.length; rowIndex++) {
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

                this.drawCellBackgroundDefault(context, cellBounds, cell, col);
                this.drawCellTextDefault(context, cellBounds, cell, col);
            }
            colIndex++;
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.props.gridOffset.x, this.props.gridOffset.y);
    }

    private drawCellBackgroundDefault = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: T, column: ColumnDef) => {
        context.fillStyle = 'white';
        context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
    }

    private drawCellTextDefault = (context: CanvasRenderingContext2D, cellBounds: ClientRect, cell: T, column: ColumnDef) => {
        context.fillStyle = 'black';
        context.fillText(cell.getText(), cellBounds.left + 2, cellBounds.top + 15, cellBounds.width - 4);
    }
}