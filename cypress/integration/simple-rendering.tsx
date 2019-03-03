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

describe('ReactCanvasGrid in a overflow:scroll parent', () => {
    it('renders a grid of data', () => {
      const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
      const props: ReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
      };

      cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'foo');

      cy.get('canvas').eq(0)
        .invoke('width')
        .should('be.greaterThan', 0);

      cy.get('#rcg-holder').matchImageSnapshot('simple-grid-in-scroll');
    });
  });