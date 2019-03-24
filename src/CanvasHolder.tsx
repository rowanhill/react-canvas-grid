import * as React from 'react';
import { OFFSCREEN_CANVAS_PADDING } from './gridGeometry';
import { Size } from './types';

export interface CanvasHolderProps {
    canvasSize: Size;
    children?: React.ReactNode;
}

export const CanvasHolder = React.forwardRef((props: CanvasHolderProps, ref: React.Ref<HTMLDivElement>) => {
    const style: React.CSSProperties = {
        position: 'relative',
        width: `${props.canvasSize.width - 2 * OFFSCREEN_CANVAS_PADDING}px`,
        height: `${props.canvasSize.height - 2 * OFFSCREEN_CANVAS_PADDING}px`,
        overflow: 'hidden',
    };

    return (
        <div ref={ref} style={style}>
            {props.children}
        </div>
    );
});
