import * as React from 'react';
import { Size, Coord } from './types';

export interface CanvasHolderProps {
    canvasSize: Size;
    gridOffset: Coord;
    children?: React.ReactNode;
}

export const CanvasHolder = React.forwardRef((props: CanvasHolderProps, ref: React.Ref<HTMLDivElement>) => {
    const transform = (props.gridOffset.x > 0 || props.gridOffset.y > 0) ? 
        `translate(${props.gridOffset.x}px, ${props.gridOffset.y}px)` :
        '';
    const style: React.CSSProperties = {
        position: 'relative',
        width: `${props.canvasSize.width}px`,
        transform: transform
    };

    return (
        <div ref={ref} style={style}>
            {props.children}
        </div>
    );
});