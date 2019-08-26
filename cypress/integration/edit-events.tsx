describe('ReactCanvasGrid', () => {
    beforeEach(() => {
        cy.visit('/#/edit-events');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');
        cy.get('textarea').as('Log');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    describe('after double-clicking an editable cell', () => {
        beforeEach(() => {
            cy.get('@Root')
                .trigger('dblclick', 5, 5, { force: true });
        });

        it('fires onCellDataChanged event when editing and hitting enter', () => {
            cy.get('input')
                .type('a{enter}');
            cy.get('@Log')
                .invoke('text')
                .should('equal', 'changed: row 0 of column "col-0" (index 0) to 0,0a\n');
        });

        it('fires onCellDataChanged event when simply hitting enter', () => {
            cy.get('input')
                .type('{enter}');
            cy.get('@Log')
                .invoke('text')
                .should('equal', 'changed: row 0 of column "col-0" (index 0) to 0,0\n');
        });

        it('fires onCellDataChanged event when editing clicking elsewhere', () => {
            cy.get('input')
                .type('a')
                .then(() => cy.get('@Canvas').click({ force: true }));
            cy.get('@Log')
                .invoke('text')
                .should('equal', 'changed: row 0 of column "col-0" (index 0) to 0,0a\n');
        });

        it('fires onCellDataChanged event when simply clicking elsewhere', () => {
            cy.get('@Canvas').click({ force: true });
            cy.get('@Log')
                .invoke('text')
                .should('equal', 'changed: row 0 of column "col-0" (index 0) to 0,0\n');
        });

        it('does not fire onCellDataChanged when hitting escape', () => {
            cy.get('input')
                .type('{esc}');
            cy.get('@Log')
                .invoke('text')
                .should('equal', '');
        });
    });
});
