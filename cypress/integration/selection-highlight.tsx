import * as React from 'react';
import {Coord, ReactCanvasGrid} from '../../src/index';
import { DefaultedReactCanvasGridProps } from '../../src/ReactCanvasGrid';
import { Holder } from '../components/ScrollingHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const getProps = () => {
    const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
    const props: DefaultedReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
    };
    return props;
};

describe('ReactCanvasGrid in an overflow:scroll parent', () => {
    beforeEach(() => {
        const props = getProps();
        cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'Holder');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('renders a selection overlay over clicked cell', () => {
        cy.get('#rcg-holder')
            .click();

        cy.get('#rcg-holder')
            .matchImageSnapshot('simple-grid-after-click');
    });

    it('scrolls the selection overlay with the grid', () => {
        cy.get('#rcg-holder')
            .click()
            .trigger('wheel', { deltaX: 50, deltaY: 50 });

        cy.get('#rcg-holder')
            .matchImageSnapshot('simple-grid-after-click-then-scroll');
    });

    describe('renders a selection overlay', () => {
        function dragFromCentre(
            finalPos: 'right'|'left'|'top'|'bottom'|'bottomRight'|Coord,
            release: boolean = false,
        ) {
            const canvas = cy.get('#rcg-holder canvas').eq(1)
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
            cy.get('#rcg-holder')
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
            cy.get('#rcg-holder canvas').eq(1)
                .trigger('mousemove', 'left', { force: true });
            cy.get('#rcg-holder')
                .matchImageSnapshot('simple-grid-drag-release-move');
        });

        it('when clicking then shift-clicking elsewhere', () => {
            cy.get('#rcg-holder canvas').eq(1)
                .click('left', { force: true })
                .trigger('mousedown', 'center', { force: true, buttons: 1, shiftKey: true })
                .trigger('mouseup', 'center', { force: true, buttons: 1, shiftKey: true });
            cy.get('#rcg-holder')
                .matchImageSnapshot('selection-highlight-click-shift-click');
        });
    });
});
