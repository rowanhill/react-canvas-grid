import * as React from 'react';
import { consumer, transformer } from 'reflex';
import { FrozenCanvasRenderer, FrozenCanvasRendererBasics, FrozenCanvasRendererPosition } from './frozenCanvasRenderer';
import { GridState } from './gridState';
import { Coord } from './types';

export interface FrozenCanvasProps<T> {
    width: number;
    height: number;
    gridState: GridState<T>;
}

export interface FrozenPreviousDrawInfo {
    gridOffset: Coord;
}

const dpr = window.devicePixelRatio;

export class FrozenCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: FrozenCanvasRenderer<T>|null = null;

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
            gridState.columns,
            gridState.columnBoundaries,
            gridState.canvasSize,
            gridState.rowHeight,
            gridState.borderWidth,
            gridState.frozenRows,
            gridState.frozenCols,
            gridState.frozenColsWidth,
            gridState.frozenRowsHeight,
        ],
        (
            data,
            columns,
            colBoundaries,
            canvasSize,
            rowHeight,
            borderWidth,
            frozenRows,
            frozenCols,
            frozenColsWidth,
            frozenRowsHeight,
        ): FrozenCanvasRendererBasics<T> => ({
            data,
            columns,
            colBoundaries,
            canvasSize,
            rowHeight,
            borderWidth,
            frozenRows,
            frozenCols,
            frozenColsWidth,
            frozenRowsHeight,
        }));

        const posProps = transformer([
            gridState.gridOffset,
        ],
        (
            gridOffset,
        ): FrozenCanvasRendererPosition => ({
            gridOffset,
        }));

        this.renderer = new FrozenCanvasRenderer(this.canvasRef.current, basicProps(), dpr);

        consumer([basicProps], (newBasicProps) => {
            if (this.renderer) {
                this.renderer.reset(newBasicProps);
            }
        });
        consumer([posProps], (newPosProps) => {
            if (this.renderer) {
                this.renderer.updatePos(newPosProps);
            }
        });
    }
}
