import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { Coord } from '../types';

export function calculateGridOffsetForTargetCell<T>(gridState: GridState<T>, focusCell: Coord) {
    return GridGeometry.calculateGridOffsetForTargetCell(
        gridState.gridOffset(),
        gridState.canvasSize(),
        gridState.frozenColsWidth(),
        gridState.frozenRowsHeight(),
        focusCell,
        gridState.columnBoundaries(),
        gridState.rowHeight(),
        gridState.borderWidth(),
        gridState.data().length,
        gridState.verticalGutterBounds(),
        gridState.horizontalGutterBounds(),
    );
}
