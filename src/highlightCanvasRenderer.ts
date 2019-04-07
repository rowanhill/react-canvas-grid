import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { CursorState, SelectionState } from './cursorState';
import * as ScrollGeometry from './scrollbarGeometry';
import { Coord, Size } from './types';

export interface HighlightCanvassRendererBasics {
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
        cursorState: { editCursorCell: null, selection: null },
    };

    constructor(canvas: HTMLCanvasElement, basicProps: HighlightCanvassRendererBasics) {
        super(canvas, basicProps.dpr, true);
        this.basicProps = basicProps;
    }

    public reset(basicProps: HighlightCanvassRendererBasics) {
        this.basicProps = basicProps;
        this.draw();
    }

    public updatePos(posProps: HighlightCanvasRendererPosition) {
        this.posProps = posProps;
        this.draw();
    }

    public updateSelection(selectProps: HighlightCanvasRendererSelection) {
        this.selectionProps = selectProps;
        this.draw();
    }

    public draw() {
        const context = this.canvas.getContext('2d', { alpha: true });
        if (!context) {
            return;
        }

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
            context.beginPath();
            context.moveTo(xPos.start, this.basicProps.height - ScrollGeometry.barWidth);
            context.lineTo(xPos.end, this.basicProps.height - ScrollGeometry.barWidth);
            context.stroke();
        }

        // Draw vertical scrollbar (if needed)
        if (this.basicProps.gridSize.height > this.basicProps.height) {
            const yPos = ScrollGeometry.calculatePosition(
                this.posProps.gridOffset.y,
                this.basicProps.height,
                this.basicProps.gridSize.height,
                ScrollGeometry.calculateLength(
                    this.basicProps.height,
                    this.basicProps.gridSize.height,
                    this.basicProps.height,
                ),
                this.basicProps.frozenRowsHeight,
            );
            context.beginPath();
            context.moveTo(this.basicProps.width - ScrollGeometry.barWidth, yPos.start);
            context.lineTo(this.basicProps.width - ScrollGeometry.barWidth, yPos.end);
            context.stroke();
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
