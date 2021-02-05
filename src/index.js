import React from "react";
import Amplify from 'aws-amplify';
import ReactDOM from "react-dom";
import awsmobile from './aws-exports';
import "./index.css";

import App from './App'

Amplify.configure(awsmobile);

ReactDOM.render(
    <App />,
  document.getElementById("root")
);
