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

interface SelectInputProps<T> {
    values: T[];
    selectedValue: T;
    onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export const RadioInputs = <T extends {}>(
    { values, selectedValue, onSelect}: SelectInputProps<T>,
) => {
    return <React.Fragment>
        {values.map((val) =>
            <label key={val.toString()}>
                <input type="radio" value={val.toString()} checked={val === selectedValue} onChange={onSelect} />
                {val}
            </label>)}
    </React.Fragment>;
};
