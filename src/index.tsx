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
            <div>
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

    private calculateViewRect = () => {
        if (!this.baseCanvasRef.current) {
            throw new Error('Cannot resize canvas: baseCanvasReft does not have current');
        }
        if (!this.scrollParent) {
            throw new Error('Cannot resize canvas: scrollParent is null');
        }
        const canvasClientRect = this.baseCanvasRef.current.getBoundingClientRect();
        const scrollParentClientRect = this.scrollParent.getBoundingClientRect();
        const bounds = {
            top: Math.max(canvasClientRect.top, scrollParentClientRect.top, 0) - canvasClientRect.top,
            left: Math.max(canvasClientRect.left, scrollParentClientRect.left, 0) - canvasClientRect.left,
            bottom: Math.min(canvasClientRect.bottom, scrollParentClientRect.bottom, window.innerHeight) - canvasClientRect.top,
            right: Math.min(canvasClientRect.right, scrollParentClientRect.right, window.innerWidth) - canvasClientRect.left
        };
        return { ...bounds, height: bounds.bottom-bounds.top, width: bounds.right-bounds.left };
    }

    private onScroll = () => {
        if (!this.baseCanvasRef.current) {
            return;
        }
        this.draw();
    }

    private resizeCanvas = () => {
        if (!this.baseCanvasRef.current) {
            return;
        }
        const canvas = this.baseCanvasRef.current;
        const dataSize = this.calculateDataSize();
        canvas.width = dataSize.width;
        canvas.height = dataSize.height;
        canvas.style.width = `${dataSize.width}px`;
        canvas.style.height = `${dataSize.height}px`;
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
        baseContext.fillRect(visibleRect.left, visibleRect.top, visibleRect.width, visibleRect.height);

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
        for (let y = this.props.rowHeight; y < baseCanvas.height; y += this.props.rowHeight) {
            if (y >= visibleRect.top && y <= visibleRect.bottom) {
                baseContext.moveTo(visibleRect.left, y);
                baseContext.lineTo(visibleRect.right, y);
            }
        }

        baseContext.stroke();

        // Draw cell text
        baseContext.fillStyle = 'black';
        let cellLeft = 0;
        this.props.columns.forEach(col => {
            if (cellLeft + col.width >= visibleRect.left && cellLeft <= visibleRect.right) {
                for (let rowIndex = 0; rowIndex < this.props.data.length; rowIndex++) {
                    const row = this.props.data[rowIndex];
                    const cell = row[col.fieldName];
                    baseContext.fillText(cell.getText(), cellLeft + 2, rowIndex * this.props.rowHeight + 15, col.width - 2);
                }
            }
            cellLeft += col.width;
        });
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