describe('ReactCanvasGrid', () => {
    beforeEach(() => {
        cy.visit('/#/focused-column');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('form select').as('FocusedColSelect');
        cy.get('form input').as('FrozenColsToggle');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('scrolls to the right to bring a focused column to the right into view', () => {
        cy.get('@FocusedColSelect').select('30');

        cy.get('@Root')
            .matchImageSnapshot('focused-col-to-right');
    });

    it('scrolls to the left to bring a focused column to the left into view', () => {
        cy.get('@Root')
            .trigger('wheel', { deltaX: 800, deltaY: 300 });

        cy.get('@FocusedColSelect').select('2');

        cy.get('@Root')
            .matchImageSnapshot('focused-col-to-left');
    });

    it('accounts for frozen columns when scrolling left to bring a frozen column into view', () => {
        cy.get('@FrozenColsToggle').click();

        cy.get('@Root')
            .trigger('wheel', { deltaX: 800, deltaY: 300 });

        cy.get('@FocusedColSelect').select('5');

        cy.get('@Root')
            .matchImageSnapshot('focused-col-to-left-with-frozen-cols');
    });
});
