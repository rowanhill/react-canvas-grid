import * as React from 'react';
import { CellDef, ReactCanvasGrid } from 'react-canvas-grid';
import { Link } from 'react-router-dom';
import { EventLog } from '../components/EventLog';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
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
            <PaddedPage>
                <h1>Keyboard Events</h1>
                <p>
                    Keyboard events bubble up, so can be captured the parent element of the grid (when
                    the grid has focus).
                </p>
                <p>
                    Note that keyboard events will also bubble up when the user interacts with the
                    inline editor, which you may wish to ignore. To do so, you may wish to observe
                    the grid's edit events.
                </p>
                <p>
                    Also note that the editing functionality provided in this example is incomplete;
                    changes are not persisted. To see a more complete example, see
                    the <Link to="/editable">Editable Data</Link> example.
                </p>
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
            </PaddedPage>
        );
    }

    private onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
        this.setState({
            eventLog: this.state.eventLog + `key up: ${event.key}\n`,
        });
    }
}
