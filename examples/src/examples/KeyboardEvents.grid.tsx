import * as React from 'react';
import { CellDef, ReactCanvasGrid } from 'react-canvas-grid';
import { EventLog } from '../components/EventLog';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface KeyboardEventsState {
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

export class KeyboardEventsGrid extends React.Component<{}, KeyboardEventsState> {
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
                    <div onKeyUp={this.onKeyUp} style={{ height: '100%' }}>
                        <ReactCanvasGrid<string>
                            columns={columns}
                            data={data}
                            rowHeight={20}
                        />
                    </div>
                </FixedSizeHolder>
                <EventLog log={this.state.eventLog} />
            </>
        );
    }

    private onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
        this.setState({
            eventLog: this.state.eventLog + `key up: ${event.key}\n`,
        });
    }
}
