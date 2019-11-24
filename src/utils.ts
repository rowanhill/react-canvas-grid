import { Coord } from './types';

export function numberBetween(num: number, min: number, max: number) {
    return Math.max(Math.min(num, max), min);
}

export function equal(a: Coord, b: Coord): boolean {
    return a.x === b.x && a.y === b.y;
}
