import { consumer, ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { GridState } from './gridState';
import { MainCanvasRenderer, MainCanvasRendererBasics, MainCanvasRendererPosition } from './mainCanvasRenderer';
import { Coord } from './types';

export interface FrozenCanvasProps<T> {
    width: number;
    height: number;
    gridState: GridState<T>;
}

export interface FrozenPreviousDrawInfo {
    gridOffset: Coord;
}

export class FrozenCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly cornerCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private cornerRenderer: MainCanvasRenderer<T>|null = null;
    private readonly rowsCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private rowsRenderer: MainCanvasRenderer<T>|null = null;
    private readonly colsCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private colsRenderer: MainCanvasRenderer<T>|null = null;

    private readonly basicProps: ReactiveFn<MainCanvasRendererBasics<T>>;
    private readonly cornerPosProps: ReactiveFn<MainCanvasRendererPosition>;
    private readonly rowsPosProps: ReactiveFn<MainCanvasRendererPosition>;
    private readonly colsPosProps: ReactiveFn<MainCanvasRendererPosition>;

    public constructor(props: FrozenCanvasProps<T>) {
        super(props);

        this.basicProps = transformer([
            props.gridState.data,
            props.gridState.borderWidth,
            props.gridState.canvasSize,
            props.gridState.columnBoundaries,
            props.gridState.columns,
            props.gridState.gridInnerSize,
            props.gridState.rowHeight,
        ],
        (
            data,
            borderWidth,
            canvasSize,
            colBoundaries,
            columns,
            gridInnerSize,
            rowHeight,
        ): MainCanvasRendererBasics<T> => ({
            data,
            borderWidth,
            canvasSize,
            colBoundaries,
            columns,
            gridInnerSize,
            rowHeight,
        }));

        const cornerVisibleReact = transformer([props.gridState.visibleRect], (visibleRect): ClientRect => {
            return {
                ...visibleRect,
                top: 0,
                left: 0,
                right: visibleRect.width,
                bottom: visibleRect.height,
            };
        });
        this.cornerPosProps = transformer([cornerVisibleReact], (visibleRect): MainCanvasRendererPosition => ({
            gridOffset: { x: 0, y: 0 },
            visibleRect,
        }));

        const rowsVisibleReact = transformer(
            [props.gridState.visibleRect, props.gridState.frozenColsWidth],
            (visibleRect, frozenColsWidth): ClientRect => ({
                ...visibleRect,
                top: 0,
                bottom: visibleRect.height,
                left: visibleRect.left + frozenColsWidth,
                right: visibleRect.right + frozenColsWidth,
            }));
        this.rowsPosProps = transformer([rowsVisibleReact], (visibleRect): MainCanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));

        const colsVisibleReact = transformer(
            [props.gridState.visibleRect, props.gridState.frozenRowsHeight],
            (visibleRect, frozenRowsHeight): ClientRect => ({
                ...visibleRect,
                left: 0,
                right: visibleRect.width,
                top: visibleRect.top + frozenRowsHeight,
                bottom: visibleRect.bottom + frozenRowsHeight,
            }));
        this.colsPosProps = transformer([colsVisibleReact], (visibleRect): MainCanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));

        consumer(
            [this.basicProps, this.cornerPosProps, this.props.gridState.frozenRows, this.props.gridState.frozenCols],
            (newBasicProps, newPosProps) => {
                if (this.cornerRenderer) {
                    this.cornerRenderer.updateProps(newBasicProps, newPosProps);
                }
            });
        consumer(
            [this.basicProps, this.rowsPosProps, this.props.gridState.frozenRows],
            (newBasicProps, newPosProps) => {
                if (this.rowsRenderer) {
                    this.rowsRenderer.updateProps(newBasicProps, newPosProps);
                }
            });
        consumer(
            [this.basicProps, this.colsPosProps, this.props.gridState.frozenCols],
            (newBasicProps, newPosProps) => {
                if (this.colsRenderer) {
                    this.colsRenderer.updateProps(newBasicProps, newPosProps);
                }
            });
    }

    public render() {
        const rowsHeight = this.props.gridState.frozenRowsHeight();
        const colsWidth = this.props.gridState.frozenColsWidth();
        const dpr = this.props.gridState.dpr();
        return (
            <React.Fragment>
                {(rowsHeight > 0 && colsWidth > 0) &&
                    <canvas
                        ref={this.cornerCanvasRef}
                        width={colsWidth * dpr}
                        height={rowsHeight * dpr}
                        style={{
                            position: 'absolute',
                            width: `${colsWidth}px`,
                            height: `${rowsHeight}px`,
                            top: 0,
                            left: 0,
                        }}
                    />
                }
                {(rowsHeight > 0) &&
                    <canvas
                        ref={this.rowsCanvasRef}
                        width={(this.props.width - colsWidth) * dpr}
                        height={rowsHeight * dpr}
                        style={{
                            position: 'absolute',
                            width: `${this.props.width - colsWidth}px`,
                            height: `${rowsHeight}px`,
                            top: 0,
                            left: `${colsWidth}px`,
                        }}
                    />
                }
                {(colsWidth > 0) &&
                    <canvas
                        ref={this.colsCanvasRef}
                        width={colsWidth * dpr}
                        height={(this.props.height - rowsHeight) * dpr}
                        style={{
                            position: 'absolute',
                            width: `${colsWidth}px`,
                            height: `${this.props.height - rowsHeight}px`,
                            top: `${rowsHeight}px`,
                            left: 0,
                        }}
                    />
                }
            </React.Fragment>
        );
    }

    public componentDidMount() {
        this.setUpCorner();
        this.setUpRows();
        this.setUpCols();
    }

    public componentDidUpdate() {
        this.setUpCorner();
        if (this.cornerRenderer) {
            this.cornerRenderer.updateProps(this.basicProps(), this.cornerPosProps());
        }
        this.setUpRows();
        if (this.rowsRenderer) {
            this.rowsRenderer.updateProps(this.basicProps(), this.rowsPosProps());
        }
        this.setUpCols();
        if (this.colsRenderer) {
            this.colsRenderer.updateProps(this.basicProps(), this.colsPosProps());
        }
    }

    private setUpCorner = () => {
        if (!this.cornerCanvasRef.current) {
            return;
        }
        this.cornerRenderer = new MainCanvasRenderer(
            this.cornerCanvasRef.current,
            this.basicProps(),
            this.props.gridState.dpr(),
        );
    }

    private setUpRows = () => {
        if (!this.rowsCanvasRef.current) {
            return;
        }
        this.rowsRenderer = new MainCanvasRenderer(
            this.rowsCanvasRef.current,
            this.basicProps(),
            this.props.gridState.dpr(),
        );
    }

    private setUpCols = () => {
        if (!this.colsCanvasRef.current) {
            return;
        }
        this.colsRenderer = new MainCanvasRenderer(
            this.colsCanvasRef.current,
            this.basicProps(),
            this.props.gridState.dpr(),
        );
    }
}
