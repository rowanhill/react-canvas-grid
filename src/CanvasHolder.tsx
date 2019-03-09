import * as React from 'react';
import { Coord, Size } from './types';

export interface CanvasHolderProps {
    canvasSize: Size;
    children?: React.ReactNode;
}

export const CanvasHolder = React.forwardRef((props: CanvasHolderProps, ref: React.Ref<HTMLDivElement>) => {
    const style: React.CSSProperties = {
        position: 'relative',
        width: `${props.canvasSize.width}px`,
    };

    return (
        <div ref={ref} style={style}>
            {props.children}
        </div>
    );
});
