import * as React from 'react';
import { GridState } from '../gridState';
import { CornerScrollbarCanvas } from './CornerScrollbarCanvas';
import { HorizontalScrollbarCanvas } from './HorizontalScrollbarCanvas';
import { VerticalScrollbarCanvas } from './VerticalScrollbarCanvas';

export interface ScrollbarCanvasProps<T> {
    dpr: number;
    gridState: GridState<T>;
}

export interface ScrollbarCanvasGutterProps {
    horizontalGutterBounds: ClientRect | null;
    verticalGutterBounds: ClientRect | null;
}

export class ScrollbarCanvas<T> extends React.PureComponent<ScrollbarCanvasProps<T> & ScrollbarCanvasGutterProps> {
    public render() {
        const { horizontalGutterBounds, verticalGutterBounds, ...coreProps } = this.props;
        return (
            <React.Fragment>
                {horizontalGutterBounds &&
                    <HorizontalScrollbarCanvas {...coreProps} horizontalGutterBounds={horizontalGutterBounds} />
                }
                {verticalGutterBounds &&
                    <VerticalScrollbarCanvas {...coreProps} verticalGutterBounds={verticalGutterBounds} />
                }
                {horizontalGutterBounds && verticalGutterBounds &&
                    <CornerScrollbarCanvas
                        {...coreProps}
                        horizontalGutterBounds={horizontalGutterBounds}
                        verticalGutterBounds={verticalGutterBounds}
                    />
                }
            </React.Fragment>
        );
    }
}
