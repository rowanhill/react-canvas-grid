import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { CursorState, SelectionState } from './cursorState';
import * as cursorState from './cursorState';
import * as ScrollGeometry from './scrollbarGeometry';
import { ScrollbarPosition } from './scrollbarGeometry';
import { ColumnDef, Coord, DataRow, Size } from './types';

export interface HighlightCanvassRendererBasics {
    data: Array<DataRow<any>>;
    columns: ColumnDef[];
    width: number;
    height: number;
    gridSize: Size;
    frozenColsWidth: number;
    frozenRowsHeight: number;
    rowHeight: number;
    colBoundaries: Array<{left: number; right: number}>;
    borderWidth: number;
    dpr: number;
}

export interface HighlightCanvasRendererPosition {
    gridOffset: Coord;
}

export interface HighlightCanvasRendererSelection {
    cursorState: CursorState;
}

const defaultPosProps = {
    gridOffset: { x: 0, y: 0 },
};

export class HighlightCanvasRenderer extends CommonCanvasRenderer<any> {
    private basicProps: HighlightCanvassRendererBasics;
    private posProps: HighlightCanvasRendererPosition = defaultPosProps;
    private selectionProps: HighlightCanvasRendererSelection = {
        cursorState: cursorState.createDefault(),
    };

    private xScrollBarPos: { extent: ScrollbarPosition, y: number } | null = null;
    private yScrollBarPos: { extent: ScrollbarPosition, x: number } | null = null;

    constructor(canvas: HTMLCanvasElement, basicProps: HighlightCanvassRendererBasics) {
        super(canvas, basicProps.dpr, true);
        this.basicProps = basicProps;
    }

    public reset(basicProps: HighlightCanvassRendererBasics) {
        if (shouldSelectionClear(this.basicProps, basicProps)) {
            this.selectionProps = { cursorState: cursorState.createDefault() };
        }
        this.basicProps = basicProps;
        this.recalculateScrollbars();
        this.drawScaled(this.draw);
    }

    public updatePos(posProps: HighlightCanvasRendererPosition) {
        this.posProps = posProps;
        this.recalculateScrollbars();
        this.drawScaled(this.draw);
    }

    public updateSelection(selectProps: HighlightCanvasRendererSelection) {
        this.selectionProps = selectProps;
        this.drawScaled(this.draw);
    }

    public draw = () => {
        const context = this.context;

        // Clear the higlight layer
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        context.translate(-this.posProps.gridOffset.x, -this.posProps.gridOffset.y);

        context.lineCap = 'butt';
        context.fillStyle = '#2276e440';
        context.strokeStyle = '#2276e4';

        // Draw edit cursor cell outline
        if (this.selectionProps.cursorState.editCursorCell) {
            context.lineWidth = 2;
            const rect = this.gridCellCoordToGridPixelCoord(this.selectionProps.cursorState.editCursorCell);
            context.strokeRect(rect.left, rect.top, rect.width, rect.height);
            context.lineWidth = 1;
        }

        // Draw selected cell highlights
        if (this.selectionProps.cursorState.selection &&
            isSelectionMoreThanOneCell(this.selectionProps.cursorState.selection)
        ) {
            const tl =
                this.gridCellCoordToGridPixelCoord(this.selectionProps.cursorState.selection.selectedRange.topLeft);
            const br =
                this.gridCellCoordToGridPixelCoord(this.selectionProps.cursorState.selection.selectedRange.bottomRight);
            context.fillRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
            context.strokeRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.posProps.gridOffset.x, this.posProps.gridOffset.y);

        // Set up for drawing scrollbars
        context.lineWidth = ScrollGeometry.barWidth;
        context.lineCap = 'round';
        context.strokeStyle = 'rgba(0, 0, 0, 0.4)';

        // Draw horizontal scrollbar (if needed)
        if (this.xScrollBarPos) {
            context.beginPath();
            context.moveTo(this.xScrollBarPos.extent.start, this.xScrollBarPos.y);
            context.lineTo(this.xScrollBarPos.extent.end, this.xScrollBarPos.y);
            context.stroke();
        }

        // Draw vertical scrollbar (if needed)
        if (this.yScrollBarPos) {
            context.beginPath();
            context.moveTo(this.yScrollBarPos.x, this.yScrollBarPos.extent.start);
            context.lineTo(this.yScrollBarPos.x, this.yScrollBarPos.extent.end);
            context.stroke();
        }
    }

    public getScrollbarPositions = () => {
        return {
            horizontal: this.xScrollBarPos,
            vertical: this.yScrollBarPos,
        };
    }

    private recalculateScrollbars = () => {
        // Recalc horizontal scrollbar
        if (this.basicProps.gridSize.width > this.basicProps.width) {
            const xPos = ScrollGeometry.calculatePosition(
                this.posProps.gridOffset.x,
                this.basicProps.width,
                this.basicProps.gridSize.width,
                ScrollGeometry.calculateLength(
                    this.basicProps.width,
                    this.basicProps.gridSize.width,
                    this.basicProps.frozenColsWidth,
                ),
                this.basicProps.frozenColsWidth,
            );
            const y = ScrollGeometry.calculateTransversePosition(this.basicProps.height);
            this.xScrollBarPos = { extent: xPos, y };
        } else {
            this.xScrollBarPos = null;
        }

        // Recalc vertical scrollbar
        if (this.basicProps.gridSize.height > this.basicProps.height) {
            const yPos = ScrollGeometry.calculatePosition(
                this.posProps.gridOffset.y,
                this.basicProps.height,
                this.basicProps.gridSize.height,
                ScrollGeometry.calculateLength(
                    this.basicProps.height,
                    this.basicProps.gridSize.height,
                    this.basicProps.frozenRowsHeight,
                ),
                this.basicProps.frozenRowsHeight,
            );
            const x = ScrollGeometry.calculateTransversePosition(this.basicProps.width);
            this.yScrollBarPos = { extent: yPos, x };
        } else {
            this.yScrollBarPos = null;
        }
    }

    private gridCellCoordToGridPixelCoord = ({x, y}: {x: number; y: number}): ClientRect => {
        return {
            top: y * (this.basicProps.rowHeight + this.basicProps.borderWidth),
            bottom: (y + 1) * (this.basicProps.rowHeight + + this.basicProps.borderWidth) - this.basicProps.borderWidth,
            height: this.basicProps.rowHeight,
            left: this.basicProps.colBoundaries[x].left,
            right: this.basicProps.colBoundaries[x].right,
            width: this.basicProps.colBoundaries[x].right - this.basicProps.colBoundaries[x].left,
        };
    }
}

function isSelectionMoreThanOneCell(selection: SelectionState) {
    const tl = selection.selectedRange.topLeft;
    const br = selection.selectedRange.bottomRight;
    return tl.x !== br.x || tl.y !== br.y;
}

export function shouldSelectionClear(
    prev: { columns: ColumnDef[], data: Array<DataRow<any>>},
    next: { columns: ColumnDef[], data: Array<DataRow<any>>},
): boolean {
    return (prev.columns !== next.columns || prev.data.length !== next.data.length);
}
