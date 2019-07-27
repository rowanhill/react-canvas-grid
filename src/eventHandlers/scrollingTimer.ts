import { GridState } from '../gridState';
import { Coord } from '../types';
import { updateOffsetByDelta } from './scrolling';

let scrollBySelectionDragTimerId: number | null = null;

export const clearScrollByDragTimer = () => {
    if (scrollBySelectionDragTimerId) {
        clearInterval(scrollBySelectionDragTimerId);
        scrollBySelectionDragTimerId = null;
    }
};

export const startScrollBySelectionDragIfNeeded = <T>(
    gridState: GridState<T>,
    componentPixelCoord: Coord,
    updateSelection: () => void,
    options: { suppressX?: boolean; suppressY?: boolean; } = {},
) => {
    const rootSize = gridState.rootSize();
    if (!rootSize) {
        return;
    }

    // Clear any old scroll timer - the mouse pos has changed, so we'll set up a new timer if needed
    clearScrollByDragTimer();

    let deltaX = 0;
    if (options.suppressX !== true) {
        if (componentPixelCoord.x < 10) {
            deltaX = -15;
        } else if (componentPixelCoord.x < 20) {
            deltaX = -10;
        } else if (componentPixelCoord.x < 40) {
            deltaX = -5;
        } else if (componentPixelCoord.x < 50) {
            deltaX = -1;
        } else if (componentPixelCoord.x > rootSize.width - 10) {
            deltaX = 15;
        } else if (componentPixelCoord.x > rootSize.width - 20) {
            deltaX = 10;
        } else if (componentPixelCoord.x > rootSize.width - 40) {
            deltaX = 5;
        } else if (componentPixelCoord.x > rootSize.width - 50) {
            deltaX = 1;
        }
    }

    let deltaY = 0;
    if (options.suppressY !== true) {
        if (componentPixelCoord.y < 10) {
            deltaY = -15;
        } else if (componentPixelCoord.y < 20) {
            deltaY = -10;
        } else if (componentPixelCoord.y < 40) {
            deltaY = -5;
        } else if (componentPixelCoord.y < 50) {
            deltaY = -1;
        } else if (componentPixelCoord.y > rootSize.height - 10) {
            deltaY = 15;
        } else if (componentPixelCoord.y > rootSize.height - 20) {
            deltaY = 10;
        } else if (componentPixelCoord.y > rootSize.height - 40) {
            deltaY = 5;
        } else if (componentPixelCoord.y > rootSize.height - 50) {
            deltaY = 1;
        }
    }

    if (deltaX !== 0 || deltaY !== 0) {
        const updateOffsetByDeltaAndUpdateSelection = () => {
            updateOffsetByDelta(deltaX, deltaY, gridState);
            updateSelection();
        };
        scrollBySelectionDragTimerId = setInterval(updateOffsetByDeltaAndUpdateSelection, 10);
        updateOffsetByDelta(deltaX, deltaY, gridState);
    }
};
