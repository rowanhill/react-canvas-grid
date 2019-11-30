import { CommonCanvasRenderer } from './commonCanvasRenderer';
import { ColumnBoundary } from './gridGeometry';
import * as ScrollGeometry from './scrollbarGeometry';
import { ScrollbarPosition } from './scrollbarGeometry';
import { NoSelection } from './selectionState/noSelection';
import { AllSelectionStates } from './selectionState/selectionStateFactory';
import { CellCoordBounds, SelectRange } from './selectionState/selectionTypes';
import { ColumnDef, Coord, DataRow } from './types';

export interface HighlightCanvasRendererBasics {
    rowHeight: number;
    columnBoundaries: ColumnBoundary[];
    borderWidth: number;
    horizontalGutterBounds: ClientRect|null;
    verticalGutterBounds: ClientRect|null;
    cellBounds: CellCoordBounds;
}

export interface HighlightCanvasRendererPosition {
    gridOffset: Coord;
    visibleRect: ClientRect;
}

export interface HighlightCanvasRendererScrollbar {
    horizontalScrollbarPos: ScrollbarPosition | null;
    verticalScrollbarPos: ScrollbarPosition | null;
    hoveredScrollbar: 'x' | 'y' | null;
}

export interface HighlightCanvasRendererSelection {
    selectionState: AllSelectionStates;
}

const defaultPosProps: HighlightCanvasRendererPosition = {
    gridOffset: { x: 0, y: 0 },
    visibleRect: { left: 0, top: 0, right: 0, bottom: 0, height: 0, width: 0 },
};

const defaultScrollbarProps: HighlightCanvasRendererScrollbar = {
    horizontalScrollbarPos: null,
    verticalScrollbarPos: null,
    hoveredScrollbar: null,
};

const defaultScrollbarStyle = 'rgba(0, 0, 0, 0.4)';
const hoveredScrollbarStyle = 'rgba(0, 0, 0, 0.55)';

export class HighlightCanvasRenderer extends CommonCanvasRenderer<any> {
    private basicProps: HighlightCanvasRendererBasics;
    private posProps: HighlightCanvasRendererPosition = defaultPosProps;
    private scrollProps: HighlightCanvasRendererScrollbar = defaultScrollbarProps;
    private selectionProps: HighlightCanvasRendererSelection = {
        selectionState: new NoSelection(false),
    };

    constructor(canvas: HTMLCanvasElement, basicProps: HighlightCanvasRendererBasics, dpr: number) {
        super(canvas, dpr, true);
        this.basicProps = basicProps;
    }

    public updateProps(
        canvas: HTMLCanvasElement,
        basicProps: HighlightCanvasRendererBasics,
        posProps: HighlightCanvasRendererPosition,
        scrollProps: HighlightCanvasRendererScrollbar,
        selectProps: HighlightCanvasRendererSelection,
    ) {
        if (this.canvas !== canvas) {
            this.setCanvas(canvas);
        }
        this.basicProps = basicProps;
        this.posProps = posProps;
        this.scrollProps = scrollProps,
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
        const editCursorCell = this.selectionProps.selectionState.getCursorCell(this.basicProps.cellBounds);
        if (editCursorCell) {
            context.lineWidth = 2;
            const rect = this.gridCellCoordToGridPixelCoord(editCursorCell);
            context.strokeRect(rect.left, rect.top, rect.width, rect.height);
            context.lineWidth = 1;
        }

        // Draw selected cell highlights
        const selectionRange = this.selectionProps.selectionState.getSelectionRange(this.basicProps.cellBounds);
        if (selectionRange && isSelectionMoreThanOneCell(selectionRange)) {
            const tl = this.gridCellCoordToGridPixelCoord(selectionRange.topLeft);
            const br = this.gridCellCoordToGridPixelCoord(selectionRange.bottomRight);
            context.fillRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
            context.strokeRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        context.translate(this.posProps.gridOffset.x, this.posProps.gridOffset.y);

        // Draw scrollbar gutters
        const vBounds = this.basicProps.verticalGutterBounds;
        const hBounds = this.basicProps.horizontalGutterBounds;
        if (vBounds || hBounds) {
            this.context.fillStyle = '#eee';
            if (vBounds) {
                this.context.fillRect(vBounds.left, vBounds.top, vBounds.width, vBounds.height);
            }
            if (hBounds) {
                this.context.fillRect(hBounds.left, hBounds.top, hBounds.width, hBounds.height);
            }

            this.context.strokeStyle = 'lightgrey';
            this.context.lineWidth = 1;
            this.context.beginPath();
            if (vBounds) {
                this.context.moveTo(vBounds.left, 0);
                this.context.lineTo(vBounds.left, vBounds.height - (hBounds ? hBounds.height : 0));
                this.context.moveTo(vBounds.right, 0);
                this.context.lineTo(vBounds.right, vBounds.height);
            }
            if (hBounds) {
                this.context.moveTo(0, hBounds.top);
                this.context.lineTo(hBounds.width - (vBounds ? vBounds.width : 0), hBounds.top);
                this.context.moveTo(0, hBounds.bottom);
                this.context.lineTo(hBounds.width, hBounds.bottom);
            }
            this.context.stroke();
        }

        // Set up for drawing scrollbars
        context.lineCap = 'round';

        // Draw horizontal scrollbar (if needed)
        if (this.scrollProps.horizontalScrollbarPos) {
            if (this.scrollProps.hoveredScrollbar === 'x') {
                context.strokeStyle = hoveredScrollbarStyle;
                context.lineWidth = ScrollGeometry.barWidth + 3;
            } else {
                context.strokeStyle = defaultScrollbarStyle;
                context.lineWidth = ScrollGeometry.barWidth;
            }
            const scrollPos = this.scrollProps.horizontalScrollbarPos;
            context.beginPath();
            context.moveTo(scrollPos.extent.start, scrollPos.transverse);
            context.lineTo(scrollPos.extent.end, scrollPos.transverse);
            context.stroke();
        }

        // Draw vertical scrollbar (if needed)
        if (this.scrollProps.verticalScrollbarPos) {
            if (this.scrollProps.hoveredScrollbar === 'y') {
                context.strokeStyle = hoveredScrollbarStyle;
                context.lineWidth = ScrollGeometry.barWidth + 3;
            } else {
                context.strokeStyle = defaultScrollbarStyle;
                context.lineWidth = ScrollGeometry.barWidth;
            }
            const scrollPos = this.scrollProps.verticalScrollbarPos;
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

function isSelectionMoreThanOneCell(selection: SelectRange) {
    const tl = selection.topLeft;
    const br = selection.bottomRight;
    return tl.x !== br.x || tl.y !== br.y;
}

export function shouldSelectionClear(
    prev: { columns: ColumnDef[], data: Array<DataRow<any>>},
    next: { columns: ColumnDef[], data: Array<DataRow<any>>},
): boolean {
    return (prev.columns !== next.columns || prev.data.length !== next.data.length);
}
