import * as React from 'react';
import {CellDef, ReactCanvasGrid, ReactCanvasGridProps} from '../../src/index';
import { Holder } from '../components/ScrollingHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

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

const mountGrid = (props = getProps()) => {
    cy.mount(<Holder><ReactCanvasGrid<null> {...props} /></Holder>, 'Holder');

    cy.get('canvas').eq(0)
        .invoke('width')
        .should('be.greaterThan', 0);
};

describe('ReactCanvasGrid in an overflow:scroll parent', () => {
    it('uses custom background renderers from cell data', () => {
        const props = getProps();
        props.data.forEach((row) => {
            for (const key of Object.keys(row)) {
                const cell = row[key];
                cell.renderBackground = (context: CanvasRenderingContext2D, cellBounds: ClientRect) => {
                    context.fillStyle = 'lightgreen';
                    context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
                };
            }
        });
        mountGrid(props);

        cy.get('#rcg-holder').matchImageSnapshot('custom-render-background');
    });

    it('uses custom text renderers from cell data', () => {
        const props = getProps();
        props.data.forEach((row) => {
            for (const key of Object.keys(row)) {
                const cellDef = row[key];
                cellDef.renderText = (
                    context: CanvasRenderingContext2D,
                    cellBounds: ClientRect,
                    cell: CellDef<null>,
                ) => {
                    context.fillStyle = 'red';
                    context.fillText(cell.getText(), cellBounds.left + 2, cellBounds.top + 15, cellBounds.width - 4);
                };
            }
        });
        mountGrid(props);

        cy.get('#rcg-holder').matchImageSnapshot('custom-render-text');
    });
});
