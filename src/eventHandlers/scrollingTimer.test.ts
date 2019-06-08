import { GridState } from '../gridState';
import * as scrolling from './scrolling';
import { clearScrollByDragTimer, startScrollBySelectionDragIfNeeded } from './scrollingTimer';

jest.mock('./scrolling');

let mockTimerId = 0;

describe('clearScrollByDragTimer', () => {
    beforeAll(() => {
        clearScrollByDragTimer();

        jest.useFakeTimers();
    });

    it('does nothing if there is no existing timer', () => {
        // Clear once to remove any danling timers
        clearScrollByDragTimer();

        // reset the timer mocks
        jest.resetAllMocks();

        // Clear again
        clearScrollByDragTimer();

        // Check nothing was done
        expect(clearInterval).not.toHaveBeenCalled();
    });
});

describe('scrolling via dragging', () => {
    let gridState: GridState<any>;

    beforeAll(() => {
        clearScrollByDragTimer();

        gridState = {
            rootSize: (() => ({ height: 500, width: 500 })) as any,
        } as GridState<any>;

        jest.useFakeTimers();
        jest.resetAllMocks();

        (setInterval as jest.Mock).mockImplementation(() => {
            mockTimerId++;
            return mockTimerId;
        });
    });

    it('is not triggered when dragging somewhere away from the edge', () => {
        startScrollBySelectionDragIfNeeded(gridState, { x: 200, y: 200 });

        expect(setInterval).not.toHaveBeenCalled();
        expect(scrolling.updateOffsetByDelta).not.toHaveBeenCalled();
    });

    const leftParams: Array<[string, number, number]> = [
        ['very slowly', 49, -1],
        ['slowly', 39, -5],
        ['quickly', 19, -10],
        ['very quickly', 9, -15],
    ];
    leftParams.forEach(([speedDesc, xPos, xSpeed]) => {
        it(`can scroll left ${speedDesc}`, () => {
            startScrollBySelectionDragIfNeeded(gridState, { x: xPos, y: 200 });

            expect(scrolling.updateOffsetByDelta).toHaveBeenCalledWith(xSpeed, 0, gridState);
            expect(setInterval).toHaveBeenCalledWith(scrolling.updateOffsetByDelta, 10, xSpeed, 0, gridState);
        });
    });

    const rightParams: Array<[string, number, number]> = [
        ['very slowly', 500 - 49, 1],
        ['slowly', 500 - 39, 5],
        ['quickly', 500 - 19, 10],
        ['very quickly', 500 - 9, 15],
    ];
    rightParams.forEach(([speedDesc, xPos, xSpeed]) => {
        it(`can scroll right ${speedDesc}`, () => {
            startScrollBySelectionDragIfNeeded(gridState, { x: xPos, y: 200 });

            expect(scrolling.updateOffsetByDelta).toHaveBeenCalledWith(xSpeed, 0, gridState);
            expect(setInterval).toHaveBeenCalledWith(scrolling.updateOffsetByDelta, 10, xSpeed, 0, gridState);
        });
    });

    const upParams: Array<[string, number, number]> = [
        ['very slowly', 49, -1],
        ['slowly', 39, -5],
        ['quickly', 19, -10],
        ['very quickly', 9, -15],
    ];
    upParams.forEach(([speedDesc, yPos, ySpeed]) => {
        it(`can scroll up ${speedDesc}`, () => {
            startScrollBySelectionDragIfNeeded(gridState, { x: 200, y: yPos });

            expect(scrolling.updateOffsetByDelta).toHaveBeenCalledWith(0, ySpeed, gridState);
            expect(setInterval).toHaveBeenCalledWith(scrolling.updateOffsetByDelta, 10, 0, ySpeed, gridState);
        });
    });

    const downParams: Array<[string, number, number]> = [
        ['very slowly', 500 - 49, 1],
        ['slowly', 500 - 39, 5],
        ['quickly', 500 - 19, 10],
        ['very quickly', 500 - 9, 15],
    ];
    downParams.forEach(([speedDesc, yPos, ySpeed]) => {
        it(`can scroll down ${speedDesc}`, () => {
            startScrollBySelectionDragIfNeeded(gridState, { x: 200, y: yPos });

            expect(scrolling.updateOffsetByDelta).toHaveBeenCalledWith(0, ySpeed, gridState);
            expect(setInterval).toHaveBeenCalledWith(scrolling.updateOffsetByDelta, 10, 0, ySpeed, gridState);
        });
    });

    it('clears pending timer when moving again', () => {
        startScrollBySelectionDragIfNeeded(gridState, { x: 10, y: 10 });
        jest.resetAllMocks();

        startScrollBySelectionDragIfNeeded(gridState, { x: 200, y: 200 });

        expect(clearInterval).toHaveBeenCalled();
    });

    it('can be configured to ignore horizontal scrolling', () => {
        startScrollBySelectionDragIfNeeded(gridState, { x: 10, y: 200 }, { suppressX: true });

        expect(setInterval).not.toHaveBeenCalled();
        expect(scrolling.updateOffsetByDelta).not.toHaveBeenCalled();
    });

    it('can be configured to ignore vertical scrolling', () => {
        startScrollBySelectionDragIfNeeded(gridState, { x: 200, y: 10 }, { suppressY: true });

        expect(setInterval).not.toHaveBeenCalled();
        expect(scrolling.updateOffsetByDelta).not.toHaveBeenCalled();
    });
});
