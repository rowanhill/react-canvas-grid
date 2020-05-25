import { ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { CanvasRendererPosition } from './commonCanvasRenderer';
import { FrozenCanvasCoreProps, FrozenCanvasProps } from './FrozenCanvas';
import { GridCanvas } from './GridCanvas';

type FrozenColsCanvasProps<T> =  FrozenCanvasCoreProps<T> & Pick<FrozenCanvasProps<T>, 'horizontalGutterBounds'>;

export class FrozenColsCanvas<T> extends React.PureComponent<FrozenColsCanvasProps<T>> {
    private readonly colsPosProps: ReactiveFn<CanvasRendererPosition>;

    public constructor(props: FrozenColsCanvasProps<T>) {
        super(props);

        const colsVisibleRect = transformer(
            [props.gridState.visibleRect, props.gridState.frozenRowsHeight, props.gridState.horizontalGutterBounds],
            (visibleRect, frozenRowsHeight, horizontalGutterBounds): ClientRect => {
                const scrollGutterHeight = horizontalGutterBounds ? horizontalGutterBounds.height : 0;
                return {
                    ...visibleRect,
                    left: 0,
                    right: visibleRect.width,
                    top: visibleRect.top + frozenRowsHeight,
                    bottom: visibleRect.bottom - scrollGutterHeight,
                    height: visibleRect.height - frozenRowsHeight - scrollGutterHeight,
                };
            });
        this.colsPosProps = transformer([colsVisibleRect], (visibleRect): CanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));
    }

    public render() {
        const horizontalGutterBounds = this.props.horizontalGutterBounds;
        const scrollGutterHeight = horizontalGutterBounds ? horizontalGutterBounds.height : 0;
        const props = {
            ...this.props,
            top: this.props.frozenRowsHeight,
            left: 0,
            height: this.props.height - this.props.frozenRowsHeight - scrollGutterHeight,
            width: this.props.frozenColsWidth,
            posProps: this.colsPosProps,
        };
        return (
            <GridCanvas {...props} name="cols" />
        );
    }
}
