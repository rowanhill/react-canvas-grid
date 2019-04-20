import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { CursorState, SelectionState } from './cursorState';
import * as cursorState from './cursorState';
import { ColumnBoundary } from './gridGeometry';
import * as ScrollGeometry from './scrollbarGeometry';
import { ScrollbarPosition } from './scrollbarGeometry';
import { ColumnDef, Coord, DataRow, Size } from './types';

export interface HighlightCanvasRendererBasics {
    data: Array<DataRow<any>>;
    columns: ColumnDef[];
    canvasSize: Size;
    gridSize: Size;
    frozenColsWidth: number;
    frozenRowsHeight: number;
    rowHeight: number;
    columnBoundaries: ColumnBoundary[];
    borderWidth: number;
}

export interface HighlightCanvasRendererPosition {
    gridOffset: Coord;
    horizontalScrollbarPos: ScrollbarPosition | null;
    verticalScrollbarPos: ScrollbarPosition | null;
}

export interface HighlightCanvasRendererSelection {
    cursorState: CursorState;
}

const defaultPosProps = {
    gridOffset: { x: 0, y: 0 },
    horizontalScrollbarPos: null,
    verticalScrollbarPos: null,
};

export class HighlightCanvasRenderer extends CommonCanvasRenderer<any> {
    private basicProps: HighlightCanvasRendererBasics;
    private posProps: HighlightCanvasRendererPosition = defaultPosProps;
    private selectionProps: HighlightCanvasRendererSelection = {
        cursorState: cursorState.createDefault(),
    };

    constructor(canvas: HTMLCanvasElement, basicProps: HighlightCanvasRendererBasics, dpr: number) {
        super(canvas, dpr, true);
        this.basicProps = basicProps;
    }

    public updateProps(
        basicProps: HighlightCanvasRendererBasics,
        posProps: HighlightCanvasRendererPosition,
        selectProps: HighlightCanvasRendererSelection,
    ) {
        this.basicProps = basicProps;
        this.posProps = posProps;
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
        context.fillStyle = 'rgba(33, 117, 228, 0.25)';
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
        if (this.posProps.horizontalScrollbarPos) {
            const scrollPos = this.posProps.horizontalScrollbarPos;
            context.beginPath();
            context.moveTo(scrollPos.extent.start, scrollPos.transverse);
            context.lineTo(scrollPos.extent.end, scrollPos.transverse);
            context.stroke();
        }

        // Draw vertical scrollbar (if needed)
        if (this.posProps.verticalScrollbarPos) {
            const scrollPos = this.posProps.verticalScrollbarPos;
            context.beginPath();
            context.moveTo(scrollPos.transverse, scrollPos.extent.start);
            context.lineTo(scrollPos.transverse, scrollPos.extent.end);
            context.stroke();
        }
    }

    private gridCellCoordToGridPixelCoord = ({x, y}: {x: number; y: number}): ClientRect => {
        return {
            top: y * (this.basicProps.rowHeight + this.basicProps.borderWidth),
            bottom: (y + 1) * (this.basicProps.rowHeight + + this.basicProps.borderWidth) - this.basicProps.borderWidth,
            height: this.basicProps.rowHeight,
            left: this.basicProps.columnBoundaries[x].left,
            right: this.basicProps.columnBoundaries[x].right,
            width: this.basicProps.columnBoundaries[x].right - this.basicProps.columnBoundaries[x].left,
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
