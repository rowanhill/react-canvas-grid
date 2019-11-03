describe('ReactCanvasGrid with frozen rows & cells', () => {
    beforeEach(() => {
        cy.visit('/#/selection-events');

        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');
        cy.get('textarea').as('Log');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);
    });

    describe('with simple cell selection', () => {
        it('logs start & end selection events on arrow up', () => {
            cy.get('@Root').type('{uparrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (4,8) -> (4,8)
   end: (4,8) -> (4,8)
`);
        });

        it('logs start & end selection events on arrow down', () => {
            cy.get('@Root').type('{downarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (4,10) -> (4,10)
   end: (4,10) -> (4,10)
`);
        });

        it('logs start & end selection events on arrow left', () => {
            cy.get('@Root').type('{leftarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (3,9) -> (3,9)
   end: (3,9) -> (3,9)
`);
        });

        it('logs start & end selection events on arrow right', () => {
            cy.get('@Root').type('{rightarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (5,9) -> (5,9)
   end: (5,9) -> (5,9)
`);
        });

        it('logs update & end selection events on shift + arrow up', () => {
            cy.get('@Root').type('{shift}{uparrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (4,8) -> (4,9)
   end: (4,8) -> (4,9)
`);
        });

        it('logs update & end selection events on shift + arrow down', () => {
            cy.get('@Root').type('{shift}{downarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (4,9) -> (4,10)
   end: (4,9) -> (4,10)
`);
        });

        it('logs update & end selection events on shift + arrow left', () => {
            cy.get('@Root').type('{shift}{leftarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (3,9) -> (4,9)
   end: (3,9) -> (4,9)
`);
        });

        it('logs update & end selection events on shift + arrow right', () => {
            cy.get('@Root').type('{shift}{rightarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (4,9) -> (5,9)
   end: (4,9) -> (5,9)
`);
        });
    });

    describe('with row selection', () => {
        beforeEach(() => {
            cy.get('@Root').click(10, 100);
        });

        it('logs start & end selection events on arrow up', () => {
            cy.get('@Root').type('{uparrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (1,3) -> (19,3)
   end: (1,3) -> (19,3)
`);
        });

        it('logs start & end selection events on arrow down', () => {
            cy.get('@Root').type('{downarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (1,5) -> (19,5)
   end: (1,5) -> (19,5)
`);
        });

        it('logs start & end selection events (for unchanged selection) on arrow left', () => {
            cy.get('@Root').type('{leftarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (1,4) -> (19,4)
   end: (1,4) -> (19,4)
`);
        });

        it('logs start & end selection events (for unchanged selection) on arrow right', () => {
            cy.get('@Root').type('{rightarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (1,4) -> (19,4)
   end: (1,4) -> (19,4)
`);
        });

        it('logs update & end selection events on shift + arrow up', () => {
            cy.get('@Root').type('{shift}{uparrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (1,3) -> (19,4)
   end: (1,3) -> (19,4)
`);
        });

        it('logs update & end selection events on shift + arrow down', () => {
            cy.get('@Root').type('{shift}{downarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (1,4) -> (19,5)
   end: (1,4) -> (19,5)
`);
        });

        it('logs end selection event (for unchanged selection) on shift + arrow left', () => {
            cy.get('@Root').type('{shift}{leftarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`   end: (1,4) -> (19,4)
`);
        });

        it('logs end selection event (for unchanged selection) on shift + arrow right', () => {
            cy.get('@Root').type('{shift}{rightarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`   end: (1,4) -> (19,4)
`);
        });
    });

    describe('with col selection', () => {
        beforeEach(() => {
            cy.get('@Root').click(200, 10);
        });

        it('logs start & end selection events (for unchanged selection) on arrow up', () => {
            cy.get('@Root').type('{uparrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (3,1) -> (3,99)
   end: (3,1) -> (3,99)
`);
        });

        it('logs start & end selection events (for unchanged selection) on arrow down', () => {
            cy.get('@Root').type('{downarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (3,1) -> (3,99)
   end: (3,1) -> (3,99)
`);
        });

        it('logs start & end selection events on arrow left', () => {
            cy.get('@Root').type('{leftarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (2,1) -> (2,99)
   end: (2,1) -> (2,99)
`);
        });

        it('logs start & end selection events on arrow right', () => {
            cy.get('@Root').type('{rightarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
` start: (4,1) -> (4,99)
   end: (4,1) -> (4,99)
`);
        });

        it('logs update & end selection events (for unchanged selection) on shift + arrow up', () => {
            cy.get('@Root').type('{shift}{uparrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`   end: (3,1) -> (3,99)
`);
        });

        it('logs update & end selection events (for unchanged selection) on shift + arrow down', () => {
            cy.get('@Root').type('{shift}{downarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`   end: (3,1) -> (3,99)
`);
        });

        it('logs end selection event on shift + arrow left', () => {
            cy.get('@Root').type('{shift}{leftarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (2,1) -> (3,99)
   end: (2,1) -> (3,99)
`);
        });

        it('logs end selection event on shift + arrow right', () => {
            cy.get('@Root').type('{shift}{rightarrow}');

            cy.get('@Log')
                .invoke('text')
                .should(
                    'contain',
`update: (3,1) -> (4,99)
   end: (3,1) -> (4,99)
`);
        });
    });
});
