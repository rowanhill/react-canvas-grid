import * as React from 'react';
import { Holder } from '../components/StatefulHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const dataGen = () => null;

describe('ReactCanvasGrid', () => {
    beforeEach(() => {
        cy.mount(<Holder<null>
                initialColsNumber={100}
                initialRowsNumber={20}
                dataGen={dataGen}
                />, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('scrolls to the right to bring a focused column to the right into view', () => {
        cy.get('@Holder')
            .invoke('setState', {
                focusedColIndex: 30,
            })
            .matchImageSnapshot('focused-col-to-right');
    });

    it('scrolls to the left to bring a focused column to the left into view', () => {
        cy.get('div#cypress-jsdom > div')
            .trigger('wheel', { deltaX: 800, deltaY: 300 });
        cy.get('@Holder')
            .invoke('setState', {
                focusedColIndex: 2,
            })
            .matchImageSnapshot('focused-col-to-left');
    });

    it('accounts for frozen columns when scrolling left to bring a frozen column into view', () => {
        cy.get('@Holder')
            .invoke('setState', {
                frozenCols: 2,
            });
        cy.get('div#cypress-jsdom > div')
            .trigger('wheel', { deltaX: 800, deltaY: 300 });
        cy.get('@Holder')
            .invoke('setState', {
                focusedColIndex: 5,
            })
            .matchImageSnapshot('focused-col-to-left-with-frozen-cols');
    });
});
