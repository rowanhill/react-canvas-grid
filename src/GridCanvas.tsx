import { consumer, ReactiveConsumer, ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { GridCanvasRenderer, GridCanvasRendererPosition } from './gridCanvasRenderer';
import { GridState } from './gridState';

export interface GridCanvasProps<T> {
    top: number;
    left: number;
    width: number;
    height: number;
    gridState: GridState<T>;
    posProps: ReactiveFn<GridCanvasRendererPosition>;
}

export class GridCanvas<T> extends React.Component<GridCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: GridCanvasRenderer<T>|null = null;
    private renderCallback: ReactiveConsumer|null = null;

    public render() {
        return (
            <canvas
                ref={this.canvasRef}
                width={this.props.width * this.props.gridState.dpr()}
                height={this.props.height * this.props.gridState.dpr()}
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
        const basicProps = transformer([
            gridState.data,
            gridState.rowHeight,
            gridState.columnBoundaries,
            gridState.columns,
            gridState.gridInnerSize,
            gridState.borderWidth,
        ],
        (
            data,
            rowHeight,
            colBoundaries,
            columns,
            gridInnerSize,
            borderWidth,
        ) => ({
            data,
            rowHeight,
            colBoundaries,
            columns,
            gridInnerSize,
            borderWidth,
        }));

        {
            const canvasSize = { width: this.props.width, height: this.props.height };
            this.renderer = new GridCanvasRenderer(this.canvasRef.current, canvasSize, basicProps(), gridState.dpr());
        }

        this.renderCallback = consumer([basicProps, this.props.posProps], (newBasicProps, newPosProps) => {
            if (this.renderer) {
                if (!this.canvasRef.current) {
                    throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
                }
                const canvasSize = { width: this.props.width, height: this.props.height };
                this.renderer.updateProps(this.canvasRef.current, canvasSize, newBasicProps, newPosProps);
            }
        });
    }

    public componentWillUnmount() {
        if (this.renderCallback) {
            this.renderCallback.deregister();
        }
    }

    // TODO: Need to call updateProps on componentDidUpdate?
}