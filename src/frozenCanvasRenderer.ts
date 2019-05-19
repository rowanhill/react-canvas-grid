import shallowEqual from 'shallow-equals';
import { borderColour, CommonCanvasRenderer } from './commonCanvasRenderer';
import { ColumnDef, Coord, DataRow, Size } from './types';

export interface FrozenCanvasRendererBasics<T> {
    data: Array<DataRow<T>>;
    columns: ColumnDef[];
    colBoundaries: Array<{left: number; right: number}>;
    canvasSize: Size;
    rowHeight: number;
    borderWidth: number;
    frozenRows: number;
    frozenCols: number;
    frozenRowsHeight: number;
    frozenColsWidth: number;
}

export interface FrozenCanvasRendererPosition {
    gridOffset: Coord;
}

interface FrozenPreviousDrawInfo {
    gridOffset: Coord;
}

const defaultPosProps = {
    gridOffset: { x: 0, y: 0 },
};

export class FrozenCanvasRenderer<T> extends CommonCanvasRenderer<T> {
    private basicProps: FrozenCanvasRendererBasics<T>;
    private posProps: FrozenCanvasRendererPosition = defaultPosProps;
    private prevDraw: FrozenPreviousDrawInfo|null = null;

    constructor(canvas: HTMLCanvasElement, basicProps: FrozenCanvasRendererBasics<T>, dpr: number) {
        super(canvas, dpr, true);
        this.basicProps = basicProps;
    }

    public updateProps(basicProps: FrozenCanvasRendererBasics<T>, posProps: FrozenCanvasRendererPosition) {
        if (!shallowEqual(this.basicProps, basicProps)) {
            this.prevDraw = null;
        }
        this.basicProps = basicProps;
        this.posProps = posProps;
        this.drawScaled(this.draw);
    }

    public draw = () => {
        const basicProps = this.basicProps;
        const posProps = this.posProps;
        const prevDraw = this.prevDraw;
        let rowAreaToPaint: ClientRect|null;
        let colAreaToPaint: ClientRect|null;
        if (!prevDraw) {
            // It's the first draw, the entire area is 'invalidated'
            rowAreaToPaint = {
                left: 0, right: basicProps.canvasSize.width, width: basicProps.canvasSize.width,
                top: 0, bottom: basicProps.frozenRowsHeight, height: basicProps.frozenRowsHeight,
            };
            colAreaToPaint = {
                left: 0, right: basicProps.frozenColsWidth, width: basicProps.frozenColsWidth,
                top: basicProps.frozenRowsHeight, bottom: basicProps.canvasSize.height,
                height: basicProps.canvasSize.height - basicProps.frozenRowsHeight,
            };

            // Fill the background with border colour
            this.drawInvalidatedAreaBackground(rowAreaToPaint, colAreaToPaint);

            // Draw immobile cell(s) in top left; these will not be redrawn (or overdrawn) when scrolling
            this.drawTopLeftCells(basicProps);
        } else {
            const xDiff = (prevDraw.gridOffset.x - posProps.gridOffset.x);
            const yDiff = (prevDraw.gridOffset.y - posProps.gridOffset.y);

            // Translate rows and cols according to difference from previous draw
            this.shiftRowsHorizontally(basicProps, xDiff);
            this.shiftColsVertically(basicProps, yDiff);

            // Work out the rects that have been revealed since the last drawn
            rowAreaToPaint = this.calculateInvalidatedAreaRows(basicProps, xDiff);
            colAreaToPaint = this.calculateInvalidatedAreaCols(basicProps, yDiff);

            // Fill the newly revealed part of the rows and cols with border colour as background
            this.drawInvalidatedAreaBackground(rowAreaToPaint, colAreaToPaint);
        }

        // Draw frozen rows
        this.drawInvalidatedCellsRows(basicProps, posProps, rowAreaToPaint);

        // Draw frozen cols
        this.drawInvalidatedCellsCols(basicProps, posProps, colAreaToPaint);
    }

    public drawInvalidatedAreaBackground(rowAreaToPaint: ClientRect|null, colAreaToPaint: ClientRect|null) {
        this.context.fillStyle = borderColour;
        if (rowAreaToPaint) {
            this.context.fillRect(
                rowAreaToPaint.left,
                rowAreaToPaint.top,
                rowAreaToPaint.width,
                rowAreaToPaint.height,
            );
        }
        if (colAreaToPaint) {
            this.context.fillRect(
                colAreaToPaint.left,
                colAreaToPaint.top,
                colAreaToPaint.width,
                colAreaToPaint.height,
            );
        }
    }

    public shiftRowsHorizontally(props: FrozenCanvasRendererBasics<T>, xDiff: number) {
        this.context.drawImage(
            this.canvas,
            // source rows from right of top-left immobile cell(s) plus the delta
            (props.frozenColsWidth - xDiff) * this.dpr, 0,
            (this.canvas.width - props.frozenColsWidth) * this.dpr, props.frozenRowsHeight * this.dpr,
            // destination to right of top-left immobile cell(s)
            props.frozenColsWidth, 0,
            this.canvas.width - props.frozenColsWidth, props.frozenRowsHeight,
        );
    }

    public shiftColsVertically(props: FrozenCanvasRendererBasics<T>, yDiff: number) {
        this.context.drawImage(
            this.canvas,
            // source rows from bottom of top-left immobile cell(s) plus the delta
            0, (props.frozenRowsHeight - yDiff) * this.dpr,
            props.frozenColsWidth * this.dpr, (this.canvas.height - props.frozenRowsHeight) * this.dpr ,
            // destination to bottom of top-left immobile cell(s)
            0, props.frozenRowsHeight,
            props.frozenColsWidth, this.canvas.height - props.frozenRowsHeight,
        );
    }

    public calculateInvalidatedAreaRows(props: FrozenCanvasRendererBasics<T>, xDiff: number): ClientRect|null {
        if (xDiff < 0) {
            // Moved right - draw right
            const left = props.canvasSize.width + xDiff;
            const width = -xDiff;
            return {
                left, width, right: left + width,
                top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
            };
        } else if (xDiff > 0) {
            // Moved left - draw left
            const left = props.frozenColsWidth;
            const width = xDiff;
            return {
                left, width, right: left + width,
                top: 0, bottom: props.frozenRowsHeight, height: props.frozenRowsHeight,
            };
        } else {
            // Didn't move horiztonally - no area to invalidate
            return null;
        }
    }

    public calculateInvalidatedAreaCols(props: FrozenCanvasRendererBasics<T>, yDiff: number): ClientRect|null {
        if (yDiff < 0) {
            // Moved down - draw bottom
            const top = props.canvasSize.height + yDiff;
            const height = -yDiff;
            return {
                top, height, bottom: top + height,
                left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
            };
        } else if (yDiff > 0) {
            // Moved up - draw top
            const top = props.frozenRowsHeight;
            const height = yDiff;
            return {
                top, height, bottom: top + height,
                left: 0, right: props.frozenColsWidth, width: props.frozenColsWidth,
            };
        } else {
            // Didn't move vertically - no area to invalidate
            return null;
        }
    }

    public drawTopLeftCells(props: FrozenCanvasRendererBasics<T>) {
        for (let colIndex = 0; colIndex < props.frozenCols; colIndex++) {
            const col = props.columns[colIndex];
            for (let rowIndex = 0; rowIndex < props.frozenRows; rowIndex++) {
                const cellBounds = calculateCellBounds(props, rowIndex, colIndex);

                const row = props.data[rowIndex];
                const cell = row[col.fieldName];
                this.drawCell(cell, cellBounds, {column: col, rowIndex, colIndex});
            }
        }
    }

    public drawInvalidatedCellsRows(
        basicProps: FrozenCanvasRendererBasics<T>,
        posProps: FrozenCanvasRendererPosition,
        rowAreaToPaint: ClientRect|null,
    ) {
        if (!rowAreaToPaint) {
            return;
        }

        this.context.save();

        // Set the clip area to the frozen rows part of the canvas
        this.context.beginPath();
        this.context.rect(
            basicProps.frozenColsWidth, 0,
            basicProps.canvasSize.width - basicProps.frozenColsWidth, basicProps.frozenRowsHeight,
        );
        this.context.closePath();
        this.context.clip();

        // Translate the context (and invalidated rect) to go from canvas coords to grid coords
        this.context.translate(-posProps.gridOffset.x, 0);
        if (rowAreaToPaint) {
            rowAreaToPaint = translateRectX(rowAreaToPaint, posProps.gridOffset.x);
        }

        const visibleLeft = posProps.gridOffset.x + basicProps.frozenColsWidth;
        const visibleRight = posProps.gridOffset.x + basicProps.canvasSize.width;
        for (let colIndex = 0; colIndex < basicProps.columns.length; colIndex++) {
            const {left: cellLeft, right: cellRight} = basicProps.colBoundaries[colIndex];
            if (cellRight < visibleLeft) {
                // Cell is off screen to left, so skip this column
                continue;
            }
            if (cellLeft > visibleRight) {
                // Cell is off screen to right, so skip this and all future columns
                break;
            }
            const col = basicProps.columns[colIndex];
            for (let rowIndex = 0; rowIndex < basicProps.frozenRows; rowIndex++) {
                const cellBounds = calculateCellBounds(basicProps, rowIndex, colIndex);

                if (rectsInsersect(cellBounds, rowAreaToPaint)) {
                    // Cell overlaps with redraw area, so needs drawing
                    const row = basicProps.data[rowIndex];
                    const cell = row[col.fieldName];

                    this.drawCell(cell, cellBounds, {column: col, rowIndex, colIndex});
                }
            }
        }

        this.context.restore();
    }

    public drawInvalidatedCellsCols(
        basicProps: FrozenCanvasRendererBasics<T>,
        posProps: FrozenCanvasRendererPosition,
        colAreaToPaint: ClientRect|null,
    ) {
        if (!colAreaToPaint) {
            return;
        }

        this.context.save();

        // Set the clip area to the frozen cols part of the canvas
        this.context.beginPath();
        this.context.rect(
            0, basicProps.frozenRowsHeight,
            basicProps.frozenColsWidth, basicProps.canvasSize.height - basicProps.frozenRowsHeight,
        );
        this.context.closePath();
        this.context.clip();

        // Translate the context (and invalidated rect) to go from canvas coords to grid coords
        this.context.translate(0, -posProps.gridOffset.y);
        if (colAreaToPaint) {
            colAreaToPaint = translateRectY(colAreaToPaint, posProps.gridOffset.y);
        }

        const visibleTop = posProps.gridOffset.y + basicProps.frozenRowsHeight;
        const visibleBottom = posProps.gridOffset.y + basicProps.canvasSize.height;
        const minRowIndex = Math.floor(visibleTop / (basicProps.rowHeight + basicProps.borderWidth));
        const maxRowIndex = Math.min(
            basicProps.data.length,
            Math.ceil(visibleBottom / (basicProps.rowHeight + basicProps.borderWidth)),
        );
        for (let colIndex = 0; colIndex < basicProps.frozenCols; colIndex++) {
            const col = basicProps.columns[colIndex];
            for (let rowIndex = minRowIndex; rowIndex < maxRowIndex; rowIndex++) {
                const cellBounds = calculateCellBounds(basicProps, rowIndex, colIndex);

                if (rectsInsersect(cellBounds, colAreaToPaint)) {
                    // Cell overlaps with redraw area, so needs drawing
                    const row = basicProps.data[rowIndex];
                    const cell = row[col.fieldName];

                    this.drawCell(cell, cellBounds, {column: col, rowIndex, colIndex});
                }
            }
        }

        this.context.restore();
    }
}

function calculateCellBounds(props: FrozenCanvasRendererBasics<any>, rowIndex: number, colIndex: number) {
    const col = props.columns[colIndex];
    const {left: cellLeft} = props.colBoundaries[colIndex];
    return {
        left: cellLeft,
        top: rowIndex * (props.rowHeight + props.borderWidth),
        right: cellLeft + col.width,
        bottom: rowIndex * (props.rowHeight + props.borderWidth) + props.rowHeight,
        width: col.width,
        height: props.rowHeight,
    };
}

function rectsInsersect(rect1: ClientRect, rect2: ClientRect) {
    return rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top;
}

function translateRectX(rect: ClientRect, x: number): ClientRect {
    return {
        ...rect,
        left: rect.left + x,
        right: rect.right + x,
    };
}

function translateRectY(rect: ClientRect, y: number): ClientRect {
    return {
        ...rect,
        top: rect.top + y,
        bottom: rect.bottom + y,
    };
}
