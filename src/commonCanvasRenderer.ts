import { CellDef, cellHasTextFunction, ColumnDef } from './types';

export const borderColour = 'lightgrey';

export class CommonCanvasRenderer<T> {
    protected readonly canvas: HTMLCanvasElement;
    protected readonly context: CanvasRenderingContext2D;
    protected readonly dpr: number;

    constructor(canvas: HTMLCanvasElement, dpr: number, alpha: boolean) {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d', { alpha });
        if (!context) {
            throw new Error('Could not create canvas contex');
        }
        this.context = context;
        this.dpr = dpr;
    }

    public fixScale() {
        this.context.scale(this.dpr, this.dpr);
    }

    public drawCell(cell: CellDef<T>, cellBounds: ClientRect, col: ColumnDef) {
        const renderBackground = cell.renderBackground || this.drawCellBackgroundDefault;
        const renderText = cell.renderText || this.drawCellTextDefault;

        renderBackground(this.context, cellBounds, cell, col);
        renderText(this.context, cellBounds, cell, col);
    }

    private drawCellBackgroundDefault = (
        context: CanvasRenderingContext2D,
        cellBounds: ClientRect,
        cell: CellDef<T>,
        column: ColumnDef,
    ) => {
        context.fillStyle = 'white';
        context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
    }

    private drawCellTextDefault = (
        context: CanvasRenderingContext2D,
        cellBounds: ClientRect,
        cell: CellDef<T>,
        column: ColumnDef,
    ) => {
        context.fillStyle = 'black';
        context.textBaseline = 'middle';
        const verticalCentre = cellBounds.top + (cellBounds.height / 2);
        const text = cellHasTextFunction(cell) ? cell.getText(cell.data) : cell.text;
        context.fillText(text, cellBounds.left + 2, verticalCentre, cellBounds.width - 4);
    }
}
