import { ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { CanvasRendererPosition } from './baseGridOffsetRenderer';
import { GridState } from './gridState';
import { HighlightedGridCanvas } from './HighlightedGridCanvas';

export interface MainCanvasProps<T> {
    width: number;
    height: number;
    frozenColsWidth: number;
    frozenRowsHeight: number;
    dpr: number;
    gridState: GridState<T>;
}

export class MainCanvas<T> extends React.PureComponent<MainCanvasProps<T>> {
    private readonly posProps: ReactiveFn<CanvasRendererPosition>;

    public constructor(props: MainCanvasProps<T>) {
        super(props);

        const mainVisibleRect = transformer(
            [props.gridState.visibleRect, props.gridState.frozenRowsHeight, props.gridState.frozenColsWidth],
            (visibleRect, frozenRowsHeight, frozenColsWidth): ClientRect => {
                return {
                    ...visibleRect,
                    top: visibleRect.top + frozenRowsHeight,
                    left: visibleRect.left + frozenColsWidth,
                    height: visibleRect.height - frozenRowsHeight,
                    width: visibleRect.width - frozenColsWidth,
                };
            });
        this.posProps = transformer([mainVisibleRect], (visibleRect): CanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));
    }

    public render() {
        const props = {
            ...this.props,
            top: this.props.frozenRowsHeight,
            left: this.props.frozenColsWidth,
            height: Math.max(this.props.height - this.props.frozenRowsHeight, 0),
            width: Math.max(this.props.width - this.props.frozenColsWidth, 0),
            posProps: this.posProps,
        };
        return (
            <HighlightedGridCanvas {...props} name="main" />
        );
    }
}
