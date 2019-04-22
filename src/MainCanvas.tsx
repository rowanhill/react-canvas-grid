import { consumer, transformer } from 'instigator';
import * as React from 'react';
import { GridState } from './gridState';
import { MainCanvasRenderer, MainCanvasRendererBasics, MainCanvasRendererPosition } from './mainCanvasRenderer';

export interface MainCanvasProps<T> {
    width: number;
    height: number;
    gridState: GridState<T>;
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

        const gridState = this.props.gridState;
        const basicProps = transformer([
            gridState.data,
            gridState.canvasSize,
            gridState.rowHeight,
            gridState.columnBoundaries,
            gridState.columns,
            gridState.gridSize,
            gridState.borderWidth,
        ],
        (
            data,
            canvasSize,
            rowHeight,
            colBoundaries,
            columns,
            gridSize,
            borderWidth,
        ): MainCanvasRendererBasics<T> => ({
            data,
            canvasSize,
            rowHeight,
            colBoundaries,
            columns,
            gridHeight: gridSize.height,
            borderWidth,
        }));

        const posProps = transformer(
            [gridState.gridOffset],
            (gridOffset): MainCanvasRendererPosition => ({ gridOffset }));

        this.renderer = new MainCanvasRenderer(this.canvasRef.current, basicProps(), dpr);

        consumer([basicProps, posProps], (newBasicProps, newPosProps) => {
            if (this.renderer) {
                this.renderer.updateProps(newBasicProps, newPosProps);
            }
        });
    }
}
