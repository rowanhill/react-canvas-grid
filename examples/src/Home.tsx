import React from 'react';
import { Link } from 'react-router-dom';
import autofill from './assets/autofill.png';
import customRender from './assets/custom-render.png';
import { ReactComponent as FeatureIconGradient } from './assets/feature-icon-gradient.svg';
import frozenRowsCols from './assets/frozen-rows-cols.png';
import inlineEdit from './assets/inline-edit.png';
import { ReactComponent as RCGLogo } from './assets/logo.svg';
import { ReactComponent as ReactLogo } from './assets/react-js.svg';
import { ReactComponent as Rocket } from './assets/rocket-launch-lines.svg';
import selectionRange from './assets/selection-range.png';
import { ReactComponent as Structure } from './assets/structure.svg';
import './Home.css';

const Home = () => {
    return (
        <>
            <div className="hero-wrapper">
                <RCGLogo className="logo-svg" />
                <h1>react-canvas-grid<br/><span className="warning">(beta)</span></h1>
                <div className="install-instructions-wrapper">
                    <div className="install-instructions">
                        <code><span className="prompt">&gt; </span>npm install --save react-canvas-grid</code>
                    </div>
                </div>
            </div>
            <div className="features">
                <FeatureIconGradient style={{width: 0, height: 0}} />
                <div className="feature">
                    <div className="feature-icon-sizer">
                        <ReactLogo className="feature-icon" />
                    </div>
                    <h3>React-first</h3>
                    <p>
                        Built from the ground up for React, ReactCanvasGrid is designed for a simple
                        developer experience, giving you power without getting in your way.
                    </p>
                </div>
                <div className="feature">
                    <div className="feature-icon-sizer">
                        <Rocket className="feature-icon" />
                    </div>
                    <h3>Performant</h3>
                    <p>
                        Powered by the canvas element, ReactCanvasGrid is fast - even with large data
                        sets or complex visuals. It only draws what's visible, and only redraws what's
                        changed, giving the user a smooth experience.
                    </p>
                </div>
                <div className="feature">
                    <div className="feature-icon-sizer">
                        <Structure className="feature-icon" />
                    </div>
                    <h3>Rich data friendly</h3>
                    <p>
                        First-class support for complex data values, allowing you to easily manage
                        compound data, metadata, or anything else!
                    </p>
                </div>
            </div>
            <div className="capabilities">
                <Capability
                    title="Customisable Rendering"
                    img={{
                        src: customRender,
                        alt: 'Customised rendering of cells, showing header cells and multi-coloured data cells',
                    }}
                    examples={[
                        { text: 'Custom Background', path: '/examples/custom-bg' },
                        { text: 'Custom Text', path: '/examples/custom-text' },
                        { text: 'Full Example', path: '/examples/full-example' },
                    ]}
                >
                    <p>
                        If you can draw it in a canvas element, you can draw it in ReactCanvasGrid.
                        All cell rendering (background, text, you name it) is fully customisable on a
                        per-cell basis.
                    </p>
                </Capability>
                <Capability
                    title="Inline Editing"
                    img={{
                        src: inlineEdit,
                        alt: 'A text input aligned with the grid, allowing user modification of cell data',
                    }}
                    examples={[
                        { text: 'Editable Data', path: '/examples/editable' },
                        { text: 'Edit Events', path: '/examples/edit-events' },
                        { text: 'Full Example', path: '/examples/full-example' },
                    ]}
                >
                    <>
                    <p>
                        Data can be altered directly through the text-based inline editor. Complex data
                        is marshalled to / from a string by custom serialisers / deserialisers.
                    </p>
                    <p>
                        Of course, you own the data, not ReactCanvasGrid, so your app can provide users
                        other means of editing data if you so choose.
                    </p>
                    </>
                </Capability>
                <Capability
                    title="Frozen Cells"
                    img={{
                        src: frozenRowsCols,
                        alt: 'The top-left of a scrolled grid, where the first row and column are still visible',
                    }}
                    examples={[
                        { text: 'Frozen Rows & Columns', path: '/examples/frozen' },
                        { text: 'Full Example', path: '/examples/full-example' },
                    ]}
                >
                    <>
                    <p>
                        Freeze as many rows or columns as you need - be it zero (i.e. no row / column headers),
                        one, or more. Frozen rows / columns do not scroll with the rest of the grid, and selecting
                        them selects the entire row, column or grid.
                    </p>
                    <p>
                        Note that frozen rows and columns are not rendered differently by default, but can be
                        customised just like any other cell.
                    </p>
                    </>
                </Capability>
                <Capability
                    title="Range Selection"
                    img={{
                        src: selectionRange,
                        alt: 'A grid with a 2x2 selection highlighted',
                    }}
                    examples={[
                        { text: 'Selection Events', path: '/examples/selection-events' },
                        { text: 'Full Example', path: '/examples/full-example' },
                    ]}
                >
                    <p>
                        A single rectangular range of cells can be selected (by either keyboard or mouse). Your
                        application can provide callbacks to listen for various phases of the selection state change
                        cycle.
                    </p>
                </Capability>
                <Capability
                    title="Column Focusing"
                    examples={[
                        { text: 'Column Focusing', path: '/examples/focused-column' },
                        { text: 'Full Example', path: '/examples/full-example' },
                    ]}
                >
                    <>
                    <p>
                        Declaratively focusing a column will cause ReactCanvasGrid to scroll to bring that column
                        in to view. This can be integrated with an external search component.
                    </p>
                    </>
                </Capability>
                <Capability
                    title="Autofill"
                    img={{
                        src: autofill,
                        alt: 'A grid with a 2x2 selection and another 2x2 area to the right highlighted for autofill',
                    }}
                    examples={[
                        { text: 'Autofill', path: '/examples/autofill' },
                        { text: 'Full Example', path: '/examples/full-example' },
                    ]}
                >
                    <>
                    <p>
                        Drag a selection range to autofill the new area. A callback will be invoked to allow your
                        application to update the data. ReactCanvasGrid also provides a convenience function to help
                        simplify modifying your data. It's also possible to dynamically determine whether autofilling
                        should be enabled for a given selection range.
                    </p>
                    </>
                </Capability>
            </div>
        </>
    );
};

interface CapabilityProps {
    title: string;
    img?: { src: string; alt: string; };
    examples: Array<{ text: string; path: string; }>;
}
const Capability: React.FC<CapabilityProps> = (props) => {
    return (
        <div className="capability">
            <h3>{props.title}</h3>
            <div className="capability-details">
                {props.img && <img src={props.img.src} alt={props.img.alt} />}
                <div>
                    {props.children}
                    {props.examples.length > 0 && <div className="example-links">
                        See: {props.examples
                            .map<React.ReactNode>((e) => <Link key={e.path} to={e.path}>{e.text}</Link>)
                            .reduce((acc, el) => [acc, ' | ', el])}
                    </div>}
                </div>
            </div>
        </div>
    );
};

export default Home;
