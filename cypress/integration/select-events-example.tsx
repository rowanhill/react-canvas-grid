describe('ReactCanvasGrid Selection Events example', () => {
    beforeEach(() => {
        cy.visit('/#/selection-events');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');
        cy.get('textarea').as('Log');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('updates the log when clicking, dragging & releasing', () => {
        cy.get('@Root')
            .trigger('mousedown', 60, 50, { buttons: 1, force: true })
            .trigger('mousemove', 150, 150, { buttons: 1, force: true })
            .trigger('mouseup', 150, 150, { force: true });

        cy.get('@Log')
            .invoke('text')
            .should(
                'equal',
` start: (1,2) -> (1,2)
update: (1,2) -> (2,7)
   end: (1,2) -> (2,7)
`);
    });
});
