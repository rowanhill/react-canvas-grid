import React from 'react';
import { ReactComponent as RCGLogo } from './assets/logo.svg';
import { ReactComponent as ReactLogo } from './assets/react-js.svg';
import { ReactComponent as Rocket } from './assets/rocket-launch-lines.svg';
import { ReactComponent as Structure } from './assets/structure.svg';
import './Home.css';

const Home = () => {
    return (
        <>
            <div className="hero-wrapper">
                <RCGLogo className="logo-svg" />
                <h1>react-canvas-grid<br/><span className="warning">(beta)</span></h1>
                <div className="features">
                    <div className="feature">
                        <div className="feature-icon-sizer">
                            <ReactLogo className="feature-icon" />
                        </div>
                        <h3>React-first</h3>
                        <p>
                            Built from the ground up for React, react-canvas-grid is designed for a simple
                            developer experience, giving you power without getting in your way.
                        </p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon-sizer">
                            <Rocket className="feature-icon" />
                        </div>
                        <h3>Performant</h3>
                        <p>
                            Powered by the canvas element, react-canvas-grid is fast - even with large data
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
            </div>
            <div className="install-instructions-wrapper">
                <div className="install-instructions">
                    <code>npm install --save react-canvas-grid</code>
                </div>
            </div>
        </>
    );
};

export default Home;
