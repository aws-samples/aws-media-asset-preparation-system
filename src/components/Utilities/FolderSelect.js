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
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles, emphasize } from '@material-ui/core/styles';

import List from '@material-ui/core/List';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FolderIcon from '@material-ui/icons/Folder';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';

import { GetBucketFolders } from './APIInterface';
import { StyledListItem } from '../Custom/CustomComponents';

const useStyles = makeStyles((theme) => ({
    paper: {
      position: 'absolute',
      width: '300px',
      backgroundColor: theme.palette.background.paper,
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
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
        backgroundColor: emphasize('#17a2b8', 0.08),
      }
    },
    currBreadcrumbLink: {
      backgroundColor: emphasize('#177b8a', 0.08),
      height: '20px',
      color: 'white',
    },
    customIcon : {
      fill: '#17a2b8',
      fontSize: '2.5rem',
      padding: '0px'
    },
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
      }
  }));

function FolderSelect(props) {
    const classes = useStyles();
    const bucketName = useSelector(state => state.mapsConfig.bucket);
    const { closeHandler, moveFilesHandler, numSelected } = props;
    const [localPrefix, setLocalPrefix] = useState('');
    const [localFolders, setLocalFolders] = useState([]);
    const [bucketHierarchy, setHierarchy] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');
    const hierarchyLen = bucketHierarchy.length;

    const localMoveFileHandler = () => {
        moveFilesHandler(localPrefix);
        localCloseHandler();
    };

    const localCloseHandler = () => {
        setSelectedFolder('');
        setLocalPrefix('');
        setLocalFolders([]);
        setHierarchy([]);
        closeHandler();
    };

    async function listBucketFolders(objKey) {
        const folderResult = await GetBucketFolders(bucketName, '', objKey);
        if (folderResult.data.body.Folders.length === 0) {
            const idx = localFolders.findIndex((val) => {
                return val.objKey === objKey;
            });

            if (idx > -1) {
                setSelectedFolder(localFolders[idx]['objKey']);
            };
        } else {
            setLocalFolders(folderResult.data.body.Folders);
        }
    };

    useEffect(() => {
        if (bucketName !== '') {
            listBucketFolders('');
        }
    }, [props.open]);

    const handleHierarchyChange = (event, objKey) => {
        event.preventDefault();
        const idx = bucketHierarchy.findIndex((val) => {
          return val.key === localPrefix;
        });
    
        if (idx > -1) {
          bucketHierarchy.splice(idx, hierarchyLen+1);
          setHierarchy(bucketHierarchy);
        } else {
          setHierarchy([]);
        }

        setSelectedFolder('');
        setLocalPrefix(objKey);
        listBucketFolders(objKey);
    }
    
    useEffect(() => {
        let tempHierarchy = [];
        const subPrefix = localPrefix.split('/').slice(0, -1);
        let idx = 0;
        for (idx=0; idx<subPrefix.length; idx++) {
          var n = localPrefix.indexOf(subPrefix[idx]);
          var prefixObj = {
            "displayName": subPrefix[idx],
            "key": localPrefix.substr(0, n+subPrefix[idx].length+1)
          };
          tempHierarchy.push(prefixObj);
        }
        setHierarchy(tempHierarchy);
      }, [localPrefix]);
    
    return (
        <Dialog
            open={props.open}
            onClose={localCloseHandler}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth='sm'
            fullWidth={true}
            PaperProps={{ style: { backgroundColor: "#23252f", elevation: "3", overflowY: 'inherit' } }}
        >
            <DialogContent>
                <Breadcrumbs className={classes.breadcrumbs} maxItems={3} aria-label="breadcrumb">
                    <Chip className={classes.breadcrumbLink} href='/' label={bucketName} onClick={event => handleHierarchyChange(event, '')} />
                    {bucketHierarchy.map((prefix, index) => {
                        if (hierarchyLen === index + 1) {
                        return (
                            <Chip className={classes.currBreadcrumbLink} href={prefix.key} label={prefix.displayName} key={prefix.key} />
                        )
                        } else {
                        return (
                            <Chip className={classes.breadcrumbLink} href={prefix.key} label={prefix.displayName} key={prefix.key} onClick={event => handleHierarchyChange(event, prefix.key)} />
                        );
                        }
                    })}
                    </Breadcrumbs>
                <List dense={true}>
                {
                    localFolders.map((item, index) => {
                    return (
                        <StyledListItem button style={{paddingLeft: '40px'}} key={item.objKey} onClick={(event) => handleHierarchyChange(event, item.objKey)} selected={selectedFolder === item.objKey ? true : false}>
                            <ListItemIcon>
                                <FolderIcon style={{fill: 'white'}}/>
                            </ListItemIcon>
                            <ListItemText
                                primary={item.displayName}
                            />
                        </StyledListItem>
                    )
                    })
                }
                </List>
                <center>
                    <Button variant='outlined' onClick={localMoveFileHandler} className={classes.customButton} >
                        {localPrefix === '' ? `Move ${numSelected} Asset(s) to /` : `Move ${numSelected} Asset(s) to ${localPrefix}`}
                    </Button>
                </center>
            </DialogContent>
        </Dialog>
    );
};

export default FolderSelect;