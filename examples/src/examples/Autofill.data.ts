import { CellDef } from 'react-canvas-grid';
import { createFakeColumns, createFakeData } from '../data/dataAndColumns';

export type TextPair = [string, string];

const numRows = 100;
const numCols = 200;

// Hash one int into another - just a cheap way of producing random-looking but deterministic numbers
/* tslint:disable:no-bitwise */
function hash(x: number): number {
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = (x >> 16) ^ x;
    return x;
}
/* tslint:enable:no-bitwise */

function getRandomTextA(x: number, y: number): string {
    return hash(x + y * numCols + 1).toString(36).substr(0, 3);
}
function getRandomTextB(x: number, y: number): string {
    return hash(x + y * numCols + numRows * numCols + 1).toString(36).substr(0, 3);
}

function getTextPair(x: number, y: number): TextPair {
    return [getRandomTextA(x, y), getRandomTextB(x, y)];
}

const options: Partial<CellDef<TextPair>> = {
    getText: ([a, b]: TextPair) => `${a}/${b}`,
};
export function getData() {
    return createFakeData(numRows, numCols, (x, y) => getTextPair(x, y), options);
}

export function getColumns() {
    return createFakeColumns(numCols);
}
