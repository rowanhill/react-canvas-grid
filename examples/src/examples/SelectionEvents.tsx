import * as React from 'react';
import { ReactCanvasGrid, SelectRange } from 'react-canvas-grid';
import { FixedSizeHolder } from '../components/FixedSizeHolder';
import PaddedPage from '../components/PaddedPage';
import { createFakeDataAndColumns } from '../data/dataAndColumns';
import './SelectionEvents.css';

interface SelectionEventsState {
    eventLog: string;
}

const { columns, rows: data } = createFakeDataAndColumns(100, 20, () => {/* no op */});

export class SelectionEventsGrid extends React.Component<{}, SelectionEventsState> {
    private logRef: React.RefObject<HTMLTextAreaElement>;

    constructor(props: {}) {
        super(props);
        this.state = {
            eventLog: '',
        };
        this.logRef = React.createRef();
    }

    public render() {
        return (
            <PaddedPage>
                <h1>Selection Events</h1>
                <p>
                    The three callbacks <code>onSelectionChange[Start|Update|End]</code> allow consumers
                    of react-canvas-grid to take action in response to the user changing the selected area.
                    This can be useful for keeping track of the selection, in order to act upon the data.
                </p>
                <p>
                    Note that clicking / dragging on frozen headers allows the user to select entire rows / columns.
                </p>
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
                <textarea ref={this.logRef} className="select-event-log" value={this.state.eventLog} readOnly />
            </PaddedPage>
        );
    }

    public componentDidUpdate() {
        if (this.logRef.current) {
            this.logRef.current.scrollTop = this.logRef.current.scrollHeight;
        }
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
        this.setState({
            eventLog: this.state.eventLog + `${paddedType}: ${newRange}\n`,
        });
    }
}
