import * as React from 'react';
import { Holder } from '../components/StatefulHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const dataGen = () => null;

describe('ReactCanvasGrid with some initial data', () => {
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

    it('re-renders when the number of columns shrinks', () => {
        cy.get('@Holder').its('state').then((oldState) => {
            cy.get('@Holder')
                .invoke('setState', {
                    columns: oldState.columns.slice(0, 5),
                })
                .matchImageSnapshot('reduce-number-of-columns');
        });
    });

    it('re-renders when the number of columns grows', () => {
        const colsAndRowsLarge = createFakeDataAndColumns(100, 50, dataGen);

        cy.get('@Holder')
            .invoke('setState', {
                columns: colsAndRowsLarge.columns,
                data: colsAndRowsLarge.rows,
            })
            .matchImageSnapshot('increase-number-of-columns');
    });

    it('clears the selection when the number of columns changes', () => {
        cy.get('div#cypress-jsdom > div')
            .click();

        cy.get('@Holder').its('state').then((oldState) => {
            cy.get('@Holder')
                .invoke('setState', {
                    columns: oldState.columns.slice(0, 5),
                })
                .matchImageSnapshot('clear-selection-after-col-num-change');
        });
    });

    it('clears the selection when the columns change order', () => {
        cy.get('div#cypress-jsdom > div')
            .click();

        cy.get('@Holder').its('state').then((oldState) => {
            cy.get('@Holder')
                .invoke('setState', {
                    columns: [...oldState.columns.slice(1), oldState.columns[0]],
                })
                .matchImageSnapshot('clear-selection-when-cols-change');
        });
    });

    it('clears the selection when the number of rows changes', () => {
        cy.get('div#cypress-jsdom > div')
            .click();

        cy.get('@Holder').its('state').then((oldState) => {
            cy.get('@Holder')
                .invoke('setState', {
                    data: [oldState.data[oldState.data.length - 1], ...oldState.data],
                })
                .matchImageSnapshot('clear-selection-when-num-rows-changes');
        });
    });

    it('does not clear the selection when the data changes but has the same number of rows', () => {
        cy.get('div#cypress-jsdom > div')
            .click();

        cy.get('@Holder').its('state').then((oldState) => {
            cy.get('@Holder')
                .invoke('setState', {
                    data: [
                        {
                            ...oldState.data[0],
                            'col-0': {
                                ...oldState.data[0]['col-0'],
                                getText: () => 'Modified',
                            },
                        },
                        ...oldState.data.slice(1),
                    ],
                })
                .matchImageSnapshot('keep-selection-when-only-data-values-change');
        });
    });

    it('constrains the scroll when the data and/or cols shrink', () => {
        const colsAndRowsLarge = createFakeDataAndColumns(100, 50, dataGen);
        cy.get('@Holder')
            .invoke('setState', {
                columns: colsAndRowsLarge.columns,
                data: colsAndRowsLarge.rows,
            });

        cy.get('div#cypress-jsdom > div')
            .trigger('wheel', { deltaX: 800, deltaY: 300 });

        const colsAndRowsSmall = createFakeDataAndColumns(20, 20, dataGen);
        cy.get('@Holder')
            .invoke('setState', {
                columns: colsAndRowsSmall.columns,
                data: colsAndRowsSmall.rows,
            })
            .matchImageSnapshot('truncate-scroll-when-shrinking-data');
    });
});
