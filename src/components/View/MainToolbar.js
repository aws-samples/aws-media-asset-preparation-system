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
import { Auth } from 'aws-amplify'

import { emphasize, makeStyles } from '@material-ui/core/styles'

import IconButton from '@material-ui/core/IconButton';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';

import logo from '../../media/media_small.png';

const useToolbarStyle = makeStyles({
    appBar: {
      backgroundColor: '#23252f',
    },

    textColor: {
        color: '#74b1be',
        fontWeight: 600
    },

    avatarColor: {
        backgroundColor: '#74b1be'
    },

    iconButtonSpacing: {
        marginRight: -10
    },
  
    breadcrumbs: {
      marginLeft: '10px',
      color: 'white'
    },
  
    breadcrumbLink: {
      backgroundColor: '#17a2b8',
      height: '20px',
      color: 'white',
  
      '&:hover, &:focus': {
        backgroundColor: '#177b8a',
      },
      '&:active': {
        //boxShadow: theme.shadows[1],
        backgroundColor: emphasize('#17a2b8', 0.08),
      }
    },
  
    currBreadcrumbLink: {
      backgroundColor: emphasize('#177b8a', 0.08),
      height: '20px',
      color: 'white',
    },
  
    rightToolbarControls: {
      marginLeft: 'auto',
      marginRight: -15,
      display: 'flex'
    }
});

function MainToolbar(props) {
    const classes = useToolbarStyle();
    const username = props.username;
    const userGroups = props.userGroups;

    // On-click Handlers //
    const handleProfileClick = () => {
        console.log('Clicked on Profile Icon');
    }

    const handleSignOut = () => {
        Auth.signOut()
        .then((data) => {
            localStorage.setItem('mapsSelectedPrefix', '');
        })
        .catch(err => console.log(err));
    };

    return (
        <AppBar className={classes.appBar} position='static'>
            <Toolbar>
                <img src={logo} alt="MAPS" style={{paddingRight: '10px'}}/>
                <Typography className={classes.textColor} variant="h6" noWrap>Media Asset Preparation System</Typography>

                <section className={classes.rightToolbarControls}>
                    <IconButton className={classes.iconButtonSpacing} onClick={handleProfileClick}>
                        <Avatar className={classes.avatarColor}>{username === undefined ? 'U' : username.toUpperCase().charAt(0)}</Avatar>
                    </IconButton>
                    <IconButton onClick={handleSignOut}>
                        <Avatar className={classes.avatarColor}>
                            <ExitToAppIcon style={{fill: 'white'}}/>
                        </Avatar>
                    </IconButton>
                </section>
            </Toolbar>
        </AppBar>
    );
};

export default MainToolbar;