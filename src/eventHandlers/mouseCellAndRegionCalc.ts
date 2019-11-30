import { RefObject } from 'react';
import { GridGeometry } from '../gridGeometry';
import { GridState } from '../gridState';
import { ReactCanvasGridProps } from '../ReactCanvasGrid';
import { GridClickRegion } from '../selectionState/selectionTypes';
import { Coord } from '../types';

export const getMouseCellCoordAndRegion = <T>(
    event: { clientX: number; clientY: number; },
    componentPixelCoord: Coord,
    rootRef: RefObject<HTMLDivElement>,
    props: ReactCanvasGridProps<T>,
    gridState: GridState<T>,
) => {
    // Find the cell coordinates of the mouse event. This is untruncated, and ignoring frozen cell overlays
    const gridCoords = GridGeometry.calculateGridCellCoordsFromGridState(event, rootRef.current, gridState);

    // Figure out if the mouse event is in a frozen cell to determine the region
    const clickInFrozenCols = componentPixelCoord.x < gridState.frozenColsWidth();
    const clickInFrozenRows = componentPixelCoord.y < gridState.frozenRowsHeight();
    const region: GridClickRegion = clickInFrozenCols ?
                        (clickInFrozenRows ? 'frozen-corner' : 'frozen-cols') :
                        (clickInFrozenRows ? 'frozen-rows' : 'cells');

    // If the mouse event was on a frozen cell, the gridCoords will be for the cell coords 'underneath' the
    // frozen cell, so we need to update to coordinate to zero
    switch (region) {
        case 'frozen-corner':
            gridCoords.x = 0;
            gridCoords.y = 0;
            break;
        case 'frozen-rows':
            gridCoords.y = 0;
            break;
        case 'frozen-cols':
            gridCoords.x = 0;
            break;
    }

    // The mouse event may be beyond the grid's actual size, so we need to truncate it (to avoid selections that
    // include fictional cells)
    return {
        truncatedCoord: truncateCoord(gridCoords, props),
        region,
    };
};

const truncateCoord = <T>(coord: Coord, props: ReactCanvasGridProps<T>): Coord => {
    return {
        x: Math.min(Math.max(coord.x, props.frozenCols), props.columns.length - 1),
        y: Math.min(Math.max(coord.y, props.frozenRows), props.data.length - 1),
    };
};
