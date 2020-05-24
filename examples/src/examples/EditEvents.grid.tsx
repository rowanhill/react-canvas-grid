import * as React from 'react';
import { CellDataChangeEvent, CellDef, ReactCanvasGrid } from 'react-canvas-grid';
import { EventLog } from '../components/EventLog';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface EditEventsState {
    eventLog: string;
}

const options: Partial<CellDef<string>> = {
    editor: {
        serialise: (value: string) => value,
        deserialise: (text: string, _: string) => text,
    },
    getText: (value: string) => value,
};
const { columns, rows: data } = createFakeDataAndColumns(100, 20, (x, y) => `${x},${y}`, options);

export class EditEventsGrid extends React.Component<{}, EditEventsState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            eventLog: '',
        };
    }

    public render() {
        return (
            <>
                <FixedSizeHolder>
                    <ReactCanvasGrid<string>
                        columns={columns}
                        data={data}
                        rowHeight={20}
                        onCellDataChanged={this.onCellDataChanged}
                    />
                </FixedSizeHolder>
                <EventLog log={this.state.eventLog} />
            </>
        );
    }

    private onCellDataChanged = (event: CellDataChangeEvent<string>) => {
        const { colIndex, rowIndex, fieldName, newData } = event;

        this.setState({
            eventLog: this.state.eventLog +
                `changed: row ${rowIndex} of column "${fieldName}" (index ${colIndex}) to ${newData}\n`,
        });
    }
}
