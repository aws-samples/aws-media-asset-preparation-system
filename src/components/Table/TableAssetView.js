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

import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

import 'moment-timezone';

import { getBucketKey } from '../Utilities/FormatUtil';
import TableAssetHeaderView from './TableAssetHeaderView';
import { stableSort, getComparator } from '../Utilities/TableSortUtil';

import TableAsset from './TableAsset';
import TableFolder from './TableFolder';

const useTableStyle = makeStyles(theme => ({
    tableRow: {
        "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: emphasize('#74b1be', 0.41),
        }
    },
    paper: {
        margin: theme.spacing(2)
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
      },
      tableRow: {
        "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: emphasize('#74b1be', 0.41),
        }
    }
}));

function TableAssetView(props) {
    const classes = useTableStyle();
    const { 
        bucketName,
        userGroups,
        allGroups,
        selectedPrefix,
        filterState,
        filteredAssets, 
        filterHandler, 
        topLevelSelectedHandler,
        unselectMediaHandler,
        selectAllHandler, 
        selectedMediaAssets, 
        mediaFolders, 
        prefixChangeHandler, 
        deleteFolderHandler,
        rightClickHandler
    } = props;
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // HANDLERS - ROW SELECTION //
    const handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';

        if (filterState['orderBy'] === property && filterState['order'] === 'desc') {
            order = 'asc';
        };

        let out = stableSort(filteredAssets, getComparator(order, orderBy))

        filterHandler(orderBy, order, out);
    };
    
    const handleSelectAllClick = event => {
        if (event.target.checked) {
            const newSelected = filteredAssets.map(n => n);
            selectAllHandler(newSelected);
        } else {
            unselectMediaHandler();
        }
    };

    // HANDLERS - PAGINATION //
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const selectedAssetsHandler = (asset, isFolder=false) => {
        topLevelSelectedHandler(asset, isFolder);
    };

    const localRightClickHandler = (event, asset, isFolder=false) => {
        rightClickHandler(event, asset, isFolder);
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

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredAssets.length + mediaFolders.length - page * rowsPerPage);

    return (
        <Paper className={classes.paper}>
            <TableContainer>
                <Table>
                    <TableAssetHeaderView
                        classes={classes}
                        numSelected={selectedMediaAssets.length === undefined ? 0 : selectedMediaAssets.length}
                        order={filterState['order']}
                        orderBy={filterState['orderBy']}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={filteredAssets.length}
                    />
                    <TableBody>
                    {mediaFolders
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((folder, index) => {
                            const labelId = `enhanced-table-checkbox-${index}`;
                            return (
                                <TableFolder bucketName={bucketName} key={folder.objKey} allGroups={allGroups} userGroups={userGroups} folder={folder} labelId={labelId} deleteHandler={deleteFolderHandler} prefixHandler={prefixChangeHandler} />
                            );
                    })}

                    {filteredAssets
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((asset, index) => {
                            const labelId = `enhanced-table-checkbox-${index}`;
                            const { key } = getBucketKey(asset.bucketObjKey);

                            return (
                                <TableAsset key={asset.bucketObjKey} asset={asset} labelId={labelId} selected={isSelected(key)} selectedHandler={selectedAssetsHandler} rightClickHandler={localRightClickHandler}/>
                            );
                        })}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 20 * emptyRows }}>
                                <TableCell colSpan={8} />
                            </TableRow>
                        )}
                    
                    </TableBody>
                </Table>
            </TableContainer>


            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 30]}
                component="div"
                count={filteredAssets.length + mediaFolders.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
            />
        </Paper>
    );

};

export default TableAssetView;