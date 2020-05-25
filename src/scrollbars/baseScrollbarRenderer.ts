import { CommonCanvasRenderer } from '../commonCanvasRenderer';
import { ScrollbarPosition } from '../scrollbarGeometry';

export interface ScrollbarRendererBasics {
    dpr: number;
    horizontalGutterBounds: ClientRect|null;
    verticalGutterBounds: ClientRect|null;
    horizontalScrollbarPos: ScrollbarPosition | null;
    verticalScrollbarPos: ScrollbarPosition | null;
    hoveredScrollbar: 'x' | 'y' | null;
}

const colours = {
    grey: {
        veryLight: 'hsla(0, 0%, 93%, 1)',
        light: 'hsla(0, 0%, 83%, 1)', // == lightgrey
    },
    black: {
        veryTransparent: 'hsla(0, 0%, 0%, 0.4)',
        transparent: 'hsla(0, 0%, 0%, 0.55)',
    },
};

export const styles = {
    scrollbar: {
        defaultFill: colours.black.veryTransparent,
        hoverFill: colours.black.transparent,
    },
    scrollGutters: {
        fill: colours.grey.veryLight,
        stroke: colours.grey.light,
    },
};

export abstract class BaseScrollbarRenderer extends CommonCanvasRenderer<any> {
    protected basicProps: ScrollbarRendererBasics;

    constructor(name: string, canvas: HTMLCanvasElement, basicProps: ScrollbarRendererBasics) {
        super(name, canvas, basicProps.dpr, false);
        this.basicProps = basicProps;
    }

    public updateProps = (canvas: HTMLCanvasElement, basicProps: ScrollbarRendererBasics) => {
        if (this.canvas !== canvas) {
            this.setCanvas(canvas);
        }
        this.basicProps = basicProps;

        this.drawScaled(this.draw);
    }

    public abstract draw(): void;

    protected setCanvas = (canvas: HTMLCanvasElement) => {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha: false });
        if (!context) {
            throw new Error('Could not create canvas contex');
        }
        this.context = context;
    }
}
