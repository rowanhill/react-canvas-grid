describe('ReactCanvasGrid autofill', () => {
    beforeEach(() => {
        cy.visit('/#/autofill');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    describe('multi mode', () => {
        it('displays an autofill handle regardless of selection size', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 60, 30, { buttons: 1, force: true })
                .trigger('mousemove', 120, 75, { buttons: 1, force: true })
                .trigger('mouseup', 120, 75, { force: true })
                .matchImageSnapshot('multi-autofill-handle');
        });
    });

    describe('single mode', () => {
        beforeEach(() => {
            cy.get('input[value="single"]')
                .click();
        });

        it('displays an autofill handle on a one-cell selection', () => {
            cy.get('@Canvas')
                .click(60, 30, { force: true })
                .matchImageSnapshot('single-autofill-handle');
        });

        it('does not display an autofill handle on a multi-cell selection', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 60, 30, { buttons: 1, force: true })
                .trigger('mousemove', 120, 75, { buttons: 1, force: true })
                .trigger('mouseup', 120, 75, { force: true })
                .matchImageSnapshot('single-multi-no-autofill-handle');
        });
    });

    describe('none mode', () => {
        beforeEach(() => {
            cy.get('input[value="none"]')
                .click();
        });

        it('does not display an autofill handle regardless of selection size', () => {
            cy.get('@Canvas')
                .click(60, 30, { force: true })
                .matchImageSnapshot('none-no-autofill-handle');
        });
    });

    it('displays an outline around the area to be filled before filling', () => {
        cy.get('@Canvas')
            .trigger('mousedown', 60, 30, { buttons: 1, force: true })
            .trigger('mousemove', 120, 75, { buttons: 1, force: true })
            .trigger('mouseup', 120, 75, { force: true });

        cy.get('@Canvas')
            .trigger('mousedown', 150, 80, { buttons: 1, force: true })
            .trigger('mousemove', 230, 80, { buttons: 1, force: true })
            .matchImageSnapshot('autofill-drag-outline');

        cy.get('@Canvas')
            .trigger('mouseup', 230, 80, { force: true })
            .matchImageSnapshot('autofill-complete');
    });

    it('highlights the autofill handle on hover and changes the cursor to crosshair', () => {
        cy.get('@Canvas')
            // Set up a selection
            .trigger('mousedown', 60, 30, { buttons: 1, force: true })
            .trigger('mousemove', 120, 75, { buttons: 1, force: true })
            .trigger('mouseup', 120, 75, { force: true })
            // Hover over the autofill handle
            .trigger('mousemove', 150, 80, { buttons: 1, force: true })
            .matchImageSnapshot('autofill-hover-highlight');

        cy.get('@Root')
            .should('have.css', 'cursor', 'crosshair');
    });
});
