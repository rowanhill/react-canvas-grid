import { consumer, mergeTransformer, ReactiveConsumer } from 'instigator';
import * as React from 'react';
import { GridState, shallowEqualsExceptFunctions } from './gridState';
import { HighlightCanvasRenderer } from './highlightCanvasRenderer';

export interface HighlightCanvasProps {
    width: number;
    height: number;
    gridState: GridState<any>;
}

export class HighlightCanvas extends React.PureComponent<HighlightCanvasProps> {
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
        const basicProps = mergeTransformer({
            rowHeight: gridState.rowHeight,
            columnBoundaries: gridState.columnBoundaries,
            borderWidth: gridState.borderWidth,
            horizontalGutterBounds: gridState.horizontalGutterBounds,
            verticalGutterBounds: gridState.verticalGutterBounds,
            cellBounds: gridState.cellBounds,
            shouldAllowAutofill: gridState.shouldAllowAutofill,
        }, shallowEqualsExceptFunctions);

        const scrollProps = mergeTransformer({
            horizontalScrollbarPos: gridState.horizontalScrollbarPos,
            verticalScrollbarPos: gridState.verticalScrollbarPos,
        });

        const hoverProps = mergeTransformer({
            hoveredScrollbar: gridState.hoveredScrollbar,
            autofillHandleIsHovered: gridState.autofillHandleIsHovered,
        });

        const posProps = mergeTransformer({
            gridOffset: gridState.gridOffset,
            visibleRect: gridState.visibleRect,
        });

        const selectionProps = mergeTransformer({ selectionState: gridState.selectionState });

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
