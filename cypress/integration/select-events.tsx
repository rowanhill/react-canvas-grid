import * as React from 'react';
import {ReactCanvasGrid, SelectRange} from '../../src/index';
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

describe('ReactCanvasGrid in an overflow:scroll parent', () => {
    let startStub: (range: SelectRange) => void;
    let updateStub: (range: SelectRange) => void;
    let endStub: (range: SelectRange) => void;

    beforeEach(() => {
        startStub = cy.stub().as('start') as unknown as (range: SelectRange) => void;
        updateStub = cy.stub().as('update') as unknown as (range: SelectRange) => void;
        endStub = cy.stub().as('end') as unknown as (range: SelectRange) => void;
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<null>
            {...props}
            onSelectionChangeStart={startStub}
            onSelectionChangeUpdate={updateStub}
            onSelectionChangeEnd={endStub}
            /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('fires onSelectionChangeStart on mouse down', () => {
        cy.get('#rcg-holder canvas').eq(1)
            .trigger('mousedown', 'center', { force: true })
            .then(() => expect(startStub).to.be.calledOnce);
    });

    it('fires onSelectChangeStart and onSelectChangeEnd on click', () => {
        cy.get('#rcg-holder canvas').eq(1)
            .click({ force: true })
            .then(() => expect(startStub).to.be.calledOnce)
            .then(() => expect(endStub).to.be.calledOnce);
    });

    it('fires onSelectChangeUpdate when mousing over a new cell', () => {
        cy.get('#rcg-holder canvas').eq(1)
            .trigger('mousedown', 'center', { force: true })
            .trigger('mousemove', 'right', { buttons: 1, force: true })
            .then(() => expect(updateStub).to.be.calledOnce);
    });

    it('does not fire onSelectChangeUpdate when moving the mouse within the same cell', () => {
        cy.get('#rcg-holder canvas').eq(1)
            .trigger('mousedown', 5, 5, { force: true })
            .trigger('mousemove', 6, 6, { buttons: 1, force: true })
            .then(() => expect(updateStub).not.to.be.called);
    });
});