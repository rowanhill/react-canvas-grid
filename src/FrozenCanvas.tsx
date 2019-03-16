import * as React from 'react';
import { BaseCanvasRenderer } from './baseCanvasRenderer';
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

export interface PreviousDrawInfo {
    gridOffset: Coord;
    rect: { top: number; left: number; right: number; bottom: number };
}

const dpr =  window.devicePixelRatio;

export class FrozenCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private hasFixedScale = false;
    private renderer: BaseCanvasRenderer<T>|null = null;

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
        this.renderer = new BaseCanvasRenderer(this.canvasRef.current, dpr, true);
    }

    public componentDidUpdate() {
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

        this.renderer.drawFrozenCells(this.props);
    }
}
