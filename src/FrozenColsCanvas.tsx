import { ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { FrozenCanvasProps } from './FrozenCanvas';
import { GridCanvas } from './GridCanvas';
import { GridCanvasRendererPosition } from './gridCanvasRenderer';

export class FrozenColsCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly colsPosProps: ReactiveFn<GridCanvasRendererPosition>;

    public constructor(props: FrozenCanvasProps<T>) {
        super(props);

        const colsVisibleRect = transformer(
            [props.gridState.visibleRect, props.gridState.frozenRowsHeight],
            (visibleRect, frozenRowsHeight): ClientRect => {
                return {
                    ...visibleRect,
                    left: 0,
                    right: visibleRect.width,
                    top: visibleRect.top + frozenRowsHeight,
                    height: visibleRect.height - frozenRowsHeight,
                };
            });
        this.colsPosProps = transformer([colsVisibleRect], (visibleRect): GridCanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));
    }

    public render() {
        const props = {
            ...this.props,
            top: this.props.frozenRowsHeight,
            left: 0,
            height: this.props.height - this.props.frozenRowsHeight,
            width: this.props.frozenColsWidth,
            posProps: this.colsPosProps,
        };
        return (
            <GridCanvas {...props} />
        );
    }
}
