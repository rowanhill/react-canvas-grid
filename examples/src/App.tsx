import React from 'react';
import { HashRouter, NavLink, Route } from 'react-router-dom';
import './App.css';
import Examples from './Examples';
import Home from './Home';

const App = () => {
    return (
        <HashRouter>
            <div className="app-container">
                <nav className="top-nav">
                    <span className="top-nav-item"><NavLink exact to="/">Home</NavLink></span>
                    <span className="top-nav-item"><NavLink to="/examples">Examples</NavLink></span>
                    <span className="top-nav-item">
                        <a href="https://github.com/rowanhill/react-canvas-grid/">GitHub</a>
                    </span>
                </nav>
                <main>
                    <Route exact path="/" component={Home} />
                    <Route path="/examples" component={Examples} />
                </main>
            </div>
        </HashRouter>
    );
};

export default App;
