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
import Amplify, { API, Auth, graphqlOperation } from 'aws-amplify';
import AWS from 'aws-sdk';
import { saveAs } from 'file-saver';
import awsmobile from '../../aws-exports';

import { deleteMapsAssets, createMapsAssets } from '../../graphql/mutations';
import { getMapsAssets } from '../../graphql/queries';

Amplify.configure(awsmobile);
const apiName = "MAPSFrontEndAPI";

const downloadFile = (s3Url) => {
  saveAs(s3Url);
};

async function DeleteObjectRequest(bucketName, key, alertHandler) {
    const authToken = await Auth.currentSession();
    const credentials = await Auth.currentUserCredentials();
    const apiPromise = API.post(apiName, "/delete", {
        headers: {Authorization: authToken.idToken.jwtToken},
        response: true,
        body: {
          bucketName: bucketName,
          key: key
        }
    });

    // Process API Response
    apiPromise
    .then((response) => {
        AWS.config.credentials = credentials;
        AWS.config.region = awsmobile['aws_cognito_region'];
        const obj = response['data']['body'];
        if (obj['allowDelete']) {
            var s3 = new AWS.S3();
            var params = {
                Bucket: bucketName, 
                Key: key
            };
            
            var deletePromise = s3.deleteObject(params);

            deletePromise.promise()
            .then((res) => {
                const deleteObj = {
                    input: {
                        bucketObjKey: `${bucketName}/${key}`
                    }
                };
                API.graphql(graphqlOperation(deleteMapsAssets, deleteObj));
            })
            .catch((err) => {
                console.log(err);
            });
        }
        else {
            alertHandler('error', 'Error', [obj['reason']]);
        }
    })
    .catch((error) => {
        console.log('Error in response API Promise', error);
    });
}

async function CheckOutObjectRequest(bucketName, key, readOnly, alertHandler) {
    const credentials = await Auth.currentSession();
    const apiPromise = API.post(apiName, "/download", {
        headers: {Authorization: credentials.idToken.jwtToken},
        response: true,
        body: {
          bucketName: bucketName,
          key: key,
          versionId: 0,
          readOnly: readOnly
        }
    });

    // Process API Response
    apiPromise
    .then((response) => {
        const date = response.data.timestamp;
        AWS.config.systemClockOffset = Date.now()/1000.0 - date;
        const obj = response['data']['body'];
        console.log(obj);
        if (obj['allowCheckOut']) {
            downloadFile(obj['url']);
        } else {
            alertHandler('error', 'Error', ['This file is not available for check out. It may be checked out by another user.']);
        }
    })
    .catch((err) => {
        console.log('Error in response API Promise', err);
    });
};

async function UploadObjRequest(bucketName, key, version) {
    const auth = await Auth.currentSession();
    let queryParams = "";
    queryParams = {
        headers: {Authorization: auth.idToken.jwtToken},
            body: {
                bucketName: bucketName,
                key: key,
                versionId: version
        },
        response: true
    };

  return API.post(apiName, "/upload", queryParams);
};

async function RenameMoveObjRequest(bucketName, keys, newPrefix, alertHandler) {
    const auth = await Auth.currentSession();
    const credentials = await Auth.currentUserCredentials();
    let queryParams = "";
    queryParams = {
        headers: {Authorization: auth.idToken.jwtToken},
            body: {
                bucketName: bucketName,
                keys: keys,
                newPrefix: newPrefix
        },
        response: true
    };

    const apiPromise = API.post(apiName, "/rename", queryParams);

    apiPromise
    .then((response) => {
        AWS.config.credentials = credentials;
        AWS.config.region = awsmobile['aws_cognito_region'];
        const moveObjs = response.data.body.objects;
        let alertText = [];
        for (const idx in moveObjs) {
            const obj = moveObjs[idx];
            console.log(obj);
            if (obj['allowMove']) {
                var s3 = new AWS.S3();
                var copyParams = {
                    Bucket: bucketName,
                    CopySource: `/${bucketName}/${obj['oldKey']}`,
                    Key: obj['newKey']
                };

                var deleteParams = {
                    Bucket: bucketName, 
                    Key: obj['oldKey']
                };

                s3.copyObject(copyParams).promise()
                .then((copyRes) => {
                    s3.deleteObject(deleteParams);
                    const oldObject = { 
                        input: { 
                            bucketObjKey: `${bucketName}/${obj['oldKey']}` 
                        } 
                    };

                    API.graphql(graphqlOperation(getMapsAssets, oldObject['input']))
                    .then((getObjRes) => {
                        let createObj = getObjRes.data.getMAPSAssets;
                        createObj['bucketObjKey'] = `${bucketName}/${obj['newKey']}`;
                        createObj['prefixLoc'] = newPrefix === '' ? '/' : newPrefix;

                        API.graphql(graphqlOperation(createMapsAssets, { input: createObj }));
                        API.graphql(graphqlOperation(deleteMapsAssets, oldObject));
                    })
                    .catch((getObjErr) => {
                        console.log("Something bad happened in object get", getObjErr);
                    });
                })
                .catch((copyErr) => {
                    console.log('Copy failed: ', copyErr);
                });
            } else {
                alertText.push(`Unable to move/rename ${obj['oldKey']}: ${obj['reason']}`)
            }
        };

        if (alertText.length > 0) {
            alertHandler("error", "Error", alertText);
        }
    })
    .catch((error) => {
        alertHandler("error", "Error", ["An unexpected error occurred."]);
    });
};

async function MoveToFsxRequest(bucketName, keys, alertHandler, moveType) {
    const auth = await Auth.currentSession();
    const credentials = await Auth.currentUserCredentials();
    let queryParams = "";
    queryParams = {
        headers: {Authorization: auth.idToken.jwtToken},
            body: {
                bucketName: bucketName,
                keys: keys,
                moveType: moveType
        },
        response: true
    };

    const apiPromise = API.post(apiName, "/move", queryParams);

    apiPromise
    .then((response) => {
        let statusMsg = [];
        const moveStatus = response.data.body.moveStatus;
        moveStatus.forEach(function(obj) {
            let keyDisplayName = ((obj.key.includes('/')) ? obj.key.split('/').slice(-1)[0] : obj.key);
            statusMsg.push(`${keyDisplayName} - ${obj.status}`);
        });
        alertHandler('info', 'Info', statusMsg);
    })
    .catch((err) => {
        console.log('Failure in move to FSX', err);
    })
};

async function GetBucketFolders(bucketName, nextIdToken, prefix) {

  const auth = await Auth.currentSession();
  return API.get(apiName, "/", {
    headers: {
      Authorization: auth.idToken.jwtToken
    },
    response: true,
    queryStringParameters: {
      bucketName: bucketName,
      prefix: prefix
    }
  });
};

async function ValidateBucket(bucketName) {
    const auth = await Auth.currentSession();
    return API.get(apiName, "/bucket", {
      headers: {Authorization: auth.idToken.jwtToken},
      response: true,
      queryStringParameters: {
          bucketName: bucketName
      }
    });
};

async function GetObjectInfo(bucketName, key) {

  const auth = await Auth.currentSession();
  return API.get(apiName, "/object", {
    headers: {Authorization: auth.idToken.jwtToken},
    response: true,
    queryStringParameters: {
      bucketName: bucketName, 
      key: key
    }
  });
};

const ProcessAdminOperations = (bucketName, keys, operation) => {
  Auth.currentSession()
  .then((auth) => {
    API.post(apiName, "/admin", {
      headers: {Authorization: auth.idToken.jwtToken},
      response: true,
      queryStringParameters: {
        operations: operation
      },
      body: {
        bucketName: bucketName,
        keys: keys
      }
  })
  .then((response) => {
    const objects = response.data.body.Objects;

    for (var i=0; i< objects.length; i++) {
      const dispKey = ((objects[i]['key'].includes('/')) ? objects[i]['key'].split('/')[-1] : objects[i]['key']);
      const dbObj = {
        input: {
          id: `${objects[i]['id']}`,
          bucketName: `${objects[i]['bucketName']}`,
          objKey: `${objects[i]['key']}`,
          displayKey: `${dispKey}`,
          status: `${objects[i]['status']}`,
          user: `${objects[i]['user']}`,
          eventTime: `${objects[i]['eventTime']}`
        }
      }
      //API.graphql(graphqlOperation(createSourceOfTruthActive, dbObj));
    }
  })
  .catch((error) => {
    console.log(error);
  })
  })
  .catch((error) => {

  });
};

async function CreateFolder(bucketName, folderName) {
    const authToken = await Auth.currentSession();
    let queryParams = "";
    queryParams = {
        headers: {Authorization: authToken.idToken.jwtToken},
            body: {
                bucketName: bucketName,
                key: folderName
        },
        response: true
    };

    return API.post(apiName, "/folder", queryParams);
};

async function GetFolderPermissions(bucketName, folderKey) {
    const auth = await Auth.currentSession();
    return API.get(apiName, "/folder/permissions", {
        headers: {Authorization: auth.idToken.jwtToken},
        response: true,
        queryStringParameters: {
            bucketName: bucketName, 
            folderKey: folderKey
        }
    });
};

async function UpdateFolderPermissions(bucketName, folderKey, permissionGroups) {
    const authToken = await Auth.currentSession();
    let queryParams = "";
    queryParams = {
        headers: {Authorization: authToken.idToken.jwtToken},
            body: {
                bucketName: bucketName,
                folderKey: folderKey,
                permissions: permissionGroups
        },
        response: true
    };

    return API.post(apiName, "/folder/permissions", queryParams);
};

async function GetUserGroups() {
    const auth = await Auth.currentSession();
    return API.get(apiName, "/user/groups", {
        headers: {Authorization: auth.idToken.jwtToken},
        response: true
    });
};

export {
  UploadObjRequest,
  DeleteObjectRequest,
  GetBucketFolders,
  ValidateBucket,
  GetObjectInfo,
  ProcessAdminOperations,
  CheckOutObjectRequest,
  CreateFolder,
  RenameMoveObjRequest,
  MoveToFsxRequest,
  GetFolderPermissions,
  UpdateFolderPermissions,
  GetUserGroups
};