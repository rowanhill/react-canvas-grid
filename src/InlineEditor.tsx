import * as React from 'react';
import { Coord, EditableCellDef } from './types';

interface InlineTextEditorProps<T> {
    left: number;
    top: number;
    width: number;
    height: number;
    gridOffset: Coord;
    cell: EditableCellDef<T>;

    onSubmit: (newData: T) => void;
    onCancel: () => void;
}

export const InlineTextEditor = <T extends any>(props: InlineTextEditorProps<T>) => {
    const defaultText = props.cell.editor.serialise(props.cell.data);
    const submit = (e: React.FocusEvent<HTMLInputElement>|React.KeyboardEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        const newData = props.cell.editor.deserialise(inputValue, props.cell.data);
        props.onSubmit(newData);
    };
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            submit(e);
        }
    };
    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 27) {
            props.onCancel();
        }
    };

    return <input
        type="text"
        style={{
            position: 'absolute',
            boxSizing: 'border-box',
            top: `${props.top - props.gridOffset.y}px`,
            left: `${props.left - props.gridOffset.x}px`,
            width: `${props.width}px`,
            height: `${props.height}px`,
            border: '0',
        }}
        autoFocus={true}
        defaultValue={defaultText}
        onBlur={submit}
        onKeyPress={handleKeyPress}
        onKeyUp={handleKeyUp}
    />;
};
