import { Coord, SelectRange } from '.';
import { CommonCanvasRenderer } from './commonCanvasRenderer';

export interface HighlightCanvassRendererBasics {
    width: number;
    height: number;
    rowHeight: number;
    colBoundaries: Array<{left: number; right: number}>;
    borderWidth: number;
    dpr: number;
}

export interface HighlightCanvasRendererPosition {
    gridOffset: Coord;
}

export interface HighlightCanvasRendererSelection {
    selectedRange: SelectRange|null;
}

const defaultPosProps = {
    gridOffset: { x: 0, y: 0 },
};

export class HighlightCanvasRenderer extends CommonCanvasRenderer<any> {
    private basicProps: HighlightCanvassRendererBasics;
    private posProps: HighlightCanvasRendererPosition = defaultPosProps;
    private selectionProps: HighlightCanvasRendererSelection = { selectedRange: null };

    constructor(canvas: HTMLCanvasElement, basicProps: HighlightCanvassRendererBasics) {
        super(canvas, basicProps.dpr, true);
        this.basicProps = basicProps;
    }

    public reset(basicProps: HighlightCanvassRendererBasics) {
        this.basicProps = basicProps;
        this.draw();
    }

    public updatePos(posProps: HighlightCanvasRendererPosition) {
        this.posProps = posProps;
        this.draw();
    }

    public updateSelection(selectProps: HighlightCanvasRendererSelection) {
        this.selectionProps = selectProps;
        this.draw();
    }

    public draw() {
        const context = this.canvas.getContext('2d', { alpha: true });
        if (!context) {
            return;
        }

        // Clear the higlight layer
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        context.translate(-this.posProps.gridOffset.x, -this.posProps.gridOffset.y);

        // Draw selected cell highlights
        context.fillStyle = '#44aaff55';
        context.strokeStyle = '#44aaffcc';
        if (this.selectionProps.selectedRange) {
            const tl = this.gridToSizer(this.selectionProps.selectedRange.topLeft);
            const br = this.gridToSizer(this.selectionProps.selectedRange.bottomRight);
            context.fillRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
            context.strokeRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.posProps.gridOffset.x, this.posProps.gridOffset.y);
    }

    private gridToSizer = ({x, y}: {x: number; y: number}): ClientRect => {
        return {
            top: y * (this.basicProps.rowHeight + this.basicProps.borderWidth),
            bottom: (y + 1) * (this.basicProps.rowHeight + + this.basicProps.borderWidth) - this.basicProps.borderWidth,
            height: this.basicProps.rowHeight,
            left: this.basicProps.colBoundaries[x].left,
            right: this.basicProps.colBoundaries[x].right,
            width: this.basicProps.colBoundaries[x].right - this.basicProps.colBoundaries[x].left,
        };
    }
}
