describe('The scrollbars in a grid larger than the canvas', () => {
    beforeEach(() => {
        cy.visit('/#/examples/simple');
        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('get darker and larger when hovered', () => {
        cy.get('@Holder')
            .trigger('mousemove', 10, 395)
            .wait(10) // Small pause to ensure grid repaints before screenshot
            .matchImageSnapshot('scrollbar-hover');
    });

    it('stay darker and larger when dragging, even if the mouse is no longer hovering over the bar', () => {
        cy.get('@Holder')
            .trigger('mousemove', 10, 395)
            .trigger('mousedown', 10, 395, { buttons: 1 })
            .trigger('mousemove', 20, 350, { buttons: 1 })
            .wait(10) // Small pause to ensure grid repaints before screenshot
            .matchImageSnapshot('scrollbar-drag-off-bar');
    });

    it('reset when releasing a drag and no longer hovering, without further mousemove', () => {
        cy.get('@Holder')
            .trigger('mousemove', 10, 395)
            .trigger('mousedown', 10, 395, { buttons: 1 })
            .trigger('mousemove', 20, 350, { buttons: 1 })
            .trigger('mouseup', 20, 350)
            .wait(10) // Small pause to ensure grid repaints before screenshot
            .matchImageSnapshot('scrollbar-release-drag-off-bar');
    });
});
