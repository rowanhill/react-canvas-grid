describe('ReactCanvasGrid', () => {
    it('uses custom background renderers from cell data', () => {
        cy.visit('/#/custom-bg');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);

        cy.get('@Root').matchImageSnapshot('custom-render-background');
    });

    it('uses custom text renderers from cell data', () => {
        cy.visit('/#/custom-text');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);

        cy.get('@Root').matchImageSnapshot('custom-render-text');
    });
});
