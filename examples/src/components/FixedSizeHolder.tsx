import * as React from 'react';
import './FixedSizeHolder.css';

export const FixedSizeHolder = (props: {children?: React.ReactNode}) => {
    return (
        <div className="fixed-size-holder">
            {props.children}
        </div>
    );
};
