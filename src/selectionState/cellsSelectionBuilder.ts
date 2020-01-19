import { Bounds, Coord } from '../types';
import { CellsSelection } from './cellsSelection';

export class CellsSelectionBuilder {
    private isSelectionInProgress: boolean;
    private editCursorCell: Coord;
    private selection: Bounds;
    private focusCell: Coord;
    private autofillDragCell: Coord | null;

    constructor(x: number, y: number) {
        this.isSelectionInProgress = false;
        this.editCursorCell = { x, y };
        this.selection = { left: x, right: x, top: y, bottom: y };
        this.focusCell = { x, y };
        this.autofillDragCell = null;
    }

    public withSelectionFromCursorTo(x: number, y: number): CellsSelectionBuilder;
    public withSelectionFromCursorTo(coord: [number, number]): CellsSelectionBuilder;
    public withSelectionFromCursorTo(first: number|[number, number], second?: number) {
        const x = typeof first === 'number' ? first : first[0];
        const y = typeof first === 'number' ? second! : first[1];
        this.selection = {
            top: Math.min(this.editCursorCell.y, y),
            left: Math.min(this.editCursorCell.x, x),
            bottom: Math.max(this.editCursorCell.y, y),
            right: Math.max(this.editCursorCell.x, x),
        };
        this.focusCell = { x, y };
        return this;
    }

    public withSelection(top: number, left: number, bottom: number, right: number): CellsSelectionBuilder;
    public withSelection(from: [number, number], to: [number, number]): CellsSelectionBuilder;
    public withSelection(a: number|[number, number], b: number|[number, number], c?: number, d?: number) {
        if (typeof a === 'number') {
            this.selection = { top: a, left: b as number, bottom: c as number, right: d as number };
        } else {
            this.selection = {
                top: Math.min(a[1], (b as [number, number])[1]),
                left: Math.min(a[0], (b as [number, number])[0]),
                bottom: Math.max(a[1], (b as [number, number])[1]),
                right: Math.max(a[0], (b as [number, number])[0]),
            };
        }
        return this;
    }

    public withOngoingSelectionDrag() {
        this.isSelectionInProgress = true;
        return this;
    }

    public withoutOngoingSelectionDrag() {
        this.isSelectionInProgress = false;
        return this;
    }

    public withAutofillDragCell(x: number, y: number) {
        this.autofillDragCell = { x, y };
        return this;
    }

    public withoutAutofillDragCell() {
        this.autofillDragCell = null;
        return this;
    }

    public build() {
        return new CellsSelection(
            this.editCursorCell,
            this.selection,
            this.focusCell,
            this.isSelectionInProgress,
            this.autofillDragCell,
        );
    }
}

export function cellsSelection(x: number, y: number): CellsSelectionBuilder;
export function cellsSelection(coord: [number, number]): CellsSelectionBuilder;
export function cellsSelection(first: number|[number, number], second?: number) {
    if (typeof first === 'number') {
        return new CellsSelectionBuilder(first, second!);
    } else {
        return new CellsSelectionBuilder(first[0], first[1]);
    }
}
