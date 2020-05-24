import * as React from 'react';
import { CellDataChangeEvent, CellDef, DataRow, ReactCanvasGrid } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeColumns, createFakeData } from '../data/dataAndColumns';

type NumPair = [number, number];

interface EditableDataGridState {
    data: Array<DataRow<NumPair>>;
}

export class EditableDataGrid extends React.Component<{}, EditableDataGridState> {
    constructor(props: {}) {
        super(props);

        const options: Partial<CellDef<NumPair>> = {
            editor: {
                serialise: ([a, b]: NumPair) => `${a},${b}`,
                deserialise: (text: string, prev: NumPair) => {
                    const match = text.match(/(\d+),(\d+)/);
                    if (match) {
                        return [parseInt(match[1], 10), parseInt(match[2], 10)];
                    } else {
                        return prev;
                    }
                },
            },
            getText: ([a, b]: NumPair) => `${a}x${b}`,
        };

        this.state = {
            data: createFakeData(100, 200, (x, y) => [x, y] as NumPair, options),
        };
    }

    public render() {
        const columns = createFakeColumns(20);

        return (
            <FixedSizeHolder>
                <ReactCanvasGrid<NumPair>
                    columns={columns}
                    data={this.state.data}
                    rowHeight={20}
                    onCellDataChanged={this.onCellDataChanged}
                />
            </FixedSizeHolder>
        );
    }

    private onCellDataChanged = (event: CellDataChangeEvent<NumPair>) => {
        this.setState({
            data: this.state.data.map((row, i) => {
                if (i === event.rowIndex) {
                    return {
                        ...row,
                        [event.fieldName]: {
                            ...row[event.fieldName],
                            data: event.newData,
                        },
                    };
                } else {
                    return row;
                }
            }),
        });
    }
}
