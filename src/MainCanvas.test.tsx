import { mount } from 'enzyme';
import * as React from 'react';
import { MainCanvas, MainCanvasProps } from './MainCanvas';
import { MainCanvasRenderer } from './mainCanvasRenderer';

const mockFixScale = jest.fn();
const mockDraw = jest.fn();
const mockReset = jest.fn();
const mockUpdatePos = jest.fn();
jest.mock('./mainCanvasRenderer', () => {
    return {
        MainCanvasRenderer: jest.fn().mockImplementation(() => {
            return {
                fixScale: mockFixScale,
                draw: mockDraw,
                reset: mockReset,
                updatePos: mockUpdatePos,
                __dummy__: 'fake MainCanvasRenderer',
            };
        }),
    };
});
const MockedRenderer = MainCanvasRenderer as jest.Mock<MainCanvasRenderer<null>>;

const props: MainCanvasProps<null> = {
    borderWidth: 1,
    colBoundaries: [],
    columns: [],
    data: [],
    gridHeight: 100,
    height: 100,
    width: 100,
    rowHeight: 20,
    setRenderer: jest.fn(),
};

describe('MainCanvas', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('draws to it\'s canvas when mounted', () => {
        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);

        expect(MockedRenderer).toHaveBeenCalled();
        expect(mockReset).toHaveBeenCalled();
    });

    it('sets the renderer when mounted', () => {
        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);

        expect(props.setRenderer).toHaveBeenCalledWith(
            expect.objectContaining({__dummy__: 'fake MainCanvasRenderer'}),
        );
    });

    it('fixes the scale of the canvas context exactly once', () => {
        const cduSpy = jest.spyOn(MainCanvas.prototype, 'componentDidUpdate');

        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);
        bc.setProps({ ...props, borderWidth: 2 });

        expect(MockedRenderer).toHaveBeenCalled();
        expect(cduSpy).toHaveBeenCalledTimes(2); // There were multiple component updates
        expect(mockFixScale).toHaveBeenCalledTimes(1); // But only one fixScale
    });

    it('redraws to its canvas when props change', () => {
        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);
        bc.setProps({ ...props, borderWidth: 2 });

        expect(mockReset).toHaveBeenCalledTimes(2);
        expect(mockReset).toHaveBeenNthCalledWith(1, { ...props, dpr: expect.anything() });
        expect(mockReset).toHaveBeenNthCalledWith(2, { ...props, borderWidth: 2, dpr: expect.anything() });
    });
});
