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
import json
import os
import re
import boto3
import http.client

s3_client = boto3.client('s3')
appsync_client = boto3.client('appsync')

GQL_API_ID = os.environ['GQL_API_ID']
GQL_URL = os.environ['GQL_URL']
SSM_OUTPUT_BUCKET = os.environ['SSM_OUTPUT_BUCKET']
SSM_OUTPUT_PREFIX = os.environ['SSM_OUTPUT_PREFIX']

def lambda_handler(event, context):
    if event['detail']['status'] == 'Success':
        commandId = event['detail']['command-id']
        instanceId = event['resources'][0].split('/')[-1]

        try:
            output = s3_client.get_object(Bucket=SSM_OUTPUT_BUCKET, Key=f"{SSM_OUTPUT_PREFIX}/{commandId}/{instanceId}/awsrunPowerShellScript/0.awsrunPowerShellScript/stdout")
            cmd_output = output['Body'].read().decode('utf-8')

            match_output = re.findall('\W*(download)\W*(s3:\/\/.*?\/.*)', cmd_output)
            if len(match_output) > 0:
                for match in match_output:
                    bucketObjKey = match[1].split(' ')[0]
                    bucket, objKey = bucketObjKey[5:].split('/', 1)
                    update_status(bucket, objKey, 'S3_FSX')
        
            match_output = re.findall('\W*(upload)\W*(s3:\/\/.*?\/.*)', cmd_output)
            if len(match_output) > 0:
                for match in match_output:
                    bucketObjKey = match[1].strip()
                    bucket, objKey = bucketObjKey[5:].split('/', 1)
                    update_status(bucket, objKey, 'S3')

        except:
            pass

def update_status(bucket, key, fileStatus):
    apiKeyRes = appsync_client.list_api_keys(apiId=GQL_API_ID, maxResults=10)

    API_KEY = apiKeyRes['apiKeys'][0]['id']
    
    HOST = GQL_URL.replace('https://','').replace('/graphql','')
    conn = http.client.HTTPSConnection(HOST, 443)
    headers = {
        'Content-type': 'application/graphql', 
        'x-api-key': API_KEY,
        'host': HOST
    }
    bucketObjKey = '{}/{}'.format(bucket, key)

    graphql_mutation = {
        'query': 'mutation($in:UpdateMAPSAssetsInput!){updateMAPSAssets(input:$in){bucketObjKey fileStatus}}',
        'variables': '{ "in": {"bucketObjKey":"'+bucketObjKey+'", "fileStatus":"'+fileStatus+'"} }'
    }
    mutation_data = json.dumps(graphql_mutation)

    # Now Perform the Mutation
    conn.request('POST', '/graphql', mutation_data, headers)
    response = conn.getresponse()

    response_string = response.read().decode('utf-8')
    print(response_string)
    