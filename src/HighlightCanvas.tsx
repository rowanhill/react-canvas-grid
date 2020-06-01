import { consumer, mergeTransformer, ReactiveConsumer, ReactiveFn } from 'instigator';
import * as React from 'react';
import { CanvasRendererPosition } from './baseGridOffsetRenderer';
import { GridState, shallowEqualsExceptFunctions } from './gridState';
import { HighlightCanvasRenderer, HighlightCanvasRendererBasics } from './highlightCanvasRenderer';

export interface HighlightCanvasProps<T> {
    name: string;
    top: number;
    left: number;
    width: number;
    height: number;
    dpr: number;
    gridState: GridState<T>;
    posProps: ReactiveFn<CanvasRendererPosition>;
}

export class HighlightCanvas<T> extends React.PureComponent<HighlightCanvasProps<T>> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: HighlightCanvasRenderer|null = null;
    private renderCallback: ReactiveConsumer|null = null;

    constructor(props: HighlightCanvasProps<T>) {
        super(props);
    }

    public render() {
        return (
            <canvas
                ref={this.canvasRef}
                data-name={this.props.name}
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
        const basicProps = mergeTransformer<HighlightCanvasRendererBasics>({
            rowHeight: gridState.rowHeight,
            columnBoundaries: gridState.columnBoundaries,
            borderWidth: gridState.borderWidth,
            cellBounds: gridState.cellBounds,
            shouldAllowAutofill: gridState.shouldAllowAutofill,
        }, shallowEqualsExceptFunctions);

        const hoverProps = mergeTransformer({
            autofillHandleIsHovered: gridState.autofillHandleIsHovered,
        });

        const selectionProps = mergeTransformer({ selectionState: gridState.selectionState });

        this.renderer = new HighlightCanvasRenderer(
            this.props.name,
            this.canvasRef.current,
            basicProps(),
            gridState.dpr(),
        );
        this.renderCallback = consumer(
            [basicProps, this.props.posProps, hoverProps, selectionProps],
            (newBasicProps, newPosProps, newHoverProps, newSelectionProps) => {
                if (this.renderer) {
                    if (!this.canvasRef.current) {
                        throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
                    }
                    this.renderer.updateProps(
                        this.canvasRef.current,
                        newBasicProps,
                        newPosProps,
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
