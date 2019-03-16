import * as React from 'react';
import { DefaultedReactCanvasGridProps, ReactCanvasGrid } from '../../src/ReactCanvasGrid';
import { Holder } from '../components/ScrollingHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const getProps = () => {
    const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
    const props: DefaultedReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
        frozenRows: 1,
        frozenCols: 1,
    };
    return props;
};

describe('ReactCanvasGrid with frozen rows & cells', () => {
    beforeEach(() => {
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('keeps the frozen rows and columns shown on the grid (and fixes the top-left cells in place)', () => {
        cy.get('#rcg-holder')
            .scrollTo(300, 300);
        cy.wait(1000); // Wait to ensure scroll bar has faded away on osx

        cy.get('#rcg-holder')
            .matchImageSnapshot('scrolled-grid-with-frozen-cells');
    });
});
