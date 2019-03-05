import * as React from 'react';
import {ReactCanvasGrid, ReactCanvasGridProps} from '../../dist/index';
import { createFakeDataAndColumns } from '../data/dataAndColumns';
import { Holder } from '../components/ScrollingHolder';

const getProps = () => {
    const colsAndRows = createFakeDataAndColumns(2, 2, () => null);
    const props: ReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
    };
    return props;
};

describe('ReactCanvasGrid with very little data', () => {
    beforeEach(() => {
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('renders a grid of data', () => {
        cy.get('#rcg-holder').matchImageSnapshot('small-grid');
    });
});