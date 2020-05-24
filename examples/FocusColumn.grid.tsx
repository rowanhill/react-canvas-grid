import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { ControlsForm } from '../components/ControlsForm';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface FocusColumnGridState {
    focusedCol: number | null;
    freezeCols: boolean;
}

export class FocusColumnGrid extends React.Component<{}, FocusColumnGridState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            focusedCol: null,
            freezeCols: false,
        };
    }

    public render() {
        const { columns, rows: data } = createFakeDataAndColumns(20, 100, () => {/* no op */});

        return (
            <>
                <ControlsForm>
                    <div>
                        <label>Select a column to focus: </label>
                        <select onChange={this.focusColumn} defaultValue={'none'}>
                            <option value={'none'}>None</option>
                            {columns.map((_, i) => (
                                <option key={i} value={i}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="toggle-frozen-cols">Select to freeze columns 1 &amp; 2: </label>
                        <input id="toggle-frozen-cols" type="checkbox" onChange={this.toggleFrozenCols} />
                    </div>
                </ControlsForm>

                <FixedSizeHolder>
                    <ReactCanvasGrid<void>
                        columns={columns}
                        data={data}
                        rowHeight={20}
                        focusedColIndex={this.state.focusedCol}
                        frozenCols={this.state.freezeCols ? 2 : 0}
                    />
                </FixedSizeHolder>
            </>
        );
    }

    private focusColumn = (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (event.target.value === 'none') {
        this.setState({ focusedCol: null });
      } else {
        this.setState({ focusedCol: parseInt(event.target.value, 10) });
      }
    }

    private toggleFrozenCols = () => {
        this.setState({ freezeCols: !this.state.freezeCols });
    }
}
