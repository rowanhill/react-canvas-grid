describe('ReactCanvasGrid with inline editor & data management callbacks', () => {
    beforeEach(() => {
        cy.visit('/#/editable');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    it('shows the inline editor over the cell on double-click', () => {
        kludgeCaretInvisible();
        cy.get('@Canvas')
            .trigger('dblclick', 5, 5, { force: true });
        cy.get('@Root')
            .matchImageSnapshot('inline-editor-shown-on-dblclick');
    });

    it('re-renders the grid when data is edited', () => {
        cy.get('@Canvas')
            .trigger('dblclick', 5, 5, { force: true });
        cy.get('@Canvas').get('input').type('{selectall}99,99{enter}');
        cy.get('@Root')
            .matchImageSnapshot('editing-updates-grid');
    });

    it('does not update the selection when using the arrow keys whilst editing text', () => {
        kludgeCaretInvisible();
        cy.get('@Canvas')
            .click(5, 5, { force: true })
            .trigger('dblclick', 5, 5, { force: true })
            .get('input')
            .type('{downarrow}{rightarrow}');
        cy.get('@Root')
            .matchImageSnapshot('inline-editor-arrows-dont-change-selection');
    });
});

/**
 * Hack to hide the text insertion caret. Otherwise, the blinking caret is sometimes present
 * in screenshots and sometimes not, meaning the tests are flakey.
 */
function kludgeCaretInvisible() {
    cy.get('@Root')
        .invoke('css', 'caret-color', 'transparent');
}
