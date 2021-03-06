import * as React from 'react';
import { ReactCanvasGrid, SelectRange } from 'react-canvas-grid';
import { EventLog } from '../components/EventLog';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import { createFakeDataAndColumns } from '../data/dataAndColumns';

interface SelectionEventsState {
    eventLog: string;
}

const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

export class SelectionEventsGrid extends React.Component<{}, SelectionEventsState> {
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
                    <ReactCanvasGrid<void>
                        columns={columns}
                        data={data}
                        rowHeight={20}
                        frozenRows={1}
                        frozenCols={1}
                        onSelectionChangeStart={this.start}
                        onSelectionChangeUpdate={this.update}
                        onSelectionChangeEnd={this.end}
                    />
                </FixedSizeHolder>
                <EventLog log={this.state.eventLog} />
            </>
        );
    }

    private start = (range: SelectRange | null) => {
        this.appendToLog('start', range);
    }

    private update = (range: SelectRange | null) => {
        this.appendToLog('update', range);
    }

    private end = (range: SelectRange | null) => {
        this.appendToLog('end', range);
    }

    private appendToLog = (eventType: 'start' | 'update' | 'end', range: SelectRange | null) => {
        const paddedType = eventType === 'start' ?  ' start' :
                           eventType === 'update' ? 'update' :
                                                    '   end';
        const newRange = range ?
            `(${range.topLeft.x},${range.topLeft.y}) -> (${range.bottomRight.x},${range.bottomRight.y})` :
            'none';
        this.setState((prevState) => {
            return { ...prevState, eventLog: prevState.eventLog + `${paddedType}: ${newRange}\n` };
        });
    }
}
