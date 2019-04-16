import * as React from 'react';
import * as cursorState from './cursorState';
import { CursorState, CursorStateWithSelection, SelectRange } from './cursorState';
import { FrozenCanvas } from './FrozenCanvas';
import { FrozenCanvasRenderer } from './frozenCanvasRenderer';
import { GridGeometry } from './gridGeometry';
import { HighlightCanvas } from './HighlightCanvas';
import { HighlightCanvasRenderer, shouldSelectionClear } from './highlightCanvasRenderer';
import { MainCanvas } from './MainCanvas';
import { MainCanvasRenderer } from './mainCanvasRenderer';
import * as ScrollbarGeometry from './scrollbarGeometry';
import { ColumnDef, Coord, DataRow, Size } from './types';

interface RequiredProps<T> {
    columns: ColumnDef[];
    data: Array<DataRow<T>>;
    rowHeight: number;

    onSelectionChangeStart?: (selectRange: SelectRange) => void;
    onSelectionChangeUpdate?: (selectRange: SelectRange) => void;
    onSelectionChangeEnd?: (selectRange: SelectRange) => void;
    onSelectionCleared?: () => void;
}
interface DefaultedProps {
    cssWidth: string;
    cssHeight: string;
    borderWidth: number;
    frozenRows: number;
    frozenCols: number;
}

export type DefaultedReactCanvasGridProps<T> = RequiredProps<T> & Partial<DefaultedProps>;
export type ReactCanvasGridProps<T> = RequiredProps<T> & DefaultedProps;

interface ReactCanvasGridState {
    rootSize: Size|null;
}

export class ReactCanvasGrid<T> extends React.Component<ReactCanvasGridProps<T>, ReactCanvasGridState> {
    public static defaultProps: DefaultedProps = {
        cssWidth: '100%',
        cssHeight: '100%',
        borderWidth: 1,
        frozenRows: 0,
        frozenCols: 0,
    };

    private readonly rootRef: React.RefObject<HTMLDivElement> = React.createRef();

    private queuedRender: number|null = null;
    private gridOffset: Coord = { x: 0, y: 0 };
    private cursorState: CursorState = cursorState.createDefault();
    private draggedScrollbar: { bar: 'x' | 'y'; origScrollbarStart: number; origClick: number } | null = null;

    private mainRenderer: MainCanvasRenderer<T>|null = null;
    private frozenRenderer: FrozenCanvasRenderer<T>|null = null;
    private highlightRenderer: HighlightCanvasRenderer|null = null;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);
        this.state = {
            rootSize: null,
        };
    }

    public componentDidMount() {
        if (!this.rootRef.current) {
            throw new Error('root element ref not set in componentDidMount, so cannot determine canvas size');
        }
        const rootRect = this.rootRef.current.getBoundingClientRect();

        this.rootRef.current.addEventListener('wheel', this.onWheel);

        // Set the rootSize, causing a re-render, at which point the canvases will be properly sized.
        this.setState({ rootSize: { width: rootRect.width, height: rootRect.height } }, () => {
            this.scrollCanvases();
        });
    }

    public componentDidUpdate(prevProps: ReactCanvasGridProps<T>) {
        if (shouldSelectionClear(prevProps, this.props)) {
            if (this.highlightRenderer) {
                this.cursorState = cursorState.createDefault();
                if (this.props.onSelectionCleared) {
                    this.props.onSelectionCleared();
                }
            }
        }

        const gridSize = GridGeometry.calculateGridSize(this.props);
        const canvasSize = this.calculateCanvasSize();
        const truncatedOffset = GridGeometry.truncateGridOffset(this.gridOffset, gridSize, canvasSize);
        if (truncatedOffset) {
            this.setOffset(truncatedOffset.x, truncatedOffset.y);
        }
    }

    public componentWillUnmount() {
        if (this.rootRef.current) {
            this.rootRef.current.removeEventListener('wheel', this.onWheel);
        }
    }

    public render() {
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(this.props);
        const canvasSize = this.calculateCanvasSize();
        const gridSize = GridGeometry.calculateGridSize(this.props);
        const frozenRowsHeight = GridGeometry.calculateFrozenRowsHeight(this.props);
        const frozenColsWidth = GridGeometry.calculateFrozenColsWidth(this.props);

        return (
            <div
                ref={this.rootRef}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                style={{
                    position: 'relative',
                    width: this.props.cssWidth,
                    height: this.props.cssHeight,
                }}
            >
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
                    data={this.props.data}
                    columns={this.props.columns}
                    rowHeight={this.props.rowHeight}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    gridSize={gridSize}
                    frozenRowsHeight={frozenRowsHeight}
                    frozenColsWidth={frozenColsWidth}
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
            </div>
        );
    }

    private scrollCanvases = () => {
        const gridOffset = this.gridOffset;
        if (this.mainRenderer) {
            this.mainRenderer.updatePos({gridOffset});
        }
        if (this.frozenRenderer) {
            this.frozenRenderer.updatePos({gridOffset});
        }
        if (this.highlightRenderer) {
            this.highlightRenderer.updatePos({gridOffset});
        }
    }

    private onWheel = (e: WheelEvent) => {
        // Browsers may use a 'delta mode' when wheeling, requesting multi-pixel movement
        // See https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
        const scaleFactors: { [index: number]: number; } = {
            0: 1,  // DOM_DELTA_PIXEL: 1-to-1
            1: 16, // DOM_DELTA_LINE: 16 seems a decent guess. See https://stackoverflow.com/q/20110224
        };
        const scaleFactor = scaleFactors[e.deltaMode];
        const willUpdate = this.updateOffset(e.deltaX * scaleFactor, e.deltaY * scaleFactor);

        if (willUpdate) {
            // The grid is going to move, so we want to prevent any other scrolling from happening
            e.preventDefault();
        }
    }

    private updateOffset = (deltaX: number, deltaY: number): boolean => {
        if (!this.state.rootSize) {
            return false;
        }
        const canvasSize = this.calculateCanvasSize();
        const gridSize = GridGeometry.calculateGridSize(this.props);
        const newX = intBetween(this.gridOffset.x + deltaX, 0, gridSize.width - canvasSize.width);
        const newY = intBetween(this.gridOffset.y + deltaY, 0, gridSize.height - canvasSize.height);

        if (newX === this.gridOffset.x && newY === this.gridOffset.y) {
            // We won't be moving, so return false
            return false;
        }

        this.setOffset(newX, newY);

        return true;
    }

    private setOffset = (x: number, y: number) => {
        // We remember the grid offset, and request an animation frame. Another update event might come in
        // before the rAF callback is called, but that's not a problem - we'll just render the latest grid
        // offset.
        this.gridOffset = { x, y };
        if (this.queuedRender === null) {
            this.queuedRender = window.requestAnimationFrame(() => {
                this.queuedRender = null;
                this.scrollCanvases();
            });
        }
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.highlightRenderer) {
            return;
        }

        const gridSize = GridGeometry.calculateGridSize(this.props);
        const coord = this.calculateCanvasPixel(event);

        if (coord.x >= gridSize.width || coord.y >= gridSize.height) {
            return;
        }

        const scrollbarPositions = this.highlightRenderer.getScrollbarPositions();
        const hitScrollbar = ScrollbarGeometry.getHitScrollBar(
            coord,
            scrollbarPositions,
        );

        if (hitScrollbar) {
            this.draggedScrollbar = {
                bar: hitScrollbar,
                origScrollbarStart: hitScrollbar === 'x' ?
                    scrollbarPositions.horizontal!.extent.start :
                    scrollbarPositions.vertical!.extent.start,
                origClick: hitScrollbar === 'x' ? coord.x : coord.y,
            };
        } else {
            const gridCoords = this.calculateGridCellCoords(event);
            const newCursorState = cursorState.startDrag(this.cursorState, gridCoords);
            if (this.props.onSelectionChangeStart) {
                this.props.onSelectionChangeStart(newCursorState.selection.selectedRange);
            }
            this.cursorState = newCursorState;
            this.highlightRenderer.updateSelection({ cursorState: this.cursorState });
        }
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const coord = this.calculateCanvasPixel(event);
        const gridSize = GridGeometry.calculateGridSize(this.props);
        if (coord.x >= gridSize.width || coord.y >= gridSize.height) {
            return;
        }

        if (this.draggedScrollbar) {
            const scrollbarPositions = this.highlightRenderer!.getScrollbarPositions();
            const canvasSize = this.calculateCanvasSize();
            if (this.draggedScrollbar.bar === 'x') {
                const frozenColsWidth = GridGeometry.calculateFrozenColsWidth(this.props);
                const dragDistance = coord.x - this.draggedScrollbar.origClick;
                const desiredStart = this.draggedScrollbar.origScrollbarStart + dragDistance;
                const desiredFraction = ScrollbarGeometry.calculateFractionFromStartPos(
                    desiredStart,
                    frozenColsWidth,
                    canvasSize.width,
                    scrollbarPositions.horizontal!.extent.end - scrollbarPositions.horizontal!.extent.start,
                );
                const offsetX = GridGeometry.calculateGridOffsetFromFraction(
                    desiredFraction,
                    gridSize.width,
                    canvasSize.width,
                );
                this.setOffset(offsetX, this.gridOffset.y);
            } else {
                const frozenRowsHeight = GridGeometry.calculateFrozenRowsHeight(this.props);
                const dragDistance = coord.y - this.draggedScrollbar.origClick;
                const desiredStart = this.draggedScrollbar.origScrollbarStart + dragDistance;
                const desiredFraction = ScrollbarGeometry.calculateFractionFromStartPos(
                    desiredStart,
                    frozenRowsHeight,
                    canvasSize.height,
                    scrollbarPositions.vertical!.extent.end - scrollbarPositions.vertical!.extent.start,
                );
                const offsetY = GridGeometry.calculateGridOffsetFromFraction(
                    desiredFraction,
                    gridSize.height,
                    canvasSize.height,
                );
                this.setOffset(this.gridOffset.x, offsetY);
            }
            return;
        }

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

    private onMouseUp = () => {
        if (this.draggedScrollbar) {
            this.draggedScrollbar = null;
            return;
        }

        if (!(this.cursorState.selection && this.highlightRenderer)) {
            return;
        }
        if (this.props.onSelectionChangeEnd) {
            this.props.onSelectionChangeEnd(this.cursorState.selection.selectedRange);
        }
        this.highlightRenderer.updateSelection({ cursorState: this.cursorState });
    }

    private calculateCanvasSize = () => {
        const gridSize = GridGeometry.calculateGridSize(this.props);
        const rootSize = this.state.rootSize;
        // First render is before componentDidMount, so before we have calculated the root element's size.
        // In this case, we just render as 0x0. componentDidMount will then update state,
        // and we'll re-render
        if (rootSize === null) {
            return { width: 0, height: 0 };
        }

        return { width: Math.min(rootSize.width, gridSize.width), height: Math.min(rootSize.height, gridSize.height) };
    }

    private calculateCanvasPixel = (event: React.MouseEvent<any, any>) => {
        if (!this.rootRef.current) {
            throw new Error('Cannot convert mouse event coords to grid coords because rootRef is not set');
        }
        return GridGeometry.windowPixelToCanvasPixel(
            {x: event.clientX, y: event.clientY},
            this.rootRef.current,
        );
    }

    private calculateGridCellCoords = (event: React.MouseEvent<any, any>) => {
        if (!this.rootRef.current) {
            throw new Error('Cannot convert mouse event coords to grid coords because rootRef is not set');
        }
        return GridGeometry.calculateGridCellCoords(
            event,
            this.props,
            this.gridOffset,
            this.rootRef.current,
        );
    }
}

function intBetween(num: number, min: number, max: number) {
    return Math.floor(Math.max(Math.min(num, max), min));
}
