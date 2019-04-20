import { mount } from 'enzyme';
import * as React from 'react';
import { GridState } from './gridState';
import { MainCanvas, MainCanvasProps } from './MainCanvas';
import { MainCanvasRenderer } from './mainCanvasRenderer';

const mockFixScale = jest.fn();
const mockDraw = jest.fn();
const mockUpdateProps = jest.fn();
jest.mock('./mainCanvasRenderer', () => {
    return {
        MainCanvasRenderer: jest.fn().mockImplementation(() => {
            return {
                fixScale: mockFixScale,
                draw: mockDraw,
                updateProps: mockUpdateProps,
                __dummy__: 'fake MainCanvasRenderer',
            };
        }),
    };
});
const MockedRenderer = MainCanvasRenderer as jest.Mock<MainCanvasRenderer<null>>;

const props: MainCanvasProps<null> = {
    height: 100,
    width: 100,
    gridState: new GridState([{width: 40} as any], [], 20, 1, 0, 0),
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

        props.gridState.gridOffset({ x: 10, y: 10 });

        expect(mockUpdateProps).toHaveBeenCalled();
    });
});
