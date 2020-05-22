import { ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { FrozenCanvasCoreProps } from './FrozenCanvas';
import { GridCanvas } from './GridCanvas';
import { GridCanvasRendererPosition } from './gridCanvasRenderer';

export class FrozenCornerCanvas<T> extends React.PureComponent<FrozenCanvasCoreProps<T>> {
    private readonly cornerPosProps: ReactiveFn<GridCanvasRendererPosition>;

    public constructor(props: FrozenCanvasCoreProps<T>) {
        super(props);

        const cornerVisibleRect = transformer(
            [props.gridState.visibleRect],
            (visibleRect): ClientRect => {
                return {
                    ...visibleRect,
                    top: 0,
                    left: 0,
                    right: visibleRect.width,
                    bottom: visibleRect.height,
                };
            });
        this.cornerPosProps = transformer([cornerVisibleRect], (visibleRect): GridCanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));
    }

    public render() {
        const props = {
            ...this.props,
            top: 0,
            left: 0,
            height: this.props.frozenRowsHeight,
            width: this.props.frozenColsWidth,
            posProps: this.cornerPosProps,
        };
        return (
            <GridCanvas {...props} name="corner" />
        );
    }
}
