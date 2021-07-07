import React, { Component } from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import './Examples.css';
import exampleMeta from './examples/exampleMeta';
import { ExamplePage } from './examples/ExamplePage';
import { Index } from './examples/Index';

class Examples extends Component<{}, {}> {
  public render() {
    return (
      <div className="examples-container">
        <main className="examples-main">
          <Switch>
            <Route exact path="/examples" component={Index} />
            {exampleMeta.map((meta) => (
              <Route key={meta.pathFragment} path={'/examples' + meta.pathFragment}>
                <ExamplePage textComponent={meta.text} gridComponent={meta.grid} filename={meta.fileName} />
              </Route>
            ))}
          </Switch>
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
