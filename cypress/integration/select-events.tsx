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

describe('ReactCanvasGrid', () => {
    let startStub: (range: SelectRange | null) => void;
    let updateStub: (range: SelectRange) => void;
    let endStub: (range: SelectRange | null) => void;

    describe('with no frozen cells', () => {
        beforeEach(() => {
            startStub = cy.stub().as('start') as unknown as (range: SelectRange | null) => void;
            updateStub = cy.stub().as('update') as unknown as (range: SelectRange) => void;
            endStub = cy.stub().as('end') as unknown as (range: SelectRange | null) => void;
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

            cy.get('#rcg-holder canvas').eq(1).as('Canvas');
        });

        it('fires onSelectionChangeStart on mouse down', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, force: true })
                .then(() => expect(startStub).to.be.calledOnce);
        });

        it('fires onSelectionChangeStart on mouse down with shift but no previous selection state', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, shiftKey: true, force: true })
                .then(() => expect(startStub).to.be.calledOnce);
        });

        it('fires onSelectionChangeUpdate on mouse down with shift', () => {
            cy.get('@Canvas').click('left', { force: true });

            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, shiftKey: true, force: true })
                .then(() => expect(updateStub).to.be.calledOnce);
        });

        it('fires onSelectChangeStart and onSelectChangeEnd on click', () => {
            cy.get('@Canvas')
                .click({ force: true })
                .then(() => expect(startStub).to.be.calledOnce)
                .then(() => expect(endStub).to.be.calledOnce);
        });

        it('fires onSelectChangeUpdate when mousing over a new cell', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, force: true })
                .trigger('mousemove', 'right', { buttons: 1, force: true })
                .then(() => expect(updateStub).to.be.calledOnce);
        });

        it('does not fire onSelectChangeUpdate when moving the mouse within the same cell', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 5, 5, { buttons: 1, force: true })
                .trigger('mousemove', 6, 6, { buttons: 1, force: true })
                .then(() => expect(updateStub).not.to.be.called);
        });
    });

    describe('with frozen cells', () => {
        beforeEach(() => {
            startStub = cy.stub().as('start') as unknown as (range: SelectRange | null) => void;
            updateStub = cy.stub().as('update') as unknown as (range: SelectRange) => void;
            endStub = cy.stub().as('end') as unknown as (range: SelectRange | null) => void;
            const props = getProps();
            cy.mount(<Holder><ReactCanvasGrid<null>
                {...props}
                onSelectionChangeStart={startStub}
                onSelectionChangeUpdate={updateStub}
                onSelectionChangeEnd={endStub}
                frozenRows={1}
                frozenCols={1}
                /></Holder>, 'Holder');

            cy.get('canvas').eq(0)
                .invoke('width')
                .should('be.greaterThan', 0);

            cy.get('#rcg-holder canvas').eq(1).as('Canvas');
        });

        it('fires start and end events with null selection ranges when clicking on a frozen cell', () => {
            cy.get('@Canvas')
                .click(5, 5, { force: true })
                .then(() => expect(startStub).to.be.calledWith(null))
                .then(() => expect(endStub).to.be.calledWith(null));
        });

        it('does not include frozen cells when dragging a selection range', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, force: true })
                .trigger('mousemove', 5, 5, { buttons: 1, force: true })
                .then(() => expect(updateStub).to.have.been.calledWithMatch({ topLeft: { x: 1, y: 1 } }));
        });
    });
});
