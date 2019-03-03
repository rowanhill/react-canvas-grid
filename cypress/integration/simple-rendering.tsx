import * as React from 'react';
import {ReactCanvasGrid, ReactCanvasGridProps} from '../../dist/index';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

describe('ReactCanvasGrid with no scrolling parent', () => {
    it('renders a grid of data', () => {
      const colsAndRows = createFakeDataAndColumns(100, 20, () => null);
      const props: ReactCanvasGridProps<null> = {
        data: colsAndRows.rows,
        columns: colsAndRows.columns,
        borderWidth: 1,
        rowHeight: 20,
      };

      cy.mount(<ReactCanvasGrid<null> {...props} />);

      cy.get('canvas').eq(0)
        .invoke('width')
        .should('be.greaterThan', 0);

      cy.matchImageSnapshot();
    });
  });