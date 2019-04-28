import * as React from 'react';
import { ReactCanvasGrid } from '../../src/index';
import { CellDataChangeEvent, DefaultedReactCanvasGridProps } from '../../src/ReactCanvasGrid';
import { Holder } from '../components/ScrollingHolder';
import { createEditableFakeDataAndColumns } from '../data/dataAndColumns';

const getProps = () => {
    const colsAndRows = createEditableFakeDataAndColumns(100, 20, (x, y) => `${x + 1}x${y + 1}`);
    const props: DefaultedReactCanvasGridProps<string> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
    };
    return props;
};

describe('ReactCanvasGrid', () => {
    let changeStub: (event: CellDataChangeEvent<any>) => void;

    beforeEach(() => {
        changeStub = cy.stub().as('change') as unknown as (event: CellDataChangeEvent<string>) => void;
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<string>
            {...props}
            onCellDataChanged={changeStub}
            /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);

        cy.get('#rcg-holder canvas').eq(1).as('Canvas');
    });

    describe('after double-clicking an editable cell', () => {
        beforeEach(() => {
            cy.get('@Canvas')
                .trigger('dblclick', 5, 5, { force: true });
        });

        it('fires onCellDataChanged event when editing and hitting enter', () => {
            cy.get('input')
                .type('change{enter}')
                .then(() => expect(changeStub).to.have.been.calledWithMatch({ newData: '1x1change' }));
        });

        it('fires onCellDataChanged event when simply hitting enter', () => {
            cy.get('input')
                .type('{enter}')
                .then(() => expect(changeStub).to.have.been.calledWithMatch({ newData: '1x1' }));
        });

        it('fires onCellDataChanged event when editing clicking elsewhere', () => {
            cy.get('input')
                .type('change')
                .then(() => cy.get('@Canvas').click({ force: true }))
                .then(() => expect(changeStub).to.have.been.calledWithMatch({ newData: '1x1change' }));
        });

        it('fires onCellDataChanged event when simply clicking elsewhere', () => {
            cy.get('input')
                .then(() => cy.get('@Canvas').click({ force: true }))
                .then(() => expect(changeStub).to.have.been.calledWithMatch({ newData: '1x1' }));
        });

        it('does not fire onCellDataChanged when hitting escape', () => {
            cy.get('input')
                .type('{esc}')
                .then(() => expect(changeStub).not.to.have.been.called);
        });
    });
});
