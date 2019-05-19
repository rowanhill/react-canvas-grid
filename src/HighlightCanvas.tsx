import { consumer, transformer } from 'instigator';
import * as React from 'react';
import { GridState } from './gridState';
import {
    HighlightCanvasRenderer,
    HighlightCanvasRendererBasics,
    HighlightCanvasRendererPosition,
    HighlightCanvasRendererScrollbar,
    HighlightCanvasRendererSelection,
} from './highlightCanvasRenderer';

export interface HighlightCanvasProps {
    width: number;
    height: number;
    gridState: GridState<any>;
}

export class HighlightCanvas extends React.Component<HighlightCanvasProps, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: HighlightCanvasRenderer|null = null;

    constructor(props: HighlightCanvasProps) {
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
            gridState.columns,
            gridState.canvasSize,
            gridState.gridSize,
            gridState.gridInnerSize,
            gridState.frozenColsWidth,
            gridState.frozenRowsHeight,
            gridState.rowHeight,
            gridState.columnBoundaries,
            gridState.borderWidth,
            gridState.horizontalGutterBounds,
            gridState.verticalGutterBounds,
        ],
        (
            data,
            columns,
            canvasSize,
            gridSize,
            gridInnerSize,
            frozenColsWidth,
            frozenRowsHeight,
            rowHeight,
            columnBoundaries,
            borderWidth,
            horizontalGutterBounds,
            verticalGutterBounds,
        ): HighlightCanvasRendererBasics => ({
            data,
            columns,
            canvasSize,
            gridSize,
            gridInnerSize,
            frozenColsWidth,
            frozenRowsHeight,
            rowHeight,
            columnBoundaries,
            borderWidth,
            horizontalGutterBounds,
            verticalGutterBounds,
        }));

        const scrollProps = transformer([
            gridState.horizontalScrollbarPos,
            gridState.verticalScrollbarPos,
            gridState.hoveredScrollbar,
        ], (
            horizontalScrollbarPos,
            verticalScrollbarPos,
            hoveredScrollbar,
        ): HighlightCanvasRendererScrollbar => ({
            horizontalScrollbarPos,
            verticalScrollbarPos,
            hoveredScrollbar,
        }));

        const posProps = transformer([
            gridState.gridOffset,
            gridState.visibleRect,
        ],
        (
            gridOffset,
            visibleRect,
        ): HighlightCanvasRendererPosition => ({
            gridOffset,
            visibleRect,
        }));

        const selectionProps = transformer(
            [gridState.cursorState],
            (cursorState): HighlightCanvasRendererSelection => ({ cursorState}));

        this.renderer = new HighlightCanvasRenderer(this.canvasRef.current, basicProps(), gridState.dpr());
        consumer(
            [basicProps, posProps, scrollProps, selectionProps],
            (newBasicProps, newPosProps, newScrollProps, newSelectionProps) => {
                if (this.renderer) {
                    this.renderer.updateProps(newBasicProps, newPosProps, newScrollProps, newSelectionProps);
                }
            });
    }
}
