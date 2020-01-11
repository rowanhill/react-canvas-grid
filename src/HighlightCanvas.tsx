import { consumer, ReactiveConsumer, transformer } from 'instigator';
import * as React from 'react';
import { GridState, shallowEqualsExceptFunctions } from './gridState';
import {
    HighlightCanvasRenderer,
    HighlightCanvasRendererBasics,
    HighlightCanvasRendererHover,
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
    private renderCallback: ReactiveConsumer|null = null;

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
            gridState.rowHeight,
            gridState.columnBoundaries,
            gridState.borderWidth,
            gridState.horizontalGutterBounds,
            gridState.verticalGutterBounds,
            gridState.cellBounds,
            gridState.shouldAllowAutofill,
        ],
        (
            rowHeight,
            columnBoundaries,
            borderWidth,
            horizontalGutterBounds,
            verticalGutterBounds,
            cellBounds,
            shouldAllowAutofill,
        ): HighlightCanvasRendererBasics => ({
            rowHeight,
            columnBoundaries,
            borderWidth,
            horizontalGutterBounds,
            verticalGutterBounds,
            cellBounds,
            shouldAllowAutofill,
        }),
        shallowEqualsExceptFunctions,
        );

        const scrollProps = transformer([
            gridState.horizontalScrollbarPos,
            gridState.verticalScrollbarPos,
        ], (
            horizontalScrollbarPos,
            verticalScrollbarPos,
        ): HighlightCanvasRendererScrollbar => ({
            horizontalScrollbarPos,
            verticalScrollbarPos,
        }));

        const hoverProps = transformer([
            gridState.hoveredScrollbar,
            gridState.autofillHandleIsHovered,
        ], (
            hoveredScrollbar,
            autofillHandleIsHovered,
        ): HighlightCanvasRendererHover => ({
            hoveredScrollbar,
            autofillHandleIsHovered,
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
            [gridState.selectionState],
            (selectionState): HighlightCanvasRendererSelection => ({ selectionState}));

        this.renderer = new HighlightCanvasRenderer(this.canvasRef.current, basicProps(), gridState.dpr());
        this.renderCallback = consumer(
            [basicProps, posProps, scrollProps, hoverProps, selectionProps],
            (newBasicProps, newPosProps, newScrollProps, newHoverProps, newSelectionProps) => {
                if (this.renderer) {
                    if (!this.canvasRef.current) {
                        throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
                    }
                    this.renderer.updateProps(
                        this.canvasRef.current,
                        newBasicProps,
                        newPosProps,
                        newScrollProps,
                        newHoverProps,
                        newSelectionProps,
                    );
                }
            });
    }

    public componentWillUnmount() {
        if (this.renderCallback) {
            this.renderCallback.deregister();
        }
    }
}
