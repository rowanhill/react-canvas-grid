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

        // Draw white base
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        context.translate(-this.props.gridOffset.x, -this.props.gridOffset.y);

        context.strokeStyle = 'lightgrey';
        context.lineWidth = 1;
        context.beginPath();

        // Draw column separator lines
        this.props.colBoundaries
            .filter(boundaries => boundaries.left >= this.props.visibleRect.left && boundaries.left <= this.props.visibleRect.right)
            .forEach(boundaries => {
                context.moveTo(boundaries.left, this.props.visibleRect.top);
                context.lineTo(boundaries.left, this.props.visibleRect.bottom);
            });

        // Draw row separator lines
        for (let y = this.props.rowHeight; y < this.props.gridHeight; y += this.props.rowHeight) {
            if (y >= this.props.visibleRect.top && y <= this.props.visibleRect.bottom) {
                context.moveTo(this.props.visibleRect.left, y);
                context.lineTo(this.props.visibleRect.right, y);
            }
        }

        context.stroke();

        // Draw cell text
        context.fillStyle = 'black';
        let colIndex = 0;
        for (let {left: cellLeft, right: cellRight} of this.props.colBoundaries) {
            const col = this.props.columns[colIndex];
            if (cellRight >= this.props.visibleRect.left && cellLeft <= this.props.visibleRect.right) {
                for (let rowIndex = Math.floor(this.props.visibleRect.top / this.props.rowHeight); rowIndex < this.props.data.length; rowIndex++) {
                    const row = this.props.data[rowIndex];
                    const cell = row[col.fieldName];
                    context.fillText(cell.getText(), cellLeft + 2, (rowIndex * this.props.rowHeight + 15), col.width - 2);
                }
            }
            cellLeft += col.width;
            colIndex++;
            if (cellLeft > this.props.visibleRect.right) {
                break;
            }
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.props.gridOffset.x, this.props.gridOffset.y);
    }
}