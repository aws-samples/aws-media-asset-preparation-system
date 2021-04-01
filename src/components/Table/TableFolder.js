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
import { emphasize, makeStyles } from '@material-ui/core/styles';

import Link from '@material-ui/core/Link';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import FolderIcon from '@material-ui/icons/Folder';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import PermissionsView from '../Utilities/PermissionsView';

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

function TableFolder(props) {
    const classes = useTableStyle();
    const userGroups = useSelector(state => state.userConfig.userGroups);
    const { folder, labelId, prefixHandler } = props;
    const [selected, setSelected] = useState(false);
    const [permissionOpen, setPermissionOpen] = useState(false);
    const [menuState, setContextMenuState] = useState({
        open: false,
        mouseX: null,
        mouseY: null
    });

    const handlePermissionsClose = () => {
        setPermissionOpen(false);
    };

    const handleClose = () => {
        setSelected(false);
        setContextMenuState({
            open: false,
            mouseX: null,
            mouseY: null
        });
    };

    const folderSelect = (event) => {
        event.preventDefault();
        
        if (event.target.id.includes('link')) {
            console.log('prefix change handler');
            prefixHandler(event, folder.objKey)
        }
    };

    const handleFolderRightClick = (event) => {
        event.preventDefault();
        if (userGroups.includes('admin')) {
            setSelected(true);
            setContextMenuState({
                open: true,
                mouseX: event.clientX - 2,
                mouseY: event.clientY - 4
            });
        }
    };

    const handlePermissionChange = () => {
        setPermissionOpen(true);
        handleClose();
    };

    const handleSavePermissions = (newPermissions) => {
        folder.permissions = newPermissions;
    };

    return (
        <>
            <TableRow
                hover
                onClick={event => folderSelect(event)}
                onContextMenu={((event) => {handleFolderRightClick(event)})}
                role="checkbox"
                aria-checked={false}
                tabIndex={-1}
                key={folder.objKey}
                selected={selected}
                className={classes.tableRow}
            >
                <TableCell padding="checkbox" align="center">
                    <FolderIcon style={{fill: '#17a2b8'}}/>
                </TableCell>
                <TableCell id={`${labelId}-0-cell`} align="left"><Link id={`${labelId}-link`} href={folder.objKey}>{folder.displayName}</Link></TableCell>
                <TableCell id={`${labelId}-1-cell`}align="left"></TableCell>
                <TableCell id={`${labelId}-2-cell`}align="left"></TableCell>
                <TableCell id={`${labelId}-3-cell`}align="left"></TableCell>
                <TableCell id={`${labelId}-4-cell`}align="left"></TableCell>
                <TableCell id={`${labelId}-5-cell`}align="left"></TableCell>
                <TableCell id={`${labelId}-6-cell`}align="left"></TableCell>
            </TableRow>
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
                <MenuItem onClick={handlePermissionChange}>Permissions</MenuItem>
            </Menu>
            <PermissionsView 
                folderName={folder.objKey} 
                open={permissionOpen} 
                permissions={folder.permissions} 
                closeHandler={handlePermissionsClose}
                savePermissionsHandler={handleSavePermissions} />
        </>
    );
};

export default TableFolder;