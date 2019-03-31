import * as React from 'react';
import { CanvasHolder } from './CanvasHolder';
import { CursorState, CursorStateWithSelection, SelectRange } from './cursorState';
import * as cursorState from './cursorState';
import { FrozenCanvas } from './FrozenCanvas';
import { FrozenCanvasRenderer } from './frozenCanvasRenderer';
import { GridGeometry } from './gridGeometry';
import { HighlightCanvas } from './HighlightCanvas';
import { HighlightCanvasRenderer } from './highlightCanvasRenderer';
import { MainCanvas } from './MainCanvas';
import { MainCanvasRenderer } from './mainCanvasRenderer';
import { ColumnDef, Coord, DataRow } from './types';

interface RequiredProps<T> {
    columns: ColumnDef[];
    data: Array<DataRow<T>>;
    rowHeight: number;

    onSelectionChangeStart?: (selectRange: SelectRange) => void;
    onSelectionChangeUpdate?: (selectRange: SelectRange) => void;
    onSelectionChangeEnd?: (selectRange: SelectRange) => void;
}
interface DefaultedProps {
    borderWidth: number;
    frozenRows: number;
    frozenCols: number;
}

export type DefaultedReactCanvasGridProps<T> = RequiredProps<T> & Partial<DefaultedProps>;
export type ReactCanvasGridProps<T> = RequiredProps<T> & DefaultedProps;

interface ReactCanvasGridState {
    scrollParent: HTMLElement|null;
}

export class ReactCanvasGrid<T> extends React.Component<ReactCanvasGridProps<T>, ReactCanvasGridState> {
    public static defaultProps = {
        borderWidth: 1,
        frozenRows: 0,
        frozenCols: 0,
    };

    private readonly sizerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private readonly canvasHolderRef: React.RefObject<HTMLDivElement> = React.createRef();

    private cursorState: CursorState = cursorState.createDefault();

    private mainRenderer: MainCanvasRenderer<T>|null = null;
    private frozenRenderer: FrozenCanvasRenderer<T>|null = null;
    private highlightRenderer: HighlightCanvasRenderer|null = null;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);
        this.state = {
            scrollParent: null,
        };
    }

    public componentDidMount() {
        if (!this.canvasHolderRef.current) {
            throw new Error('canvasHolder ref not set in componentDidMount, so cannot determine scroll parent');
        }
        const scrollParent = getScrollParent(this.canvasHolderRef.current, true);

        if (scrollParent && scrollParent !== document.body) {
            scrollParent.addEventListener('scroll', this.onScroll);
        }
        window.addEventListener('scroll', this.onScroll);

        // Set the scrollParent, causing a re-render, at which point the canvases will be properly sized.
        this.setState({ scrollParent }, () => {
            // Once the canvases are sized, we can trigger a draw with initial position information
            // An easy way to do this is fake a scroll event
            this.onScroll();
        });
    }

    public componentWillUnmount() {
        if (this.state.scrollParent && this.state.scrollParent !== document.body) {
            this.state.scrollParent.removeEventListener('scroll', this.onScroll);
        }
        window.removeEventListener('scroll', this.onScroll);
    }

    public render() {
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(this.props);
        // First render is before componentDidMount, so before we have found scrollParent.
        // In this case, we just render as 0x0. componentDidMount will then update state,
        // and we'll re-render
        const canvasSize = this.state.scrollParent ?
            GridGeometry.calculateMaxViewSize(this.props, this.state.scrollParent) :
            { height: 0, width: 0 };
        const gridSize = GridGeometry.calculateGridSize(this.props);
        const frozenRowsHeight = GridGeometry.calculateFrozenRowsHeight(this.props);
        const frozenColsWidth = GridGeometry.calculateFrozenColsWidth(this.props);

        return (
            <div
                ref={this.sizerRef}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                style={{
                    width: `${gridSize.width}px`,
                    height: `${gridSize.height}px`,
                }}
            >
                <CanvasHolder ref={this.canvasHolderRef} canvasSize={canvasSize}>
                    <MainCanvas<T>
                        data={this.props.data}
                        columns={this.props.columns}
                        rowHeight={this.props.rowHeight}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gridHeight={gridSize.height}
                        colBoundaries={columnBoundaries}
                        borderWidth={this.props.borderWidth}
                        setRenderer={(r) => this.mainRenderer = r}
                    />
                    <HighlightCanvas
                        rowHeight={this.props.rowHeight}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        colBoundaries={columnBoundaries}
                        borderWidth={this.props.borderWidth}
                        setRenderer={(r) => this.highlightRenderer = r}
                    />
                    <FrozenCanvas
                        data={this.props.data}
                        columns={this.props.columns}
                        colBoundaries={columnBoundaries}
                        rowHeight={this.props.rowHeight}
                        borderWidth={this.props.borderWidth}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        frozenRows={this.props.frozenRows}
                        frozenCols={this.props.frozenCols}
                        frozenRowsHeight={frozenRowsHeight}
                        frozenColsWidth={frozenColsWidth}
                        setRenderer={(r) => this.frozenRenderer = r}
                    />
                </CanvasHolder>
            </div>
        );
    }

    private scrollCanvases = (gridOffset: Coord, visibleRect: ClientRect) => {
        if (this.mainRenderer) {
            this.mainRenderer.updatePos({gridOffset, visibleRect});
        }
        if (this.frozenRenderer) {
            this.frozenRenderer.updatePos({gridOffset});
        }
        if (this.highlightRenderer) {
            this.highlightRenderer.updatePos({gridOffset});
        }
    }

    private onScroll = () => {
        if (!this.sizerRef.current) {
            return;
        }
        if (!this.state.scrollParent) {
            return;
        }
        const gridOffset = GridGeometry.calculateGridOffset(this.props, this.state.scrollParent, this.sizerRef.current);

        // Update the canvas holder's position outside of React, for performance reasons
        if (this.canvasHolderRef.current) {
            const transform = (gridOffset.x > 0 || gridOffset.y > 0) ?
                `translate(${gridOffset.x}px, ${gridOffset.y}px)` :
                '';
            this.canvasHolderRef.current.style.transform = transform;
        }

        const visibleRect = GridGeometry.calculateViewRect(
            this.props,
            gridOffset,
            this.state.scrollParent,
            this.sizerRef.current,
        );
        this.scrollCanvases(gridOffset, visibleRect);
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.highlightRenderer) {
            return;
        }
        const gridCoords = this.calculateGridCellCoords(event);
        const newCursorState = cursorState.startDrag(this.cursorState, gridCoords);
        if (this.props.onSelectionChangeStart) {
            this.props.onSelectionChangeStart(newCursorState.selection.selectedRange);
        }
        this.cursorState = newCursorState;
        this.highlightRenderer.updateSelection({ cursorState: this.cursorState });
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.cursorState.selection) {
            return;
        }
        const oldCursorState: CursorStateWithSelection = this.cursorState as CursorStateWithSelection;
        // tslint:disable-next-line: no-bitwise
        if ((event.buttons & 1) === 0) {
            return;
        }
        if (!this.highlightRenderer) {
            return;
        }
        const gridCoords = this.calculateGridCellCoords(event);
        const newCursorState = cursorState.updateDrag(oldCursorState, gridCoords);
        this.cursorState = newCursorState;
        if (this.props.onSelectionChangeUpdate) {
            const rangeChanged = cursorState.isSelectRangeDifferent(
                oldCursorState.selection.selectedRange,
                newCursorState.selection.selectedRange);
            if (rangeChanged) {
                this.props.onSelectionChangeUpdate(newCursorState.selection.selectedRange);
            }
        }
        this.highlightRenderer.updateSelection({ cursorState: this.cursorState });
    }

    private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.cursorState.selection) {
            return;
        }
        const oldCursorState: CursorStateWithSelection = this.cursorState as CursorStateWithSelection;
        if (!this.highlightRenderer) {
            return;
        }
        const gridCoords = this.calculateGridCellCoords(event);
        const newCursorState = cursorState.updateDrag(oldCursorState, gridCoords);
        this.cursorState = newCursorState;
        if (this.props.onSelectionChangeEnd) {
            this.props.onSelectionChangeEnd(newCursorState.selection.selectedRange);
        }
        this.highlightRenderer.updateSelection({ cursorState: this.cursorState });
    }

    private calculateGridCellCoords = (event: React.MouseEvent<any, any>) => {
        if (!this.sizerRef.current) {
            throw new Error('Cannot convert mouse event coords to grid coords because sizerRef is not set');
        }
        return GridGeometry.calculateGridCellCoords(
            event,
            this.props,
            this.sizerRef.current,
        );
    }
}

function getScrollParent(element: HTMLElement, includeHidden: boolean) {
    let style = getComputedStyle(element);
    const excludeStaticParent = style.position === 'absolute';
    const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
    const doc = element.ownerDocument || document;

    if (style.position === 'fixed') { return doc.body; }
    for (let parent: HTMLElement|null = element; parent !== null; parent = parent!.parentElement) {
        style = getComputedStyle(parent);
        if (excludeStaticParent && style.position === 'static') {
            continue;
        }
        if (overflowRegex.test(`${style.overflow}${style.overflowY}${style.overflowX}`)) {
            return parent;
        }
    }

    return doc.body;
}
