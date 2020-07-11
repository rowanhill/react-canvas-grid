describe('ReactCanvasGrid in a fixed size parent', () => {
    beforeEach(() => {
        cy.visit('/#/examples/simple');
        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('renders a grid of data', () => {
        cy.get('@Canvas').matchImageSnapshot('simple-grid-in-scroll');
    });

    it('can be scrolled to the middle', () => {
        cy.get('@Holder')
            .trigger('wheel', { deltaX: 300, deltaY: 300 });

        cy.get('@Canvas')
            .matchImageSnapshot('scrolled-grid-in-scroll');
    });
});
