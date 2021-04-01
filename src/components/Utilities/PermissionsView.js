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
import Amplify from 'aws-amplify';
import awsmobile from '../../aws-exports';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import { CustomCheckboxLight } from '../Custom/CustomComponents';
import { UpdateFolderPermissions } from './APIInterface';

Amplify.configure(awsmobile);

const useStyles = makeStyles((theme) => ({
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
      },
      formControl: {
        margin: theme.spacing(3),
      }
  }));

function PermissionsView(props) {
    const classes = useStyles();
    const bucketName = useSelector(state => state.mapsConfig.bucket);
    const allGroups = useSelector(state => state.userConfig.allGroups);
    const [folderPermissions, setFolderPermissions] = useState(props.permissions);
    const { folderName, closeHandler, savePermissionsHandler } = props;
    
    const handleClose = () => {
        setFolderPermissions(props.permissions);
        closeHandler();
    };

    const handleSavePermissions = () => {
        UpdateFolderPermissions(bucketName, folderName, folderPermissions)
        .then((res) => {
            if (res.data.body['success']) {
                setFolderPermissions(folderPermissions);
                closeHandler();
            }
        })
        .catch((err) => {
            console.log('error', err);
            setFolderPermissions(props.permissions);
        });
    };

    const handleCheckboxSelect = (event) => {
        let selectedIndex = -1;
        let permissionVal = event.target.value;

        selectedIndex = folderPermissions.findIndex((val) => {
            return val === permissionVal;
        });

        if (selectedIndex === -1) {
            setFolderPermissions([...folderPermissions, permissionVal])
        } else {
            setFolderPermissions(folderPermissions.filter((item)=>(item !== permissionVal)))
        }
    };

    return (
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
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend" style={{color: 'white'}}>Assign Permissions</FormLabel>
                    <FormGroup>
                        {allGroups.map((group, index) => {
                            let checked = folderPermissions.includes(group);
                            return (
                                <FormControlLabel
                                    key={index}
                                    style={{color: 'white'}}
                                    control={<CustomCheckboxLight
                                        value={group}
                                        checked={checked}
                                        inputProps={{ 'aria-labelledby': index }}
                                        onChange={handleCheckboxSelect} />}
                                    label={group}
                                />
                            );
                        })}
                    </FormGroup>
                </FormControl>
                <center>
                    <Button variant='outlined' onClick={handleSavePermissions} className={classes.customButton}>{'Save'}</Button>
                </center>
            </DialogContent>
        </Dialog>
    );
};

export default PermissionsView;