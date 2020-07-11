describe('ReactCanvasGrid Selection Events example', () => {
    beforeEach(() => {
        cy.visit('/#/examples/selection-events');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');
        cy.get('textarea').as('Log');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    describe('non-frozen cells', () => {
        it('logs start and end when clicking', () => {
            cy.get('@Root')
                .click(60, 50);

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,2) -> (1,2)
   end: (1,2) -> (1,2)
`);
        });

        it('logs start and end when shift-clicking with no prior selection', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 50, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 60, 150, { shiftKey: true, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,2) -> (1,2)
   end: (1,2) -> (1,2)
`);
        });

        it('logs start/end, update/end when clicking then shift-clicking elsewhere', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 50, { buttons: 1, force: true })
                .trigger('mouseup', 60, 150, { force: true })
                .trigger('mousedown', 150, 150, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 150, 150, { shiftKey: true, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,2) -> (1,2)
   end: (1,2) -> (1,2)
update: (1,2) -> (2,7)
   end: (1,2) -> (2,7)
`);
        });

        it('logs start, update, and end when clicking, dragging & releasing', () => {
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

        it('does not log an update when moving the mouse within the same cell', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 50, { buttons: 1, force: true })
                .trigger('mousemove', 61, 50, { buttons: 1, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,2) -> (1,2)
`);
        });
    });

    describe('frozen rows', () => {
        it('logs start/end when clicking a column header', () => {
            cy.get('@Root')
                .click(60, 10);

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,0) -> (1,99)
   end: (1,0) -> (1,99)
`);
        });

        it('logs start/end when shift-clicking a column header with no prior selection', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 10, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 60, 10, { shiftKey: true, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,0) -> (1,99)
   end: (1,0) -> (1,99)
`);
        });

        it('logs start/end and update/end when clicking then shift-clicking column headers', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 10, { buttons: 1, force: true })
                .trigger('mouseup', 60, 10, { force: true })
                .trigger('mousedown', 150, 10, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 150, 10, { shiftKey: true, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,0) -> (1,99)
   end: (1,0) -> (1,99)
update: (1,0) -> (2,99)
   end: (1,0) -> (2,99)
`);
        });

        it('logs start, update, and end when clicking, dragging & releasing on column headers', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 10, { buttons: 1, force: true })
                .trigger('mousemove', 150, 10, { buttons: 1, force: true })
                .trigger('mouseup', 150, 10, { force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,0) -> (1,99)
update: (1,0) -> (2,99)
   end: (1,0) -> (2,99)
`);
        });

        it('does not log an update when moving the mouse within the same column header', () => {
            cy.get('@Root')
                .trigger('mousedown', 60, 10, { buttons: 1, force: true })
                .trigger('mousemove', 61, 10, { buttons: 1, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,0) -> (1,99)
`);
        });

        it('log updates when moving the mouse over non-frozen cells and/or row headers', () => {
            cy.get('@Root')
                .trigger('mousedown', 180, 10, { buttons: 1, force: true })
                .trigger('mousemove', 120, 60, { buttons: 1, force: true })
                .trigger('mousemove', 10, 60, { buttons: 1, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (3,0) -> (3,99)
update: (2,0) -> (3,99)
update: (1,0) -> (3,99)
`);
        });
    });

    describe('frozen cols', () => {
        it('logs start/end when clicking a row header', () => {
            cy.get('@Root')
                .click(10, 30);

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,1) -> (19,1)
   end: (0,1) -> (19,1)
`);
        });

        it('logs start/end when shift-clicking a row header with no prior selection', () => {
            cy.get('@Root')
                .trigger('mousedown', 10, 30, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 10, 30, { shiftKey: true, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,1) -> (19,1)
   end: (0,1) -> (19,1)
`);
        });

        it('logs start/end and update/end when clicking then shift-clicking row headers', () => {
            cy.get('@Root')
                .trigger('mousedown', 10, 30, { buttons: 1, force: true })
                .trigger('mouseup', 10, 30, { force: true })
                .trigger('mousedown', 10, 90, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 110, 90, { shiftKey: true, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,1) -> (19,1)
   end: (0,1) -> (19,1)
update: (0,1) -> (19,4)
   end: (0,1) -> (19,4)
`);
        });

        it('logs start, update, and end when clicking, dragging & releasing on row headers', () => {
            cy.get('@Root')
                .trigger('mousedown', 10, 30, { buttons: 1, force: true })
                .trigger('mousemove', 10, 50, { buttons: 1, force: true })
                .trigger('mouseup', 10, 50, { force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,1) -> (19,1)
update: (0,1) -> (19,2)
   end: (0,1) -> (19,2)
`);
        });

        it('does not log an update when moving the mouse within the same row header', () => {
            cy.get('@Root')
                .trigger('mousedown', 10, 30, { buttons: 1, force: true })
                .trigger('mousemove', 10, 31, { buttons: 1, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,1) -> (19,1)
`);
        });

        it('logs updates when moving the mouse over non-frozen cells and/or col headers', () => {
            cy.get('@Root')
                .trigger('mousedown', 10, 30, { buttons: 1, force: true })
                .trigger('mousemove', 60, 60, { buttons: 1, force: true })
                .trigger('mousemove', 60, 10, { buttons: 1, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,1) -> (19,1)
update: (0,1) -> (19,2)
update: (0,1) -> (19,1)
`);
        });
    });

    describe('frozen top-left area', () => {
        it('logs start/end when clicked', () => {
            cy.get('@Root')
                .click(10, 10);

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (0,0) -> (19,99)
   end: (0,0) -> (19,99)
`);
        });
    });

    describe('clicking outside the grid', () => {
        it('logs nothing', () => {
            cy.get('main.examples-main h1')
                .click(0, 0);
            cy.get('@Log')
                .invoke('text')
                .should('equal', '');
        });
    });

    describe('dragging outside the grid with prior selection', () => {
        it('logs nothing additional', () => {
            cy.get('@Root')
                .click(60, 50);
            cy.get('main.examples-main h1')
                .trigger('mousedown', 0, 0, { buttons: 1, force: true })
                .trigger('mousemove', 10, 10, { buttons: 1, force: true });

            cy.get('@Log')
                .invoke('text')
                .should(
                    'equal',
` start: (1,2) -> (1,2)
   end: (1,2) -> (1,2)
`);
        });
    });
});
