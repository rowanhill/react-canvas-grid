import * as React from 'react';

export const Holder = (props: {children?: any}) => {
    return (
        <div id="rcg-holder" style={{width: `500px`, height: `400px`, overflow: 'scroll'}}>
            {props.children}
        </div>
    );
};
