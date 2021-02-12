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
from pymediainfo import MediaInfo

from botocore.client import Config

import http.client

TRACKING_DB_TABLE = os.environ['TRACKING_DB_TABLE']
REGION = os.environ['AWS_REGION']
GQL_API_ID = os.environ['GQL_API_ID']
GQL_URL = os.environ['GQL_URL']

s3_client = boto3.client('s3', config=Config(signature_version='s3v4', s3={'addressing_style': 'virtual'}))
ddb_client = boto3.client('dynamodb')
mediaconvert = boto3.client("mediaconvert", region_name=REGION)
appsync_client = boto3.client('appsync')

def lambda_handler(event, context):
    thumbnail_loc = ""
    proxy_loc = ""
    
    # Get status from EventBridge response
    jobStatus = event['detail']['status']
    if jobStatus == 'COMPLETE':
        jobId = event['detail']['jobId']
        
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
        
        response = customer_mediaconvert.get_job(Id=jobId)
        inputs = response['Job']['Settings']['Inputs']
        originalFile = inputs[0]['FileInput'][5:]
        bucket, key = originalFile.split('/', 1)
        
        # Process Output Groups
        outputs = event['detail']['outputGroupDetails']
        for output in outputs:
            filePath = output['outputDetails'][0]['outputFilePaths'][0]
            if "_thumbnail" in filePath:
                thumbnail_loc = filePath[5:]
            elif "_proxy" in filePath:
                proxy_loc = filePath[5:]
        
        ddb_item = extract_tech_metadata(bucket, key)
        ddb_item['thumbnailLoc'] = thumbnail_loc
        ddb_item['proxyLoc'] = proxy_loc
        ddb_item['fileStatus'] = 'S3'
        ddb_item['editUser'] = ""
        
        update_asset(bucket, key, ddb_item)

def extract_tech_metadata(bucket, key):
    ddb_item = {}
    metadata_json = {}
    # The number of seconds that the Signed URL is valid:
    signed_url_expiration = 300
    # Generate a signed URL for reading a file from S3 via HTTPS
    signed_url = s3_client.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=signed_url_expiration)
    # Launch MediaInfo
    media_info = MediaInfo.parse(signed_url)
    # Save the result
    metadata_json = json.loads(media_info.to_json())
    
    # Number of audio tracks is used by the Transcribe operator
    num_audio_tracks = len(list(filter(lambda i: i['track_type'] == 'Audio', metadata_json['tracks'])))
    num_video_tracks = len(list(filter(lambda i: i['track_type'] == 'Video', metadata_json['tracks'])))
    
    # Process Tracks to get Video Metadata
    for track in metadata_json['tracks']:
        if track['track_type'] == 'General':
            video_codec = track["codecs_video"] if 'codecs_video' in track else 'NONE'
            audio_codec = track['audio_codecs'] if 'audio_codecs' in track else 'NONE'
            file_type = track['format'] if 'format' in track else 'NONE'
            duration = track['duration'] if 'duration' in track else 0
            frame_rate = track['frame_rate'] if 'frame_rate' in track else 0
            frame_count = track['frame_count'] if 'frame_count' in track else 0
            file_size = track['file_size'] if 'file_size' in track else 0
            break
    
    ddb_item['videoCodec'] = video_codec
    ddb_item['audioCodec'] = audio_codec
    ddb_item['fileFormat'] = file_type
    ddb_item['fileLength'] = str(duration)
    ddb_item['frameRate'] = frame_rate
    ddb_item['frameCount'] = str(frame_count)
    ddb_item['numAudioTracks'] = str(num_audio_tracks)
    ddb_item['numVideoTracks'] = str(num_video_tracks)
    ddb_item['fileSize'] = str(file_size)
    
    return ddb_item

def update_asset(bucket, key, ddb_item):
    appsync_update(bucket, key, ddb_item)

def appsync_update(bucket, key, ddb_item):
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
    prefixLoc = key.rsplit('/', 1)[0]
    if key.count('/') == 0:
        prefixLoc = '/'
    elif prefixLoc[-1] != '/':
        prefixLoc += '/'

    graphql_mutation = {
        'query': 'mutation($in:UpdateMAPSAssetsInput!){updateMAPSAssets(input:$in){bucketObjKey videoCodec audioCodec fileFormat fileLength frameRate frameCount numAudioTracks numVideoTracks fileSize thumbnailLoc proxyLoc fileStatus editUser prefixLoc assetId lastModifiedDate creationDate}}',
        'variables': '{ "in": {"bucketObjKey":"'+bucketObjKey+'", "prefixLoc":"'+prefixLoc+'", "videoCodec":"'+ddb_item['videoCodec']+'", "audioCodec":"'+ddb_item['audioCodec']+'", "fileFormat":"'+ddb_item['fileFormat']+'", "fileLength":"'+ddb_item['fileLength']+'", "frameRate":"'+ddb_item['frameRate']+'", "frameCount":"'+ddb_item['frameCount']+'", "numAudioTracks":"'+ddb_item['numAudioTracks']+'", "numVideoTracks":"'+ddb_item['numVideoTracks']+'", "thumbnailLoc":"'+ddb_item['thumbnailLoc']+'", "proxyLoc":"'+ddb_item['proxyLoc']+'"} }'
    }
    mutation_data = json.dumps(graphql_mutation)

    # Now Perform the Mutation
    conn.request('POST', '/graphql', mutation_data, headers)
    response = conn.getresponse()

    response_string = response.read().decode('utf-8')
    print(response_string)
    