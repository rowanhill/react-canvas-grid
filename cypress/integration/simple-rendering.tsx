import * as React from 'react';
import {ReactCanvasGrid, ReactCanvasGridProps} from '../../dist/index';
import { createFakeDataAndColumns } from '../data/dataAndColumns';
import { Holder } from '../components/ScrollingHolder';

const getProps = () => {
    const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
    const props: ReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
    };
    return props;
};

describe('ReactCanvasGrid in an overflow:scroll parent', () => {
    beforeEach(() => {
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('renders a grid of data', () => {
        cy.get('#rcg-holder').matchImageSnapshot('simple-grid-in-scroll');
    });

    it('can be scrolled to the middle', () => {
        cy.get('#rcg-holder')
            .scrollTo(300, 300);
        cy.wait(1000); // Wait to ensure scroll bar has faded away on osx

        cy.get('#rcg-holder')
            .matchImageSnapshot('scrolled-grid-in-scroll');
    });
});