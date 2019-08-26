import * as React from 'react';
import './EventLog.css';

interface EventLogProps {
    log: string;
}

export class EventLog extends React.PureComponent<EventLogProps> {
    private logRef: React.RefObject<HTMLTextAreaElement>;

    constructor(props: EventLogProps) {
        super(props);
        this.logRef = React.createRef();
    }

    public render() {
        return (<textarea ref={this.logRef} className="event-log" value={this.props.log} readOnly />);
    }

    public componentDidUpdate() {
        if (this.logRef.current) {
            this.logRef.current.scrollTop = this.logRef.current.scrollHeight;
        }
    }
}
