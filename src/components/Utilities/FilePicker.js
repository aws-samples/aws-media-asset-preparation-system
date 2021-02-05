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
import { Auth } from 'aws-amplify';
import awsmobile from '../../aws-exports';

import Fade from '@material-ui/core/Fade';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles';

import { UploadObjRequest } from './APIInterface';
import { LinearProgressWithLabel } from '../Custom/CustomComponents';

const useStyles = makeStyles({
  createJobRoot: {
      display: 'inline',
  },
  hide: {
      display: 'none',
      opacity: "0",
  },
  dropZone : {
      border: '3px dashed white',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'white',
      padding: '2em',
      height: '20vh',
      position: 'sticky',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    dropZoneShift : {
      border: '3px dashed grey',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontSize: '20px',
      fontWeight: 'bold',
      padding: '2em',
      height: '20vh',
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
      width: '100px',
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

function FilePicker(props) {
  const classes = useStyles();
  const [fileName, setFileName] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [inProgress, setInProgress] = useState(false);
  const [fileLabel, setFileLabel] = useState('No File Selected');
  const [uploadPercent, setUploadPercent] = useState(0);
  const { bucketName, selectedPrefix, numSelected, selectedRows, alertHandler, closeHandler } = props;

  const handleClose = () => {
    if (!inProgress) {
      setFileLabel('No File Selected')
      setFileName(null);
      setNewFile(null);
      setUploadPercent(0);
    }
    closeHandler();
  };

  const handleFileInputClick = (event) => {
    document.getElementById('hiddenFileInput').click();
  };

  const startUpload = () => {
      setInProgress(true);
      setTimeout(handleUpload, 2000);
  };

  const handleFileSelection = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file !== null) {
      setNewFile(file);
      const cleanFileName = file.name.replace(/[&\/\\#, +()$~%'":*?!<>{}]/g, '_'); 
      setFileName(cleanFileName);
      setFileLabel(cleanFileName);
    }
  };

  const uploadObject = () => {
    Auth.currentUserCredentials()
    .then((response) => {
        AWS.config.credentials = response;
        AWS.config.region = awsmobile['aws_cognito_region'];

        var upload = new AWS.S3.ManagedUpload({
            params: {
                Bucket: bucketName,
                Key: `${selectedPrefix}${fileName}`,
                Body: newFile
            }
        });

        upload.on('httpUploadProgress', (event) => {
            setUploadPercent(event.loaded * 100 / event.total);
        });

        upload.promise()
        .then((response) => {
            closeHandler();
            setInProgress(false);
            setFileLabel('No File Selected');
            setFileName(null);
            setNewFile(null);
        })
        .catch((uploadError) => {
            console.log('Upload error', uploadError);
        });
    })
    .catch((err) => {
        console.log('Auth error', err);
    });
  }

  const handleUpload = () => {
    let fileName = newFile.name;
    let version = -1;

    fileName = selectedPrefix+fileName; 

    UploadObjRequest(bucketName, fileName, version)
      .then((response) => {
          if (response.data.body['allowCheckIn']) {
              uploadObject();
          } else {
            alertHandler('error', 'Error', [response.data.body['reason']]);
            closeHandler();
            setInProgress(false);
            setFileLabel('No File Selected');
            setFileName(null);
            setNewFile(null);
          }
      })
      .catch((error) => {
        console.log(error);
        alertHandler('error', 'Error', ['There was an error uploading your file.  Please try again.']);
      });
  };

  return (
    <>
      <Dialog
        open={props.open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth='md'
        fullWidth={true}
        PaperProps={{ style: { backgroundColor: "#343a40", elevation: "3", overflowY: 'inherit' } }}
      >
        <DialogContent>
          <div className={clsx({[classes.loading]: inProgress})}>
            <Fade in={inProgress} timeout={{enter: 500}}>
                    <div className={clsx({[classes.hide]: !inProgress})}>
                        <LinearProgressWithLabel className={clsx({[classes.hide]: !inProgress}, {[classes.loadingBar]: inProgress})} value={uploadPercent}/>
                        <span className={clsx(classes.span)}>
                            Uploading <strong style={{color: "#17a2b8"}}>{fileName}</strong>
                        </span>
                    </div>
            </Fade>
            </div>
            <center>
              <div className={clsx(classes.createJobRoot, {[classes.hide]: inProgress})}>
                <Button variant="contained" className={classes.customButton} onClick={handleFileInputClick}>Browse</Button>
                <label style={{marginBottom: '10px', marginLeft: '10px', marginRight: '10px', color: 'white', fontsize: '20px'}} className='fileText'>{fileLabel}</label>
                <input
                  type="file"
                  id="hiddenFileInput"
                  onChange={handleFileSelection}
                  accept=".cmaf, .dash, .hls, .mp4, .f4v, .mxf, .mov, .ismv, .raw, .av1, .avc, .hevc, .mpeg-2, .avi, .mkv, .webm"
                  style={{display: 'none'}}
                />
              </div>
              <br/>
            </center>
        </DialogContent>

        <center>
          <Button variant='outlined' onClick={startUpload} disabled={fileName === null} className={classes.customButton} style={{display: inProgress ? 'none' : 'inline'}}>
              Upload
          </Button>
        </center>
      </Dialog>
  </>
  );
}

export default FilePicker; 
