import { ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { FrozenCanvasProps } from './FrozenCanvas';
import { GridCanvas } from './GridCanvas';
import { GridCanvasRendererPosition } from './gridCanvasRenderer';

export class FrozenRowsCanvas<T> extends React.Component<FrozenCanvasProps<T>, {}> {
    private readonly rowsPosProps: ReactiveFn<GridCanvasRendererPosition>;

    public constructor(props: FrozenCanvasProps<T>) {
        super(props);

        const rowsVisibleRect = transformer(
            [props.gridState.visibleRect, props.gridState.frozenColsWidth, props.gridState.verticalGutterBounds],
            (visibleRect, frozenColsWidth, verticalGutterBounds): ClientRect => {
                const scrollGutterWidth = verticalGutterBounds ? verticalGutterBounds.width : 0;
                return {
                    ...visibleRect,
                    top: 0,
                    bottom: visibleRect.height,
                    left: visibleRect.left + frozenColsWidth,
                    right: visibleRect.right - scrollGutterWidth,
                    width: visibleRect.width - frozenColsWidth - scrollGutterWidth,
                };
            });
        this.rowsPosProps = transformer([rowsVisibleRect], (visibleRect): GridCanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));
    }

    public render() {
        const verticalGutterBounds = this.props.gridState.verticalGutterBounds();
        const scrollGutterWidth = verticalGutterBounds ? verticalGutterBounds.width : 0;
        const props = {
            ...this.props,
            top: 0,
            left: this.props.frozenColsWidth,
            height: this.props.frozenRowsHeight,
            width: this.props.width - this.props.frozenColsWidth - scrollGutterWidth,
            posProps: this.rowsPosProps,
        };
        return (
            <GridCanvas {...props} name="rows" />
        );
    }
}
