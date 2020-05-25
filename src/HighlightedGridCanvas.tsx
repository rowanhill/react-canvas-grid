import * as React from 'react';
import { GridCanvas, GridCanvasProps } from './GridCanvas';
import { HighlightCanvas, HighlightCanvasProps } from './HighlightCanvas';

type LayeredCanvasesProps<T> = GridCanvasProps<T> & HighlightCanvasProps<T>;

export const HighlightedGridCanvas = <T extends {}>(props: LayeredCanvasesProps<T>) => {
    return (
        <>
            <GridCanvas
                name={props.name}
                top={props.top}
                left={props.left}
                width={props.width}
                height={props.height}
                dpr={props.dpr}
                gridState={props.gridState}
                posProps={props.posProps}
            />
            <HighlightCanvas
                name={`${props.name}-highlight`}
                top={props.top}
                left={props.left}
                width={props.width}
                height={props.height}
                dpr={props.dpr}
                gridState={props.gridState}
                posProps={props.posProps}
            />
        </>
    );
};
