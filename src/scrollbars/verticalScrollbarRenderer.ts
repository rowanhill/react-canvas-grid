import * as ScrollGeometry from '../scrollbarGeometry';
import { BaseScrollbarRenderer, ScrollbarRendererBasics, styles } from './baseScrollbarRenderer';

export class VerticalScrollbarRenderer extends BaseScrollbarRenderer {
    constructor(canvas: HTMLCanvasElement, basicProps: ScrollbarRendererBasics) {
        super('vertical scrollbar', canvas, basicProps);
    }

    public translate() {
        const vBounds = this.basicProps.verticalGutterBounds;
        if (vBounds) {
            this.context.translate(-vBounds.left, -vBounds.top);
        }
    }

    public draw = () => {
        const context = this.context;

        // Draw scrollbar gutters
        const vBounds = this.basicProps.verticalGutterBounds;
        const hBounds = this.basicProps.horizontalGutterBounds;
        if (vBounds) {
            this.context.fillStyle = styles.scrollGutters.fill;
            this.context.fillRect(vBounds.left, vBounds.top, vBounds.width, vBounds.height);

            this.context.strokeStyle = styles.scrollGutters.stroke;
            this.context.lineWidth = 1;
            this.context.beginPath();
            this.context.moveTo(vBounds.left, 0);
            this.context.lineTo(vBounds.left, vBounds.height - (hBounds ? hBounds.height : 0));
            this.context.moveTo(vBounds.right, 0);
            this.context.lineTo(vBounds.right, vBounds.height);
            this.context.stroke();
        }

        // Set up for drawing scrollbars
        context.lineCap = 'round';

        // Draw vertical scrollbar (if needed)
        if (this.basicProps.verticalScrollbarPos) {
            if (this.basicProps.hoveredScrollbar === 'y') {
                context.strokeStyle = styles.scrollbar.hoverFill;
                context.lineWidth = ScrollGeometry.barWidth + 3;
            } else {
                context.strokeStyle = styles.scrollbar.defaultFill;
                context.lineWidth = ScrollGeometry.barWidth;
            }
            const scrollPos = this.basicProps.verticalScrollbarPos;
            context.beginPath();
            context.moveTo(scrollPos.transverse, scrollPos.extent.start);
            context.lineTo(scrollPos.transverse, scrollPos.extent.end);
            context.stroke();
        }
    }
}
