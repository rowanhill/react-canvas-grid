import * as ScrollGeometry from '../scrollbarGeometry';
import { BaseScrollbarRenderer, ScrollbarRendererBasics, styles } from './baseScrollbarRenderer';
import { drawHScrollbar } from './horizontalScrollbarRenderer';
import { drawVScrollbar } from './verticalScrollbarRenderer';

export class CornerScrollbarRenderer extends BaseScrollbarRenderer {
    constructor(canvas: HTMLCanvasElement, basicProps: ScrollbarRendererBasics) {
        super('scrollbar corner', canvas, basicProps);
    }

    public draw = () => {
        const context = this.context;
        // Draw scrollbar gutters
        const vBounds = this.basicProps.verticalGutterBounds;
        const hBounds = this.basicProps.horizontalGutterBounds;
        if (hBounds && vBounds) {
            this.context.fillStyle = styles.scrollGutters.fill;
            this.context.fillRect(vBounds.left, hBounds.top, vBounds.width, hBounds.height);

            this.context.strokeStyle = styles.scrollGutters.stroke;
            this.context.lineWidth = 1;
            this.context.beginPath();
            this.context.moveTo(vBounds.right, hBounds.top);
            this.context.lineTo(vBounds.right, hBounds.bottom);
            this.context.moveTo(vBounds.left, vBounds.bottom);
            this.context.lineTo(vBounds.right, vBounds.bottom);
            this.context.stroke();
        }

        // Draw (the ends of) the scrollbars (if needed)
        drawHScrollbar(context, this.basicProps.horizontalScrollbarPos, this.basicProps.hoveredScrollbar);
        drawVScrollbar(context, this.basicProps.verticalScrollbarPos, this.basicProps.hoveredScrollbar);
    }

    public translate = () => {
        const hBounds = this.basicProps.horizontalGutterBounds;
        const vBounds = this.basicProps.verticalGutterBounds;
        if (hBounds && vBounds) {
            this.context.translate(-vBounds.left, -hBounds.top);
        }
    }
}
