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
    it('renders a grid of data', () => {
      const props = getProps();
      cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'foo');

      cy.get('canvas').eq(0)
        .invoke('width')
        .should('be.greaterThan', 0);

      cy.get('#rcg-holder').matchImageSnapshot('simple-grid-in-scroll');
    });

    it('can be scrolled to the middle', () => {
      const props = getProps();
      cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'foo');

      cy.get('canvas').eq(0)
        .invoke('width')
        .should('be.greaterThan', 0);

      cy.get('#rcg-holder')
        .scrollTo(300, 300);
      cy.wait(1000); // Wait to ensure scroll bar has faded away on osx
      cy.get('#rcg-holder')
        .matchImageSnapshot('scrolled-grid-in-scroll');
    });

    it('renders an selection overlay over clicked cell', () => {
      const props = getProps();
      cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'foo');

      cy.get('canvas').eq(0)
        .invoke('width')
        .should('be.greaterThan', 0);

      cy.get('#rcg-holder')
        .click();
      cy.get('#rcg-holder')
        .matchImageSnapshot('simple-grid-after-click');
    });
  });