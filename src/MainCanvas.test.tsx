import { mount } from 'enzyme';
import * as React from 'react';
import { GridCanvasRenderer } from './gridCanvasRenderer';
import { GridState } from './gridState';
import { MainCanvas, MainCanvasProps } from './MainCanvas';

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

const props: MainCanvasProps<null> = {
    height: 100,
    width: 100,
    frozenColsWidth: 0,
    frozenRowsHeight: 0,
    gridState: new GridState([{width: 40} as any], [], 20, 1, 0, 0, () => false),
    dpr: 1,
};

describe('MainCanvas', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('draws to its canvas when base props change', () => {
        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);

        props.gridState.rowHeight(30);

        expect(MockedRenderer).toHaveBeenCalled();
        expect(mockUpdateProps).toHaveBeenCalled();
    });

    it('redraws to its canvas when pos props change', () => {
        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);

        props.gridState.gridOffsetRaw({ x: 10, y: 10 });

        expect(mockUpdateProps).toHaveBeenCalled();
    });
});
