import * as React from 'react';
import {ColumnDef, DataRow, ReactCanvasGrid} from '../../src/index';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface HolderState<T> {
    columns: ColumnDef[];
    data: Array<DataRow<T>>;
    focusedColIndex: number | null;
    frozenCols: number;
}

interface HolderProps<T> {
    initialColsNumber: number;
    initialRowsNumber: number;
    dataGen: (x: number, y: number) => T;
}

export class Holder<T> extends React.Component<HolderProps<T>, HolderState<T>> {
    constructor(props: HolderProps<T>) {
        super(props);
        const dataAndCols = createFakeDataAndColumns(props.initialRowsNumber, props.initialColsNumber, props.dataGen);
        this.state = {
            columns: dataAndCols.columns,
            data: dataAndCols.rows,
            focusedColIndex: null,
            frozenCols: 0,
        };
    }

    public render() {
        return (
            <ReactCanvasGrid<T>
                cssWidth={'500px'}
                cssHeight={'400px'}
                data={this.state.data}
                columns={this.state.columns}
                rowHeight={20}
                focusedColIndex={this.state.focusedColIndex}
                frozenCols={this.state.frozenCols}
            />
        );
    }
}
