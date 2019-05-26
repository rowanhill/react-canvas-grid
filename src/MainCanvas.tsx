import { consumer, transformer } from 'instigator';
import * as React from 'react';
import { GridState } from './gridState';
import { MainCanvasRenderer, MainCanvasRendererBasics, MainCanvasRendererPosition } from './mainCanvasRenderer';

export interface MainCanvasProps<T> {
    width: number;
    height: number;
    gridState: GridState<T>;
}

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
                width={this.props.width * this.props.gridState.dpr()}
                height={this.props.height * this.props.gridState.dpr()}
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
        ): MainCanvasRendererBasics<T> => ({
            data,
            rowHeight,
            colBoundaries,
            columns,
            gridInnerSize,
            borderWidth,
        }));

        const posProps = transformer(
            [gridState.gridOffset, gridState.visibleRect],
            (gridOffset, visibleRect): MainCanvasRendererPosition => ({ gridOffset, visibleRect }));

        {
            const canvasSize = { width: this.props.width, height: this.props.height };
            this.renderer = new MainCanvasRenderer(this.canvasRef.current, canvasSize, basicProps(), gridState.dpr());
        }

        consumer([basicProps, posProps], (newBasicProps, newPosProps) => {
            if (this.renderer) {
                const canvasSize = { width: this.props.width, height: this.props.height };
                this.renderer.updateProps(canvasSize, newBasicProps, newPosProps);
            }
        });
    }
}
