import shallowEqual from 'shallow-equals';
import { BaseGridOffsetRenderer, CanvasRendererPosition } from './baseGridOffsetRenderer';
import { ColumnBoundary, GridGeometry } from './gridGeometry';
import { CellsSelection } from './selectionState/cellsSelection';
import { NoSelection } from './selectionState/noSelection';
import { AllSelectionStates } from './selectionState/selectionStateFactory';
import { CellCoordBounds, SelectRange } from './selectionState/selectionTypes';
import { ColumnDef, DataRow } from './types';

export interface HighlightCanvasRendererBasics {
    rowHeight: number;
    columnBoundaries: ColumnBoundary[];
    borderWidth: number;
    horizontalGutterBounds: ClientRect|null;
    verticalGutterBounds: ClientRect|null;
    cellBounds: CellCoordBounds;
    shouldAllowAutofill: (selectRange: SelectRange) => boolean;
}

export interface HighlightCanvasRendererHover {
    autofillHandleIsHovered: boolean;
}

export interface HighlightCanvasRendererSelection {
    selectionState: AllSelectionStates;
}

const defaultHoverProps: HighlightCanvasRendererHover = {
    autofillHandleIsHovered: false,
};

const colours = {
    blue: {
        mediumTransparent: 'hsla(214, 78%, 51%, 0.25)',
        medium: 'hsla(214, 78%, 51%, 1)',
        light: 'hsla(214, 93%, 64%, 1)',
    },
};

const styles = {
    selectedCells: {
        fill: colours.blue.mediumTransparent,
        stroke: colours.blue.medium,
    },
    autofillCells: {
        stroke: colours.blue.medium,
    },
    autofillHandle: {
        defaultFill: colours.blue.medium,
        hoverFill: colours.blue.light,
    },
};

export class HighlightCanvasRenderer extends BaseGridOffsetRenderer<any> {
    private basicProps: HighlightCanvasRendererBasics;
    private hoverProps: HighlightCanvasRendererHover = defaultHoverProps;
    private selectionProps: HighlightCanvasRendererSelection = {
        selectionState: new NoSelection(false),
    };

    constructor(name: string, canvas: HTMLCanvasElement, basicProps: HighlightCanvasRendererBasics, dpr: number) {
        super(name, canvas, dpr, true);
        this.basicProps = basicProps;
    }

    public updateProps(
        canvas: HTMLCanvasElement,
        basicProps: HighlightCanvasRendererBasics,
        posProps: CanvasRendererPosition,
        hoverProps: HighlightCanvasRendererHover,
        selectProps: HighlightCanvasRendererSelection,
    ) {
        if (this.canvas !== canvas) {
            this.setCanvas(canvas);
        }
        this.basicProps = basicProps;
        this.posProps = posProps;
        this.hoverProps = hoverProps;
        this.selectionProps = selectProps;
        this.drawScaled(this.draw, this.drawUntranslated);
    }

    public drawUntranslated = () => {
        // Clear the higlight layer
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public draw = () => {
        const context = this.context;

        context.lineCap = 'butt';
        context.fillStyle = styles.selectedCells.fill;
        context.strokeStyle = styles.selectedCells.stroke;

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

        if (this.selectionProps.selectionState instanceof CellsSelection) {
            if (selectionRange && this.basicProps.shouldAllowAutofill(selectionRange)) {
                // Draw autofill handle
                context.fillStyle = this.hoverProps.autofillHandleIsHovered ?
                    styles.autofillHandle.hoverFill :
                    styles.autofillHandle.defaultFill;
                const rect = this.gridCellCoordToGridPixelCoord(selectionRange.bottomRight);
                context.fillRect(rect.right - 3, rect.bottom - 3, 6, 6);
                context.strokeRect(rect.right - 3, rect.bottom - 3, 6, 6);
            }

            const autofillRange = this.selectionProps.selectionState.getAutofillRange();
            if (autofillRange) {
                const topLeftRect = this.gridCellCoordToGridPixelCoord(autofillRange.topLeft);
                const bottomRightRect = this.gridCellCoordToGridPixelCoord(autofillRange.bottomRight);

                // Draw the currently dragged autofill range
                context.strokeStyle = styles.autofillCells.stroke;
                context.setLineDash([5, 7]);
                context.strokeRect(
                    topLeftRect.left,
                    topLeftRect.top,
                    bottomRightRect.right - topLeftRect.left,
                    bottomRightRect.bottom - topLeftRect.top,
                );
                context.setLineDash([]);
            }
        }
    }

    private gridCellCoordToGridPixelCoord = ({x, y}: {x: number; y: number}): ClientRect => {
        return GridGeometry.calculateCellBounds(
            x,
            y,
            this.basicProps.rowHeight,
            this.basicProps.borderWidth,
            this.basicProps.columnBoundaries,
        );
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
    return (!shallowEqual(prev.columns, next.columns) || prev.data.length !== next.data.length);
}
