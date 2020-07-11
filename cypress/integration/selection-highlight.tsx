import { Coord } from '../../src/index';

describe('ReactCanvasGrid in a fixed size parent', () => {
    beforeEach(() => {
        cy.visit('/#/examples/simple');
        cy.get('.fixed-size-holder').as('Holder');
        cy.get('.fixed-size-holder .react-canvas-grid').as('Root');
        cy.get('.fixed-size-holder canvas').eq(1).as('Canvas');

        cy.get('Canvas').invoke('width').should('be.greaterThan', 0);

        // Yuck :(
        // A small wait here does seem to make the tests much more reliable, however...
        cy.wait(20);
    });

    it('renders a selection overlay over clicked cell', () => {
        cy.get('@Root')
            .click()
            .matchImageSnapshot('simple-grid-after-click');
    });

    it('scrolls the selection overlay with the grid', () => {
        cy.get('@Root')
            .click()
            .trigger('wheel', { deltaX: 50, deltaY: 50 });
        cy.wait(20); // Another short wait helps ensure the scroll has been redrawn before the screenshot is taken
        cy.get('@Root')
            .matchImageSnapshot('simple-grid-after-click-then-scroll');
    });

    describe('renders a selection overlay', () => {
        function dragFromCentre(
            finalPos: 'right'|'left'|'top'|'bottom'|'bottomRight'|Coord,
            release: boolean = false,
        ) {
            const canvas = cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, force: true });
            if (typeof finalPos === 'string') {
                canvas.trigger('mousemove', finalPos, { buttons: 1, force: true });
                if (release) {
                    canvas.trigger('mouseup', finalPos, { force: true });
                }
            } else {
                canvas.trigger('mousemove', finalPos.x, finalPos.y, { buttons: 1, force: true });
                if (release) {
                    canvas.trigger('mouseup', finalPos.x, finalPos.y, { force: true });
                }
            }
        }
        function dragFromCentreAndScreenshot(
            finalPos: 'right'|'left'|'top'|'bottom'|'bottomRight'|Coord,
            screenshotName: string,
            release: boolean = false,
        ) {
            dragFromCentre(finalPos, release);
            cy.get('@Root')
                .matchImageSnapshot(screenshotName);
        }

        it('when dragging right', () => {
            dragFromCentreAndScreenshot({ x: 400, y: 200 }, 'simple-grid-drag-right');
        });

        it('when dragging left', () => {
            dragFromCentreAndScreenshot('left', 'simple-grid-drag-left');
        });

        it('when dragging down', () => {
            dragFromCentreAndScreenshot({ x: 250, y: 345 }, 'simple-grid-drag-down');
        });

        it('when dragging up', () => {
            dragFromCentreAndScreenshot('top', 'simple-grid-drag-up');
        });

        it('when dragging diagonally down and right', () => {
            dragFromCentreAndScreenshot({ x: 400, y: 345 }, 'simple-grid-drag-down-and-right');
        });

        it('when dragging and releasing', () => {
            dragFromCentreAndScreenshot({ x: 400, y: 200 }, 'simple-grid-drag-right-and-release', true);
        });

        it('when dragging, releasing, and then moving the mouse', () => {
            dragFromCentre({ x: 400, y: 200 }, true);
            cy.get('@Canvas')
                .trigger('mousemove', 'left', { force: true })
                .matchImageSnapshot('simple-grid-drag-release-move');
        });

        it('when clicking then shift-clicking elsewhere', () => {
            cy.get('@Root')
                .click('left', { force: true })
                .trigger('mousedown', 'center', { force: true, buttons: 1, shiftKey: true })
                .trigger('mouseup', 'center', { force: true, buttons: 1, shiftKey: true })
                .matchImageSnapshot('selection-highlight-click-shift-click');
        });
    });
});
