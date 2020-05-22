import { ReactiveFn, transformer } from 'instigator';
import * as React from 'react';
import { FrozenCanvasProps } from './FrozenCanvas';
import { GridCanvas } from './GridCanvas';
import { GridCanvasRendererPosition } from './gridCanvasRenderer';
import { GridState } from './gridState';

export interface MainCanvasProps<T> {
    width: number;
    height: number;
    frozenColsWidth: number;
    frozenRowsHeight: number;
    dpr: number;
    gridState: GridState<T>;
}

export class MainCanvas<T> extends React.PureComponent<MainCanvasProps<T>> {
    private readonly posProps: ReactiveFn<GridCanvasRendererPosition>;

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
        this.posProps = transformer([mainVisibleRect], (visibleRect): GridCanvasRendererPosition => ({
            gridOffset: { x: visibleRect.left, y: visibleRect.top },
            visibleRect,
        }));
    }

    public render() {
        const props = {
            ...this.props,
            top: this.props.frozenRowsHeight,
            left: this.props.frozenColsWidth,
            height: this.props.height - this.props.frozenRowsHeight,
            width: this.props.width - this.props.frozenColsWidth,
            posProps: this.posProps,
        };
        return (
            <GridCanvas {...props} name="main" />
        );
    }
}
