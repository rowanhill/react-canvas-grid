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

    describe('renders a selection overlay', () => {
        function dragFromCenterAndScreenshot(
            finalPos: 'right'|'left'|'top'|'bottom'|'bottomRight',
            screenshotName: string,
            release: boolean = false
        ) {
            cy.get('#rcg-holder canvas').eq(1)
                .trigger('mousedown', 'center')
                .trigger('mousemove', finalPos, { buttons: 1, force: true });
            if (release) {
                cy.get('#rcg-holder canvas').eq(1)
                    .trigger('mouseup', finalPos, { force: true });
            }

            cy.get('#rcg-holder')
                .matchImageSnapshot(screenshotName);
        }

        it('when dragging right', () => {
            dragFromCenterAndScreenshot('right', 'simple-grid-drag-right');
        });
    
        it('when dragging left', () => {
            dragFromCenterAndScreenshot('left', 'simple-grid-drag-left');
        });
    
        it('when dragging down', () => {
            dragFromCenterAndScreenshot('bottom', 'simple-grid-drag-down');
        });
    
        it('when dragging up', () => {
            dragFromCenterAndScreenshot('top', 'simple-grid-drag-up');
        });

        it('when dragging diagonally down and right', () => {
            dragFromCenterAndScreenshot('bottomRight', 'simple-grid-drag-down-and-right');
        });

        it('when dragging and releasing', () => {
            dragFromCenterAndScreenshot('right', 'simple-grid-drag-right-and-release', true);
        });
    });
});