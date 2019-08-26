import * as React from 'react';
import { CellDataChangeEvent, CellDef, ReactCanvasGrid } from 'react-canvas-grid';
import { Link } from 'react-router-dom';
import { EventLog } from '../components/EventLog';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
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
            <PaddedPage>
                <h1>Edit Events</h1>
                <p>
                    The callback <code>onCellDataChanged</code> allow consumers of react-canvas-grid to
                    respond to the user making changes to the data. Typically, this is used to update the
                    data passed to the grid in the <code>data</code> prop. Without doing so, the grid's
                    data will not be changed. See the <Link to="/editable">Editable Data</Link> example
                    for further detail. This example does not update the data, but merely logs event.
                </p>
                <p>
                    Note that the callback is fired when the user hits enter on the inline editor, or when
                    the inline editor loses focus, regardless of whether the data has been changed. The
                    inline editor can be dismissed with the escape key, regardless of whether the data has
                    been changed.
                </p>
                <FixedSizeHolder>
                    <ReactCanvasGrid<string>
                        columns={columns}
                        data={data}
                        rowHeight={20}
                        onCellDataChanged={this.onCellDataChanged}
                    />
                </FixedSizeHolder>
                <EventLog log={this.state.eventLog} />
            </PaddedPage>
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
