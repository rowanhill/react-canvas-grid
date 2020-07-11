import React, { Component } from 'react';
import { NavLink, Route } from 'react-router-dom';
import './Examples.css';
import exampleMeta from './examples/exampleMeta';
import { examplePage } from './examples/ExamplePage';
import { Index } from './examples/Index';

class Examples extends Component<{}, {}> {
  public render() {
    return (
      <div className="examples-container">
        <main className="examples-main">
          <Route exact path="/examples" component={Index} />
          {exampleMeta.map((meta) => (
            <Route
              key={meta.pathFragment}
              path={'/examples' + meta.pathFragment}
              component={examplePage(meta.text, meta.grid, meta.fileName)}
            />
          ))}
        </main>
        <nav className="examples-menu">
          <h1><NavLink to="/examples">Examples</NavLink></h1>
          <ul>
            {exampleMeta.map((meta) => (
              <li key={meta.pathFragment}>
                <NavLink to={'/examples' + meta.pathFragment} activeClassName="selected">{meta.name}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }
}

export default Examples;
