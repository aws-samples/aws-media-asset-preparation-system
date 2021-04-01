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
import { useSelector } from 'react-redux';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import FolderSelect from '../Utilities/FolderSelect';
import { RenameMoveObjRequest, MoveToFsxRequest } from '../Utilities/APIInterface';
  
function ContextMenu(props) {
    const bucketName = useSelector(state => state.mapsConfig.bucket);
    const [folderSelectOpen, setFolderSelectOpen] = useState(false);
    const { menuState, closeHandler, selectedAssets, unselectAssetHandler, alertHandler } = props;

    const handleClose = () => {
        closeHandler();
        if (!folderSelectOpen) {
            unselectAssetHandler();
        }
    };

    const handleFolderSelectClose = () => {
        setFolderSelectOpen(false);
        unselectAssetHandler();
    };

    const openFolderSelectionWindow = () => {
        setFolderSelectOpen(true);
        closeHandler();
    };

    const moveFilesHandler = (newPrefix) => {
        console.log(selectedAssets);
        console.log("New Prefix: ", newPrefix);
        RenameMoveObjRequest(bucketName, selectedAssets, newPrefix, alertHandler);
        handleFolderSelectClose();
    };

    const moveToFsx = () => {
        console.log('Move to Fsx');
        MoveToFsxRequest(bucketName, selectedAssets, alertHandler, 'fsx');
        closeHandler();
        unselectAssetHandler();
    };

    const removeFromFsx = () => {
        MoveToFsxRequest(bucketName, selectedAssets, alertHandler, 'remove_fsx');
        closeHandler();
        unselectAssetHandler();
    };

    return (
        <>
        <Menu
            keepMounted
            open={menuState['open']}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
                menuState.mouseY !== null && menuState.mouseX !== null
                  ? { top: menuState.mouseY, left: menuState.mouseX }
                  : undefined
              }
        >
            <MenuItem onClick={handleClose} disabled={true}>Rename</MenuItem>
            <MenuItem onClick={openFolderSelectionWindow}>Move To Folder</MenuItem>
            <MenuItem onClick={moveToFsx}>Copy To FSx</MenuItem>
            <MenuItem onClick={removeFromFsx}>Remove From FSx</MenuItem>
        </Menu>
        <FolderSelect closeHandler={handleFolderSelectClose} open={folderSelectOpen} moveFilesHandler={moveFilesHandler} numSelected={selectedAssets.length}/>
        </>
    );
};

export default ContextMenu;