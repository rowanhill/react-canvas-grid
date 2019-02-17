import * as React from 'react';
import { CellDef, DataRow, ColumnDef, Coord } from './types';
import { SelectRange } from '.';

export interface HighlightCanvasProps {
    width: number;
    height: number;
    rowHeight: number;
    gridOffset: Coord;
    colBoundaries: {left: number; right: number}[];
    selectedRange: SelectRange|null;
    borderWidth: number;
}

const dpr =  window.devicePixelRatio;

export class HighlightCanvas extends React.Component<HighlightCanvasProps, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;

    constructor(props: HighlightCanvasProps) {
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

        const context = canvas.getContext('2d', { alpha: true });
        if (!context) {
            return;
        }

        // Clear the higlight layer
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        context.translate(-this.props.gridOffset.x, -this.props.gridOffset.y);
        
        // Draw selected cell highlights
        context.fillStyle = '#44aaff55';
        context.strokeStyle = '#44aaffcc';
        if (this.props.selectedRange) {
            const tl = this.gridToSizer(this.props.selectedRange.topLeft);
            const br = this.gridToSizer(this.props.selectedRange.bottomRight);
            context.fillRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
            context.strokeRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.props.gridOffset.x, this.props.gridOffset.y);
    }

    private gridToSizer = ({x, y}: {x: number; y: number}): ClientRect => {
        return {
            top: y * (this.props.rowHeight + this.props.borderWidth),
            bottom: (y + 1) * (this.props.rowHeight + + this.props.borderWidth) - this.props.borderWidth,
            height: this.props.rowHeight,
            left: this.props.colBoundaries[x].left,
            right: this.props.colBoundaries[x].right,
            width: this.props.colBoundaries[x].right - this.props.colBoundaries[x].left
        };
    }
}