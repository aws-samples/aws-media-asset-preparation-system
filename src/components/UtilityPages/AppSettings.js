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
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';

import MainToolbar from '../View/MainToolbar'
import EmptyToolbar from '../View/EmptyToolbar'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import { Alert, AlertTitle } from '@material-ui/lab';
import { ValidateBucket, SetMAPSBucket } from '../Utilities/APIInterface';
import { BootstrapInput } from '../Custom/CustomComponents';
import { setBucket, setPrefix } from '../../store/mapsconfig/mapsconfig';

const settingsStyle = makeStyles(theme => ({
    customButton : {
      marginBottom: '10px', 
      color: '#17a2b8',
      backgroundColor: 'transparent',
      border: '1px solid #17a2b8',
      '&:hover': {
        color: 'white',
        backgroundColor: '#17a2b8'
      },
      '&:disabled': {
        color: '#11707f',
        border: '1px solid #11707f'
      }
    },
    paper: {
        margin: theme.spacing(5),
        width: '50%'
    }
}));
  
function AppSettings(props) {
    const classes = settingsStyle();
    const currBucketName = useSelector(state => state.mapsConfig.bucket);
    const [localBucketName, setLocalBucketName] = useState(currBucketName);
    const dispatch = useDispatch();

    const [alertState, setAlertState] = useState({
        alertSev: 'error',
        alertMsg: 'Alert',
        alertTitle: 'Alert',
        showAlert: false
    });

    const handleAlertClose = () => {
        setAlertState({...alertState,
            showAlert: false,
            alertMsg: 'Alert'
        });
    };

    const saveSettingsHandler = () => {
        if (localBucketName !== '') {
            ValidateBucket(localBucketName)
            .then((response) => {
                const respBody = response.data.body;
                if (respBody['valid']) {
                    SetMAPSBucket(localBucketName)
                    .then((resp) => {
                        if (resp.data.body['success']) {
                            dispatch(setBucket(localBucketName));
                            dispatch(setPrefix(''));
                        } else {
                            console.log(resp.data.body);
                            console.log('error with setting bucket');
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                } else {
                    setAlertState({...alertState,
                        alertMsg: respBody['reason'],
                        showAlert: true
                    });
                }
            })
            .catch((err) => {
                console.log(err);
            });
        }
    };

    const updateBucketText = (event) => {
        if (event.target.value !== '') {
            setLocalBucketName(event.target.value);
        } else {
            setLocalBucketName(currBucketName);
        }
    };

    return (
        <>
            <MainToolbar props={props}/>
            <EmptyToolbar toolbarTitle='Settings' />
            <center>
                <Paper className={classes.paper}>
                    <Grid 
                        container 
                        style={{padding: '20px'}}
                        align="center"
                        justify="center"
                        direction="row"
                    >
                        <Grid item xs={4} style={{display: 'inline-grid', alignContent: 'center'}}>
                            <Typography variant='subtitle1'>Amazon S3 Bucket:</Typography>
                        </Grid>
                        <Grid item xs={4} >
                            <BootstrapInput id="bucketName" placeholder={currBucketName} onChange={updateBucketText} style={{width: '350px'}}/>
                        </Grid>

                    </Grid>

                    <Button onClick={saveSettingsHandler} className={classes.customButton} disabled={localBucketName === currBucketName}>
                        Save Settings
                    </Button>
                </Paper>
            </center>
            <Dialog
                open={alertState.showAlert}
                onClose={handleAlertClose}
            >
                <Alert severity={alertState.alertSev}>
                    <AlertTitle>{alertState.alertTitle}</AlertTitle>
                    {alertState.alertMsg}
                </Alert>
            </Dialog>
        </>
    );
};

export default AppSettings;