import { ActiveSource, activeSource, consumer, mergeTransformer, ReactiveConsumer, ReactiveFn } from 'instigator';
import * as React from 'react';
import { GridCanvasRenderer, GridCanvasRendererPosition } from './gridCanvasRenderer';
import { GridState } from './gridState';
import { Size } from './types';

export interface GridCanvasProps<T> {
    name: string;
    top: number;
    left: number;
    width: number;
    height: number;
    dpr: number;
    gridState: GridState<T>;
    posProps: ReactiveFn<GridCanvasRendererPosition>;
}

export class GridCanvas<T> extends React.PureComponent<GridCanvasProps<T>> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private readonly canvasSizeSource: ActiveSource<Size>;
    private renderer: GridCanvasRenderer<T>|null = null;
    private renderCallback: ReactiveConsumer|null = null;

    constructor(props: GridCanvasProps<T>) {
        super(props);
        this.canvasSizeSource = activeSource({
            width: props.width,
            height: props.height,
        });
    }

    public render() {
        return (
            <canvas
                ref={this.canvasRef}
                width={this.props.width * this.props.dpr}
                height={this.props.height * this.props.dpr}
                style={{
                    position: 'absolute',
                    top: `${this.props.top}px`,
                    left: `${this.props.left}px`,
                    width: `${this.props.width}px`,
                    height: `${this.props.height}px`,
                }}
            />
        );
    }

    public componentDidMount() {
        if (!this.canvasRef.current) {
            throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
        }

        const gridState = this.props.gridState;
        const basicProps = mergeTransformer({
            data: gridState.data,
            rowHeight: gridState.rowHeight,
            colBoundaries: gridState.columnBoundaries,
            columns: gridState.columns,
            gridInnerSize: gridState.gridInnerSize,
            borderWidth: gridState.borderWidth,
        });

        {
            const canvasSize = { width: this.props.width, height: this.props.height };
            this.renderer = new GridCanvasRenderer(
                this.canvasRef.current,
                canvasSize,
                basicProps(),
                gridState.dpr(),
                this.props.name,
            );
        }

        const renderCallback = consumer(
            [basicProps, this.props.posProps, this.canvasSizeSource],
            (newBasicProps, newPosProps, canvasSize) => {
                if (this.renderer) {
                    if (!this.canvasRef.current) {
                        throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
                    }
                    this.renderer.updateProps(this.canvasRef.current, canvasSize, newBasicProps, newPosProps);
                }
            },
        );
        // Force the render - there's no guarantee the consumer's inputs will ever update, so we need to ensure
        // something is painted to the canvas.
        renderCallback();
        this.renderCallback = renderCallback;
    }

    public componentDidUpdate() {
        this.canvasSizeSource({ width: this.props.width, height: this.props.height });
    }

    public componentWillUnmount() {
        if (this.renderCallback) {
            this.renderCallback.deregister();
        }
    }
}
