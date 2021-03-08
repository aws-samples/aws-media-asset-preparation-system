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
import React, { useState, useEffect, useReducer } from 'react';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import MainToolbar from './MainToolbar';
import ControlsToolbar from './ControlsToolbar';
import TableAssetView from '../Table/TableAssetView';
import CardAssetView from '../Cards/CardAssetView';

import { Alert, AlertTitle } from '@material-ui/lab';
import Dialog from '@material-ui/core/Dialog';

import { listMapsAssets } from '../../graphql/queries';
import { onCreateMapsAssets, onUpdateMapsAssets, onDeleteMapsAssets } from '../../graphql/subscriptions';
import { getBucketKey } from '../Utilities/FormatUtil';
import { GetBucketFolders, GetUserGroups } from '../Utilities/APIInterface';
import { stableSort, getComparator } from '../Utilities/TableSortUtil';

import ContextMenu from '../Utilities/ContextMenu';

export default function MainAssetViewer(props) {
    const { bucketName } = props;
    const [alertState, setAlertState] = useState({
        severity: 'error',
        title: 'Error',
        msg: [],
        show: false
    });
    const [selectedMediaAssets, setSelected] = useState([]);
    const [mediaAssets, setMediaAssets] = useState([]);
    const [nextToken, setNextToken] = useState(undefined);
    const [filteredAssets, setFilteredAssets] = useState([]);

    const [bucketFolders, setBucketFolders] = useState([]);
    const [contextMenuState, setContextMenuState] = useState({
        open: false,
        mouseX: null,
        mouseY: null
    });
    const [selectedPrefix, setSelectedPrefix] = useState(
        localStorage.getItem('MapsSelectedPrefix') || ''
    );
    const [viewLayout, setViewLayout] = useState('table');
    const [filteringState, setFilteringState] = useState({
        order: 'desc',
        orderBy: 'lastModifiedDate',
        searchTerm: ''
    });

    const [username, setUsername] = useState('');
    const [userGroups, setUserGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const paginationLimit = 500;

    useEffect(() => {
        localStorage.setItem('MapsSelectedPrefix', selectedPrefix);
    }, [selectedPrefix]);

    useEffect(() => {
        localStorage.setItem('viewLayout', viewLayout);
    }, [viewLayout]);

    // HANDLERS //
    const handlePrefixChange = (event, folderKey) => {
        event.preventDefault();
        setSelectedPrefix(folderKey);
        unselectMediaAssetsHandler();
    };

    const handleViewLayoutChange = (view) => {
        setViewLayout(view);
        unselectMediaAssetsHandler();
    };

    const selectAllHandler = (assets) => {
        let key = -1;
        let selectAll = [];
        assets.forEach(function(asset) {
            key = getBucketKey(asset.bucketObjKey).key;
            selectAll.push({key: key})
        });
        setSelected(selectAll);
    };

    const selectedAssetHandler = (asset, isFolder=false) => {
        let selectedIndex = -1;
        let key = -1;
        if (isFolder) {
            key = asset.objKey;
        } else {
            key = getBucketKey(asset.bucketObjKey).key;
        }

        selectedIndex = selectedMediaAssets.findIndex((val) => {
            return val.key === key;
        });

        if (selectedIndex === -1) {
            setSelected([...selectedMediaAssets, {key: key}])
        } else {
            setSelected(selectedMediaAssets.filter((item)=>(item.key !== key)))
        }
    };

    const unselectMediaAssetsHandler = () => {
        setSelected(selectedMediaAssets.filter(()=>(false)));
    };

    const handleAlertClose = () => {
        setAlertState({show: false, msg: []});
    };

    const mainAlertHandler = (alertSev, alertTitle, alertMsg) => {
        setAlertState({
            severity: alertSev,
            title: alertTitle,
            msg: alertMsg,
            show: true
        });
        unselectMediaAssetsHandler();
    };

    const updateFolderHandler = (folderObj) => {
        setBucketFolders([...bucketFolders, folderObj]);

    };

    const deleteFolderHandler = (folderName) => {
        setBucketFolders(bucketFolders.filter((item)=>(item.objKey !== folderName)))
    };

    const handleRightClickMenu = (event, asset, isFolder=false) => {
        event.preventDefault();
        
        let key = -1;
        if (isFolder) {
            key = asset.objKey;
        } else {
            key = getBucketKey(asset.bucketObjKey).key;
        }

        // If asset that was right clicked is not selected, select it
        let selectedIndex = -1;
        selectedIndex = selectedMediaAssets.findIndex((val) => {
            return val.key === key;
        });

        if (selectedIndex === -1) {
            setSelected([...selectedMediaAssets, {key: key}])
        }

        setContextMenuState({
            open: true,
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4
        });
    };

    const rightClickCloseHandler = () => {
        setContextMenuState({
            open: false,
            mouseX: null,
            mouseY: null
        });
    };

    const assetFilterHandler = (orderBy, order, data) => {
        applySearchFilter(data, filteringState['searchTerm']);
        setFilteringState({...filteringState, order: order, orderBy: orderBy});
    };

    const searchHandler = (searchTerm) => {
        applyFilters(mediaAssets, undefined, undefined, searchTerm);
        setFilteringState({...filteringState, [searchTerm]: searchTerm});
    };

    const applyFilters = (data, newOrderBy, newOrder, newSearchTerm) => {
        const order = newOrder === undefined ? filteringState['order'] : newOrder;
        const orderBy = newOrderBy === undefined ? filteringState['orderBy'] : newOrderBy;
        const searchTerm = newSearchTerm === undefined ? filteringState['searchTerm'] : newSearchTerm;

        let filterData = stableSort(data, getComparator(order, orderBy));

        if (searchTerm !== '') {
            return applySearchFilter(filterData, searchTerm);
        }

        setFilteredAssets(filterData);
    };

    const applySearchFilter = (data, searchTerm) => {
        const crawl = (asset, allValues) => {
            if (!allValues) allValues = [];
            for (var key in asset) {
              if (typeof asset[key] === "object") crawl(asset[key], allValues);
              else allValues.push(asset[key] + " ");
            }
            return allValues;
        };

        const searchInd = data.map(asset => {
            const allValues = crawl(asset);
            return { allValues: allValues.toString() };
        });

        if (searchTerm !== '') {
            const reqData = searchInd.map((asset, index) => {
              if (asset.allValues.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0)
                return data[index];
              return null;
            });

            setFilteredAssets(
              reqData.filter(asset => {
                if (asset) return true;
                return false;
              })
            );
          } else setFilteredAssets(data);
    };

    // Pull media assets here to pass down to view layouts //
    useEffect(() => {
        async function listBucketFolders() {
            const folderResult = await GetBucketFolders(bucketName, '', selectedPrefix);
            setBucketFolders(folderResult.data.body.Folders);
        };

        async function listMediaAssets() {
            const tempPrefix = selectedPrefix === '' ? '/' : selectedPrefix;
            const filter = {
                'prefixLoc': {
                    eq: tempPrefix
                },
                'bucketObjKey': {
                    contains: bucketName
                }
            };

            let assets = await API.graphql(graphqlOperation(listMapsAssets, {filter: filter, limit: paginationLimit}));
            let nextNewToken = assets.data.listMAPSAssets.nextToken;
            setMediaAssets(assets.data.listMAPSAssets.items);
            applyFilters(assets.data.listMAPSAssets.items, undefined, undefined, undefined);
            if (nextNewToken !== null) {
                setNextToken(nextNewToken);
            }
        };

        // Only pull assets if a bucket has been selected
        if (bucketName !== '') {
            listBucketFolders();
            listMediaAssets();
        }
    }, [bucketName, selectedPrefix]);

    useEffect(() => {
        async function paginateAssets() {
            if (bucketName !== '') {
                const tempPrefix = selectedPrefix === '' ? '/' : selectedPrefix;
                const filter = {
                    'prefixLoc': {
                        eq: tempPrefix
                    },
                    'bucketObjKey': {
                        contains: bucketName
                    }
                };

                let assets = await API.graphql(graphqlOperation(listMapsAssets, {filter: filter, limit: paginationLimit, nextToken: nextToken}));
                let nextNewToken = assets.data.listMAPSAssets.nextToken;
                setMediaAssets(mediaAssets.concat(assets.data.listMAPSAssets.items));
                applyFilters(mediaAssets.concat(assets.data.listMAPSAssets.items), undefined, undefined, undefined);
                if (nextNewToken !== null) {
                    setNextToken(nextNewToken);
                }
            }
        }
        paginateAssets();
    }, [nextToken]);

    // Handle media asset updates //
    const mediaAssetReducer = (state, action) => {
        let tempMediaAssets = Object.create(mediaAssets);
        let tempFilteredAssets = Object.create(filteredAssets);
        let idx = 0;
        let filtIdx = 0;
        let localPrefix = action.data.prefixLoc === '/' ? '' : action.data.prefixLoc;
        switch(action.type) {
            case 'UPDATE':
                idx = tempMediaAssets.findIndex((val) => {
                    return val.bucketObjKey === action.data.bucketObjKey;
                });

                filtIdx = tempFilteredAssets.findIndex((val) => {
                    return val.bucketObjKey === action.data.bucketObjKey;
                });
                
                if (idx > -1) {
                    for (var key of Object.keys(action.data)) {
                        tempMediaAssets[idx][key] = action.data[key];
                    }
                    setMediaAssets(tempMediaAssets);
                }

                if (filtIdx > -1) {
                    for (var key of Object.keys(action.data)) {
                        tempFilteredAssets[filtIdx][key] = action.data[key];
                    }
                    setFilteredAssets(tempFilteredAssets);
                }
                break;
            case 'NEW':
                idx = tempMediaAssets.findIndex((val) => {
                    return val.bucketObjKey === action.data.bucketObjKey;
                });

                filtIdx = tempFilteredAssets.findIndex((val) => {
                    return val.bucketObjKey === action.data.bucketObjKey;
                });

                if (idx === -1 && localPrefix === selectedPrefix && action.data.bucketObjKey.includes(bucketName)) {
                    setMediaAssets([...tempMediaAssets, action.data])
                }

                if (filtIdx === -1 && localPrefix === selectedPrefix && action.data.bucketObjKey.includes(bucketName)) {
                    applyFilters([...tempFilteredAssets, action.data], undefined, undefined, undefined);
                }
                break;
            case 'DELETE':
                setMediaAssets(tempMediaAssets.filter((item)=>(item.bucketObjKey !== action.data.bucketObjKey)));
                setFilteredAssets(tempFilteredAssets.filter((item)=>(item.bucketObjKey !== action.data.bucketObjKey)));
                break;
            default:
                break;
        };
    };

    const [emptyState, dispatch] = useReducer(mediaAssetReducer);

    function listenForUpdatedAssets(){
        return API.graphql(
            graphqlOperation(onUpdateMapsAssets),
        ).subscribe({
            next: (((data) => {
                console.log(data);
                const updateAssetData = data.value.data.onUpdateMAPSAssets;
                dispatch({type: 'UPDATE', data: updateAssetData});
            })),
        });
    };

    function listenForNewAssets() {
        return API.graphql(
            graphqlOperation(onCreateMapsAssets),
        ).subscribe({
            next: (((data) => {
                console.log(data);
                const newAssetData = data.value.data.onCreateMAPSAssets;
                dispatch({type: 'NEW', data: newAssetData});
            })),
        });
    };

    function listenForDeletedAssets() {
        return API.graphql(
            graphqlOperation(onDeleteMapsAssets),
        ).subscribe({
            next: (((data) => {
                console.log(data);
                const deleteAssetData = data.value.data.onDeleteMAPSAssets;
                dispatch({type: 'DELETE', data: deleteAssetData});
            }))
        });
    };

    useEffect(() => {
        const updateSub = listenForUpdatedAssets();
        const newSub = listenForNewAssets();
        const delSub = listenForDeletedAssets();

        return () => { 
            updateSub.unsubscribe();
            newSub.unsubscribe();
            delSub.unsubscribe();
        }
    }, []);

    const userSessionReducer = (state, action) => {
        setUsername(action.data.username);
        setUserGroups(action.data.userGroups);
        setAllGroups(action.data.allGroups);
    };

    const [emptyState2, sessionDispatch] = useReducer(userSessionReducer);

    async function configureUserInfo() {
        const user = await Auth.currentAuthenticatedUser();
        const groupRes = await GetUserGroups();
        let groups = [];
        if (groupRes.data.body.hasOwnProperty('groups')) {
            groups = groupRes.data.body.groups;
        } else if(groupRes.data.body.hasOwnProperty('reason')) {
            mainAlertHandler('error', 'Error', groupRes.data.body.reason);
        }

        sessionDispatch({data: {
            allGroups: groups, 
            username: user.username, 
            userGroups: user.signInUserSession.accessToken.payload["cognito:groups"]
        }});
    };

    useEffect(() => {
        configureUserInfo();
    }, []);

    // CONDITIONAL VIEWS //
    function ViewLayoutDisplay() {
        if (viewLayout === "table") {
            return ( <TableAssetView 
                        bucketName={bucketName} 
                        selectedPrefix={selectedPrefix} 
                        userGroups={userGroups}
                        allGroups={allGroups}
                        filteredAssets={filteredAssets}
                        filterHandler={assetFilterHandler}
                        filterState={filteringState}
                        mediaFolders={bucketFolders} 
                        prefixChangeHandler={handlePrefixChange} 
                        topLevelSelectedHandler={selectedAssetHandler}
                        unselectMediaHandler={unselectMediaAssetsHandler}
                        selectAllHandler={selectAllHandler}
                        selectedMediaAssets={selectedMediaAssets}
                        deleteFolderHandler={deleteFolderHandler}
                        rightClickHandler={handleRightClickMenu} /> );
        } else {
            return ( <CardAssetView 
                        bucketName={bucketName} 
                        selectedPrefix={selectedPrefix} 
                        filteredAssets={filteredAssets} 
                        topLevelSelectedHandler={selectedAssetHandler} 
                        selectedMediaAssets={selectedMediaAssets}
                        rightClickHandler={handleRightClickMenu} /> );
        }
    };

    return (
        <>
            <MainToolbar username={username} userGroups={userGroups}/>
            <ControlsToolbar 
                bucketName={bucketName} 
                selectedPrefix={selectedPrefix} 
                username={username}
                userGroups={userGroups}
                prefixChangeHandler={handlePrefixChange} 
                viewLayoutChangeHandler={handleViewLayoutChange} 
                selectedMediaAssets={selectedMediaAssets}
                unselectAssetHandler={unselectMediaAssetsHandler}
                alertHandler={mainAlertHandler}
                folderHandler={updateFolderHandler}
                searchHandler={searchHandler}
            />
            <ViewLayoutDisplay />

            <Dialog
                open={alertState.show}
                onClose={handleAlertClose}
                maxWidth={false}
            >
                <Alert severity={alertState.severity}>
                <AlertTitle>{alertState.title}</AlertTitle>
                {alertState.msg.map((alert, idx) => {
                    return (<p key={idx}>{alert}</p>)
                })}
                </Alert>
            </Dialog>

            <ContextMenu 
                bucketName={bucketName} 
                menuState={contextMenuState} 
                closeHandler={rightClickCloseHandler} 
                selectedAssets={selectedMediaAssets} 
                unselectAssetHandler={unselectMediaAssetsHandler}
                alertHandler={mainAlertHandler}
            />
        </>
    );
};