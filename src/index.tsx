import * as React from 'react';
import { CellDef, DataRow, ColumnDef, Coord, Size } from './types';
import { BaseCanvas } from './BaseCanvas';
import { HighlightCanvas } from './HighlightCanvas';

export { CellDef, DataRow, ColumnDef, Coord, Size } from './types';

export interface ReactCanvasGridProps<T extends CellDef> {
    columns: ColumnDef[];
    data: DataRow<T>[];
    rowHeight: number;
}

interface ReactCanvasGridState {
    canvasSize: Size;
    visibleRect: ClientRect;
    gridOffset: Coord;
    gridSize: Size;

    selectedRangeDragStart: Coord|null;
    selectedRange: SelectRange|null;
}

export interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

export class ReactCanvasGrid<T extends CellDef> extends React.Component<ReactCanvasGridProps<T>, ReactCanvasGridState> {
    private readonly sizerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private readonly canvasHolderRef: React.RefObject<HTMLDivElement> = React.createRef();
    private scrollParent: HTMLElement|null = null;

    constructor(props: ReactCanvasGridProps<T>) {
        super(props);

        this.state = {
            canvasSize: {width: 0, height: 0},
            gridOffset: {x: 0, y: 0},
            gridSize: {width: 0, height: 0},
            visibleRect: {top: 0, left: 0, right: 0, bottom: 0, height: 0, width: 0},
            selectedRangeDragStart: null,
            selectedRange: null,
        };
    }

    componentDidMount() {
        if (this.canvasHolderRef.current) {
            this.scrollParent = getScrollParent(this.canvasHolderRef.current, true);
        }

        const canvasSize = this.calculateMaxViewSize();

        const sizerClientRect = this.sizerRef.current!.getBoundingClientRect();
        const scrollParentClientRect =  this.getScrollParentClientRect();

        // Get amount to translate
        const gridOffset = {
            x: this.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, this.state.canvasSize),
            y: this.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, this.state.canvasSize)
        };

        const gridSize = this.calculateDataSize();

        this.setState({
            canvasSize,
            gridOffset,
            gridSize,
        });

        // Calculate the view rect once the canvas has been sized and the DOM has updated
        setTimeout(() => {
            const visibleRect = this.calculateViewRect();
            this.setState({
                visibleRect,
            });
        }, 0);

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

    render() {
        const colBoundaries = this.calculateColumnBoundaries();

        const canvasHolderTransform = (this.state.gridOffset.x > 0 || this.state.gridOffset.y > 0) ? 
            `translate(${this.state.gridOffset.x}px, ${this.state.gridOffset.y}px)` :
            '';

        return (
            <div
                ref={this.sizerRef}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
                style={{
                    width: `${this.state.gridSize.width}px`,
                    height: `${this.state.gridSize.height}px`
                }}
            >
                <div
                    ref={this.canvasHolderRef} 
                    style={{
                        position: 'relative',
                        width: `${this.state.canvasSize.width}px`,
                        transform: canvasHolderTransform
                    }}
                >
                    <BaseCanvas<T>
                        data={this.props.data}
                        columns={this.props.columns}
                        rowHeight={this.props.rowHeight}
                        width={this.state.canvasSize.width}
                        height={this.state.canvasSize.height}
                        visibleRect={this.state.visibleRect}
                        gridOffset={this.state.gridOffset}
                        gridHeight={this.state.gridSize.height}
                        colBoundaries={colBoundaries}
                    />
                    <HighlightCanvas
                        rowHeight={this.props.rowHeight}
                        width={this.state.canvasSize.width}
                        height={this.state.canvasSize.height}
                        gridOffset={this.state.gridOffset}
                        colBoundaries={colBoundaries}
                        selectedRange={this.state.selectedRange}
                    />
                </div>
            </div>
        );
    }

    private calculateColumnBoundaries = () => {
        let curLeft = 0;
        return this.props.columns.map(col => {
            const boundary = { left: curLeft, right: curLeft + col.width };
            curLeft += col.width;
            return boundary;
        });
    }

    private calculateColumnLefts = () => {
        const lefts = [0];
        let curLeft = 0;
        this.props.columns.forEach(col => {
            curLeft += col.width;
            lefts.push(curLeft);
        });
        return lefts;
    }

    private calculateDataSize = () => {
        const numRows = this.props.data.length;
        const height = numRows * this.props.rowHeight;

        const width = this.props.columns.reduce((acc, col) => acc + col.width, 0);

        return { width, height };
    }

    private calculateMaxViewSize = () => {
        if (!this.scrollParent) {
            throw new Error('Cannot resize canvas: scrollParent is null');
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
        const sizerClientRect = this.sizerRef.current.getBoundingClientRect();
        const scrollParentClientRect = this.getScrollParentClientRect();

        const yOffset = this.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, this.state.canvasSize);
        const xOffset = this.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, this.state.canvasSize);

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
        const columnLefts = this.calculateColumnLefts(); //TODO: Cache as private var
        let colIndex = -1;
        for (let i = 0; i < columnLefts.length; i++) {
            if (columnLefts[i] >= x) {
                colIndex = i - 1;
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