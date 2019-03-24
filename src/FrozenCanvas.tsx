import * as React from 'react';
import { FrozenCanvasRenderer } from './frozenCanvasRenderer';
import { OFFSCREEN_CANVAS_PADDING } from './gridGeometry';
import { ColumnDef, Coord, DataRow } from './types';

export interface FrozenCanvasProps<T> {
    data: Array<DataRow<T>>;
    columns: ColumnDef[];
    colBoundaries: Array<{left: number; right: number}>;
    width: number;
    height: number;
    rowHeight: number;
    borderWidth: number;
    frozenRows: number;
    frozenCols: number;
    frozenRowsHeight: number;
    frozenColsWidth: number;
    gridOffset: Coord;
}

export interface FrozenPreviousDrawInfo {
    gridOffset: Coord;
}

const dpr = window.devicePixelRatio;

export class FrozenCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;
    private prevDraw: FrozenPreviousDrawInfo|null = null;
    private renderer: FrozenCanvasRenderer<T>|null = null;

    constructor(props: FrozenCanvasProps<T>) {
        super(props);
    }

    public render() {
        return (
            <canvas
                ref={this.canvasRef}
                width={this.props.width * dpr}
                height={this.props.height * dpr}
                style={{
                    position: 'absolute',
                    width: `${this.props.width}px`,
                    height: `${this.props.height}px`,
                    top: -OFFSCREEN_CANVAS_PADDING,
                    left: -OFFSCREEN_CANVAS_PADDING,
                }}
            />
        );
    }

    public componentDidMount() {
        if (!this.canvasRef.current) {
            throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
        }
        this.renderer = new FrozenCanvasRenderer(this.canvasRef.current, dpr);
    }

    public componentDidUpdate(prevProps: FrozenCanvasProps<T>) {
        if (!this.renderer) {
            throw new Error('renderer is null in componentDidUpdate - cannot draw');
        }

        // Fix the scale if we haven't already.
        // (Note, we can't do this in componentDidMount for some reason - perhaps because the canvas mounts
        //  with a zero size?)
        if (!this.hasFixedScale) {
            this.renderer.fixScale();
            this.hasFixedScale = true;
        }

        // If anything that affects the grid other than the gridOffset / visibleRect has changed
        // then invalidate the previously drawn region
        for (const key of Object.keys(this.props) as Array<keyof FrozenCanvasProps<T>>) {
            if (key === 'gridOffset') {
                continue;
            }
            if (this.props[key] !== prevProps[key]) {
                this.prevDraw = null;
                break;
            }
        }

        this.prevDraw = this.renderer.drawFrozenCells(this.props, this.prevDraw);
    }
}
