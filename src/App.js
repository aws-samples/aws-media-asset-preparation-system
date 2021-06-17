import Amplify from 'aws-amplify';
import { Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignIn } from 'aws-amplify-react';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import awsmobile from './aws-exports';
import { Route, BrowserRouter } from 'react-router-dom';

import MAPSMain from './components/Main/MAPSMain';
import AppSettings from './components/UtilityPages/AppSettings';
import { GetMAPSBucket } from './components/Utilities/APIInterface';
import { setBucket } from './store/mapsconfig/mapsconfig';
import { setUser, setUserGroups } from './store/user/user';

Amplify.configure(awsmobile);

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        async function ConfigureBucket() {
            const resp = await GetMAPSBucket();
            dispatch(setBucket((resp.data.body['bucket'])));
        }

        ConfigureBucket();
    }, []);

    useEffect(() => {
        async function ConfigureUserInfo() {
            const user = await Auth.currentAuthenticatedUser();
            dispatch(setUser(user.username));
            dispatch(setUserGroups(user.signInUserSession.accessToken.payload["cognito:groups"]));
        }

        ConfigureUserInfo();
    }, []);

    return user ? (
        <BrowserRouter>
            <Route
                exact
                path={'/'}
                component={() => <MAPSMain />}
            />
            <Route
                exact
                path={'/settings'}
                component={() => <AppSettings />}
            />
        </BrowserRouter>
    ) : (
        <AmplifyAuthenticator >
            <AmplifySignIn slot="sign-in" hideSignUp={true} />
        </AmplifyAuthenticator>
    );
};

export default App;
