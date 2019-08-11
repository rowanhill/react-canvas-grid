describe('ReactCanvasGrid with some initial data', () => {
    beforeEach(() => {
        cy.visit('/#/dynamic-data');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('#num-rows').as('NumRowsInput');
        cy.get('#num-cols').as('NumColsInput');
        cy.get('#first-col-to-end').as('FirstColToEndButton');
        cy.get('#modify-top-left').as('ModifyTopLeftButton');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('re-renders when the number of columns shrinks', () => {
        cy.get('@NumColsInput')
            .type('{selectall}5');
        cy.wait(100); // Wait for 80ms debounce to trigger
        cy.get('@Root')
            .matchImageSnapshot('reduce-number-of-columns');
    });

    it('re-renders when the number of columns grows', () => {
        cy.get('@NumColsInput')
            .type('{selectall}50');
        cy.get('@NumRowsInput')
            .type('{selectall}100');
        cy.wait(100); // Wait for 80ms debounce to trigger

        cy.get('@Root')
            .matchImageSnapshot('increase-number-of-columns');
    });

    it('clears the selection when the number of columns changes', () => {
        cy.get('@Root')
            .click();
        cy.get('@NumColsInput')
            .type('{selectall}5');
        cy.wait(100); // Wait for 80ms debounce to trigger
        cy.get('@Root')
            .matchImageSnapshot('clear-selection-after-col-num-change');
    });

    it('clears the selection when the columns change order', () => {
        cy.get('@Root')
            .click();
        cy.get('@FirstColToEndButton')
            .click();
        cy.get('@Root')
            .matchImageSnapshot('clear-selection-when-cols-change');
    });

    it('clears the selection when the number of rows changes', () => {
        cy.get('@Root')
            .click();
        cy.get('@NumRowsInput')
            .type('{selectall}100');
        cy.wait(100); // Wait for 80ms debounce to trigger
        cy.get('@Root')
            .matchImageSnapshot('clear-selection-when-num-rows-changes');
    });

    it('does not clear the selection when the data changes but has the same number of rows', () => {
        cy.get('@Root')
            .click();
        cy.get('@ModifyTopLeftButton')
            .click();

        cy.get('@Root')
            .matchImageSnapshot('keep-selection-when-only-data-values-change');
    });

    it('constrains the scroll when the data and/or cols shrink', () => {
        cy.get('@NumColsInput')
            .type('{selectall}50');
        cy.get('@NumRowsInput')
            .type('{selectall}100');
        cy.wait(100); // Wait for 80ms debounce to trigger

        cy.get('@Root')
            .trigger('wheel', { deltaX: 800, deltaY: 300 });

        cy.get('@NumColsInput')
            .type('{selectall}20');
        cy.get('@NumRowsInput')
            .type('{selectall}20');
        cy.wait(100); // Wait for 80ms debounce to trigger
        cy.get('@Root')
            .matchImageSnapshot('truncate-scroll-when-shrinking-data');
    });
});
