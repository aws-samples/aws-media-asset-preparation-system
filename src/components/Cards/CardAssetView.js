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
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import CardAsset from './CardAsset';
import { getBucketKey } from '../Utilities/FormatUtil';

const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
      margin: '20px'
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
}));

function CardAssetView(props) {
    const classes = useStyles();
    const { bucketName, filteredAssets, topLevelSelectedHandler, selectedMediaAssets } = props;

    const selectedAssetsHandler = (asset) => {
        topLevelSelectedHandler(asset);
    };

    const isSelected = (objKey) => {
        let selectedIndex = -1;
        if (selectedMediaAssets !== undefined ) {
            selectedIndex = selectedMediaAssets.findIndex((val) => {
                return val.key === objKey;
            });
            return selectedIndex !== -1;
        }
        return false;
    };

    return (
        <div className={classes.root}>
            <Grid container spacing={1}>
                {filteredAssets.map((asset) => {
                    const keyDisplayName = ((asset.bucketObjKey.includes('/')) ? asset.bucketObjKey.split('/').slice(-1)[0] : asset.bucketObjKey);
                    const { key } = getBucketKey(asset.bucketObjKey);

                    return (
                        <Grid item align="center" xs={2} key={asset.bucketObjKey}>
                            <CardAsset bucketName={bucketName} title={keyDisplayName} details={asset} key={asset.bucketObjKey} selected={isSelected(key)} selectedHandler={selectedAssetsHandler}/>
                        </Grid>
                    );
                })};
            </Grid>
        </div>
    );
};

export default CardAssetView;