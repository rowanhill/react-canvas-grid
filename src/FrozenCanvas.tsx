import * as React from 'react';
import { FrozenColsCanvas } from './FrozenColsCanvas';
import { FrozenCornerCanvas } from './FrozenCornerCanvas';
import { FrozenRowsCanvas } from './FrozenRowsCanvas';
import { GridState } from './gridState';

export interface FrozenCanvasCoreProps<T> {
    width: number;
    height: number;
    frozenColsWidth: number;
    frozenRowsHeight: number;
    dpr: number;
    gridState: GridState<T>;
}
export interface FrozenCanvasProps<T> extends FrozenCanvasCoreProps<T> {
    horizontalGutterBounds: ClientRect | null;
    verticalGutterBounds: ClientRect | null;
}

export class FrozenCanvas<T> extends React.PureComponent<FrozenCanvasProps<T>> {
    public render() {
        const { horizontalGutterBounds, verticalGutterBounds, ...coreProps } = this.props;
        return (
            <React.Fragment>
                {(this.props.frozenRowsHeight > 0 && this.props.frozenColsWidth > 0) &&
                    <FrozenCornerCanvas {...coreProps} />
                }
                {this.props.frozenRowsHeight > 0 &&
                    <FrozenRowsCanvas {...coreProps} verticalGutterBounds={verticalGutterBounds} />
                }
                {this.props.frozenColsWidth > 0 &&
                    <FrozenColsCanvas {...coreProps} horizontalGutterBounds={horizontalGutterBounds} />
                }
            </React.Fragment>
        );
    }
}
