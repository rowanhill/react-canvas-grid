import * as React from 'react';
import './ControlsForm.css';

export const ControlsForm = (props: { children?: React.ReactNode }) => {
    return (
        <form className="controls">
            {props.children}
        </form>
    );
};

export const InlineGroup = (props: { children?: React.ReactNode }) => {
    return (
        <span className="inline-controls-group">
            {props.children}
        </span>
    );
};

export const NumberInput = (props: Partial<React.InputHTMLAttributes<HTMLInputElement>>) =>
    <input type="number" {...props} />;
