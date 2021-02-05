/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import React from 'react';

import { makeStyles } from '@material-ui/core/styles'
import { Link } from 'react-router-dom';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Typography from '@material-ui/core/Typography';

const useToolbarStyle = makeStyles({
    appBar: {
        backgroundColor: "#74b1be",
    },

    toolBar: {
        minHeight: "45px"
    },

    textColor: {
        color: 'white',
    },

    avatarStyle: {
        backgroundColor: '#2f3241',
        width: '32px',
        height: '32px'
    }

});

function EmptyToolbar(props) {
    const classes = useToolbarStyle();
    const { toolbarTitle } = props;

    return (
        <AppBar className={classes.appBar} position='static'>
            <Toolbar className={classes.toolBar}>
                <Link to="/">
                    <IconButton>
                        <Avatar className={classes.avatarStyle}>
                            <ArrowBackIcon style={{fill: 'white'}}/>
                        </Avatar>
                    </IconButton>
                </Link>

                <Typography className={classes.textColor} variant="h6" noWrap>{toolbarTitle}</Typography>

            </Toolbar>
        </AppBar>
    );
};

export default EmptyToolbar;