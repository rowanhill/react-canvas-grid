import { CellDef, CustomDrawCallbackMetadata, getCellText } from './types';

export const borderColour = 'lightgrey';

export class CommonCanvasRenderer<T> {
    protected canvas: HTMLCanvasElement;
    protected context: CanvasRenderingContext2D;
    protected readonly alpha: boolean;
    protected readonly dpr: number;

    private queuedRender: number | null = null;

    constructor(canvas: HTMLCanvasElement, dpr: number, alpha: boolean) {
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

    public drawScaled(draw: () => void) {
        if (this.queuedRender !== null) {
            return;
        }

        this.queuedRender = window.requestAnimationFrame(() => {
            this.context.scale(this.dpr, this.dpr);
            try {
                draw();
            } finally {
                this.context.scale(1 / this.dpr, 1 / this.dpr);

                this.queuedRender = null;
            }
        });
    }

    public drawCell(cell: CellDef<T>, cellBounds: ClientRect, metadata: CustomDrawCallbackMetadata) {
        const renderBackground = cell.renderBackground || this.drawCellBackgroundDefault;
        const renderText = cell.renderText || this.drawCellTextDefault;

        renderBackground(this.context, cellBounds, cell, metadata);
        renderText(this.context, cellBounds, cell, metadata);
    }

    protected setCanvas = (canvas: HTMLCanvasElement) => {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha: this.alpha });
        if (!context) {
            throw new Error('Could not create canvas contex');
        }
        this.context = context;
    }

    private drawCellBackgroundDefault = (
        context: CanvasRenderingContext2D,
        cellBounds: ClientRect,
    ) => {
        context.fillStyle = 'white';
        context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
    }

    private drawCellTextDefault = (
        context: CanvasRenderingContext2D,
        cellBounds: ClientRect,
        cell: CellDef<T>,
    ) => {
        context.fillStyle = 'black';
        context.textBaseline = 'middle';
        const verticalCentre = cellBounds.top + (cellBounds.height / 2);
        const text = getCellText(cell);
        context.fillText(text, cellBounds.left + 2, verticalCentre, cellBounds.width - 4);
    }
}
