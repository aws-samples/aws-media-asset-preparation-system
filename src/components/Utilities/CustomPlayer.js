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
import { makeStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import ReactPlayer from 'react-player';
import { bytesToSize } from '../Utilities/FormatUtil';
import { formattedDuration } from '../Utilities/FormatUtil';

const useStyles = makeStyles((theme) => ({
    paper: { 
        minWidth: "800px",
        maxWidth: "md",
        backgroundColor: '#23252f'
    }
  }));

function CustomPlayer(props) {
    const classes = useStyles();
    const { title, details, videoUrl, closeHandler } = props;

    return (
        <Dialog 
            open={props.open}
            onClose={closeHandler}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            classes={{ paper: classes.paper}}
            >
            <DialogContent>
                <center>
                    <Typography wrap="nowrap" variant="h5" style={{color: 'white', marginBottom: '10px', fontSize: '100%', fontWeight: '600'}}>{title}</Typography>
                    <ReactPlayer url={videoUrl} playing controls={true} width={"100%"} height={"100%"}/>
                
                <Grid container spacing={1} style={{margin: '10px'}}>
                    <Grid item xs={12}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"Asset ID: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.assetId === undefined ? '' : details.assetId}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"Filename: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.bucketObjKey === undefined ? '' : details.bucketObjKey}</Typography>
                    </Grid>
                </Grid>
                
                <Grid container spacing={1} style={{margin: '10px'}}>
                    <Grid item xs={6}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"Video Duration: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.fileLength === undefined ? '' : formattedDuration(details.fileLength)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"File Format: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.fileFormat === undefined ? '' : details.fileFormat}</Typography>
                    </Grid>

                    <Grid item xs={6}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"Video Codec: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.videoCodec === undefined ? 'N/A' : details.videoCodec}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"Audio Codec: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.audioCodec === undefined ? 'N/A' : details.audioCodec}</Typography>
                    </Grid>

                    <Grid item xs={6}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"File Size: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.fileSize === undefined ? '' : bytesToSize(details.fileSize)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography wrap="nowrap" variant="body2" style={{color: '#74b1be', fontWeight: 'bold'}}>{"Video Frame Rate: "}</Typography>
                        <Typography wrap="nowrap" variant="body2" style={{color: 'white'}}>{details.frameRate === undefined ? 'N/A' : details.frameRate}</Typography>
                    </Grid>
                </Grid>
                </center>
            </DialogContent>
        </Dialog>
    );
};

export default CustomPlayer;