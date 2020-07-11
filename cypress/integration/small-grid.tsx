describe('ReactCanvasGrid with very little data', () => {
    beforeEach(() => {
        cy.visit('/#/examples/small');
    });

    it('renders a grid of data', () => {
        cy.get('div.react-canvas-grid > canvas:first-of-type').matchImageSnapshot('small-grid');
    });
});
