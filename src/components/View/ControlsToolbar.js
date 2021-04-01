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

import { emphasize, makeStyles } from '@material-ui/core/styles'
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import SettingsIcon from '@material-ui/icons/Settings';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import ViewListIcon from '@material-ui/icons/ViewList';
import { Link } from 'react-router-dom';

import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import * as assetAPI from '../Utilities/APIInterface';
import FilePicker from '../Utilities/FilePicker';
import FolderCreation from '../Utilities/FolderCreation';
import { BootstrapInput } from '../Custom/CustomComponents';

const useToolbarStyle = makeStyles({
    appBar: {
        backgroundColor: "#74b1be",
    },

    toolBar: {
        minHeight: "45px"
    },

    breadcrumbs: {
        marginLeft: '10px',
        color: 'white'
    },

    breadcrumbLink: {
        backgroundColor: '#17a2b8',
        height: '20px',
        color: 'white',
        fontWeight: 'bold',

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
        fontWeight: 'bold'
    },

    avatarStyle: {
        backgroundColor: '#2f3241',
        width: '32px',
        height: '32px'
    },

    leftToolbarControls: {
        display: "flex",
        alignItems:'center',
        width: '33%'
    },

    rightToolbarControls: {
        marginRight: 0,
        justifyContent: 'flex-end', 
        display: "flex",
        width: '34%'
    },

    centerToolbarControls: {
        display: 'flex',  
        justifyContent: 'center', 
        alignItems:'center',
        width: '33%'
    }
});

function ControlsToolbar(props) {
    const classes = useToolbarStyle();
    const [bucketHierarchy, setHierarchy] = useState([]);
    const [viewLayout, setViewLayout] = useState('table');
    const hierarchyLen = bucketHierarchy.length;
    const bucketName = useSelector(state => state.mapsConfig.bucket);
    const selectedPrefix = useSelector(state => state.mapsConfig.prefix);
    const userGroups = useSelector(state => state.userConfig.userGroups);
    const { 
        prefixChangeHandler, 
        viewLayoutChangeHandler, 
        selectedMediaAssets, 
        unselectAssetHandler, 
        alertHandler,
        folderHandler,
        searchHandler
    } = props;
    const [open, setOpen] = useState(false);
    const [folderOpen, setFolderOpen] = useState(false);
    const [folderSelected, isFolderSelected] = useState(false);

    const handleHierarchyChange = (event, prefix) => {
        event.preventDefault();
        const idx = bucketHierarchy.findIndex((val) => {
          return val.key === prefix;
        });
    
        if (idx > -1) {
          bucketHierarchy.splice(idx, hierarchyLen+1);
          setHierarchy(bucketHierarchy);
        } else {
          setHierarchy([]);
        }
        prefixChangeHandler(event, prefix);
      }
    
    useEffect(() => {
        let tempHierarchy = [];
        const subPrefix = selectedPrefix.split('/').slice(0, -1);
        let idx = 0;
        for (idx=0; idx<subPrefix.length; idx++) {
            var n = selectedPrefix.indexOf(subPrefix[idx]);
            var prefixObj = {
            "displayName": subPrefix[idx],
            "key": selectedPrefix.substr(0, n+subPrefix[idx].length+1)
            };
            tempHierarchy.push(prefixObj);
        }
        setHierarchy(tempHierarchy);
    }, [selectedPrefix]);

    // HANDLERS //
    const handleViewLayoutChange = (event, newViewLayout) => {
        setViewLayout(newViewLayout);
        viewLayoutChangeHandler(newViewLayout);
    };

    const handleCheckoutClick = () => {
        console.log('Handle file check out');
        const numSelected = selectedMediaAssets.length;
        if ( numSelected <= 0) {
            alertHandler('error', 'Error', ['No assets selected to download.']);
        } else {
            for (let i=0; i<numSelected; i++) {
                console.log(selectedMediaAssets[i]);
                assetAPI.CheckOutObjectRequest(bucketName, selectedMediaAssets[i].key, false, alertHandler);
            }
        }
        unselectAssetHandler();
    };
    
    const handleClose = () => {
        setOpen(false);
        unselectAssetHandler();
    };

    const handleFolderClose = () => {
        setFolderOpen(false);
    };

    const handleCheckinClick = (event) => {
        event.preventDefault();
        console.log('Handle file check in');
        setOpen(true);
    };

    const handleDeleteClick = () => {
        console.log('Handle delete click');
        const numSelected = selectedMediaAssets.length;
        console.log(numSelected);
        if ( numSelected <= 0) {
            alertHandler('error', 'Error', ['No assets selected to delete.']);
        } else {
            for (let i=0; i<numSelected; i++) {
                console.log(selectedMediaAssets[i]);
                assetAPI.DeleteObjectRequest(bucketName, selectedMediaAssets[i].key, alertHandler);
            }
        }
        unselectAssetHandler();
    };

    const handleNewFileClick = (event) => {
        event.preventDefault();
        console.log('Handle new file click');
        setOpen(true);
    };

    const handleNewFolderClick = (event) => {
        event.preventDefault();
        console.log('Handle new folder click');
        setFolderOpen(true);
    };

    const handleSearch = (event) => {
        searchHandler(event.target.value);
    };

    return (
        <>
        <AppBar className={classes.appBar} position='static'>
            <Toolbar className={classes.toolBar}>
                <section className={classes.leftToolbarControls}>
                    <ToggleButtonGroup
                        value={viewLayout}
                        exclusive
                        onChange={handleViewLayoutChange}
                        aria-label="text alignment"
                        style={{backgroundColor: "#ffffff"}}
                    >
                        <ToggleButton value="card" aria-label="left aligned">
                            <ViewModuleIcon />
                        </ToggleButton>
                        <ToggleButton value="table" aria-label="centered">
                            <ViewListIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>


                    <Breadcrumbs className={classes.breadcrumbs} maxItems={3} aria-label="breadcrumb">
                        <Chip className={classes.breadcrumbLink} href='/' label={bucketName} onClick={event => handleHierarchyChange(event, '')} style={{visibility: bucketName !== '' ? 'visible' : 'hidden'}} />
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
                </section>

                <section className={classes.centerToolbarControls}>
                    <BootstrapInput id="Search" placeholder={"Search"} onChange={handleSearch} style={{width: '500px', minWidth: '25vw'}}/>
                </section>

                <section className={classes.rightToolbarControls}>
                    <Tooltip title="Download">
                        <IconButton onClick={handleCheckoutClick} style={{display: folderSelected ? 'none' : 'inline'}}>
                            <Avatar className={classes.avatarStyle}>
                                <GetAppIcon style={{fill: 'white'}}/>
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                        <IconButton onClick={handleDeleteClick} style={{display: folderSelected ? 'none' : 'inline'}}>
                            <Avatar className={classes.avatarStyle}>
                                <DeleteIcon style={{fill: 'white'}}/>
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="New File">
                        <IconButton onClick={handleNewFileClick}>
                            <Avatar className={classes.avatarStyle}>
                                <AddIcon style={{fill: 'white'}}/>
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="New Folder">
                        <IconButton onClick={handleNewFolderClick}>
                            <Avatar className={classes.avatarStyle}>
                                <CreateNewFolderIcon style={{fill: 'white'}}/>
                            </Avatar>
                        </IconButton>
                    </Tooltip>


                    <Link to="/settings">
                        <Tooltip title="Settings">
                            <IconButton style={{display: userGroups.includes('admin') ? 'inline' : 'none'}}>
                                <Avatar className={classes.avatarStyle}>
                                    <SettingsIcon style={{fill: 'white'}}/>
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                    </Link>
                </section>
            </Toolbar>
        </AppBar>
        <FilePicker numSelected={selectedMediaAssets.length} selectedRows={selectedMediaAssets} alertHandler={alertHandler} open={open} closeHandler={handleClose}/>
        <FolderCreation alertHandler={alertHandler} open={folderOpen} closeHandler={handleFolderClose} newFolderHandler={folderHandler}/>
        </>
    );
};

export default ControlsToolbar;