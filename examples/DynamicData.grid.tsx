import * as React from 'react';
import { ColumnDef, DataRow, ReactCanvasGrid } from 'react-canvas-grid';
import { ControlsForm, InlineGroup, NumberInput } from '../components/ControlsForm';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface DynamicDataGridState {
    columns: ColumnDef[];
    data: Array<DataRow<void>>;
    numCols: number;
    numColsInputValue: number;
    numRows: number;
    numRowsInputValue: number;
    freezeFirstRowAndCol: boolean;
    filterCols: boolean;
}

export class DynamicDataGrid extends React.Component<{}, DynamicDataGridState> {
    private changeColsDebounceTimeout: number | null = null;
    private changeRowsDebounceTimeout: number | null = null;

    constructor(props: {}) {
        super(props);

        this.state = getDefaultState();
    }

    public render() {
        const shownCols = this.state.columns.filter((c, i) => !this.state.filterCols || i < 5);
        return (
            <>
                <ControlsForm>
                    <div>
                        <InlineGroup>
                            <label>Number of rows: </label>
                            <NumberInput
                                id="num-rows"
                                onChange={this.changeNumRows}
                                value={this.state.numRowsInputValue.toString()}
                            />
                        </InlineGroup>
                        <InlineGroup>
                            <label>Number of columns: </label>
                            <NumberInput
                                id="num-cols"
                                onChange={this.changeNumCols}
                                value={this.state.numColsInputValue.toString()}
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
                    <div>
                        <InlineGroup>
                            <label htmlFor="toggle-frozen-cols">Select to freeze row 1 &amp; column 1: </label>
                            <input
                                id="toggle-frozen-cols"
                                type="checkbox"
                                onChange={this.toggleFrozen}
                                checked={this.state.freezeFirstRowAndCol}
                            />
                        </InlineGroup>
                        <InlineGroup>
                            <label htmlFor="toggle-filter-cols">Select to hide columns over 5: </label>
                            <input
                                id="toggle-filter-cols"
                                type="checkbox"
                                onChange={this.toggleFilterCols}
                                checked={this.state.filterCols}
                            />
                        </InlineGroup>
                    </div>
                </ControlsForm>

                <FixedSizeHolder>
                    <ReactCanvasGrid<void>
                        columns={shownCols}
                        data={this.state.data}
                        rowHeight={20}
                        frozenCols={this.state.freezeFirstRowAndCol ? 1 : 0}
                        frozenRows={this.state.freezeFirstRowAndCol ? 1 : 0}
                    />
                </FixedSizeHolder>
            </>
        );
    }

    private changeNumRows = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.changeRowsDebounceTimeout) {
            clearTimeout(this.changeRowsDebounceTimeout);
        }
        const numRows = event.target.valueAsNumber;
        this.setState({ numRowsInputValue: numRows });
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
        this.setState({ numColsInputValue: numCols });
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

    private toggleFrozen = () => {
        this.setState({
            freezeFirstRowAndCol: !this.state.freezeFirstRowAndCol,
        });
    }

    private toggleFilterCols = () => {
        this.setState({
            filterCols: !this.state.filterCols,
        });
    }
}

const getDefaultState = (): DynamicDataGridState => {
    const { columns, rows: data } = createFakeDataAndColumns(20, 100, () => {/* no op */});

    return {
        columns,
        data,
        numCols: 100,
        numColsInputValue: 100,
        numRows: 20,
        numRowsInputValue: 20,
        freezeFirstRowAndCol: false,
        filterCols: false,
    };
};
