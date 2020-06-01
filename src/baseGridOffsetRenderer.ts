import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { Coord } from './types';

export interface CanvasRendererPosition {
    gridOffset: Coord;
    visibleRect: ClientRect;
}

const defaultPosProps = {
    gridOffset: { x: 0, y: 0 },
    visibleRect: { left: 0, top: 0, right: 0, bottom: 0, height: 0, width: 0 },
};

export class BaseGridOffsetRenderer<T> extends CommonCanvasRenderer<T> {
    protected posProps: CanvasRendererPosition = defaultPosProps;

    public translate() {
        this.context.translate(-this.posProps.gridOffset.x, -this.posProps.gridOffset.y);
    }
}
