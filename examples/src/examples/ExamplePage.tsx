import Highlight, { defaultProps } from 'prism-react-renderer';
import nightOwlLight from 'prism-react-renderer/themes/nightOwlLight';
import * as React from 'react';
import './ExamplePage.css';

interface ExamplePageProps {
    textComponent: React.ComponentType;
    gridComponent: React.ComponentType;
    filename: String;
}

export class ExamplePage extends React.Component<ExamplePageProps, { source: string|null; showSource: boolean; }> {
    constructor(props: ExamplePageProps) {
        super(props);
        this.state = {
            source: null,
            showSource: false,
        };
    }

    public componentDidMount() {
        fetch(process.env.PUBLIC_URL + `/examples/${this.props.filename}.grid.tsx`)
            .then((res) => res.text())
            .then((source) => this.setState({source}));
    }

    public render() {
        const Text = this.props.textComponent;
        const Grid = this.props.gridComponent;
        return (
            <>
                <Text />
                <Grid />
                {this.state.source &&
                    <button className="link code-toggle" onClick={this.toggleCode}>
                        {this.state.showSource ? 'Hide' : 'Show'} code
                    </button>
                }
                {this.state.source && this.state.showSource &&
                    <Highlight {...defaultProps} theme={nightOwlLight} code={this.state.source} language="tsx">
                        {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre className={`code-example ${className}`} style={style}>
                            {tokens.map((line, i) => (
                            <div {...getLineProps({ line, key: i })}>
                                {line.map((token, key) => (
                                <span {...getTokenProps({ token, key })} />
                                ))}
                            </div>
                            ))}
                        </pre>
                        )}
                    </Highlight>
                }
            </>
        );
    }

    private toggleCode = (e: React.MouseEvent) => {
        this.setState({
            showSource: !this.state.showSource,
        });
        e.preventDefault();
    }
};
