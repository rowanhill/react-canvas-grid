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
    // let changeStub: (event: CellDataChangeEvent<any>) => void;

    beforeEach(() => {
        const onKeyPressStub = cy.stub().as('keypress');
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<string>
            {...props}
            onKeyPress={onKeyPressStub as any}
            /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);

        cy.get('#rcg-holder canvas').eq(1).as('Canvas');
        cy.get('#rcg-holder div').as('Root');
    });

    describe('after focusing the component', () => {
        beforeEach(() => {
            cy.get('@Root').click();
        });

        it('fires onKeyPress when pressing a key', () => {
            cy.get('@Root')
                .type('a')
                .then(() => cy.get('@keypress'))
                .then((keypress) => expect(keypress).to.have.been.calledWithMatch({ key: 'a' }));
        });

        it('does not fire onKeyPress when typing into a cell edit input', () => {
            cy.get('@Root')
                .trigger('dblclick', 5, 5, { force: true })
                .find('input')
                .type('a')
                .then(() => cy.get('@keypress'))
                .then((keypress) => expect(keypress).not.to.have.been.called);
        });
    });
});
