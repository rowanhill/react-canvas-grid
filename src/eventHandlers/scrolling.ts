import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { Coord } from '../types';
import { numberBetween } from '../utils';

export const updateOffsetByDelta = <T>(
    deltaX: number,
    deltaY: number,
    gridState: GridState<T>,
): boolean => {
    if (!gridState.rootSize()) {
        return false;
    }
    const canvasSize = gridState.canvasSize();
    const gridSize = gridState.gridSize();
    const gridOffset = gridState.gridOffset();
    const newX = numberBetween(gridOffset.x + deltaX, 0, gridSize.width - canvasSize.width);
    const newY = numberBetween(gridOffset.y + deltaY, 0, gridSize.height - canvasSize.height);

    if (newX === gridOffset.x && newY === gridOffset.y) {
        // We won't be moving, so return false
        return false;
    }

    gridState.gridOffsetRaw({ x: newX, y: newY });

    // We did move, so return true
    return true;
};

export const scrollToCell = <T>(
    cellCoord: Coord,
    gridState: GridState<T>,
) => {
    const newOffset = GridGeometry.calculateGridOffsetForTargetCell(
        gridState.gridOffset(),
        gridState.canvasSize(),
        gridState.frozenColsWidth(),
        gridState.frozenRowsHeight(),
        cellCoord,
        gridState.columnBoundaries(),
        gridState.rowHeight(),
        gridState.borderWidth(),
        gridState.data().length,
        gridState.verticalGutterBounds(),
        gridState.horizontalGutterBounds(),
    );

    gridState.gridOffsetRaw(newOffset);
};
