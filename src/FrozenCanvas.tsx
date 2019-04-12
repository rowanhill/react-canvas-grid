import * as React from 'react';
import { FrozenCanvasRenderer } from './frozenCanvasRenderer';
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
    setRenderer: (r: FrozenCanvasRenderer<T>) => void;
}

export interface FrozenPreviousDrawInfo {
    gridOffset: Coord;
}

const dpr = window.devicePixelRatio;

export class FrozenCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
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
        const { setRenderer, ...basicProps } = this.props;
        this.renderer = new FrozenCanvasRenderer(this.canvasRef.current, { ...basicProps, dpr });
        setRenderer(this.renderer);
    }

    public componentDidUpdate(prevProps: FrozenCanvasProps<T>) {
        if (!this.renderer) {
            throw new Error('renderer is null in componentDidUpdate - cannot draw');
        }

        this.renderer.reset({ ...this.props, dpr });
    }
}
