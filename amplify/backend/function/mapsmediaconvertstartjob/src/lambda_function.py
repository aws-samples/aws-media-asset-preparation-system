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
import json
import uuid
import http.client
from urllib.parse import unquote_plus

MEDIA_CONVERT_ROLE = os.environ['MEDIA_CONVERT_ROLE']
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
TRACKING_DB_TABLE = os.environ['TRACKING_DB_TABLE']
PERMISSIONS_DB_TABLE = os.environ['PERMISSIONS_DB_TABLE']
COGNITO_USER_POOL = os.environ['COGNITO_USER_POOL']
REGION = os.environ['AWS_REGION']
GQL_API_ID = os.environ['GQL_API_ID']
GQL_URL = os.environ['GQL_URL']

s3_client = boto3.client('s3')
cognito_client = boto3.client('cognito-idp')
ddb_client = boto3.client('dynamodb')
appsync_client = boto3.client('appsync')
mediaconvert = boto3.client("mediaconvert", region_name=REGION)

def asset_exists(bucketObjKey):
    resp = ddb_client.get_item(
            TableName=TRACKING_DB_TABLE,
            Key={
                "bucketObjKey": {
                    "S": bucketObjKey
                }
            },
            AttributesToGet=[
                'assetId',
            ]
        )
    
    try:
        assetId = resp['Item']['assetId']['S']
        return True, assetId
    except KeyError as e:
        return False, ''

def get_folder_permissions(bucket, folderKey):
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
        return True, groups
    except KeyError as e:
        return False, ''

def create_asset(bucket, key, assetId, eventTime, fileSize, api_key):
    appsync_create(bucket, key, assetId, eventTime, fileSize, api_key)

def update_asset(bucket, key, eventTime, fileSize, api_key):
    appsync_update(bucket, key, eventTime, fileSize, api_key)

def appsync_update(bucket, key, eventTime, fileSize, api_key):
    bucketObjKey = "{}/{}".format(bucket, key)
    
    HOST = GQL_URL.replace('https://','').replace('/graphql','')
    conn = http.client.HTTPSConnection(HOST, 443)
    headers = {
        'Content-type': 'application/graphql', 
        'x-api-key': api_key,
        'host': HOST
    }

    graphql_mutation = {
        'query': 'mutation($in:UpdateMAPSAssetsInput!){updateMAPSAssets(input:$in){bucketObjKey videoCodec audioCodec fileFormat fileLength frameRate frameCount numAudioTracks numVideoTracks fileSize thumbnailLoc proxyLoc fileStatus editUser prefixLoc assetId lastModifiedDate creationDate}}',
        'variables': '{ "in": {"bucketObjKey":"'+bucketObjKey+'", "lastModifiedDate":"'+eventTime+'", "fileStatus":"'+'S3'+'", "fileSize":"'+str(fileSize)+'"} }'
    }
    mutation_data = json.dumps(graphql_mutation)

    # Now Perform the Mutation
    conn.request('POST', '/graphql', mutation_data, headers)
    response = conn.getresponse()

    response_string = response.read().decode('utf-8')
    print(response_string)

def appsync_create(bucket, key, assetId, eventTime, fileSize, api_key):
    bucketObjKey = "{}/{}".format(bucket, key)
    prefixLoc = key.rsplit('/', 1)[0]
    if key.count('/') == 0:
        prefixLoc = '/'
    elif prefixLoc[-1] != '/':
        prefixLoc += '/'

    HOST = GQL_URL.replace('https://','').replace('/graphql','')
    conn = http.client.HTTPSConnection(HOST, 443)
    headers = {
        'Content-type': 'application/graphql', 
        'x-api-key': api_key,
        'host': HOST
    }

    graphql_mutation = {
        'query': 'mutation($in:CreateMAPSAssetsInput!){createMAPSAssets(input:$in){bucketObjKey assetId creationDate lastModifiedDate fileSize fileStatus editUser prefixLoc}}',
        'variables': '{ "in": {"bucketObjKey":"'+bucketObjKey+'", "assetId":"'+assetId+'", "creationDate":"'+eventTime+'", "lastModifiedDate":"'+eventTime+'", "fileSize":"'+str(fileSize)+'", "fileStatus":"'+'S3'+'", "editUser":"'+''+'", "prefixLoc":"'+prefixLoc+'"} }'
    }
    mutation_data = json.dumps(graphql_mutation)

    # Now Perform the Mutation
    conn.request('POST', '/graphql', mutation_data, headers)
    response = conn.getresponse()

    response_string = response.read().decode('utf-8')
    print(response_string)

def lambda_handler(event, context):
    print(event)
    for record in event['Records']:
        parsed_record = json.loads(record['body'])
        bucket = parsed_record['Records'][0]['s3']['bucket']['name']
        key = unquote_plus(parsed_record['Records'][0]['s3']['object']['key'])
        eventTime = parsed_record['Records'][0]['eventTime']
        fileSize = parsed_record['Records'][0]['s3']['object']['size']
        
        # Restrict calls on folders
        if key[-1] != '/':
            objExists, assetId = asset_exists("{}/{}".format(bucket, key))
            folderExists, permissionGroups = get_folder_permissions(bucket, key.rsplit('/', 1)[0])
            
            apiKeyRes = appsync_client.list_api_keys(apiId=GQL_API_ID, maxResults=10)

            API_KEY = apiKeyRes['apiKeys'][0]['id']

            if not objExists:
                assetId = str(uuid.uuid4())
                create_asset(bucket, key, assetId, eventTime, fileSize, API_KEY)
            else:
                update_asset(bucket, key, eventTime, fileSize, API_KEY)
                
            file_input = "s3://" + bucket + "/" + key
            thumbnail_destination = "s3://" + OUTPUT_BUCKET + "/" + 'private/assets/' + assetId + "/"
            proxy_destination = "s3://" + OUTPUT_BUCKET + "/" + 'private/assets/' + assetId + "/"
        
            # Get user-defined location for generic data file
            thumbnail_position = 7
        
            # Get mediaconvert endpoint from cache if available
            if ("MEDIACONVERT_ENDPOINT" in os.environ):
                mediaconvert_endpoint = os.environ["MEDIACONVERT_ENDPOINT"]
                customer_mediaconvert = boto3.client("mediaconvert", region_name=REGION, endpoint_url=mediaconvert_endpoint)
            else:
                try:
                    response = mediaconvert.describe_endpoints()
                except Exception as e:
                    print("Exception:\n", e)
                    raise e
                else:
                    mediaconvert_endpoint = response["Endpoints"][0]["Url"]
                    # Cache the mediaconvert endpoint in order to avoid getting throttled on
                    # the DescribeEndpoints API.
                    os.environ["MEDIACONVERT_ENDPOINT"] = mediaconvert_endpoint
                    customer_mediaconvert = boto3.client("mediaconvert", region_name=REGION, endpoint_url=mediaconvert_endpoint)
        
            try:
                response = customer_mediaconvert.create_job(
                    Role=MEDIA_CONVERT_ROLE,
                    Settings={
                        "OutputGroups": [
                            {
                                "CustomName": "thumbnail",
                                "Name": "File Group",
                                "Outputs": [
                                    {
                                        "ContainerSettings": {
                                            "Container": "RAW"
                                        },
                                        "VideoDescription": {
                                            "ScalingBehavior": "DEFAULT",
                                            "TimecodeInsertion": "DISABLED",
                                            "AntiAlias": "ENABLED",
                                            "Sharpness": 50,
                                            "CodecSettings": {
                                                "Codec": "FRAME_CAPTURE",
                                                "FrameCaptureSettings": {
                                                    "FramerateNumerator": 1,
                                                    "FramerateDenominator": thumbnail_position,
                                                    "MaxCaptures": 2,
                                                    "Quality": 80
                                                }
                                            },
                                            "DropFrameTimecode": "ENABLED",
                                            "ColorMetadata": "INSERT"
                                        },
                                        "Extension": "jpg",
                                        "NameModifier": "_thumbnail"
                                    }
                                ],
                                "OutputGroupSettings": {
                                    "Type": "FILE_GROUP_SETTINGS",
                                    "FileGroupSettings": {
                                        "Destination": thumbnail_destination
                                    }
                                }
                            },
                            {
                                "CustomName": "proxy",
                                "Name": "File Group",
                                "Outputs": [
                                    {
                                        "VideoDescription": {
                                            "ScalingBehavior": "DEFAULT",
                                            "TimecodeInsertion": "DISABLED",
                                            "AntiAlias": "ENABLED",
                                            "Sharpness": 50,
                                            "CodecSettings": {
                                                "Codec": "H_264",
                                                "H264Settings": {
                                                    "InterlaceMode": "PROGRESSIVE",
                                                    "NumberReferenceFrames": 3,
                                                    "Syntax": "DEFAULT",
                                                    "Softness": 0,
                                                    "GopClosedCadence": 1,
                                                    "GopSize": 90,
                                                    "Slices": 1,
                                                    "GopBReference": "DISABLED",
                                                    "SlowPal": "DISABLED",
                                                    "SpatialAdaptiveQuantization": "ENABLED",
                                                    "TemporalAdaptiveQuantization": "ENABLED",
                                                    "FlickerAdaptiveQuantization": "DISABLED",
                                                    "EntropyEncoding": "CABAC",
                                                    "Bitrate": 5000000,
                                                    "FramerateControl": "SPECIFIED",
                                                    "RateControlMode": "CBR",
                                                    "CodecProfile": "MAIN",
                                                    "Telecine": "NONE",
                                                    "MinIInterval": 0,
                                                    "AdaptiveQuantization": "HIGH",
                                                    "CodecLevel": "AUTO",
                                                    "FieldEncoding": "PAFF",
                                                    "SceneChangeDetect": "ENABLED",
                                                    "QualityTuningLevel": "SINGLE_PASS",
                                                    "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                                                    "UnregisteredSeiTimecode": "DISABLED",
                                                    "GopSizeUnits": "FRAMES",
                                                    "ParControl": "SPECIFIED",
                                                    "NumberBFramesBetweenReferenceFrames": 2,
                                                    "RepeatPps": "DISABLED",
                                                    "FramerateNumerator": 30,
                                                    "FramerateDenominator": 1,
                                                    "ParNumerator": 1,
                                                    "ParDenominator": 1
                                                }
                                            },
                                            "AfdSignaling": "NONE",
                                            "DropFrameTimecode": "ENABLED",
                                            "RespondToAfd": "NONE",
                                            "ColorMetadata": "INSERT"
                                        },
                                        "AudioDescriptions": [
                                            {
                                                "AudioTypeControl": "FOLLOW_INPUT",
                                                "CodecSettings": {
                                                    "Codec": "AAC",
                                                    "AacSettings": {
                                                        "AudioDescriptionBroadcasterMix": "NORMAL",
                                                        "RateControlMode": "CBR",
                                                        "CodecProfile": "LC",
                                                        "CodingMode": "CODING_MODE_2_0",
                                                        "RawFormat": "NONE",
                                                        "SampleRate": 48000,
                                                        "Specification": "MPEG4",
                                                        "Bitrate": 64000
                                                    }
                                                },
                                                "LanguageCodeControl": "FOLLOW_INPUT",
                                                "AudioSourceName": "Audio Selector 1"
                                            }
                                        ],
                                        "ContainerSettings": {
                                            "Container": "MP4",
                                            "Mp4Settings": {
                                                "CslgAtom": "INCLUDE",
                                                "FreeSpaceBox": "EXCLUDE",
                                                "MoovPlacement": "PROGRESSIVE_DOWNLOAD"
                                            }
                                        },
                                        "Extension": "mp4",
                                        "NameModifier": "_proxy"
                                    }
                                ],
                                "OutputGroupSettings": {
                                    "Type": "FILE_GROUP_SETTINGS",
                                    "FileGroupSettings": {
                                        "Destination": proxy_destination
                                    }
                                }
                            }
                            ],
                        "Inputs": [{
                            "AudioSelectors": {
                                "Audio Selector 1": {
                                    "Offset": 0,
                                    "DefaultSelection": "DEFAULT",
                                    "ProgramSelection": 1
                                }
                            },
                            "VideoSelector": {
                                "ColorSpace": "FOLLOW"
                            },
                            "FileInput": file_input
                        }]
                    }
                )
        
            # TODO: Add support for boto client error handling
            except Exception as e:
                print("Exception:\n", e)
                raise e
            else:
                job_id = response['Job']['Id']
        
        else:
            res = s3_client.head_object(Bucket=bucket, Key=key)
            owner = res['Metadata']['owner']
            
            # Structure permission group
            permissionGroup = { 'L': [] }
            
            res = cognito_client.admin_list_groups_for_user(
                    Username=owner,
                    UserPoolId=COGNITO_USER_POOL
                )
            groups = res['Groups']
            if len(groups) > 0:
                groupName = groups[0]['GroupName']
                if groupName != 'admin':
                    permissionGroup['L'].append({'S': 'admin'})
                permissionGroup['L'].append({'S': groups[0]['GroupName']})
            else:
                permissionGroup['L'].append({'S': 'admin'})
            
            res = ddb_client.put_item(
                    TableName=PERMISSIONS_DB_TABLE,
                    Item={
                        'bucket': { 'S': bucket },
                        'folderKey': { 'S': key },
                        'permissionGroups': permissionGroup
                    }
                )
