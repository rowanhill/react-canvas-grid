import * as React from 'react';
import { ReactCanvasGrid } from 'react-canvas-grid';
import { ControlsForm } from '../components/ControlsForm';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

export class ResizeGrid extends React.Component<{}, { size: 'big'|'small'; }> {
    constructor(props: {}) {
        super(props);
        this.state = {
            size: 'small',
        };
    }

    public render() {
        const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

        return (
            <>
                <ControlsForm>
                    <div>
                        <label>Grid size: </label>
                        <select onChange={this.chooseSize} value={this.state.size}>
                            <option value={'small'}>Small</option>
                            <option value={'big'}>Big</option>
                        </select>
                    </div>
                </ControlsForm>
                <ReactCanvasGrid<void>
                    cssHeight={this.state.size === 'big' ? '600px' : '400px'}
                    cssWidth={this.state.size === 'big' ? '600px' : '400px'}
                    columns={columns}
                    data={data}
                    rowHeight={20}
                />
            </>
        );
    }

    private chooseSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as 'big'|'small';
        this.setState({
            size: value,
        });
    }
}
