import * as React from 'react';
import {ReactCanvasGrid, SelectRange} from '../../src/index';
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

describe('ReactCanvasGrid', () => {
    let startStub: (range: SelectRange | null) => void;
    let updateStub: (range: SelectRange) => void;
    let endStub: (range: SelectRange | null) => void;

    describe('with no frozen cells', () => {
        beforeEach(() => {
            startStub = cy.stub().as('start') as unknown as (range: SelectRange | null) => void;
            updateStub = cy.stub().as('update') as unknown as (range: SelectRange) => void;
            endStub = cy.stub().as('end') as unknown as (range: SelectRange | null) => void;
            const props = getProps();
            cy.mount(<Holder><ReactCanvasGrid<null>
                {...props}
                onSelectionChangeStart={startStub}
                onSelectionChangeUpdate={updateStub}
                onSelectionChangeEnd={endStub}
                /></Holder>, 'Holder');

            cy.get('canvas').eq(0)
                .invoke('width')
                .should('be.greaterThan', 0);

            cy.get('#rcg-holder canvas').eq(1).as('Canvas');
        });

        it('fires onSelectionChangeStart on mouse down', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, force: true })
                .then(() => expect(startStub).to.be.calledOnce);
        });

        it('fires onSelectionChangeStart on mouse down with shift but no previous selection state', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, shiftKey: true, force: true })
                .then(() => expect(startStub).to.be.calledOnce);
        });

        it('fires onSelectionChangeUpdate on mouse down with shift', () => {
            cy.get('@Canvas').click('left', { force: true });

            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, shiftKey: true, force: true })
                .then(() => expect(updateStub).to.be.calledOnce);
        });

        it('fires onSelectChangeStart and onSelectChangeEnd on click', () => {
            cy.get('@Canvas')
                .click({ force: true })
                .then(() => expect(startStub).to.be.calledOnce)
                .then(() => expect(endStub).to.be.calledOnce);
        });

        it('fires onSelectChangeUpdate when mousing over a new cell', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 'center', { buttons: 1, force: true })
                .trigger('mousemove', 'right', { buttons: 1, force: true })
                .then(() => expect(updateStub).to.be.calledOnce);
        });

        it('does not fire onSelectChangeUpdate when moving the mouse within the same cell', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 5, 5, { buttons: 1, force: true })
                .trigger('mousemove', 6, 6, { buttons: 1, force: true })
                .then(() => expect(updateStub).not.to.be.called);
        });
    });

    describe('with frozen cells', () => {
        beforeEach(() => {
            startStub = cy.stub().as('start') as unknown as (range: SelectRange | null) => void;
            updateStub = cy.stub().as('update') as unknown as (range: SelectRange) => void;
            endStub = cy.stub().as('end') as unknown as (range: SelectRange | null) => void;
            const props = getProps();
            cy.mount(<Holder><ReactCanvasGrid<null>
                {...props}
                onSelectionChangeStart={startStub}
                onSelectionChangeUpdate={updateStub}
                onSelectionChangeEnd={endStub}
                frozenRows={1}
                frozenCols={1}
                /></Holder>, 'Holder');

            cy.get('canvas').eq(0)
                .invoke('width')
                .should('be.greaterThan', 0);

            cy.get('#rcg-holder canvas').eq(1).as('Canvas');
        });

        it('selects row when clicking on a cell in a frozen column (i.e. a row header)', () => {
            cy.get('@Canvas')
                .click(10, 50, { force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 2 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 2 } }));
        });

        it('selects multiple rows when dragging from one row header to another', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 10, 53, { buttons: 1, force: true })
                .trigger('mousemove', 10, 95, { buttons: 1, force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 2 } }))
                .then(() => expect(updateStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 4 } }));
        });

        it('selects multiple rows when shift-clicking after previously selecting another row', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 10, 53, { buttons: 1, force: true })
                .trigger('mouseup', 10, 53, { buttons: 1, force: true })
                .trigger('mousedown', 10, 95, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 10, 95, { shiftKey: true, buttons: 1, force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 2 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 2 } }))
                .then(() => expect(updateStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 4 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 2 },
                    bottomRight: { x: 19, y: 4 } }));
        });

        it('selects column when clicking on a cell in a frozen row (i.e. a column header)', () => {
            cy.get('@Canvas')
                .click(120, 10, { force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 2, y: 99 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 2, y: 99 } }));
        });

        it('selects multiple columns when dragging from one row header to another', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 120, 10, { buttons: 1, force: true })
                .trigger('mousemove', 160, 10, { buttons: 1, force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 2, y: 99 } }))
                .then(() => expect(updateStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 3, y: 99 } }));
        });

        it('selects multiple columns when shift-clicking after previously selecting another column', () => {
            cy.get('@Canvas')
                .trigger('mousedown', 140, 10, { buttons: 1, force: true })
                .trigger('mouseup', 140, 10, { buttons: 1, force: true })
                .trigger('mousedown', 160, 10, { shiftKey: true, buttons: 1, force: true })
                .trigger('mouseup', 160, 10, { shiftKey: true, buttons: 1, force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 2, y: 99 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 2, y: 99 } }))
                .then(() => expect(updateStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 3, y: 99 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 2, y: 1 },
                    bottomRight: { x: 3, y: 99 } }));
        });

        it('selects all when clicking on a cell in a frozen row and column (i.e. a corner cell)', () => {
            cy.get('@Canvas')
                .click(10, 10, { force: true })
                .then(() => expect(startStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 1 },
                    bottomRight: { x: 19, y: 99 } }))
                .then(() => expect(endStub).to.have.been.calledWith({
                    topLeft: { x: 1, y: 1 },
                    bottomRight: { x: 19, y: 99 } }));
        });

        it('selects an enlarged range when dragged over cells "underneath" frozen cells', () => {
            cy.get('@Canvas')
                .trigger('wheel', { deltaX: 300, deltaY: 300 })
                .trigger('mousedown', 'center', { buttons: 1, force: true })
                .trigger('mousemove', 160, 10, { buttons: 1, force: true })
                .then(() => expect(updateStub).to.have.been.calledWith({
                    topLeft: { x: 9, y: 14 },
                    bottomRight: { x: 10, y: 23 } }));
            cy.get('@Canvas')
                .trigger('mousemove', 20, 95, { buttons: 1, force: true })
                .trigger('mouseup', 20, 95, { force: true })
                .then(() => expect(updateStub).to.have.been.calledWith({
                    topLeft: { x: 6, y: 18 },
                    bottomRight: { x: 10, y: 23 } }));
        });
    });
});
