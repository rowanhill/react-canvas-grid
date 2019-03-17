import { mount } from 'enzyme';
import * as React from 'react';
import { MainCanvas, MainCanvasProps } from './MainCanvas';
import { MainCanvasRenderer } from './mainCanvasRenderer';

const mockFixScale = jest.fn();
const mockDraw = jest.fn();
jest.mock('./mainCanvasRenderer', () => {
    return {
        MainCanvasRenderer: jest.fn().mockImplementation(() => {
            return {
                fixScale: mockFixScale,
                draw: mockDraw,
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
    gridOffset: { x: 0, y: 0 },
    height: 100,
    width: 100,
    rowHeight: 20,
    visibleRect: { top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100 },
};

describe('MainCanvas', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('draws to it\'s canvas when mounted', () => {
        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);

        expect(MockedRenderer).toHaveBeenCalled();
        expect(mockDraw).toHaveBeenCalled();
    });

    it('fixes the scale of the canvas context exactly once', () => {
        const cduSpy = jest.spyOn(MainCanvas.prototype, 'componentDidUpdate');

        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);
        bc.setProps({ ...props, gridOffset: { x: 1, y: 1 } });

        expect(MockedRenderer).toHaveBeenCalled();
        expect(cduSpy).toHaveBeenCalledTimes(2); // There were multiple component updates
        expect(mockFixScale).toHaveBeenCalledTimes(1); // But only one fixScale
    });

    it('redraws to its canvas with details of previous draw when non-fundamental props change', () => {
        mockDraw.mockReturnValue({
            gridOffset: { x: 0, y: 0 },
            rect: {},
        });

        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);
        bc.setProps({ ...props, gridOffset: { x: 1, y: 1 } });

        expect(mockDraw).toHaveBeenCalledTimes(2);
        expect(mockDraw).toHaveBeenNthCalledWith(1, expect.anything(), null);
        expect(mockDraw).toHaveBeenNthCalledWith(2,
            expect.anything(),
            expect.objectContaining({ gridOffset: expect.anything(), rect: expect.anything()}),
        );
    });

    it('redraws to its canvas discarding prior draw info when fundamental props change', () => {
        mockDraw.mockReturnValue({
            gridOffset: { x: 0, y: 0 },
            rect: {},
        });

        const bc = mount(<MainCanvas {...props} />);
        bc.setProps(props);
        bc.setProps({ ...props, rowHeight: 30 });

        expect(mockDraw).toHaveBeenCalledTimes(2);
        expect(mockDraw).toHaveBeenNthCalledWith(1, expect.anything(), null);
        expect(mockDraw).toHaveBeenNthCalledWith(2, expect.anything(), null);
    });
});
