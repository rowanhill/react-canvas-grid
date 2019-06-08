import { GridState } from '../gridState';
import { updateOffsetByDelta } from './scrolling';

describe('updateOffsetByDelta', () => {
    const createGridState = <T>(params: Partial<GridState<T>> = {}) => {
        const defaults: GridState<T> = {
            rootSize: (() => ({ width: 500, height: 500 })) as any,
            canvasSize: (() => ({ width: 500, height: 500 })) as any,
            gridSize: (() => ({ width: 1000, height: 1000 })) as any,
            gridOffset: (() => ({ x: 0, y: 0 })) as any,
            gridOffsetRaw: jest.fn() as any,
        } as GridState<T>;
        return { ...defaults, ...params };
    };

    it('does not update the offset if the rootSize is not yet set', () => {
        const gridState = createGridState({ rootSize: (() => null) as any });

        const result = updateOffsetByDelta(10, 10, gridState);

        expect(result).toEqual(false);
        expect(gridState.gridOffsetRaw).not.toHaveBeenCalled();
    });

    it('does not update the offset if the delta is 0', () => {
        const gridState = createGridState();

        const result = updateOffsetByDelta(0, 0, gridState);

        expect(result).toEqual(false);
        expect(gridState.gridOffsetRaw).not.toHaveBeenCalled();
    });

    it('does not update the offset if the offset is at the top left and the delta is up and left', () => {
        const gridState = createGridState();

        const result = updateOffsetByDelta(-10, -10, gridState);

        expect(result).toEqual(false);
        expect(gridState.gridOffsetRaw).not.toHaveBeenCalled();
    });

    it('does not update the offset if the offset is at the bottom right and the delta is down and right', () => {
        const gridState = createGridState({ gridOffset: (() => ({ x: 500, y: 500 })) as any });

        const result = updateOffsetByDelta(10, 10, gridState);

        expect(result).toEqual(false);
        expect(gridState.gridOffsetRaw).not.toHaveBeenCalled();
    });

    it('updates the offset if the delta would change it (after truncation)', () => {
        const gridState = createGridState();

        const result = updateOffsetByDelta(10, 10, gridState);

        expect(result).toEqual(true);
        expect(gridState.gridOffsetRaw).toHaveBeenCalledWith({ x: 10, y: 10 });
    });
});
