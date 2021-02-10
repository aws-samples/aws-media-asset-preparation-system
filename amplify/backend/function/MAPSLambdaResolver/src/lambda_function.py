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
import json
import boto3
from boto3.dynamodb.conditions import Key

TRACKING_DB_TABLE = os.environ['TRACKING_DB_TABLE']
PERMISSIONS_DB_TABLE = os.environ['PERMISSIONS_DB_TABLE']

ddb_client = boto3.client('dynamodb')

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
        if folderKey == '/':
            return True
        else:
            return False
    
def lambda_handler(event, context):
    groups = event['identity']['claims']['cognito:groups']

    bucket = event['arguments']['filter']['bucketObjKey']['contains']
    prefix = event['arguments']['filter']['prefixLoc']['eq']
    hasPermissions = validate_permissions(groups, bucket, prefix)

    if hasPermissions:
        resp = ddb_client.scan(
                TableName=TRACKING_DB_TABLE,
                Select='ALL_ATTRIBUTES',
                FilterExpression="contains (bucketObjKey, :bucket)",
                ExpressionAttributeValues={
                    ":bucket": { "S": bucket }
                }
            )

        event['arguments']['allow'] = True
    else:
        event['arguments']['allow'] = False
    
    return event
