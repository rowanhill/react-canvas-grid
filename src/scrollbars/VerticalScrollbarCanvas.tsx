import { consumer, mergeTransformer, ReactiveConsumer } from 'instigator';
import * as React from 'react';
import { shallowEqualsExceptFunctions } from '../gridState';
import { ScrollbarRendererBasics } from './baseScrollbarRenderer';
import { ScrollbarCanvasProps } from './ScrollbarCanvas';
import { VerticalScrollbarRenderer } from './verticalScrollbarRenderer';

type VerticalScrollbarCanvasProps<T> = ScrollbarCanvasProps<T> & {
    verticalGutterBounds: ClientRect;
};

export class VerticalScrollbarCanvas<T> extends React.PureComponent<VerticalScrollbarCanvasProps<T>> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: VerticalScrollbarRenderer|null = null;
    private renderCallback: ReactiveConsumer|null = null;

    public render() {
        return (
            <canvas
                ref={this.canvasRef}
                data-name="vertical-scrollbar"
                width={this.props.verticalGutterBounds.width * this.props.dpr}
                height={this.props.verticalGutterBounds.height * this.props.dpr}
                style={{
                    position: 'absolute',
                    top: `${this.props.verticalGutterBounds.top}px`,
                    left: `${this.props.verticalGutterBounds.left}px`,
                    width: `${this.props.verticalGutterBounds.width}px`,
                    height: `${this.props.verticalGutterBounds.height}px`,
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

        this.renderer = new VerticalScrollbarRenderer(
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
