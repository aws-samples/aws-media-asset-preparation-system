import React from "react";
import Amplify from 'aws-amplify';
import ReactDOM from "react-dom";
import awsmobile from './aws-exports';
import "./index.css";
import App from './App';

import { Provider } from 'react-redux';
import { createStore } from 'redux';
import mapsStore from './store/store';

const maps = createStore(mapsStore);

Amplify.configure(awsmobile);

ReactDOM.render(
    <Provider store={maps}>
        <App />
    </Provider>,
    document.getElementById("root")
);