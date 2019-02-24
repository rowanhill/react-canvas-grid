import * as React from 'react';
import { CellDef, DataRow, ColumnDef, Coord, Size } from './types';
import { BaseCanvas } from './BaseCanvas';
import { HighlightCanvas } from './HighlightCanvas';
import { CanvasHolder } from './CanvasHolder';

export { CellDef, DataRow, ColumnDef, Coord, Size } from './types';

export interface ReactCanvasGridProps<T> {
    columns: ColumnDef[];
    data: DataRow<T>[];
    rowHeight: number;
    borderWidth: number;
}

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
    static defaultProps = {
        borderWidth: 1
    };

    private readonly sizerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private readonly canvasHolderRef: React.RefObject<HTMLDivElement> = React.createRef();
    private scrollParent: HTMLElement|null = null;

    private columnBoundaries: {left: number; right: number}[];

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);

        this.columnBoundaries = this.calculateColumnBoundaries();

        this.state = {
            gridOffset: {x: 0, y: 0},
            visibleRect: {top: 0, left: 0, right: 0, bottom: 0, height: 0, width: 0},
            selectedRangeDragStart: null,
            selectedRange: null,
        };
    }

    componentDidMount() {
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

    componentWillUnmount() {
        if (this.scrollParent && this.scrollParent !== document.body) {
            this.scrollParent.removeEventListener('scroll', this.onScroll);
        }
        window.removeEventListener('scroll', this.onScroll);
    }

    componentDidUpdate() {
        this.columnBoundaries = this.calculateColumnBoundaries();
    }

    render() {
        const canvasSize = this.calculateMaxViewSize();
        const gridSize = this.calculateDataSize();

        return (
            <div
                ref={this.sizerRef}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                style={{
                    width: `${gridSize.width}px`,
                    height: `${gridSize.height}px`
                }}
            >
                <CanvasHolder ref={this.canvasHolderRef} canvasSize={canvasSize}>
                    <BaseCanvas<T>
                        data={this.props.data}
                        columns={this.props.columns}
                        rowHeight={this.props.rowHeight}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        visibleRect={this.state.visibleRect}
                        gridOffset={this.state.gridOffset}
                        gridHeight={gridSize.height}
                        colBoundaries={this.columnBoundaries}
                        borderWidth={this.props.borderWidth}
                    />
                    <HighlightCanvas
                        rowHeight={this.props.rowHeight}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gridOffset={this.state.gridOffset}
                        colBoundaries={this.columnBoundaries}
                        selectedRange={this.state.selectedRange}
                        borderWidth={this.props.borderWidth}
                    />
                </CanvasHolder>
            </div>
        );
    }

    private calculateColumnBoundaries = () => {
        let curLeft = 0;
        return this.props.columns.map(col => {
            const boundary = { left: curLeft, right: curLeft + col.width };
            curLeft += col.width + 1;
            return boundary;
        });
    }

    private calculateDataSize = () => {
        const borderWidth = this.props.borderWidth;
        const numRows = this.props.data.length;
        const height = numRows * (this.props.rowHeight + borderWidth) - borderWidth;

        const width = this.props.columns.reduce((acc, col) => acc + col.width + borderWidth, 0) - borderWidth;

        return { width, height };
    }

    private calculateMaxViewSize = () => {
        if (!this.scrollParent) {
            // First render is before componentDidMount, so before we have found scrollParent.
            // In this case, we just render as 0x0. componentDidMount will then update state,
            // and we'll re-render
            return {height: 0, width: 0};
        }
        const dataSize = this.calculateDataSize();
        const scrollParentClientRect = this.scrollParent.getBoundingClientRect();
        return {
            height: Math.min(dataSize.height, scrollParentClientRect.height, window.innerHeight),
            width: Math.min(dataSize.width, scrollParentClientRect.width, window.innerWidth)
        };
    }

    private calculateViewRect = () => {
        if (!this.sizerRef.current) {
            throw new Error('Cannot resize canvas: sizerRef does not have current');
        }
        if (!this.scrollParent) {
            throw new Error('Cannot resize canvas: scrollParent is null');
        }
        const sizerClientRect = this.sizerRef.current.getBoundingClientRect();
        const scrollParentClientRect = this.getScrollParentClientRect();
        const bounds = {
            top: Math.max(sizerClientRect.top, scrollParentClientRect.top, 0) - sizerClientRect.top,
            left: Math.max(sizerClientRect.left, scrollParentClientRect.left, 0) - sizerClientRect.left,
            bottom: Math.min(sizerClientRect.bottom, scrollParentClientRect.bottom, window.innerHeight) - sizerClientRect.top,
            right: Math.min(sizerClientRect.right, scrollParentClientRect.right, window.innerWidth) - sizerClientRect.left
        };
        return { ...bounds, height: bounds.bottom-bounds.top, width: bounds.right-bounds.left };
    }

    private onScroll = () => {
        if (!this.sizerRef.current) {
            return;
        }
        const canvasSize = this.calculateMaxViewSize();
        const sizerClientRect = this.sizerRef.current.getBoundingClientRect();
        const scrollParentClientRect = this.getScrollParentClientRect();

        const yOffset = this.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, canvasSize);
        const xOffset = this.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, canvasSize);

        // Update the canvas holder's position outside of React, for performance reasons
        if (this.canvasHolderRef.current) {
            const transform = (xOffset > 0 || yOffset > 0) ?
                `translate(${xOffset}px, ${yOffset}px)` :
                '';
            this.canvasHolderRef.current.style.transform = transform;
        }

        this.setState({
            gridOffset: {x: xOffset, y: yOffset},
            visibleRect: this.calculateViewRect()
        });
    }

    private calcCanvasYOffset = (
        sizerClientRect: ClientRect,
        scrollParentClientRect: ClientRect,
        canvasSize: Size
    ) => {
        if (sizerClientRect.top >= scrollParentClientRect.top) {
            // The sizer is below the top of the scroll parent, so no need to offset the canvas
            return 0;
        } else if (sizerClientRect.bottom <= scrollParentClientRect.bottom) {
            // The sizer is above the bottom of the scroll parent, so offset the canvas to align the bottoms
            return sizerClientRect.height - canvasSize.height;
        } else {
            // The sizer spans across the scroll parent, so offset the canvas to align the tops
            return scrollParentClientRect.top - sizerClientRect.top;
        }
    }

    private calcCanvasXOffset = (
        sizerClientRect: ClientRect,
        scrollParentClientRect: ClientRect,
        canvasSize: Size
    ) => {
        if (sizerClientRect.left >= scrollParentClientRect.left) {
            // The sizer is to the right of the left of the scroll parent, so no need to offset the canvas
            return 0;
        } else if (sizerClientRect.right <= scrollParentClientRect.right) {
            // The sizer is to the left of the right of the scroll parent, so offset the canvas to align the rights
            return sizerClientRect.width - canvasSize.width;
        } else {
            // The sizer spans across the scroll parent, so offset the canvas to align the lefts
            return scrollParentClientRect.left - sizerClientRect.left;
        }
    }

    private getScrollParentClientRect = () => {
        if (!this.scrollParent) {
            throw new Error('Cannot get scroll parent client rect: scrollParent not set');
        }
        if (this.scrollParent === document.body) {
            return {
                top: 0,
                height: window.innerHeight,
                bottom: window.innerHeight,
                left: 0,
                width: window.innerWidth,
                right: window.innerWidth
            };
        } else {
            return this.scrollParent.getBoundingClientRect();
        }
    }

    private windowToSizer = ({x, y}: {x: number; y: number}) => {
        if (!this.sizerRef.current) {
            return {x, y};
        }
        const sizerClientRect = this.sizerRef.current.getBoundingClientRect();
        return {
            x: x - sizerClientRect.left,
            y: y - sizerClientRect.top
        };
    }

    private sizerToGrid = ({x, y}: {x: number; y: number}) => {
        let colIndex = -1;
        for (let i = 0; i < this.columnBoundaries.length; i++) {
            if (this.columnBoundaries[i].right >= x) {
                colIndex = i;
                break;
            }
        }
        return {
            y: Math.floor(y / this.props.rowHeight),
            x: colIndex
        };
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const gridCoords = this.sizerToGrid(this.windowToSizer({x: event.clientX, y: event.clientY}));
        const selectedRange = {
            topLeft: gridCoords,
            bottomRight: gridCoords
        };
        this.setState({selectedRange, selectedRangeDragStart: gridCoords});
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.state.selectedRange || !this.state.selectedRangeDragStart) {
            return;
        }
        if ((event.buttons & 1) === 0) {
            return;
        }
        const gridCoords = this.sizerToGrid(this.windowToSizer({x: event.clientX, y: event.clientY}));
        const selectedRange = {
            topLeft: {
                x: Math.min(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.min(this.state.selectedRangeDragStart.y, gridCoords.y)
            },
            bottomRight: {
                x: Math.max(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.max(this.state.selectedRangeDragStart.y, gridCoords.y)
            }
        };
        this.setState({selectedRange});
    }

    private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.state.selectedRange || !this.state.selectedRangeDragStart) {
            return;
        }
        const gridCoords = this.sizerToGrid(this.windowToSizer({x: event.clientX, y: event.clientY}));
        const selectedRange = {
            topLeft: {
                x: Math.min(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.min(this.state.selectedRangeDragStart.y, gridCoords.y)
            },
            bottomRight: {
                x: Math.max(this.state.selectedRangeDragStart.x, gridCoords.x),
                y: Math.max(this.state.selectedRangeDragStart.y, gridCoords.y)
            }
        };
        const selectedRangeDragStart = null;
        this.setState({selectedRange, selectedRangeDragStart});
    }
};

function getScrollParent(element: HTMLElement, includeHidden: boolean) {
    var style = getComputedStyle(element);
    var excludeStaticParent = style.position === 'absolute';
    var overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

    if (style.position === 'fixed') return document.body;
    for (let parent: HTMLElement|null = element; parent !== null; parent = parent!.parentElement) {
        style = getComputedStyle(parent);
        if (excludeStaticParent && style.position === "static") {
            continue;
        }
        if (overflowRegex.test(`${style.overflow}${style.overflowY}${style.overflowX}`)) {
            return parent;
        }
    }

    return document.body;
}