import { SelectRange } from './selectionState/selectionTypes';
import { Bounds, Coord } from './types';

export function numberBetween(num: number, min: number, max: number) {
    return Math.max(Math.min(num, max), min);
}

export function equalCoord(a: Coord, b: Coord): boolean {
    return a.x === b.x && a.y === b.y;
}

export function equalSelectRange(a: SelectRange|null, b: SelectRange|null): boolean {
    return a === b ||
        (a !== null && b !== null && equalCoord(a.topLeft, b.topLeft) && equalCoord(a.bottomRight, b.bottomRight));
}

export function equalBounds(a: Bounds|null, b: Bounds|null): boolean {
    return a === b || (
        a !== null &&
        b !== null &&
        a.top === b.top &&
        a.bottom === b.bottom &&
        a.left === b.left &&
        a.right === b.right
    );
}
