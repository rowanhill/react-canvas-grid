import * as React from 'react';
import {ReactCanvasGrid, ReactCanvasGridProps} from '../../dist/index';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

const Holder = (props: {children?: any}) => {
    return (
        <div id="rcg-holder" style={{width: `500px`, height: `400px`, overflow: 'scroll'}}>
            {props.children}
        </div>
    );
};

const getProps = () => {
    const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
    const props: ReactCanvasGridProps<null> = {
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
        cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'foo');

        cy.get('canvas').eq(0)
            .invoke('width')
            .should('be.greaterThan', 0);
    });

    it('renders a grid of data', () => {
        cy.get('#rcg-holder').matchImageSnapshot('simple-grid-in-scroll');
    });

    it('can be scrolled to the middle', () => {
        cy.get('#rcg-holder')
            .scrollTo(300, 300);
        cy.wait(1000); // Wait to ensure scroll bar has faded away on osx

        cy.get('#rcg-holder')
            .matchImageSnapshot('scrolled-grid-in-scroll');
    });

    it('renders a selection overlay over clicked cell', () => {
        cy.get('#rcg-holder')
            .click();

        cy.get('#rcg-holder')
            .matchImageSnapshot('simple-grid-after-click');
    });

    it('scrolls the selection overlay with the grid', () => {
        cy.get('#rcg-holder')
            .click();
        cy.get('#rcg-holder')
            .scrollTo(50, 50);
        cy.wait(1000); // Wait to ensure scroll bar has faded away on osx

        cy.get('#rcg-holder')
            .matchImageSnapshot('simple-grid-after-click-then-scroll');
    });

    describe('renders a selection overlay', () => {
        function dragFromCentre(
            finalPos: 'right'|'left'|'top'|'bottom'|'bottomRight',
            release: boolean = false
        ) {
            cy.get('#rcg-holder canvas').eq(1)
                .trigger('mousedown', 'center')
                .trigger('mousemove', finalPos, { buttons: 1, force: true });
            if (release) {
                cy.get('#rcg-holder canvas').eq(1)
                    .trigger('mouseup', finalPos, { force: true });
            }
        }
        function dragFromCentreAndScreenshot(
            finalPos: 'right'|'left'|'top'|'bottom'|'bottomRight',
            screenshotName: string,
            release: boolean = false
        ) {
            dragFromCentre(finalPos, release);
            cy.get('#rcg-holder')
                .matchImageSnapshot(screenshotName);
        }

        it('when dragging right', () => {
            dragFromCentreAndScreenshot('right', 'simple-grid-drag-right');
        });
    
        it('when dragging left', () => {
            dragFromCentreAndScreenshot('left', 'simple-grid-drag-left');
        });
    
        it('when dragging down', () => {
            dragFromCentreAndScreenshot('bottom', 'simple-grid-drag-down');
        });
    
        it('when dragging up', () => {
            dragFromCentreAndScreenshot('top', 'simple-grid-drag-up');
        });

        it('when dragging diagonally down and right', () => {
            dragFromCentreAndScreenshot('bottomRight', 'simple-grid-drag-down-and-right');
        });

        it('when dragging and releasing', () => {
            dragFromCentreAndScreenshot('right', 'simple-grid-drag-right-and-release', true);
        });

        it('when dragging, releasing, and then moving the mouse', () => {
            dragFromCentre('right', true);
            cy.get('#rcg-holder canvas').eq(1)
                .trigger('mousemove', 'left', { force: true });
            cy.get('#rcg-holder')
                .matchImageSnapshot('simple-grid-drag-release-move');
        })
    });
});