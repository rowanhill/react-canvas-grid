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

export class ReactCanvasGrid<T extends CellDef> extends React.Component<ReactCanvasGridProps<T>, {}> {
    private readonly baseCanvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private readonly sizerRef: React.RefObject<HTMLDivElement> = React.createRef();
    private scrollParent: HTMLElement|null = null;

    componentDidMount() {
        if (this.baseCanvasRef.current) {
            this.scrollParent = getScrollParent(this.baseCanvasRef.current, true);
        }
        this.resizeCanvas();
        this.fixDpi();
        this.draw();

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
            <div ref={this.sizerRef} >
                <canvas ref={this.baseCanvasRef} />
            </div>
        );
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
        if (!this.sizerRef.current) {
            return;
        }
        if (!this.scrollParent) {
            return;
        }
        const sizerClientRect = this.sizerRef.current.getBoundingClientRect();
        const scrollParentClientRect = this.getScrollParentClientRect();

        const yOffset = Math.max(0, scrollParentClientRect.top - sizerClientRect.top);
        const xOffset = Math.max(0, scrollParentClientRect.left - sizerClientRect.left);

        if (yOffset > 0 || xOffset > 0) {
            this.baseCanvasRef.current.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        } else {
            this.baseCanvasRef.current.style.transform = '';
        }

        this.draw();
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
        if (!this.sizerRef.current) {
            throw new Error('Cannot resize canvas: sizerRef does not have current');
        }
        const canvas = this.baseCanvasRef.current;
        const sizer = this.sizerRef.current;

        const newCanvasSize = this.calculateMaxViewSize();
        canvas.width = newCanvasSize.width;
        canvas.height = newCanvasSize.height;
        canvas.style.width = `${newCanvasSize.width}px`;
        canvas.style.height = `${newCanvasSize.height}px`;

        const newSizerSize = this.calculateDataSize();
        sizer.style.width = `${newSizerSize.width}px`;
        sizer.style.height = `${newSizerSize.height}px`;
    }

    private fixDpi = () => {
        if (!this.baseCanvasRef.current) {
            return;
        }
        const canvas = this.baseCanvasRef.current;
        const dpr = window.devicePixelRatio;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale all drawing operations by the dpr, so you
        // don't have to worry about the difference.
        var ctx = canvas.getContext('2d', { alpha: false });
        ctx!.scale(dpr, dpr);
    }

    private draw = () => {
        if (!this.baseCanvasRef.current) {
            return;
        }
        const baseCanvas = this.baseCanvasRef.current;

        if (!this.sizerRef.current) {
            return;
        }
        const sizer = this.sizerRef.current;

        const baseContext = baseCanvas.getContext('2d');
        if (!baseContext) {
            return;
        }

        // Get rect to draw
        const visibleRect = this.calculateViewRect();

        // Clear the background
        baseContext.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

        // Draw white base
        baseContext.fillStyle = 'white';
        baseContext.fillRect(0, 0, visibleRect.width, visibleRect.height);

        // Draw column separator lines
        baseContext.strokeStyle = 'lightgrey';
        baseContext.lineWidth = 1;
        baseContext.beginPath();

        let x = 0;
        this.props.columns.forEach(col => {
            x += col.width;
            if (x >= visibleRect.left && x <= visibleRect.right) {
                baseContext.moveTo(x - visibleRect.left, 0);
                baseContext.lineTo(x - visibleRect.left, visibleRect.height);
            }
        });

        // Draw row separator lines
        for (let y = this.props.rowHeight; y < sizer.getBoundingClientRect().height; y += this.props.rowHeight) {
            if (y >= visibleRect.top && y <= visibleRect.bottom) {
                baseContext.moveTo(0, y - visibleRect.top);
                baseContext.lineTo(visibleRect.width, y - visibleRect.top);
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
                    baseContext.fillText(cell.getText(), cellLeft + 2 - visibleRect.left, (rowIndex * this.props.rowHeight + 15) - visibleRect.top, col.width - 2);
                }
            }
            cellLeft += col.width;
            if (cellLeft > visibleRect.right) {
                break;
            }
        }
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