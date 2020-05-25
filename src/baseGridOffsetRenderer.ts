import { CommonCanvasRenderer } from './commonCanvasRenderer';

export class BaseGridOffsetRenderer<T> extends CommonCanvasRenderer<T> {
    public translate() {
        this.context.translate(-this.posProps.gridOffset.x, -this.posProps.gridOffset.y);
    }
}
