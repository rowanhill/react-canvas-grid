export const borderColour = 'lightgrey';

export abstract class CommonCanvasRenderer<T> {
    protected canvas: HTMLCanvasElement;
    protected context: CanvasRenderingContext2D;
    protected readonly name: string;
    protected readonly alpha: boolean;
    protected readonly dpr: number;

    private queuedRender: number | null = null;

    constructor(name: string, canvas: HTMLCanvasElement, dpr: number, alpha: boolean) {
        this.name = name;
        this.alpha = alpha;
        this.dpr = dpr;

        // Below is same as setCanvas, copied here to appease compiler
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha: this.alpha });
        if (!context) {
            throw new Error('Could not create canvas contex');
        }
        this.context = context;
    }

    public drawScaled(draw: () => void, drawUntranslated?: () => void) {
        if (this.queuedRender !== null) {
            return;
        }

        this.queuedRender = window.requestAnimationFrame(() => {
            this.context.save();
            this.context.scale(this.dpr, this.dpr);
            try {
                if (drawUntranslated) {
                    drawUntranslated();
                }
                this.context.save();
                this.translate();
                try {
                    draw();
                } finally {
                    this.context.restore();
                }
            } finally {
                this.context.restore();

                this.queuedRender = null;
            }
        });
    }

    public abstract translate(): void;

    protected setCanvas = (canvas: HTMLCanvasElement) => {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha: this.alpha });
        if (!context) {
            throw new Error('Could not create canvas contex');
        }
        this.context = context;
    }
}
