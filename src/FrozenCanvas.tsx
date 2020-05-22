import * as React from 'react';
import { FrozenColsCanvas } from './FrozenColsCanvas';
import { FrozenCornerCanvas } from './FrozenCornerCanvas';
import { FrozenRowsCanvas } from './FrozenRowsCanvas';
import { GridState } from './gridState';

export interface FrozenCanvasProps<T> {
    width: number;
    height: number;
    frozenColsWidth: number;
    frozenRowsHeight: number;
    gridState: GridState<T>;
}

export class FrozenCanvas<T> extends React.PureComponent<FrozenCanvasProps<T>> {
    public render() {
        return (
            <React.Fragment>
                {(this.props.frozenRowsHeight > 0 && this.props.frozenColsWidth > 0) &&
                    <FrozenCornerCanvas {...this.props} />
                }
                {this.props.frozenRowsHeight > 0 &&
                    <FrozenRowsCanvas {...this.props} />
                }
                {this.props.frozenColsWidth > 0 &&
                    <FrozenColsCanvas {...this.props} />
                }
            </React.Fragment>
        );
    }
}
