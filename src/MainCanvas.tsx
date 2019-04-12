import * as React from 'react';
import { MainCanvasRenderer } from './mainCanvasRenderer';
import { ColumnDef, DataRow } from './types';

export interface MainCanvasProps<T> {
    data: Array<DataRow<T>>;
    width: number;
    height: number;
    rowHeight: number;
    colBoundaries: Array<{left: number; right: number}>;
    columns: ColumnDef[];
    gridHeight: number;
    borderWidth: number;
    setRenderer: (r: MainCanvasRenderer<T>) => void;
}

const dpr = window.devicePixelRatio;

export class MainCanvas<T> extends React.Component<MainCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
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

        const { setRenderer, ...basicProps } = this.props;
        this.renderer = new MainCanvasRenderer(this.canvasRef.current, { ...basicProps, dpr });
        setRenderer(this.renderer);
    }

    public componentDidUpdate() {
        if (!this.renderer) {
            throw new Error('renderer is null in componentDidUpdate - cannot draw');
        }

        this.renderer.reset({ ...this.props, dpr });
    }
}
