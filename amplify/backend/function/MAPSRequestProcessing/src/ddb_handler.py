'''
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
'''
import boto3
import json
import os
import util
import s3_handler
from datetime import datetime, timezone
from botocore.client import Config
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

s3_client = boto3.client('s3', config=Config(signature_version='s3v4'))
ddb_client = boto3.client('dynamodb')
ec2_client = boto3.client('ec2')
ssm_client = boto3.client('ssm')

PERMISSIONS_DB_TABLE = os.environ['PERMISSIONS_DB_TABLE']
ACTIVE_DB_TABLE = os.environ['ACTIVE_DB_TABLE']
FSX_MOUNT = os.environ['FSX_MOUNT']
REGION = os.environ['REGION']
SSM_OUTPUT_BUCKET = os.environ['SSM_OUTPUT_BUCKET']
SSM_OUTPUT_PREFIX = os.environ['SSM_OUTPUT_PREFIX']

ddb_deserialize = TypeDeserializer().deserialize
ddb_serialize = TypeSerializer().serialize

def check_for_existing(bucketObjKey):
    response = ddb_client.get_item(
        TableName=ACTIVE_DB_TABLE,
        Key={
            "bucketObjKey": {
                "S": bucketObjKey
            }
        },
        AttributesToGet=[
            'editUser',
            'fileStatus'
        ],
    )
    
    return response

# Handle Upload Object Request
# Perform checks to see if object is available for check in
# by querying DynamoDB
def handle_upload_file_req(request_body, request_cxt):
    bucketName = request_body['bucketName']
    key = request_body['key']
    user = request_cxt['authorizer']['claims']['cognito:username']
    
    obj_response_body = {}
    response = check_for_existing(bucketObjKey=f"{bucketName}/{key}")
    
    # File is checked out for edit by current user, allow check in
    if 'Item' in response:
        if response['Item']['fileStatus']['S'] == 'S3_DOWNLOADED':
            if user == response['Item']['editUser']['S']:
                obj_response_body = {"allowCheckIn": True}
            else:
                obj_response_body = {"allowCheckIn": False, "reason": 'File already downloaded by another user'}
        else:
            obj_response_body = {"allowCheckIn": False, "overwrite": True, "reason": 'File is already being tracked, do you wish to overwrite it?'}
    
    else:
        # Extra sanity check incase upload was not logged into DDB table
        try:
            resp = s3_client.get_object_acl(Bucket=bucketName, Key=key)
            obj_response_body = {"allowCheckIn": False, "reason": 'File already exists and is not currently being tracked. Please contact your administrator.'}

            return util.generate_response_body(200, obj_response_body)
        except:
            obj_response_body = {"allowCheckIn": True}

    return util.generate_response_body(200, obj_response_body)

# Handle Download Object Request
# Perform checks to see if object is available for check out
# by querying DynamoDB
def handle_download_file_req(request_body, request_cxt):
    bucketName = request_body['bucketName']
    key = request_body['key']
    displayKey = key.split('/')[-1]
    readOnly = request_body['readOnly']
    user = request_cxt['authorizer']['claims']['cognito:username']
    
    obj_response_body = {}
    response = check_for_existing(bucketObjKey=f"{bucketName}/{key}")

    params={
        'Bucket': bucketName,
        'Key': key,
        'ResponseContentDisposition': f'attachment; filename={displayKey};'
    }

    # Read-Only
    if readOnly == True:
        s3_resp = s3_client.generate_presigned_url('get_object', 
            Params=params,
            ExpiresIn=300)
            
        obj_response_body = {
            'user': user,
            'allowCheckOut': True,
            'url': s3_resp
        }

    # File is checked out for edit by another user
    elif 'Item' in response:
        editUser = response['Item']['editUser']['S']
        fileStatus = response['Item']['fileStatus']['S']
        if fileStatus == 'S3_DOWNLOADED':
            obj_response_body = {'allowCheckOut': False, 'reason': "File is already checked out for edit."}
        else:
            s3_resp = s3_client.generate_presigned_url('get_object', 
                Params=params,
                ExpiresIn=300)

            obj_response_body = {
                'user': user,
                'allowCheckOut': True,
                'url': s3_resp
            }
    
    return util.generate_response_body(resp_code=200, body=obj_response_body)

# Handle Delete Object Request
# Perform checks to see if object is available for deletion
# by querying DynamoDB
def handle_delete_file_req(request_body, request_cxt):
    bucketName = request_body['bucketName']
    key = request_body['key']
    user = request_cxt['authorizer']['claims']['cognito:username']
    
    obj_response_body = {}
    response = check_for_existing(bucketObjKey=f"{bucketName}/{key}")
    if 'Item' in response:
        fileStatus = response['Item']['fileStatus']['S']
        editUser = response['Item']['editUser']['S']
        if fileStatus == 'S3_DOWNLOADED' and user == editUser:
            obj_response_body = {'allowDelete': True}
        elif fileStatus == 'S3_DOWNLOADED' and user != editUser:
            obj_response_body = {'allowDelete': False, 'reason': "File is currently checked out to another user."}
        elif fileStatus == 'S3' or fileStatus == 'S3_FSX':
            obj_response_body = {'allowDelete': True}
        else:
            obj_response_body = {'allowDelete': False, 'reason': "Unable to delete file."}

    return util.generate_response_body(200, obj_response_body)

# Handle Rename or Move Object Request
# Perform checks to see if object is available for renaming or moving
# by querying DynamoDB
def handle_rename_move_req(request_body, request_cxt):
    bucketName = request_body['bucketName']
    keys = request_body['keys']
    newPrefix = request_body['newPrefix']
    user = request_cxt['authorizer']['claims']['cognito:username']

    obj_response_body = {}
    obj_response_body['objects'] = []

    for key in keys:
        key = key['key']
        fileName = key.split('/')[-1]
        response = check_for_existing(bucketObjKey=f"{bucketName}/{key}")
        newResponse = check_for_existing(bucketObjKey=f"{bucketName}/{newPrefix}{fileName}")

        if 'Item' in response:
            fileStatus = response['Item']['fileStatus']['S']
            editUser = response['Item']['editUser']['S']
            if (fileStatus == 'S3' or fileStatus == 'S3_FSX') and 'Item' not in newResponse:
                obj_response_body['objects'].append({
                    'oldKey': key,
                    'newKey': f"{newPrefix}{fileName}",
                    'allowMove': True 
                })
            elif fileStatus == 'S3_DOWNLOADED' and user == editUser and 'Item' not in newResponse:
                obj_response_body['objects'].append({
                    'oldKey': key,
                    'newKey': f"{newPrefix}{fileName}",
                    'allowMove': True 
                })
            elif 'Item' in newResponse:
                obj_response_body['objects'].append({
                    'oldKey': key,
                    'newKey': f"{newPrefix}{fileName}",
                    'allowMove': False,
                    'reason': 'There exists a file with the same name at the new folder location. This will cause a merge conflict and overwrite the existing file.' 
                })
            elif fileStatus == 'S3_DOWNLOADED' and user != editUser:
                obj_response_body['objects'].append({
                    'oldKey': key,
                    'newKey': f"{newPrefix}{fileName}",
                    'allowMove': False,
                    'reason': 'File cannot be moved as it is checked out by another user.' 
                })
            else:
                obj_response_body['objects'].append({
                    'oldKey': key,
                    'newKey': f"{newPrefix}{fileName}",
                    'allowMove': False,
                    'reason': 'Unknown error occurred and we could not complete your request.' 
                })
    
    return util.generate_response_body(200, obj_response_body)

# Handle Move to FSX Request
# Perform checks to see if object is available for moving
# by querying DynamoDB
def handle_fsx_move_req(request_body, request_cxt, curr_req):
    bucketName = request_body['bucketName']
    keys = request_body['keys']
    moveType = request_body['moveType']
    user = request_cxt['authorizer']['claims']['cognito:username']
    sourceIp = request_cxt['identity']['sourceIp']
    instanceId = None

    # Get instance ID from source IP
    resp = ec2_client.describe_addresses(PublicIps=[sourceIp])
    if len(resp['Addresses']) > 0:
        instanceId = resp['Addresses'][0]['InstanceId']
    else:
        return util.generate_response_body(200, {"allowMove": False, "reason": "No EC2 instances are currently associated with your IP address so we are unable to move files to FSx."})
    
    obj_response_body = {}
    obj_response_body['moveStatus'] = []
    
    toFsx = 1
    files = ''
    
    for key in keys:
        response = check_for_existing(bucketObjKey=f"{bucketName}/{key['key']}")
        displayKey = key['key'].split('/')[-1]
        if 'Item' in response:
            status = response['Item']['fileStatus']['S']
            if status == 'S3' and moveType == 'fsx':
                files += '{},'.format(key['key'])
                toFsx = 1
                obj_response_body['moveStatus'].append({
                    'key': key['key'],
                    'status': 'Moving to FSX'
                })
            elif status == 'S3_FSX' and moveType == 'fsx':
                obj_response_body['moveStatus'].append({
                    'key': key['key'],
                    'status': 'File is already in FSX'
                })
            elif status == 'S3' and moveType == 'remove_fsx':
                obj_response_body['moveStatus'].append({
                    'key': key['key'],
                    'status': 'File is not currently in FSX'
                })
            elif status == 'S3_FSX' and moveType == 'remove_fsx':
                files += '{},'.format(key['key'])
                toFsx = 0
                obj_response_body['moveStatus'].append({
                    'key': key['key'],
                    'status': 'Moving from FSX'
                })
            else:
                obj_response_body['moveStatus'].append({
                    'key': key['key'],
                    'status': 'Unable to process move request'
                })
        else:
            obj_response_body['moveStatus'].append({
                    'key': key['key'],
                    'status': 'Asset is not currently being tracked'
                })
    
    command = f'.\MoveMedia.ps1 -bucket {bucketName} -toFsx {toFsx} -files {files[:-1]} -fsxmount {FSX_MOUNT}'

    resp = ssm_client.send_command(
        InstanceIds=[instanceId],
        DocumentName="AWS-RunPowerShellScript",
        Parameters={
            'commands': [command],
            'workingDirectory': ['C:\ProgramData\Amazon\EC2-Windows\Launch\Scripts']
        },
        OutputS3Region=REGION,
        OutputS3BucketName=SSM_OUTPUT_BUCKET,
        OutputS3KeyPrefix=SSM_OUTPUT_PREFIX
    )

    return util.generate_response_body(200, obj_response_body)

def handle_admin_operation(request_body, query_params, request_cxt):
    bucketName = request_body['bucketName']
    keys = request_body['keys'].split(',')
    groups = request_cxt['authorizer']['claims']['cognito:groups']
    user = request_cxt['authorizer']['claims']['cognito:username']
    eventTime = str(datetime.utcfromtimestamp(float(request_cxt['requestTimeEpoch'])/1000.).replace(tzinfo=timezone.utc))
    id = request_cxt['requestId']
    
    resp_body = {}
    resp_body['Objects'] = []
    
    operation = query_params.get('operation')
    if operation == 'check-in':
        return handle_admin_checkin(bucketName, keys, user)
    elif operation == 'check-out':
        pass
    elif operation == 'delete':
        pass
    elif operation == 'lock':
        pass
    elif operation == 'unlock':
        pass
    else:
        pass
        
    return util.generate_response_body(resp_code=200, body=resp_body)

def handle_admin_checkin(bucketName, keys, user):
    resp_body = {}
    return util.generate_response_body(resp_code=200, body=resp_body)

def get_folder_permissions(bucket_name, folder_key, request_cxt):
    obj_response_body = {}

    groups = request_cxt['authorizer']['claims']['cognito:groups']

    if 'admin' in groups:
        response = ddb_client.get_item(
            TableName=PERMISSIONS_DB_TABLE,
            Key={
                "bucket": {
                    "S": bucket_name
                },
                "folderKey": {
                    "S": folder_key
                }
            },
            AttributesToGet=[
                'permissionGroups'
            ]
        )

        if 'Item' in response:
            userGroups = ddb_deserialize(response['Item']['permissionGroups'])
            obj_response_body['userGroups'] = userGroups
        else:
            obj_response_body['reason'] = 'Folder does not exist or is not being tracked by MAPS.'

    else:
        obj_response_body['reason'] = 'User does not have permissions to change folder access.'
    
    return util.generate_response_body(200, obj_response_body)

def update_folder_permissions(request_body, request_cxt):
    obj_response_body = {}

    bucket_name = request_body['bucketName']
    folder_key = request_body['folderKey']
    newPermissionGroup = request_body['permissions']

    groups = request_cxt['authorizer']['claims']['cognito:groups']
    if 'admin' in groups:
        response = ddb_client.update_item(
            TableName=PERMISSIONS_DB_TABLE,
            Key={
                'bucket': { 'S': bucket_name },
                'folderKey': { 'S': folder_key }
            },
            UpdateExpression="set permissionGroups=:p",
            ExpressionAttributeValues={
                ':p': ddb_serialize(newPermissionGroup)
            }
        )

        obj_response_body['success'] = True
    else:
        obj_response_body['reason'] = 'User does not have permissions to change folder access.'
    
    return util.generate_response_body(200, obj_response_body)