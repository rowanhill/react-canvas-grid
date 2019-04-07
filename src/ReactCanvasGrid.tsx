import * as React from 'react';
import { CursorState, CursorStateWithSelection, SelectRange } from './cursorState';
import * as cursorState from './cursorState';
import { FrozenCanvas } from './FrozenCanvas';
import { FrozenCanvasRenderer } from './frozenCanvasRenderer';
import { GridGeometry } from './gridGeometry';
import { HighlightCanvas } from './HighlightCanvas';
import { HighlightCanvasRenderer } from './highlightCanvasRenderer';
import { MainCanvas } from './MainCanvas';
import { MainCanvasRenderer } from './mainCanvasRenderer';
import { ColumnDef, Coord, DataRow, Size } from './types';

interface RequiredProps<T> {
    columns: ColumnDef[];
    data: Array<DataRow<T>>;
    rowHeight: number;

    onSelectionChangeStart?: (selectRange: SelectRange) => void;
    onSelectionChangeUpdate?: (selectRange: SelectRange) => void;
    onSelectionChangeEnd?: (selectRange: SelectRange) => void;
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
    canvasSize: Size|null;
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

    private mainRenderer: MainCanvasRenderer<T>|null = null;
    private frozenRenderer: FrozenCanvasRenderer<T>|null = null;
    private highlightRenderer: HighlightCanvasRenderer|null = null;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);
        this.state = {
            canvasSize: null,
        };
    }

    public componentDidMount() {
        if (!this.rootRef.current) {
            throw new Error('root element ref not set in componentDidMount, so cannot determine canvas size');
        }
        const rootRect = this.rootRef.current.getBoundingClientRect();
        const gridSize = GridGeometry.calculateGridSize(this.props);
        const canvasSize = {
            width: Math.min(rootRect.width, gridSize.width),
            height: Math.min(rootRect.height, gridSize.height),
        };

        this.rootRef.current.addEventListener('wheel', this.onWheel);

        // Set the canvasSize, causing a re-render, at which point the canvases will be properly sized.
        this.setState({ canvasSize }, () => {
            this.scrollCanvases();
        });
    }

    public componentWillUnmount() {
        if (this.rootRef.current) {
            this.rootRef.current.removeEventListener('wheel', this.onWheel);
        }
    }

    public render() {
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(this.props);
        // First render is before componentDidMount, so before we have calculated the canvas size.
        // In this case, we just render as 0x0. componentDidMount will then update state,
        // and we'll re-render
        const canvasSize = this.state.canvasSize || { height: 0, width: 0 };
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
        if (!this.state.canvasSize) {
            return;
        }
        const canvasSize = this.state.canvasSize;
        const gridSize = GridGeometry.calculateGridSize(this.props);
        const newX = intBetween(this.gridOffset.x + e.deltaX, 0, gridSize.width - canvasSize.width);
        const newY = intBetween(this.gridOffset.y + e.deltaY, 0, gridSize.height - canvasSize.height);

        if (newX === this.gridOffset.x && newY === this.gridOffset.y) {
            // The wheel will result in no movement - we're likely at the edge of the grid - so we can
            // bail out and let the browser handle as normal
            return;
        }

        // Otherwise, the grid is going to move, so we want to prevent any other scrolling from happening
        e.preventDefault();

        // We remember the grid offset, and request an animation frame. Another wheel event might come in
        // before the rAF callback is called, but that's not a problem - we'll just render the latest grid
        // offset.
        this.gridOffset = { x: newX, y: newY };
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
