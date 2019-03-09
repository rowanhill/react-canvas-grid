import * as React from 'react';
import { DataRow, ColumnDef, Coord } from './types';
import { BaseCanvasRenderer } from './baseCanvasRenderer';

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

export interface PreviousDrawInfo {
    gridOffset: Coord;
    rect: { top: number; left: number; right: number; bottom: number };
}

const dpr =  window.devicePixelRatio;

export class BaseCanvas<T> extends React.Component<BaseCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;
    private prevDraw: PreviousDrawInfo|null = null;
    private renderer: BaseCanvasRenderer<T>|null = null;

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

    componentDidMount() {
        if (!this.canvasRef.current) {
            throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
        }
        this.renderer = new BaseCanvasRenderer(this.canvasRef.current, dpr);
    }

    componentDidUpdate(prevProps: BaseCanvasProps<T>) {
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
        for (const key of Object.keys(this.props) as (keyof BaseCanvasProps<T>)[]) {
            if (key === 'gridOffset' || key === 'visibleRect') {
                continue;
            }
            if (this.props[key] !== prevProps[key]) {
                this.prevDraw = null;
                break;
            }
        }

        this.prevDraw = this.renderer.draw(this.props, this.prevDraw);
    }
}