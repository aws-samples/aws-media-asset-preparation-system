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
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AudiotrackIcon from '@material-ui/icons/Audiotrack';
import Tooltip from '@material-ui/core/Tooltip';

import { GetObjectInfo } from '../Utilities/APIInterface';
import { getBucketKey, formattedDuration } from '../Utilities/FormatUtil';

import moment from 'moment';

import { CustomCheckbox } from '../Custom/CustomComponents';
import CustomPlayer from '../Utilities/CustomPlayer';

import react_logo from '../../media/logo192.png';

const useStyles = makeStyles((theme) => ({
    root: {
      maxWidth: "md",
      marginLeft: '5px',
      marginRight: '0px'
    },
    media: {
      height: 0,
      paddingTop: '56.25%', // 16:9
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    paper: { 
        minWidth: "800px",
        maxWidth: "md",
        backgroundColor: '#23252f'
    },
  }));

function CardAsset(props) {
    const classes = useStyles();
    const { title, details, selected, selectedHandler } = props;
    const [expanded, setExpanded] = useState(false);
    const [open, setOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState(
        sessionStorage.getItem(`${title}_jpg`) || react_logo
    );

    const handleClose = () => {
        setOpen(false);
    };

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const handleMediaClick = (event) => {
        if (details.hasOwnProperty('proxyLoc')) {
            if (details.proxyLoc !== null) {
                const { bucket, key } = getBucketKey(details.proxyLoc);
                GetObjectInfo(bucket, key)
                .then((response) => {
                    setOpen(true);
                    setVideoUrl(response.data.body.objUrl);
                })
                .catch((err) => {
                    console.log(err);
                });
            }
        } else {
            console.log('No proxy file yet');
        }
    };

    const handleCardSelect = (event) => {
        selectedHandler(details);
    }

    useEffect(() => {
        sessionStorage.setItem(`${title}_jpg`, thumbnailUrl);
    }, [thumbnailUrl]);

    // On-Load Functions //
    useEffect(() => {
        const tempImgLoc = sessionStorage.getItem(`${title}_jpg`);
        const params = new URLSearchParams(tempImgLoc);
        let expireDate = new Date();
        let expired = false;
        if (params.has('X-Amz-Date') && params.has("X-Amz-Expires")) {
            const reqDate = moment(params.get('X-Amz-Date')).format('YYYYMMDDTHHmmssZ');
            expireDate = moment(reqDate).add(params.get('X-Amz-Expires'), 's');
            const currDate = new Date();
            expired = moment(expireDate).diff(currDate, 'seconds') <= 0;
        }

        if (tempImgLoc === react_logo || expired) {
            if (details.hasOwnProperty('thumbnailLoc')) {
                if (details.thumbnailLoc !== null) {
                    const { bucket, key } = getBucketKey(details.thumbnailLoc);
                    GetObjectInfo(bucket, key)
                    .then((response) => {
                        setThumbnailUrl(response.data.body.objUrl);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                }
            }
        }
    }, []);

    return (
        <>
        <Card className={classes.root}>
        <CardHeader
          title={title}
          titleTypographyProps={{variant: 'subtitle1', style:{ textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '150px'}}}
        />
        <CardActionArea onClick={handleMediaClick}>
            <CardMedia
            className={classes.media}
            image={thumbnailUrl}
            title={title}
            />
        </CardActionArea>
        <CardActions disableSpacing>
            <CustomCheckbox checked={selected} onChange={handleCardSelect}/>
            {details.numAudioTracks > 0 ?
                <Tooltip title={`${details.numAudioTracks} Audio Track(s)`}>
                    <AudiotrackIcon />
                </Tooltip>
                :
                <></>
            }
            <IconButton
                className={clsx(classes.expand, {
                [classes.expandOpen]: expanded,
                })}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show more"
            >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Grid container spacing={1}>
                <Grid item xs={6}>{"Duration:"}</Grid>
                <Grid item xs={6}>{formattedDuration(details.fileLength)}</Grid>

                <Grid item xs={6}>{"File Format:"}</Grid>
                <Grid item xs={6}>{details.fileFormat === undefined ? 'N/A' : details.fileFormat}</Grid>

                <Grid item xs={6}>{"Video Codec:"}</Grid>
                <Grid item xs={6}>{details.videoCodec === undefined ? 'N/A' : details.videoCodec}</Grid>

                <Grid item xs={6}>{"Audio Codec:"}</Grid>
                <Grid item xs={6}>{details.audioCodec === undefined ? 'N/A' : details.audioCodec}</Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>
      <CustomPlayer title={title} details={details} videoUrl={videoUrl} closeHandler={handleClose} open={open} />
    </>
    );
};

CardAsset.propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      details: PropTypes.string,
    }),
  };
  
  CardAsset.defaultProps = {
    item: {
        title: 'Default Title',
        details: 'Default Details',
    },
};

export default CardAsset;