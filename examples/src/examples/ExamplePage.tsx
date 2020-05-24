import Highlight, { defaultProps } from 'prism-react-renderer';
import nightOwlLight from 'prism-react-renderer/themes/nightOwlLight';
import * as React from 'react';
import './ExamplePage.css';

export const examplePage = (Text: React.ComponentType, Grid: React.ComponentType, fileName: string) => {
    return class extends React.Component<{}, { source: string|null; showSource: boolean; }> {
        constructor(props: {}) {
            super(props);
            this.state = {
                source: null,
                showSource: false,
            };
        }

        public componentDidMount() {
            fetch(`examples/${fileName}.grid.tsx`)
                .then((res) => res.text())
                .then((source) => this.setState({source}));
        }

        public render() {
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
};
