import * as React from 'react';
import { Link } from 'react-router-dom';
import exampleMeta from './exampleMeta';

export const Index = () => {
    return (
        <React.Fragment>
            <h1>Examples</h1>
            <ul>
                {exampleMeta.map((meta) => (
                    <li key={meta.pathFragment}>
                        <h3><Link to={'/examples' + meta.pathFragment}>{meta.name}</Link></h3>
                        <p>{meta.description}</p>
                    </li>
                ))}
            </ul>
        </React.Fragment>
    );
};
