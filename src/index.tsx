import * as React from 'react';

export interface ColumnDef {
    fieldName: string;
    width: number;
}

export interface CellDef {
    getText: () => string;
}

export type DataRow<T extends CellDef> = {
    [fieldName: string]: T;
}

export interface ReactCanvasGridProps<T extends CellDef> {
    columns: ColumnDef[];
    data: DataRow<T>[];
    rowHeight: number;
}

export interface Coord {
    x: number;
    y: number;
}

export interface SelectRange {
    topLeft: Coord;
    bottomRight: Coord;
}

export class ReactCanvasGrid<T extends CellDef> extends React.Component<ReactCanvasGridProps<T>, {}> {
    private readonly baseCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private readonly highlightCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private readonly sizerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private scrollParent: HTMLElement|null = null;

    private selectedRangeDragStart: Coord|null = null;
    private selectedRange: SelectRange|null = null;

    componentDidMount() {
        if (this.baseCanvasRef.current) {
            this.scrollParent = getScrollParent(this.baseCanvasRef.current, true);
        }
        this.resizeCanvas();
        this.fixDpi();
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

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div ref={this.sizerRef} onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove}>
                <canvas ref={this.baseCanvasRef} style={{display: 'block'}} />
                <canvas ref={this.highlightCanvasRef} />
            </div>
        );
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
        if (!this.baseCanvasRef.current) {
            throw new Error('Cannot resize canvas: baseCanvasReft does not have current');
        }
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
        if (!this.baseCanvasRef.current) {
            return;
        }
        if (!this.highlightCanvasRef.current) {
            return;
        }
        if (!this.sizerRef.current) {
            return;
        }
        if (!this.scrollParent) {
            return;
        }
        const sizerClientRect = this.sizerRef.current.getBoundingClientRect();
        const scrollParentClientRect = this.getScrollParentClientRect();
        const canvasClientRect = this.baseCanvasRef.current.getBoundingClientRect();

        const yOffset = this.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, canvasClientRect);
        const xOffset = this.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, canvasClientRect);

        if (yOffset > 0 || xOffset > 0) {
            this.baseCanvasRef.current.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            this.highlightCanvasRef.current.style.transform = `translate(${xOffset}px, ${yOffset - canvasClientRect.height}px)`;
        } else {
            this.baseCanvasRef.current.style.transform = '';
            this.highlightCanvasRef.current.style.transform = `translate(0px, ${-canvasClientRect.height}px)`;
        }

        this.drawBase();
        this.drawHighlight();
    }

    private calcCanvasYOffset = (
        sizerClientRect: ClientRect,
        scrollParentClientRect: ClientRect,
        canvasClientRect: ClientRect
    ) => {
        if (sizerClientRect.top >= scrollParentClientRect.top) {
            // The sizer is below the top of the scroll parent, so no need to offset the canvas
            return 0;
        } else if (sizerClientRect.bottom <= scrollParentClientRect.bottom) {
            // The sizer is above the bottom of the scroll parent, so offset the canvas to align the bottoms
            return sizerClientRect.height - canvasClientRect.height;
        } else {
            // The sizer spans across the scroll parent, so offset the canvas to align the tops
            return scrollParentClientRect.top - sizerClientRect.top;
        }
    }

    private calcCanvasXOffset = (
        sizerClientRect: ClientRect,
        scrollParentClientRect: ClientRect,
        canvasClientRect: ClientRect
    ) => {
        if (sizerClientRect.left >= scrollParentClientRect.left) {
            // The sizer is to the right of the left of the scroll parent, so no need to offset the canvas
            return 0;
        } else if (sizerClientRect.right <= scrollParentClientRect.right) {
            // The sizer is to the left of the right of the scroll parent, so offset the canvas to align the rights
            return sizerClientRect.width - canvasClientRect.width;
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

    private resizeCanvas = () => {
        if (!this.baseCanvasRef.current) {
            throw new Error('Cannot resize canvas: baseCanvasRef does not have current');
        }
        if (!this.highlightCanvasRef.current) {
            throw new Error('Cannot resize canvas: highlightCanvasRef does not have current');
        }
        if (!this.sizerRef.current) {
            throw new Error('Cannot resize canvas: sizerRef does not have current');
        }
        const baseCanvas = this.baseCanvasRef.current;
        const highlightCanvas = this.highlightCanvasRef.current;
        const sizer = this.sizerRef.current;

        const newCanvasSize = this.calculateMaxViewSize();
        [baseCanvas, highlightCanvas].forEach(canvas => {
            canvas.width = newCanvasSize.width;
            canvas.height = newCanvasSize.height;
            canvas.style.width = `${newCanvasSize.width}px`;
            canvas.style.height = `${newCanvasSize.height}px`;
        });

        const newSizerSize = this.calculateDataSize();
        sizer.style.width = `${newSizerSize.width}px`;
        sizer.style.height = `${newSizerSize.height}px`;
    }

    private fixDpi = () => {
        if (!this.baseCanvasRef.current) {
            throw new Error('Cannot resize canvas: baseCanvasRef does not have current');
        }
        if (!this.highlightCanvasRef.current) {
            throw new Error('Cannot resize canvas: highlightCanvasRef does not have current');
        }
        const dpr = window.devicePixelRatio;

        const canvases = [
            {canvas: this.baseCanvasRef.current, alpha: false},
            {canvas: this.highlightCanvasRef.current, alpha: true},
        ];

        canvases.forEach(({canvas, alpha}) => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
    
            // Scale all drawing operations by the dpr, so you
            // don't have to worry about the difference.
            var ctx = canvas.getContext('2d', { alpha });
            ctx!.scale(dpr, dpr);
        });
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

    private gridToSizer = ({x, y}: {x: number; y: number}): ClientRect => {
        const columnLefts = this.calculateColumnLefts(); //TODO: Cache as private var
        return {
            top: y * this.props.rowHeight,
            bottom: (y + 1) * this.props.rowHeight,
            height: this.props.rowHeight,
            left: columnLefts[x],
            right: columnLefts[x + 1],
            width: this.props.columns[x].width
        };
    }

    private onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const gridCoords = this.sizerToGrid(this.windowToSizer({x: event.clientX, y: event.clientY}));
        this.selectedRangeDragStart = gridCoords;
        this.selectedRange = {
            topLeft: gridCoords,
            bottomRight: gridCoords
        };
        this.drawHighlight();
    }

    private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.selectedRange || !this.selectedRangeDragStart) {
            return;
        }
        if ((event.buttons & 1) === 0) {
            return;
        }
        const gridCoords = this.sizerToGrid(this.windowToSizer({x: event.clientX, y: event.clientY}));
        this.selectedRange = {
            topLeft: {
                x: Math.min(this.selectedRangeDragStart.x, gridCoords.x),
                y: Math.min(this.selectedRangeDragStart.y, gridCoords.y)
            },
            bottomRight: {
                x: Math.max(this.selectedRangeDragStart.x, gridCoords.x),
                y: Math.max(this.selectedRangeDragStart.y, gridCoords.y)
            }
        };
        this.drawHighlight();
    }

    private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!this.selectedRange || !this.selectedRangeDragStart) {
            return;
        }
        const gridCoords = this.sizerToGrid(this.windowToSizer({x: event.clientX, y: event.clientY}));
        this.selectedRange = {
            topLeft: {
                x: Math.min(this.selectedRangeDragStart.x, gridCoords.x),
                y: Math.min(this.selectedRangeDragStart.y, gridCoords.y)
            },
            bottomRight: {
                x: Math.max(this.selectedRangeDragStart.x, gridCoords.x),
                y: Math.max(this.selectedRangeDragStart.y, gridCoords.y)
            }
        };
        this.selectedRangeDragStart = null;
        this.drawHighlight();
    }

    private drawBase = () => {
        if (!this.baseCanvasRef.current) {
            return;
        }
        const baseCanvas = this.baseCanvasRef.current;

        if (!this.sizerRef.current) {
            return;
        }
        const sizer = this.sizerRef.current;

        const baseContext = baseCanvas.getContext('2d', { alpha: false });
        if (!baseContext) {
            return;
        }

        if (!this.scrollParent) {
            return;
        }

        const sizerClientRect = sizer.getBoundingClientRect();
        const scrollParentClientRect =  this.getScrollParentClientRect();
        const baseCanvasClientRect = baseCanvas.getBoundingClientRect()

        // Get rect to draw
        const visibleRect = this.calculateViewRect();

        // Get amount to translate
        const translationOffset = {
            top: this.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, baseCanvasClientRect),
            left: this.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, baseCanvasClientRect)
        };

        // Draw white base
        baseContext.fillStyle = 'white';
        baseContext.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        baseContext.translate(-translationOffset.left, -translationOffset.top);

        // Draw column separator lines
        baseContext.strokeStyle = 'lightgrey';
        baseContext.lineWidth = 1;
        baseContext.beginPath();

        let x = 0;
        this.props.columns.forEach(col => {
            x += col.width;
            if (x >= visibleRect.left && x <= visibleRect.right) {
                baseContext.moveTo(x, visibleRect.top);
                baseContext.lineTo(x, visibleRect.bottom);
            }
        });

        // Draw row separator lines
        for (let y = this.props.rowHeight; y < sizer.getBoundingClientRect().height; y += this.props.rowHeight) {
            if (y >= visibleRect.top && y <= visibleRect.bottom) {
                baseContext.moveTo(visibleRect.left, y);
                baseContext.lineTo(visibleRect.right, y);
            }
        }

        baseContext.stroke();

        // Draw cell text
        baseContext.fillStyle = 'black';
        let cellLeft = 0;
        for (let col of this.props.columns) {
            if (cellLeft + col.width >= visibleRect.left && cellLeft <= visibleRect.right) {
                for (let rowIndex = Math.floor(visibleRect.top / this.props.rowHeight); rowIndex < this.props.data.length; rowIndex++) {
                    const row = this.props.data[rowIndex];
                    const cell = row[col.fieldName];
                    baseContext.fillText(cell.getText(), cellLeft + 2, (rowIndex * this.props.rowHeight + 15), col.width - 2);
                }
            }
            cellLeft += col.width;
            if (cellLeft > visibleRect.right) {
                break;
            }
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        baseContext.translate(translationOffset.left, translationOffset.top);
    }

    private drawHighlight = () => {
        if (!this.highlightCanvasRef.current) {
            return;
        }
        const highlightCanvas = this.highlightCanvasRef.current;

        if (!this.sizerRef.current) {
            return;
        }
        const sizer = this.sizerRef.current;

        const highlightContext = highlightCanvas.getContext('2d', { alpha: true });
        if (!highlightContext) {
            return;
        }

        if (!this.scrollParent) {
            return;
        }

        const sizerClientRect = sizer.getBoundingClientRect();
        const scrollParentClientRect =  this.getScrollParentClientRect();
        const canvasClientRect = highlightCanvas.getBoundingClientRect();

        // Get rect to draw
        const visibleRect = this.calculateViewRect();

        // Get amount to translate
        const translationOffset = {
            top: this.calcCanvasYOffset(sizerClientRect, scrollParentClientRect, canvasClientRect),
            left: this.calcCanvasXOffset(sizerClientRect, scrollParentClientRect, canvasClientRect)
        };

        // Clear the higlight layer
        highlightContext.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

        // Translate the canvas context so that it's covering the visibleRect
        // (so when we translate it back, what we've drawn is within the bounds of the canvas element)
        highlightContext.translate(-translationOffset.left, -translationOffset.top);
        
        // Draw selected cell highlights
        highlightContext.fillStyle = '#44aaff22';
        highlightContext.strokeStyle = '#44aaff99';
        if (this.selectedRange) {
            const tl = this.gridToSizer(this.selectedRange.topLeft);
            const br = this.gridToSizer(this.selectedRange.bottomRight);
            highlightContext.fillRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
            highlightContext.strokeRect(tl.left, tl.top, br.right - tl.left, br.bottom - tl.top);
        }

        // Translate back, to bring our drawn area into the bounds of the canvas element
        highlightContext.translate(translationOffset.left, translationOffset.top);
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