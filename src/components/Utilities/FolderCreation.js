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
import clsx from 'clsx';
import AWS from 'aws-sdk';
import awsmobile from '../../aws-exports';
import { makeStyles } from '@material-ui/core/styles';
import Amplify, { Auth } from 'aws-amplify';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { BootstrapInput } from '../Custom/CustomComponents';
import { CreateFolder } from '../Utilities/APIInterface';

Amplify.configure(awsmobile);

const useStyles = makeStyles({
    createJobRoot: {
        display: 'inline',
    },
    hide: {
        display: 'none',
        opacity: "0",
    },
      textFields: {
        paddingTop: "1em",
        marginBottom: "10em",
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '60vw',
        height: '40vh',
        display: 'block'
      },
      textFieldsShift: {
        width: 'calc(60vw-20vw)',
      },
      textField : {
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '50%',
        padding: '5px',
        color: '#232F3E',
        '& focused': {
            border: '3px solid #4A90E2'
        },
        '& label.Mui-focused': {
            color: '#232F3E',
        },
      },
      loading : {
        marginTop: "20px",
        marginBottom: "20px",
        textAlign: "center",
      },
      loadingBar : {
        marginBottom: "20px",
        position: "relative",
        marginLeft: "10px",
        marginRight: "10px",
        transition: "2s",
      },
      span : {
        display: "inline",
        marginTop: "1em",
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white'
      },
      customButton : {
        marginBottom: '10px', 
        width: '200px',
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
      }
  });

function FolderCreation(props) {
    const classes = useStyles();
    const [folderName, setFolderName] = useState('');
    const { bucketName, selectedPrefix, username, userGroups, alertHandler, closeHandler, newFolderHandler } = props;

    const handleClose = () => {
        setFolderName('');
        closeHandler();
    };

    const handleFolderName = (event) => {
        setFolderName(event.target.value);
    };

    const handleCreateFolder = () => {
        console.log('Handle create folder');
        CreateFolder(bucketName, `${selectedPrefix}${folderName}/`)
        .then((response) => {
            Auth.currentUserCredentials()
            .then((credentials) => {
                AWS.config.credentials = credentials;
                AWS.config.region = awsmobile['aws_cognito_region'];
                const obj = response['data']['body'];
                if (obj['allowCreation']) {
                    var s3 = new AWS.S3();
                    var params = {
                        Bucket: bucketName, 
                        Key: `${selectedPrefix}${folderName}/`,
                        Metadata: {
                            'owner': username
                        }
                    };
                    
                    var putPromise = s3.putObject(params);
                    putPromise.promise()
                    .then((resp) => {
                        const permissionGroups = !userGroups.includes('admin') ? userGroups.push('admin') : userGroups;
                        const folderObj = {
                            displayName: folderName,
                            objKey: `${selectedPrefix}${folderName}/`,
                            permissions: permissionGroups
                        }
                        newFolderHandler(folderObj);
                        handleClose();
                    })
                    .catch((err) => {
                        handleClose();
                    });
                } else {
                    alertHandler('error', 'Error', [obj['reason']]);
                }
            })
            .catch((credError) => {
                console.log(credError);
                handleClose();
            });
        })
        .catch((error) => {
            console.log(error);
        });
    };

    return (
        <>
            <Dialog
                open={props.open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth='sm'
                fullWidth={true}
                PaperProps={{ style: { backgroundColor: "#343a40", elevation: "3", overflowY: 'inherit' } }}
            >
                <DialogContent>
                    <center>
                    <div className={clsx(classes.createJobRoot)}>
                        <label style={{marginBottom: '10px', marginLeft: '10px', marginRight: '10px', color: 'white', fontsize: '20px'}} className='fileText'>Folder Name:</label>
                        <BootstrapInput id="folderName" multiline rowsMax={4} onChange={handleFolderName}/>
                    </div>
                    </center>
                </DialogContent>

                <center>
                <Button variant='outlined' onClick={handleCreateFolder} disabled={folderName === null} className={classes.customButton}>
                    Create Folder
                </Button>
                </center>
            </Dialog>
        </>
    );
};

export default FolderCreation;