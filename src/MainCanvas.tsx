import * as React from 'react';
import { MainCanvasRenderer } from './mainCanvasRenderer';
import { ColumnDef, Coord, DataRow } from './types';

export interface MainCanvasProps<T> {
    data: Array<DataRow<T>>;
    width: number;
    height: number;
    visibleRect: ClientRect;
    gridOffset: Coord;
    rowHeight: number;
    colBoundaries: Array<{left: number; right: number}>;
    columns: ColumnDef[];
    gridHeight: number;
    borderWidth: number;
}

export interface PreviousDrawInfo {
    gridOffset: Coord;
    rect: { top: number; left: number; right: number; bottom: number };
}

const dpr =  window.devicePixelRatio;

export class MainCanvas<T> extends React.Component<MainCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;
    private prevDraw: PreviousDrawInfo|null = null;
    private renderer: MainCanvasRenderer<T>|null = null;

    constructor(props: MainCanvasProps<T>) {
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
                    top: 0,
                    left: 0,
                }}
            />
        );
    }

    public componentDidMount() {
        if (!this.canvasRef.current) {
            throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
        }
        this.renderer = new MainCanvasRenderer(this.canvasRef.current, dpr);
    }

    public componentDidUpdate(prevProps: MainCanvasProps<T>) {
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
        for (const key of Object.keys(this.props) as Array<keyof MainCanvasProps<T>>) {
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
