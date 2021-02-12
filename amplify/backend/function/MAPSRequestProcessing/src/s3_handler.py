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
import os
import boto3
import util
import ddb_handler
import logging
from datetime import datetime, timezone
from botocore.client import Config
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
from boto3.dynamodb.types import TypeDeserializer
from urllib.parse import quote_plus

s3_client = boto3.client('s3')
ddb_client = boto3.client('dynamodb')
cognito_client = boto3.client('cognito-idp')

COGNITO_USER_POOL = os.environ['COGNITO_USER_POOL']
PERMISSIONS_DB_TABLE = os.environ['PERMISSIONS_DB_TABLE']

ddb_deserialize = TypeDeserializer().deserialize

logging.basicConfig()
logging.getLogger().setLevel(logging.INFO)

def validate_bucket_CORS(bucketName):
    try:
        response = s3_client.get_bucket_cors(Bucket=bucketName)
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchCORSConfiguration':
            return False
        else:
            logging.error(e)
            return False
    
    for rule in response['CORSRules']:
        if '*' in rule['AllowedHeaders'] and '*' in rule['AllowedOrigins'] \
         and 'PUT' in rule['AllowedMethods'] and 'HEAD' in rule['AllowedMethods']:
            return True
    return False 
 
def validate_permissions(userGroups, bucket, folderKey):
    resp = ddb_client.get_item(
            TableName=PERMISSIONS_DB_TABLE,
            Key={
                "bucket": { 'S': bucket },
                "folderKey": { 'S': folderKey }
            },
            AttributesToGet=[
                'permissionGroups'
            ]
        )

    try:
        groups = resp['Item']['permissionGroups']['L']
        for group in groups:
            if group['S'] in userGroups:
                return True
        return False
    except KeyError as e:
        return False 
 
def get_s3_buckets(bucket_name):
    response = s3_client.list_buckets()
    resp_body = {}
    found = False
    valid = False
    for bucket in response['Buckets']:
        if bucket_name == bucket['Name']:
            found = True
            valid = validate_bucket_CORS(bucket_name)
            break
    
    resp_body['valid'] = valid
    resp_body['reason'] = 'Valid CORS' if valid else ('Invalid CORS Configuration' if found else 'Bucket not found in AWS Account')
    
    return util.generate_response_body(resp_code=200, body=resp_body)
    
def get_s3_ddb_data(bucket_name, next_token, keyPrefix, req_cxt):
    resp_body = {}
    resp_body['Folders'] = []

    user = req_cxt['authorizer']['claims']['cognito:username']
    resp = cognito_client.admin_list_groups_for_user(
        Username=user,
        UserPoolId=COGNITO_USER_POOL
    )
    
    userGroups = []
    for group in resp['Groups']:
        userGroups.append(group['GroupName'])

    response = ddb_client.scan(
            TableName=PERMISSIONS_DB_TABLE,
            FilterExpression='(#buck = :buckval) and contains(#pl, :plval)', 
            ExpressionAttributeNames={
                '#buck': 'bucket',
                '#pl': 'folderKey'
            },
            ExpressionAttributeValues={
                ':buckval': { 'S': bucket_name },
                ':plval': { 'S': keyPrefix }
            },
        )
    
    if 'Items' in response:
        res_items = response['Items']
        for item in res_items:
            permissionGroups = ddb_deserialize(item['permissionGroups'])
            hasPermissions = validate_permissions(userGroups, bucket_name, item['folderKey']['S'])
            displayKey = item['folderKey']['S'].replace(keyPrefix, '')
            if hasPermissions and displayKey != '' and displayKey.count('/') == 1 and displayKey != '/':
                folder_resp = {}
                folder_resp['displayName'] = displayKey
                folder_resp['objKey'] = item['folderKey']['S']
                folder_resp['permissions'] = permissionGroups
                resp_body['Folders'].append(folder_resp)
        
    return util.generate_response_body(resp_code=200, body=resp_body)
    
def get_s3_obj(bucket_name, key):
    obj_resp = {}
    displayKey = quote_plus(key.split('/')[-1])
    params={
        'Bucket': bucket_name,
        'Key': key,
        'ResponseContentDisposition': f'attachment; filename={displayKey};'
    }
    
    s3_resp = s3_client.generate_presigned_url('get_object', 
                                                Params=params,
                                                ExpiresIn=86400)
    
    obj_resp['objUrl'] = s3_resp

    return util.generate_response_body(resp_code=200, body=obj_resp)

def check_folder_exists(request_body):
    bucketName = request_body['bucketName']
    folder = request_body['key']
    obj_response_body = {}

    try:
        resp = s3_client.get_object_acl(Bucket=bucketName, Key=folder)
        obj_response_body = {"allowCreation": False, "reason": 'Folder already exists.'}

        return util.generate_response_body(200, obj_response_body)
    except:
        obj_response_body = {"allowCreation": True}
    
    return util.generate_response_body(200, obj_response_body)

def get_user_groups(request_cxt):
    obj_response_body = {}

    groups = request_cxt['authorizer']['claims']['cognito:groups']

    if 'admin' in groups:
        allGroups = cognito_client.list_groups(
            UserPoolId=COGNITO_USER_POOL
        )

        returnGroups = [group['GroupName'] for group in allGroups['Groups']]
        obj_response_body['groups'] = returnGroups
    
    else:
        obj_response_body['groups'] = []
    
    return util.generate_response_body(200, obj_response_body)
