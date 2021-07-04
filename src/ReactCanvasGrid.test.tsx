import { mount } from 'enzyme';
import * as React from 'react';
import { DefaultedReactCanvasGridProps, ReactCanvasGrid } from './ReactCanvasGrid';

// Mock out the canvas components with no-op components, because canvas contexts aren't
// supported in a Jest (i.e. node) context
jest.mock('./MainCanvas', () => {
    return {
        MainCanvas: (props: any) => {
            return (
                <>{props.children}</>
            );
        },
    };
});
jest.mock('./FrozenCanvas', () => {
    return {
        FrozenCanvas: (props: any) => {
            return (
                <>{props.children}</>
            );
        },
    };
});
jest.mock('./scrollbars/ScrollbarCanvas', () => {
    return {
        ScrollbarCanvas: (props: any) => {
            return (
                <>{props.children}</>
            );
        },
    };
});

let props: DefaultedReactCanvasGridProps<null>;

describe('ReactCanvasGrid', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        props = {
            rowHeight: 15,
            columns: [
                { width: 50, fieldName: 'A' },
                { width: 50, fieldName: 'B' },
                { width: 50, fieldName: 'C' },
            ],
            data: [
                {
                    'A': { title: 'A1', text: 'A1', data: null },
                    'B': { title: 'B1', text: 'B1', data: null },
                    'C': { title: 'C1', text: 'C1', data: null },
                },
                {
                    'A': { title: 'A2', text: 'A', data: null },
                    'B': { title: 'B2', text: 'B', data: null },
                    'C': { title: 'C2', text: 'C', data: null },
                },
                {
                    'A': { title: 'A3', text: 'A3', data: null },
                    'B': { title: 'B3', text: 'B3', data: null },
                    'C': { title: 'C3', text: 'C3', data: null },
                },
            ]
        };
    });

    it('starts with no title text', () => {
        const rcg = mount(<ReactCanvasGrid {...props} />);

        expect(rcg.find('div').prop('title')).toBeUndefined();
    });

    it('sets the title text when mousing over a cell', () => {
        const rcg = mount(<ReactCanvasGrid {...props} />);

        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
        rcg.update();

        expect(rcg.find('div').prop('title')).toBe('A1');
    });

    it('sets the title text to the hovered cell when the grid is scrolled', () => {
        const rcg = mount(<ReactCanvasGrid {...props} />);

        (rcg.find('div').instance() as unknown as EventTarget).dispatchEvent(new WheelEvent('wheel', { deltaY: 20 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
        rcg.update();

        expect(rcg.find('div').prop('title')).toBe('A2');
    });

    it('sets the title text to the frozen cell\'s title when mousing over a frozen cell when the grid is scrolled', () => {
        const rcg = mount(<ReactCanvasGrid {...props} frozenRows={1} />);

        (rcg.find('div').instance() as unknown as EventTarget).dispatchEvent(new WheelEvent('wheel', { deltaY: 20 }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
        rcg.update();

        expect(rcg.find('div').prop('title')).toBe('A1');
    });
});
