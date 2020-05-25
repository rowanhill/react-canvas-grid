import { CellDef, CustomDrawCallbackMetadata, getCellText } from './types';

export const drawCell = <T>(
    context: CanvasRenderingContext2D,
    cell: CellDef<T>,
    cellBounds: ClientRect,
    metadata: CustomDrawCallbackMetadata,
) => {
    const renderBackground = cell.renderBackground || drawCellBackgroundDefault;
    const renderText = cell.renderText || drawCellTextDefault;

    renderBackground(context, cellBounds, cell, metadata);
    renderText(context, cellBounds, cell, metadata);
};

const drawCellBackgroundDefault = (
    context: CanvasRenderingContext2D,
    cellBounds: ClientRect,
) => {
    context.fillStyle = 'white';
    context.fillRect(cellBounds.left, cellBounds.top, cellBounds.width, cellBounds.height);
};

const drawCellTextDefault = <T>(
    context: CanvasRenderingContext2D,
    cellBounds: ClientRect,
    cell: CellDef<T>,
) => {
    context.fillStyle = 'black';
    context.textBaseline = 'middle';
    const verticalCentre = cellBounds.top + (cellBounds.height / 2);
    const text = getCellText(cell);
    context.fillText(text, cellBounds.left + 2, verticalCentre, cellBounds.width - 4);
};
