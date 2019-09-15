import * as React from 'react';
import { ColumnDef, DataRow, ReactCanvasGrid } from 'react-canvas-grid';
import { ControlsForm, InlineGroup, NumberInput } from '../components/ControlsForm';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface DynamicDataGridState {
    columns: ColumnDef[];
    data: Array<DataRow<void>>;
    numCols: number;
    numRows: number;
}

export class DynamicDataGrid extends React.Component<{}, DynamicDataGridState> {
    private changeColsDebounceTimeout: number | null = null;
    private changeRowsDebounceTimeout: number | null = null;

    constructor(props: {}) {
        super(props);

        this.state = getDefaultState();
    }

    public render() {
        return (
            <PaddedPage>
                <h1>Dynamic Data</h1>
                <p>
                    Updates to the <code>columns</code> and <code>data</code> props cause the grid to
                    re-render with new values.
                </p>
                <p>
                    The selected cells are cleared if <code>columns</code> changes or the number of rows
                    (in <code>data</code>) changes. The selection is not cleared, however, if <code>columns</code>
                    &#160;stays the same and <code>data</code> is replaced with an array of the same length (even if the
                    contents within the array is different). I.e. if the <em>structure</em> of the grid has changed
                    then the selection is cleared, but if only the <em>contents</em> change then the selection is
                    retained.
                </p>
                <p>
                    The scroll position is maintained as long as it is valid in the newly rendered grid. If not
                    (because there are fewer columns or rows) the scroll position is truncated.
                </p>

                <ControlsForm>
                    <div>
                        <InlineGroup>
                            <label>Number of rows: </label>
                            <NumberInput
                                id="num-rows"
                                onChange={this.changeNumRows}
                                defaultValue={this.state.numRows as any}
                            />
                        </InlineGroup>
                        <InlineGroup>
                            <label>Number of columns: </label>
                            <NumberInput
                                id="num-cols"
                                onChange={this.changeNumCols}
                                defaultValue={this.state.numCols as any}
                            />
                        </InlineGroup>
                    </div>
                    <div>
                        <InlineGroup>
                            <button id="first-col-to-end" onClick={this.moveFirstColumnToEnd}>
                                Move first column to end
                            </button>
                        </InlineGroup>
                        <InlineGroup>
                            <button id="modify-top-left" onClick={this.modifyTopLeftCell}>
                                Modify top left cell
                            </button>
                        </InlineGroup>
                        <InlineGroup>
                            <button id="reset" onClick={this.reset}>Reset</button>
                        </InlineGroup>
                    </div>
                </ControlsForm>

                <FixedSizeHolder>
                    <ReactCanvasGrid<void>
                        columns={this.state.columns}
                        data={this.state.data}
                        rowHeight={20}
                    />
                </FixedSizeHolder>
            </PaddedPage>
        );
    }

    private changeNumRows = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.changeRowsDebounceTimeout) {
            clearTimeout(this.changeRowsDebounceTimeout);
        }
        const numRows = event.target.valueAsNumber;
        this.changeRowsDebounceTimeout = setTimeout(this.changeNumRowsDebounced, 80, numRows);
    }

    private changeNumRowsDebounced = (numRows: number) => {
        this.changeRowsDebounceTimeout = null;
        const { columns, rows: data } = createFakeDataAndColumns(numRows, this.state.numCols, () => {/* no op */});

        this.setState({ columns, data, numRows });
    }

    private changeNumCols = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.changeColsDebounceTimeout) {
            clearTimeout(this.changeColsDebounceTimeout);
        }
        const numCols = event.target.valueAsNumber;
        this.changeColsDebounceTimeout = setTimeout(this.changeNumColsDebounced, 80, numCols);
    }

    private changeNumColsDebounced = (numCols: number) => {
        this.changeColsDebounceTimeout = null;
        const { columns, rows: data } = createFakeDataAndColumns(this.state.numRows, numCols, () => {/* no op */});

        this.setState({ columns, data, numCols });
    }

    private moveFirstColumnToEnd = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>  {
        this.setState({
            columns: [...this.state.columns.slice(1), this.state.columns[0]],
        });
        event.preventDefault();
    }

    private modifyTopLeftCell = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>  {
        const firstColName = this.state.columns[0].fieldName;
        this.setState({
            data: [
                {
                    ...this.state.data[0],
                    [firstColName]: {
                        ...this.state.data[0][firstColName],
                        getText: () => 'Modified',
                    },
                },
                ...this.state.data.slice(1),
            ],
        });
        event.preventDefault();
    }

    private reset = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        this.setState(getDefaultState());
        event.preventDefault();
    }
}

const getDefaultState = () => {
    const { columns, rows: data } = createFakeDataAndColumns(20, 100, () => {/* no op */});

    return {
        columns,
        data,
        numCols: 100,
        numRows: 20,
    };
};