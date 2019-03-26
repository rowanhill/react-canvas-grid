import * as React from 'react';
import { HighlightCanvasRenderer } from './highlightCanvasRenderer';

export interface HighlightCanvasProps {
    width: number;
    height: number;
    rowHeight: number;
    colBoundaries: Array<{left: number; right: number}>;
    borderWidth: number;
    setRenderer: (r: HighlightCanvasRenderer) => void;
}

const dpr =  window.devicePixelRatio;

export class HighlightCanvas extends React.Component<HighlightCanvasProps, {}> {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private renderer: HighlightCanvasRenderer|null = null;
    private hasFixedScale = false;

    constructor(props: HighlightCanvasProps) {
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
        const { setRenderer, ...basicProps } = this.props;
        this.renderer = new HighlightCanvasRenderer(this.canvasRef.current, { ...basicProps, dpr });
        setRenderer(this.renderer);
    }

    public componentDidUpdate() {
        if (!this.renderer) {
            throw new Error('renderer is null in componentDidUpdate - cannot draw');
        }

        // Fix the scale if we haven't already.
        // (Note, we can't do this in componentDidMount for some reason - perhaps because the canvas mounts
        //  with a zero size?)
        if (!this.hasFixedScale) {
            this.renderer.fixScale();
            this.hasFixedScale = true;
        }

        this.renderer.reset({ ...this.props, dpr });
    }
}
