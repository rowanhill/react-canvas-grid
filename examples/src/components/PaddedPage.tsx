import * as React from 'react';
import './PaddedPage.css';

const PaddedPage = (props: { children?: React.ReactNode }) => {
    return (
        <div className="padded-page">
            {props.children}
        </div>
    );
};

export default PaddedPage;
