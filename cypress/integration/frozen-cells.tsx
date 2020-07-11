describe('ReactCanvasGrid with frozen rows & cells', () => {
    beforeEach(() => {
        cy.visit('/#/examples/frozen');
        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('keeps the frozen rows and columns shown on the grid (and fixes the top-left cells in place)', () => {
        cy.get('@Root')
            .trigger('wheel', { deltaX: 300, deltaY: 300 })
            .matchImageSnapshot('scrolled-grid-with-frozen-cells');
    });
});
