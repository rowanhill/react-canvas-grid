describe('ReactCanvasGrid with resizable cssWidth / cssHeight', () => {
    beforeEach(() => {
        cy.visit('/#/resize');
        cy.get('.react-canvas-grid').as('Root');
        cy.get('.react-canvas-grid canvas').eq(1).as('Canvas');

        cy.get('select').as('SizeSelect');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('redraws when cssWidth / cssHeight are increased', () => {
        cy.get('@SizeSelect').select('big');

        cy.get('@Canvas')
            .matchImageSnapshot('resize-grid-small-to-large');
    });
});
