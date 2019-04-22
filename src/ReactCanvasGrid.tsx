import { batch } from 'instigator';
import * as React from 'react';
import { CursorStateWithSelection, SelectRange } from './cursorState';
import * as cursorState from './cursorState';
import { FrozenCanvas } from './FrozenCanvas';
import { GridGeometry } from './gridGeometry';
import { GridState } from './gridState';
import { HighlightCanvas } from './HighlightCanvas';
import { shouldSelectionClear } from './highlightCanvasRenderer';
import { MainCanvas } from './MainCanvas';
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
    focusedColIndex: number | null;
}

export type DefaultedReactCanvasGridProps<T> = RequiredProps<T> & Partial<DefaultedProps>;
export type ReactCanvasGridProps<T> = RequiredProps<T> & DefaultedProps;

interface ReactCanvasGridState {
    rootSize: Size|null;
}

export class ReactCanvasGrid<T> extends React.PureComponent<ReactCanvasGridProps<T>, ReactCanvasGridState> {
    public static defaultProps: DefaultedProps = {
        cssWidth: '100%',
        cssHeight: '100%',
        borderWidth: 1,
        frozenRows: 0,
        frozenCols: 0,
        focusedColIndex: null,
    };

    private readonly rootRef: React.RefObject<HTMLDivElement> = React.createRef();

    private draggedScrollbar: { bar: 'x' | 'y'; origScrollbarStart: number; origClick: number } | null = null;

    private gridState: GridState<T>;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);
        this.state = {
            rootSize: null,
        };
        this.gridState = new GridState(
            props.columns,
            props.data,
            props.rowHeight,
            props.borderWidth,
            props.frozenRows,
            props.frozenCols,
        );
    }

    public componentDidMount() {
        if (!this.rootRef.current) {
            throw new Error('root element ref not set in componentDidMount, so cannot determine canvas size');
        }
        const rootRect = this.rootRef.current.getBoundingClientRect();

        this.rootRef.current.addEventListener('wheel', this.onWheel);

        // Set the rootSize, causing a re-render, at which point the canvases will be properly sized.
        // Once the state has been set and everything has re-rendered, we can set the rootSize, causing
        // the renderers to redraw.
        this.setState({ rootSize: { width: rootRect.width, height: rootRect.height } }, () => {
            this.gridState.rootSize({ width: rootRect.width, height: rootRect.height });
        });
    }

    public componentDidUpdate(prevProps: ReactCanvasGridProps<T>) {
        if (!this.rootRef.current) {
            throw new Error('root element ref not set in componentDidMount, so cannot determine canvas size');
        }
        const rootRect = this.rootRef.current.getBoundingClientRect();
        batch(() => {
            this.gridState.columns(this.props.columns);
            this.gridState.data(this.props.data);
            this.gridState.rowHeight(this.props.rowHeight);
            this.gridState.borderWidth(this.props.borderWidth);
            this.gridState.frozenRows(this.props.frozenRows);
            this.gridState.frozenCols(this.props.frozenCols);
            this.gridState.rootSize({ width: rootRect.width, height: rootRect.height });

            if (shouldSelectionClear(prevProps, this.props)) {
                this.gridState.cursorState(cursorState.createDefault());
                if (this.props.onSelectionCleared) {
                    this.props.onSelectionCleared();
                }
            }

            const gridSize = this.gridState.gridSize();
            const canvasSize = this.gridState.canvasSize();
            const truncatedOffset = GridGeometry.truncateGridOffset(this.gridState.gridOffset(), gridSize, canvasSize);
            if (truncatedOffset) {
                this.gridState.gridOffset(truncatedOffset);
            }

            if (this.props.focusedColIndex !== null && this.props.focusedColIndex !== prevProps.focusedColIndex) {
                const focusedOffset = GridGeometry.calculateGridOffsetForFocusedColumn(
                    this.gridState.gridOffset(),
                    canvasSize,
                    this.gridState.frozenColsWidth(),
                    this.props.focusedColIndex,
                    this.gridState.columnBoundaries(),
                );
                this.gridState.gridOffset(focusedOffset);
            }
        });
    }

    public componentWillUnmount() {
        if (this.rootRef.current) {
            this.rootRef.current.removeEventListener('wheel', this.onWheel);
        }
    }

    public render() {
        // Since we're rendering, the props have just changed. The values in gridState won't update until
        // componentDidMount is run, however, so we can't use them, and have to calculate fresh values
        // here in render and throw them away. Props changes should be rare, and unlikely to be extremely
        // performance sensitive, so this probably won't cause noticeable problems.
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(this.props.columns, this.props.borderWidth);
        const gridSize = GridGeometry.calculateGridSize(
            this.props.data,
            columnBoundaries,
            this.props.rowHeight,
            this.props.borderWidth);
        const canvasSize = GridGeometry.calculateCanvasSize(gridSize, this.state.rootSize);

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
                    width={canvasSize.width}
                    height={canvasSize.height}
                    gridState={this.gridState}
                />
                <HighlightCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    gridState={this.gridState}
                />
                <FrozenCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    gridState={this.gridState}
                />
            </div>
        );
    }

    private onWheel = (e: WheelEvent) => {
        // Browsers may use a 'delta mode' when wheeling, requesting multi-pixel movement
        // See https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
        const scaleFactors: { [index: number]: number; } = {
            0: 1,  // DOM_DELTA_PIXEL: 1-to-1
            1: 16, // DOM_DELTA_LINE: 16 seems a decent guess. See https://stackoverflow.com/q/20110224
        };
        const scaleFactor = scaleFactors[e.deltaMode || 0];
        const willUpdate = this.updateOffsetByDelta(e.deltaX * scaleFactor, e.deltaY * scaleFactor);

        if (willUpdate) {
            // The grid is going to move, so we want to prevent any other scrolling from happening
            e.preventDefault();
        }
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const gridSize = this.gridState.gridSize();
        const coord = this.calculateCanvasPixel(event);

        if (coord.x >= gridSize.width || coord.y >= gridSize.height) {
            // The click happened within the component but outside the grid, so ignore it
            return;
        }

        if (this.mouseDownOnScrollbar(coord)) {
            return;
        }

        this.mouseDownOnGrid(event);
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const coord = this.calculateCanvasPixel(event);
        const gridSize = this.gridState.gridSize();

        if (coord.x >= gridSize.width || coord.y >= gridSize.height) {
            // The drag has gone beyond the edge of the grid (even if still in the component), so ignore it
            return;
        }

        if (this.mouseDragOnScrollbar(coord)) {
            return;
        } else if (this.mouseDragOnGrid(event)) {
            return;
        } else {
            this.mouseHoverOnScrollbar(coord);
        }
    }

    private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        batch(() => {
            if (this.mouseUpOnScrollbar()) {
                const coord = this.calculateCanvasPixel(event);
                this.mouseHoverOnScrollbar(coord);
                return;
            }

            this.mouseUpOnGrid();
        });
    }

    private updateOffsetByDelta = (deltaX: number, deltaY: number): boolean => {
        if (!this.state.rootSize) {
            return false;
        }
        const canvasSize = this.gridState.canvasSize();
        const gridSize = this.gridState.gridSize();
        const gridOffset = this.gridState.gridOffset();
        const newX = intBetween(gridOffset.x + deltaX, 0, gridSize.width - canvasSize.width);
        const newY = intBetween(gridOffset.y + deltaY, 0, gridSize.height - canvasSize.height);

        if (newX === gridOffset.x && newY === gridOffset.y) {
            // We won't be moving, so return false
            return false;
        }

        this.gridState.gridOffset({ x: newX, y: newY });

        // We did move, so return true
        return true;
    }

    private mouseDownOnScrollbar = (coord: Coord): boolean => {
        const hitScrollbar = ScrollbarGeometry.getHitScrollBar(
            coord,
            this.gridState.horizontalScrollbarPos(),
            this.gridState.verticalScrollbarPos(),
        );

        if (hitScrollbar) {
            this.draggedScrollbar = {
                bar: hitScrollbar,
                origScrollbarStart: hitScrollbar === 'x' ?
                    this.gridState.horizontalScrollbarPos()!.extent.start :
                    this.gridState.verticalScrollbarPos()!.extent.start,
                origClick: hitScrollbar === 'x' ? coord.x : coord.y,
            };
            return true;
        } else {
            return false;
        }
    }

    private mouseDownOnGrid = (event: React.MouseEvent<any, any>) => {
        if (!isLeftButton(event)) {
            return;
        }

        const gridCoords = this.calculateGridCellCoords(event);
        const newCursorState = cursorState.startDrag(this.gridState.cursorState(), gridCoords);
        if (this.props.onSelectionChangeStart) {
            this.props.onSelectionChangeStart(newCursorState.selection.selectedRange);
        }
        this.gridState.cursorState(newCursorState);
    }

    private mouseDragOnScrollbar = (coord: Coord): boolean => {
        if (!this.draggedScrollbar) {
            return false;
        }

        const values = this.draggedScrollbar.bar === 'x' ?
            {
                frozenLen: this.gridState.frozenColsWidth(),
                canvasLen: this.gridState.canvasSize().width,
                gridLen: this.gridState.gridSize().width,
                barLen: this.gridState.horizontalScrollbarLength(),
                clickCoord: coord.x,
            } :
            {
                frozenLen: this.gridState.frozenRowsHeight(),
                canvasLen: this.gridState.canvasSize().height,
                gridLen: this.gridState.gridSize().height,
                barLen: this.gridState.verticalScrollbarLength(),
                clickCoord: coord.y,
            };

        const dragDistance = values.clickCoord - this.draggedScrollbar.origClick;
        const desiredStart = this.draggedScrollbar.origScrollbarStart + dragDistance;
        const desiredFraction = ScrollbarGeometry.calculateFractionFromStartPos(
            desiredStart,
            values.frozenLen,
            values.canvasLen,
            values.barLen,
        );
        const newOffset = GridGeometry.calculateGridOffsetFromFraction(
            desiredFraction,
            values.gridLen,
            values.canvasLen,
        );
        if (this.draggedScrollbar.bar === 'x') {
            this.gridState.gridOffset({ x: newOffset, y: this.gridState.gridOffset().y });
        } else {
            this.gridState.gridOffset({ x: this.gridState.gridOffset().x, y: newOffset });
        }

        return true;
    }

    private mouseDragOnGrid = (event: React.MouseEvent<any, any>): boolean => {
        if (!isLeftButton(event)) {
            return false;
        }
        if (!this.gridState.cursorState().selection) {
            return false;
        }
        const oldCursorState: CursorStateWithSelection = this.gridState.cursorState() as CursorStateWithSelection;
        const gridCoords = this.calculateGridCellCoords(event);
        const newCursorState = cursorState.updateDrag(oldCursorState, gridCoords);
        if (this.props.onSelectionChangeUpdate) {
            const rangeChanged = cursorState.isSelectRangeDifferent(
                oldCursorState.selection.selectedRange,
                newCursorState.selection.selectedRange);
            if (rangeChanged) {
                this.props.onSelectionChangeUpdate(newCursorState.selection.selectedRange);
            }
        }
        this.gridState.cursorState(newCursorState);
        return true;
    }

    private mouseHoverOnScrollbar = (coord: Coord) => {
        const hoveredScrollbar = ScrollbarGeometry.getHitScrollBar(
            coord,
            this.gridState.horizontalScrollbarPos(),
            this.gridState.verticalScrollbarPos(),
        );

        this.gridState.hoveredScrollbar(hoveredScrollbar);
    }

    private mouseUpOnScrollbar = (): boolean => {
        if (this.draggedScrollbar) {
            this.draggedScrollbar = null;
            return true;
        } else {
            return false;
        }
    }

    private mouseUpOnGrid = () => {
        if (!this.gridState.cursorState().selection) {
            return;
        }

        if (this.props.onSelectionChangeEnd) {
            this.props.onSelectionChangeEnd(this.gridState.cursorState().selection!.selectedRange);
        }
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
            this.gridState.columnBoundaries(),
            this.gridState.borderWidth(),
            this.gridState.rowHeight(),
            this.gridState.gridOffset(),
            this.rootRef.current,
        );
    }
}

function intBetween(num: number, min: number, max: number) {
    return Math.floor(Math.max(Math.min(num, max), min));
}

function isLeftButton(event: React.MouseEvent<any, any>): boolean {
    // tslint:disable-next-line: no-bitwise
    return (event.buttons & 1) === 1;
}
