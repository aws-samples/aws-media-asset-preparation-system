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
import { alpha, withStyles } from '@material-ui/core/styles';

import Checkbox from '@material-ui/core/Checkbox';
import InputBase from '@material-ui/core/InputBase';
import ListItem from '@material-ui/core/ListItem';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

const CustomCheckbox = withStyles({
    root: {
      color: '#23252f',
      '&$checked': {
        color: '#23252f',
      }
    },
    checked: {},
})((props) => <Checkbox color="default" {...props} />);

const CustomCheckboxLight = withStyles({
    root: {
      color: '#17a2b8',
      '&$checked': {
        color: '#17a2b8',
      }
    },
    checked: {},
})((props) => <Checkbox color="default" {...props} />);

const BootstrapInput = withStyles((theme) => ({
    input: {
      borderRadius: 5,
      position: 'relative',
      backgroundColor: theme.palette.common.white,
      border: '1px solid #ced4da',
      fontSize: 16,
      padding: '10px 12px',
      maxLength: 200,
      //margin: '10px',
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      '&:focus': {
        boxShadow: `${alpha('#17a2b8', 0.25)} 0 0 0 0.2rem`,
        borderColor: '#17a2b8',
      },
    }
  }))((props) => <InputBase {...props} />);

const StyledListItem = withStyles({
    root: {
        backgroundColor: "#23252f",
        color: 'white',
        "&.Mui-selected": {
            color: 'white',
            backgroundColor: '#17a2b8',
            '&:hover': {
                color: 'white',
                backgroundColor: '#17a2b8'
            }
        },
        '&:hover': {
            color: 'white',
            backgroundColor: '#17a2b8'
        }
    },
})((props) => <ListItem {...props} />);

function LinearProgressWithLabel(props) {
    
    return (
        <Grid container spacing={1}>
            <Grid item xs={11}>
                <LinearProgress variant="determinate" {...props} />
            </Grid>
            <Grid item xs={1}>
                <Typography variant="body1" style={{color: '#74b1be', fontWeight: 'bold'}}>{`${Math.round(
                props.value,
            )}%`}</Typography>
            </Grid>
        </Grid>
    );
}

export {
    CustomCheckboxLight,
    CustomCheckbox,
    BootstrapInput,
    StyledListItem,
    LinearProgressWithLabel
};