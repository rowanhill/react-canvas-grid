import { mount } from 'enzyme';
import { transformer } from 'instigator';
import * as React from 'react';
import { CanvasRendererPosition } from './commonCanvasRenderer';
import { GridCanvas, GridCanvasProps } from './GridCanvas';
import { GridCanvasRenderer } from './gridCanvasRenderer';
import { GridState } from './gridState';

const mockFixScale = jest.fn();
const mockDraw = jest.fn();
const mockUpdateProps = jest.fn();
jest.mock('./gridCanvasRenderer', () => {
    return {
        GridCanvasRenderer: jest.fn().mockImplementation(() => {
            return {
                fixScale: mockFixScale,
                draw: mockDraw,
                updateProps: mockUpdateProps,
                __dummy__: 'fake GridCanvasRenderer',
            };
        }),
    };
});
const MockedRenderer = GridCanvasRenderer as jest.Mock<GridCanvasRenderer<null>>;

let props: GridCanvasProps<null>;

describe('GridCanvas', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const gridState = new GridState<null>([{width: 40} as any], [], 20, 1, 0, 0, () => false);
        const posProps = transformer(
            [gridState.gridOffset, gridState.canvasSize],
            (offset, size): CanvasRendererPosition => {
                return {
                    gridOffset: offset,
                    visibleRect: {
                        left: offset.x,
                        top: offset.y,
                        width: size.width,
                        height: size.height,
                        right: offset.x + size.width,
                        bottom: offset.y + size.height,
                    },
                };
            },
        );
        props = {
            name: 'test',
            top: 0,
            left: 0,
            height: 100,
            width: 100,
            gridState,
            dpr: 1,
            posProps,
        };
    });

    it('draws to its canvas when base props change', () => {
        const bc = mount(<GridCanvas {...props} />);
        bc.setProps(props);

        props.gridState.rowHeight(30);

        expect(MockedRenderer).toHaveBeenCalled();
        expect(mockUpdateProps).toHaveBeenCalled();
    });

    it('redraws to its canvas when pos props change', () => {
        const bc = mount(<GridCanvas {...props} />);
        bc.setProps(props);

        props.gridState.gridOffsetRaw({ x: 10, y: 10 });

        expect(mockUpdateProps).toHaveBeenCalled();
    });
});
