import * as React from 'react';
import { CanvasHolder } from './CanvasHolder';
import { FrozenCanvas } from './FrozenCanvas';
import { GridGeometry } from './gridGeometry';
import { HighlightCanvas } from './HighlightCanvas';
import { MainCanvas } from './MainCanvas';
import { ColumnDef, Coord, DataRow } from './types';

interface RequiredProps<T> {
    columns: ColumnDef[];
    data: Array<DataRow<T>>;
    rowHeight: number;
}
interface DefaultedProps {
    borderWidth: number;
    frozenRows: number;
    frozenCols: number;
}

export type DefaultedReactCanvasGridProps<T> = RequiredProps<T> & Partial<DefaultedProps>;
export type ReactCanvasGridProps<T> = RequiredProps<T> & DefaultedProps;

interface ReactCanvasGridState {
    visibleRect: ClientRect;
    gridOffset: Coord;

    selectedRangeDragStart: Coord|null;
    selectedRange: SelectRange|null;
}

export interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

export class ReactCanvasGrid<T> extends React.Component<ReactCanvasGridProps<T>, ReactCanvasGridState> {
    public static defaultProps = {
        borderWidth: 1,
        frozenRows: 0,
        frozenCols: 0,
    };

    private readonly sizerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private readonly canvasHolderRef: React.RefObject<HTMLDivElement> = React.createRef();
    private scrollParent: HTMLElement|null = null;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);

        this.state = {
            gridOffset: {x: 0, y: 0},
            visibleRect: {top: 0, left: 0, right: 0, bottom: 0, height: 0, width: 0},
            selectedRangeDragStart: null,
            selectedRange: null,
        };
    }

    public componentDidMount() {
        if (this.canvasHolderRef.current) {
            this.scrollParent = getScrollParent(this.canvasHolderRef.current, true);
        }

        // Calculate the visible region and the canvases' offset, and set them as state,
        // causing us to re-render
        this.onScroll();

        if (this.scrollParent && this.scrollParent !== document.body) {
            this.scrollParent.addEventListener('scroll', this.onScroll);
        }
        window.addEventListener('scroll', this.onScroll);
    }

    public componentWillUnmount() {
        if (this.scrollParent && this.scrollParent !== document.body) {
            this.scrollParent.removeEventListener('scroll', this.onScroll);
        }
        window.removeEventListener('scroll', this.onScroll);
    }

    public render() {
        const columnBoundaries = GridGeometry.calculateColumnBoundaries(this.props);
        // First render is before componentDidMount, so before we have found scrollParent.
        // In this case, we just render as 0x0. componentDidMount will then update state,
        // and we'll re-render
        const canvasSize = this.scrollParent ?
            GridGeometry.calculateMaxViewSize(this.props, this.scrollParent) :
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
                        visibleRect={this.state.visibleRect}
                        gridOffset={this.state.gridOffset}
                        gridHeight={gridSize.height}
                        colBoundaries={columnBoundaries}
                        borderWidth={this.props.borderWidth}
                    />
                    <HighlightCanvas
                        rowHeight={this.props.rowHeight}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gridOffset={this.state.gridOffset}
                        colBoundaries={columnBoundaries}
                        selectedRange={this.state.selectedRange}
                        borderWidth={this.props.borderWidth}
                    />
                    <FrozenCanvas
                        data={this.props.data}
                        columns={this.props.columns}
                        colBoundaries={columnBoundaries}
                        rowHeight={this.props.rowHeight}
                        borderWidth={this.props.borderWidth}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gridOffset={this.state.gridOffset}
                        frozenRows={this.props.frozenRows}
                        frozenCols={this.props.frozenCols}
                        frozenRowsHeight={frozenRowsHeight}
                        frozenColsWidth={frozenColsWidth}
                    />
                </CanvasHolder>
            </div>
        );
    }

    private onScroll = () => {
        if (!this.sizerRef.current) {
            return;
        }
        if (!this.scrollParent) {
            return;
        }
        const gridOffset = GridGeometry.calculateGridOffset(this.props, this.scrollParent, this.sizerRef.current);

        // Update the canvas holder's position outside of React, for performance reasons
        if (this.canvasHolderRef.current) {
            const transform = (gridOffset.x > 0 || gridOffset.y > 0) ?
                `translate(${gridOffset.x}px, ${gridOffset.y}px)` :
                '';
            this.canvasHolderRef.current.style.transform = transform;
        }

        this.setState({
            gridOffset,
            visibleRect: GridGeometry.calculateViewRect(
                this.props,
                gridOffset,
                this.scrollParent,
                this.sizerRef.current,
            ),
        });
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const gridCoords = this.calculateGridCellCoords(event);
        const selectedRange = {
            topLeft: gridCoords,
            bottomRight: gridCoords,
        };
        this.setState({selectedRange, selectedRangeDragStart: gridCoords});
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.state.selectedRange || !this.state.selectedRangeDragStart) {
            return;
        }
        // tslint:disable-next-line: no-bitwise
        if ((event.buttons & 1) === 0) {
            return;
        }
        const gridCoords = this.calculateGridCellCoords(event);
        const selectedRange = {
            topLeft: {
                x: Math.min(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.min(this.state.selectedRangeDragStart.y, gridCoords.y),
            },
            bottomRight: {
                x: Math.max(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.max(this.state.selectedRangeDragStart.y, gridCoords.y),
            },
        };
        this.setState({selectedRange});
    }

    private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.state.selectedRange || !this.state.selectedRangeDragStart) {
            return;
        }
        const gridCoords = this.calculateGridCellCoords(event);
        const selectedRange = {
            topLeft: {
                x: Math.min(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.min(this.state.selectedRangeDragStart.y, gridCoords.y),
            },
            bottomRight: {
                x: Math.max(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.max(this.state.selectedRangeDragStart.y, gridCoords.y),
            },
        };
        const selectedRangeDragStart = null;
        this.setState({selectedRange, selectedRangeDragStart});
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
    for (let parent: HTMLElement|null = element.parentElement; parent !== null; parent = parent!.parentElement) {
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
