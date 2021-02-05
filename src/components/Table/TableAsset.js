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
import { emphasize, makeStyles } from '@material-ui/core/styles';

import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

import Moment from 'react-moment';
import 'moment-timezone';

import { CustomCheckbox } from '../Custom/CustomComponents';
import { getBucketKey, bytesToSize } from '../Utilities/FormatUtil';
import { GetObjectInfo } from '../Utilities/APIInterface';
import useClickPreventionOnDoubleClick from '../Utilities/CancellablePromise';
import CustomPlayer from '../Utilities/CustomPlayer';

const useTableStyle = makeStyles(theme => ({
    tableRow: {
        "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: emphasize('#74b1be', 0.41),
        }
    },
    paper: { 
        minWidth: "800px",
        maxWidth: "md",
        backgroundColor: '#23252f'
    }
}));

function TableAsset(props) {
    const classes = useTableStyle();
    const { asset, labelId, selected, selectedHandler, rightClickHandler } = props;
    const keyDisplayName = ((asset.bucketObjKey.includes('/')) ? asset.bucketObjKey.split('/').slice(-1)[0] : asset.bucketObjKey);
    const { key } = getBucketKey(asset.bucketObjKey);
    const [open, setOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    const handleRowSelect = () => {
        selectedHandler(asset);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleMediaClick = (event) => {
        console.log('Handle Media Click');
        if (asset.hasOwnProperty('proxyLoc')) {
            const { bucket, key } = getBucketKey(asset.proxyLoc);
            GetObjectInfo(bucket, key)
            .then((response) => {
                setOpen(true);
                setVideoUrl(response.data.body.objUrl);
            })
            .catch((err) => {
                console.log(err);
            });
        } else {
            console.log('No proxy file yet');
        }
    };

    const RowComponent = ({onClick, onDoubleClick}) => {
        const [handleClick, handleDoubleClick] = useClickPreventionOnDoubleClick(onClick, onDoubleClick);
        return (
            <TableRow
                hover
                onDoubleClick={handleDoubleClick}
                onClick={handleClick}
                onContextMenu={((event) => {rightClickHandler(event, asset, false)})}
                role="checkbox"
                aria-checked={selected}
                tabIndex={-1}
                key={key}
                selected={selected}
                className={classes.tableRow}
            >
                <TableCell padding="checkbox" align="left">
                    <CustomCheckbox
                        checked={selected}
                        inputProps={{ 'aria-labelledby': labelId }}
                    />
                </TableCell> 
            
                <TableCell id={labelId} align="left">{keyDisplayName}</TableCell>
                <TableCell align="left">{asset.assetId}</TableCell>
                <TableCell align="left">{asset.fileFormat}</TableCell>
                <TableCell align="left">{asset.fileStatus}</TableCell>
                <TableCell align="left"><Moment fromNow ago tz='UTC'>{new Date(asset.creationDate)}</Moment> ago</TableCell>
                <TableCell align="left"><Moment fromNow ago tz='UTC'>{new Date(asset.lastModifiedDate)}</Moment> ago</TableCell>
                <TableCell align="left">{bytesToSize(asset.fileSize)}</TableCell>
            </TableRow>
        );
    }

    return (
        <>
            <RowComponent onClick={handleRowSelect} onDoubleClick={handleMediaClick} />
            <CustomPlayer title={keyDisplayName} details={asset} videoUrl={videoUrl} closeHandler={handleClose} open={open} />
        </>
    );
};

export default TableAsset;