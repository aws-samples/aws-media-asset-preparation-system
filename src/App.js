import Amplify from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import React, { useState } from 'react';
import awsmobile from './aws-exports';
import { Route, BrowserRouter } from 'react-router-dom';

import MAPSMain from './components/Main/MAPSMain';
import AppSettings from './components/UtilityPages/AppSettings';

Amplify.configure(awsmobile);

function App() {

    const [bucketName, setBucketName] = useState(
        localStorage.getItem('mapsBucketName') || ''
    );

    const handleBucketChange = (bucketName) => {
        localStorage.setItem('mapsBucketName', bucketName);
        setBucketName(bucketName);
    };

    return (
        <BrowserRouter>
            <Route
                exact
                path={'/'}
                component={() => <MAPSMain bucketName={bucketName}/>}
            />
            <Route
                exact
                path={'/settings'}
                component={() => <AppSettings
                    currBucketName={bucketName}
                    bucketChangeHandler={handleBucketChange}
                />}
            />
        </BrowserRouter>
    );
};

export default withAuthenticator(App, false);