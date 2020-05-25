import * as ScrollGeometry from '../scrollbarGeometry';
import { BaseScrollbarRenderer, ScrollbarRendererBasics, styles } from './baseScrollbarRenderer';

export class HorizontalScrollbarRenderer extends BaseScrollbarRenderer {
    constructor(canvas: HTMLCanvasElement, basicProps: ScrollbarRendererBasics) {
        super('horizontal scrollbar', canvas, basicProps);
    }

    public translate() {
        const hBounds = this.basicProps.horizontalGutterBounds;
        if (hBounds) {
            this.context.translate(-hBounds.left, -hBounds.top);
        }
    }

    public draw = () => {
        const context = this.context;

        // Draw scrollbar gutters
        const hBounds = this.basicProps.horizontalGutterBounds;
        const vBounds = this.basicProps.verticalGutterBounds;
        if (hBounds) {
            this.context.fillStyle = styles.scrollGutters.fill;
            this.context.fillRect(hBounds.left, hBounds.top, hBounds.width, hBounds.height);

            this.context.strokeStyle = styles.scrollGutters.stroke;
            this.context.lineWidth = 1;
            this.context.beginPath();
            this.context.moveTo(0, hBounds.top);
            this.context.lineTo(hBounds.width - (vBounds ? vBounds.width : 0), hBounds.top);
            this.context.moveTo(0, hBounds.bottom);
            this.context.lineTo(hBounds.width, hBounds.bottom);
            this.context.stroke();
        }

        // Draw horizontal scrollbar (if needed)
        drawHScrollbar(context, this.basicProps.horizontalScrollbarPos, this.basicProps.hoveredScrollbar);
    }
}

export function drawHScrollbar(
    context: CanvasRenderingContext2D,
    horizontalScrollbarPos: ScrollGeometry.ScrollbarPosition | null,
    hoveredScrollbar: 'x' | 'y' | null,
) {
    // Set up for drawing scrollbars
    context.lineCap = 'round';

    if (horizontalScrollbarPos) {
        if (hoveredScrollbar === 'x') {
            context.strokeStyle = styles.scrollbar.hoverFill;
            context.lineWidth = ScrollGeometry.barWidth + 3;
        } else {
            context.strokeStyle = styles.scrollbar.defaultFill;
            context.lineWidth = ScrollGeometry.barWidth;
        }
        const scrollPos = horizontalScrollbarPos;
        context.beginPath();
        context.moveTo(scrollPos.extent.start, scrollPos.transverse);
        context.lineTo(scrollPos.extent.end, scrollPos.transverse);
        context.stroke();
    }
}
