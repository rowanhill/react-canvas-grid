import * as React from 'react';
import { ReactCanvasGrid } from '../../src/index';
import { DefaultedReactCanvasGridProps } from '../../src/ReactCanvasGrid';
import { Holder } from '../components/ScrollingHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const getProps = () => {
    const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
    const props: DefaultedReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
    };
    return props;
};

describe('The scrollbars in a grid larger than the canvas', () => {
    beforeEach(() => {
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('get darker and larger when hovered', () => {
        cy.get('#rcg-holder')
            .trigger('mousemove', 10, 395)
            .matchImageSnapshot('scrollbar-hover');
    });

    it('stay darker and larger when dragging, even if the mouse is no longer hovering over the bar', () => {
        cy.get('#rcg-holder')
            .trigger('mousemove', 10, 395)
            .trigger('mousedown', 10, 395, { buttons: 1 })
            .trigger('mousemove', 20, 350, { buttons: 1 })
            .matchImageSnapshot('scrollbar-drag-off-bar');
    });

    it('reset when releasing a drag and no longer hovering, without further mousemove', () => {
        cy.get('#rcg-holder')
            .trigger('mousemove', 10, 395)
            .trigger('mousedown', 10, 395, { buttons: 1 })
            .trigger('mousemove', 20, 350, { buttons: 1 })
            .trigger('mouseup', 20, 350)
            .matchImageSnapshot('scrollbar-release-drag-off-bar');
    });
});
