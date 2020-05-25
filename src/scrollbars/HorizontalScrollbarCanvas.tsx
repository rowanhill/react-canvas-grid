import { consumer, mergeTransformer, ReactiveConsumer } from 'instigator';
import * as React from 'react';
import { shallowEqualsExceptFunctions } from '../gridState';
import { ScrollbarRendererBasics } from './baseScrollbarRenderer';
import { HorizontalScrollbarRenderer } from './horizontalScrollbarRenderer';
import { ScrollbarCanvasProps } from './ScrollbarCanvas';

type HorizontalScrollbarCanvasProps<T> = ScrollbarCanvasProps<T> & {
    horizontalGutterBounds: ClientRect;
};

export class HorizontalScrollbarCanvas<T> extends React.PureComponent<HorizontalScrollbarCanvasProps<T>> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: HorizontalScrollbarRenderer|null = null;
    private renderCallback: ReactiveConsumer|null = null;

    public render() {
        return (
            <canvas
                ref={this.canvasRef}
                data-name="horizontal-scrollbar"
                width={this.props.horizontalGutterBounds.width * this.props.dpr}
                height={this.props.horizontalGutterBounds.height * this.props.dpr}
                style={{
                    position: 'absolute',
                    top: `${this.props.horizontalGutterBounds.top}px`,
                    left: `${this.props.horizontalGutterBounds.left}px`,
                    width: `${this.props.horizontalGutterBounds.width}px`,
                    height: `${this.props.horizontalGutterBounds.height}px`,
                }}
            />
        );
    }

    public componentDidMount() {
        if (!this.canvasRef.current) {
            throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
        }

        const gridState = this.props.gridState;
        const basicProps = mergeTransformer<ScrollbarRendererBasics>({
            dpr: gridState.dpr,
            horizontalGutterBounds: gridState.horizontalGutterBounds,
            verticalGutterBounds: gridState.verticalGutterBounds,
            horizontalScrollbarPos: gridState.horizontalScrollbarPos,
            verticalScrollbarPos: gridState.verticalScrollbarPos,
            hoveredScrollbar: gridState.hoveredScrollbar,
        }, shallowEqualsExceptFunctions);

        this.renderer = new HorizontalScrollbarRenderer(
            this.canvasRef.current,
            basicProps(),
        );
        this.renderCallback = consumer(
            [basicProps],
            (newBasicProps) => {
                if (this.renderer) {
                    if (!this.canvasRef.current) {
                        throw new Error('canvasRef is null in componentDidMount - cannot create renderer');
                    }
                    this.renderer.updateProps(this.canvasRef.current, newBasicProps);
                }
            });
        this.renderCallback();
    }

    public componentWillUnmount() {
        if (this.renderCallback) {
            this.renderCallback.deregister();
        }
    }
}
