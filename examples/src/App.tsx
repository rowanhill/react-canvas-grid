import React, { Component } from 'react';
import { HashRouter, NavLink, Route } from 'react-router-dom';
import './App.css';
import exampleMeta from './examples/exampleMeta';
import { Index } from './examples/Index';

class App extends Component<{}, {}> {
  public render() {
    return (
      <HashRouter>
        <div className="app-container">
          <main>
            <Route exact path="/" component={Index} />
            {exampleMeta.map((meta) => (
              <Route key={meta.pathFragment} path={meta.pathFragment} component={meta.component} />
            ))}
          </main>
          <nav>
            <h1><NavLink to="/">react-canvas-grid</NavLink></h1>
            <ul>
              {exampleMeta.map((meta) => (
                <li key={meta.pathFragment}>
                  <NavLink to={meta.pathFragment} activeClassName="selected">{meta.name}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </HashRouter>
    );
  }
}

export default App;
