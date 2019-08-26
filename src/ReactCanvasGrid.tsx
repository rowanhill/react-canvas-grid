import { batch, consumer } from 'instigator';
import * as React from 'react';
import { SelectRange } from './cursorState';
import * as cursorState from './cursorState';
import { mouseDownOnGrid, mouseDragOnGrid, mouseUpOnGrid } from './eventHandlers/gridMouseEvents';
import {
    mouseDownOnScrollbar,
    mouseDragOnScrollbar,
    mouseHoverOnScrollbar,
    mouseUpOnScrollbar,
} from './eventHandlers/scrollbarMouseEvents';
import { updateOffsetByDelta } from './eventHandlers/scrolling';
import { FrozenCanvas } from './FrozenCanvas';
import { GridGeometry } from './gridGeometry';
import { GridState } from './gridState';
import { HighlightCanvas } from './HighlightCanvas';
import { shouldSelectionClear } from './highlightCanvasRenderer';
import { InlineTextEditor } from './InlineEditor';
import { MainCanvas } from './MainCanvas';
import { cellIsEditable, ColumnDef, Coord, DataRow, EditableCellDef, Size } from './types';

export interface CellDataChangeEvent<T> {
    newData: T;
    cell: EditableCellDef<T>;
    rowIndex: number;
    colIndex: number;
    fieldName: string;
}

interface RequiredProps<T> {
    columns: ColumnDef[];
    data: Array<DataRow<T>>;
    rowHeight: number;

    onSelectionChangeStart?: (selectRange: SelectRange | null) => void;
    onSelectionChangeUpdate?: (selectRange: SelectRange) => void;
    onSelectionChangeEnd?: (selectRange: SelectRange | null) => void;
    onSelectionCleared?: () => void;

    onCellDataChanged?: (event: CellDataChangeEvent<T>) => void;
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

export interface EditingCell<T> {
    cell: EditableCellDef<T>;
    rowIndex: number;
    colIndex: number;
    left: number;
    top: number;
    width: number;
    height: number;
    fieldName: string;
}

interface ReactCanvasGridState<T> {
    rootSize: Size|null;
    gridOffset: Coord;
    editingCell: EditingCell<T> | null;
}

export class ReactCanvasGrid<T> extends React.PureComponent<ReactCanvasGridProps<T>, ReactCanvasGridState<T>> {
    public static defaultProps: DefaultedProps = {
        cssWidth: '100%',
        cssHeight: '100%',
        borderWidth: 1,
        frozenRows: 0,
        frozenCols: 0,
        focusedColIndex: null,
    };

    private readonly rootRef: React.RefObject<HTMLDivElement> = React.createRef();

    private gridState: GridState<T>;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);
        this.gridState = new GridState(
            props.columns,
            props.data,
            props.rowHeight,
            props.borderWidth,
            props.frozenRows,
            props.frozenCols,
        );
        this.state = {
            rootSize: null,
            gridOffset: this.gridState.gridOffset(),
            editingCell: null,
        };
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

        // Keep the gridState gridOffset and the React state gridOffset in sync
        consumer([this.gridState.gridOffset], (gridOffset) => this.setState({gridOffset}));
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
                this.gridState.gridOffsetRaw(truncatedOffset);
            }

            if (this.props.focusedColIndex !== null && this.props.focusedColIndex !== prevProps.focusedColIndex) {
                const focusedOffset = GridGeometry.calculateGridOffsetForFocusedColumn(
                    this.gridState.gridOffset(),
                    canvasSize,
                    this.gridState.frozenColsWidth(),
                    this.props.focusedColIndex,
                    this.gridState.columnBoundaries(),
                    this.gridState.verticalGutterBounds(),
                );
                this.gridState.gridOffsetRaw(focusedOffset);
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
        const gridPlusGutterSize = GridGeometry.calculateGridPlusGutterSize(gridSize, this.state.rootSize);
        const canvasSize = GridGeometry.calculateCanvasSize(gridPlusGutterSize, this.state.rootSize);
        const frozenColsWidth =
            GridGeometry.calculateFrozenColsWidth(columnBoundaries, this.props.frozenCols, this.props.borderWidth);
        const frozenRowsHeight =
            GridGeometry.calculateFrozenRowsHeight(this.props.rowHeight, this.props.borderWidth, this.props.frozenRows);

        return (
            <div
                ref={this.rootRef}
                className="react-canvas-grid"
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                onDoubleClick={this.onDoubleClick}
                tabIndex={1}
                style={{
                    position: 'relative',
                    width: this.props.cssWidth,
                    height: this.props.cssHeight,
                    overflow: 'hidden',
                    outline: 'none',
                }}
            >
                <MainCanvas<T>
                    width={canvasSize.width}
                    height={canvasSize.height}
                    frozenColsWidth={frozenColsWidth}
                    frozenRowsHeight={frozenRowsHeight}
                    gridState={this.gridState}
                />
                <HighlightCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    gridState={this.gridState}
                />
                {this.state.editingCell &&
                    <InlineTextEditor<T>
                        cell={this.state.editingCell.cell}
                        left={this.state.editingCell.left}
                        top={this.state.editingCell.top}
                        width={this.state.editingCell.width}
                        height={this.state.editingCell.height}
                        gridOffset={this.state.gridOffset}
                        onSubmit={this.stopEditingCell}
                        onCancel={this.cancelEditingCell}
                    />
                }
                <FrozenCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    frozenColsWidth={frozenColsWidth}
                    frozenRowsHeight={frozenRowsHeight}
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
        const willUpdate = updateOffsetByDelta(e.deltaX * scaleFactor, e.deltaY * scaleFactor, this.gridState);

        if (willUpdate) {
            // The grid is going to move, so we want to prevent any other scrolling from happening
            e.preventDefault();
        }
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const gridSize = this.gridState.gridSize();
        const coord = GridGeometry.calculateComponentPixel(event, this.rootRef.current);

        if (coord.x >= gridSize.width || coord.y >= gridSize.height) {
            // The click happened within the component but outside the grid, so ignore it
            return;
        }

        if (mouseDownOnScrollbar(coord, this.gridState)) {
            return;
        }

        mouseDownOnGrid(event, coord, this.rootRef, this.props, this.gridState, this.state.editingCell);
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const coord = GridGeometry.calculateComponentPixel(event, this.rootRef.current);
        const gridSize = this.gridState.gridSize();

        if (coord.x >= gridSize.width || coord.y >= gridSize.height) {
            // The drag has gone beyond the edge of the grid (even if still in the component), so ignore it
            return;
        }

        if (mouseDragOnScrollbar(coord, this.gridState)) {
            return;
        } else if (mouseDragOnGrid(event, this.rootRef, this.props, this.gridState, this.state.editingCell)) {
            return;
        } else {
            mouseHoverOnScrollbar(coord, this.gridState);
        }
    }

    private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        batch(() => {
            const coord = GridGeometry.calculateComponentPixel(event, this.rootRef.current);
            if (mouseUpOnScrollbar()) {
                mouseHoverOnScrollbar(coord, this.gridState);
                return;
            }

            mouseUpOnGrid(this.props, this.gridState, this.state.editingCell);
        });
    }

    private onDoubleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const cellCoords =
            GridGeometry.calculateGridCellCoordsFromGridState(event, this.rootRef.current, this.gridState);
        this.startEditingCell(cellCoords);
    }

    private startEditingCell = (cellCoords: Coord) => {
        const cellBounds = GridGeometry.calculateCellBounds(
            cellCoords.x,
            cellCoords.y,
            this.props.rowHeight,
            this.props.borderWidth,
            this.gridState.columnBoundaries(),
            this.props.columns,
        );
        const col = this.props.columns[cellCoords.x];
        const cell = this.props.data[cellCoords.y][col.fieldName];
        if (!cellIsEditable(cell)) {
            return;
        }
        this.setState({
            editingCell: {
                cell,
                colIndex: cellCoords.x,
                rowIndex: cellCoords.y,
                ...cellBounds,
                fieldName: col.fieldName,
            },
        });
    }

    private cancelEditingCell = () => {
        this.setState({ editingCell: null }, this.focusRoot);
    }

    private stopEditingCell = (newData: T) => {
        if (this.state.editingCell === null) {
            return;
        }

        if (this.props.onCellDataChanged) {
            this.props.onCellDataChanged({
                cell: this.state.editingCell.cell,
                colIndex: this.state.editingCell.colIndex,
                rowIndex: this.state.editingCell.rowIndex,
                fieldName: this.state.editingCell.fieldName,
                newData,
            });
        }
        this.setState({ editingCell: null }, this.focusRoot);
    }

    private focusRoot = () => {
        if (this.rootRef.current) {
            this.rootRef.current.focus({ preventScroll: true });
        }
    }
}
