import { Coord } from '../types';
import { AllGridSelection } from './allGridSelection';
import { CellsSelection } from './cellsSelection';
import { ColsSelection } from './colsSelection';
import { RowsSelection } from './rowsSelection';
import { ClickMeta } from './selectionState';

export type AllSelectionStates = CellsSelection | RowsSelection | ColsSelection | AllGridSelection;

export const mouseDown = (cell: Coord, meta: ClickMeta) => {
    switch (meta.region) {
        case 'cells':
            return new CellsSelection(cell, cell, cell, true, cell);
        case 'frozen-cols':
            return new RowsSelection(cell, cell.y, cell.y, true, cell.y);
        case 'frozen-rows':
            return new ColsSelection(cell, cell.x, cell.x, true, cell.x);
        case 'frozen-corner':
            return new AllGridSelection(true);
        default:
            throw new Error(`Unsupported click meta region: ${meta.region}`);
    }
};