describe('ReactCanvasGrid', () => {
    beforeEach(() => {
        cy.visit('/#/keyboard-events');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');
        cy.get('textarea').as('Log');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    describe('after focusing the component', () => {
        beforeEach(() => {
            cy.get('@Root').click();
        });

        it('logs an event when pressing a key', () => {
            cy.get('@Root').type('a');

            cy.get('@Log')
                .invoke('text')
                .should('equal', 'key up: a\n');
        });
    });

    describe('after opening the inline editor', () => {
        it('logs an event when pressing a key', () => {
            cy.get('@Root')
                .trigger('dblclick', 'center', { force: true });
            cy.get('@Root').get('input').type('a');
            cy.get('@Log')
                .invoke('text')
                .should('equal', 'key up: a\n');
        });
    });
});
