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
import logging
import os
import json
import util
import s3_handler
import ddb_handler

from chalice import Chalice, BadRequestError, NotFoundError
from chalice import CognitoUserPoolAuthorizer

app = Chalice(app_name='source-of-truth-api')
app.debug = True

logging.basicConfig()
logging.getLogger().setLevel(logging.INFO)

authorizer = CognitoUserPoolAuthorizer(
    'SourceOfTruthUserPool', provider_arns=[os.environ['COGNITO_USER_POOL']])

@app.route('/upload', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def upload_s3_file():
    request_body = json.loads(app.current_request.raw_body)
    return ddb_handler.handle_upload_file_req(request_body, app.current_request.context)

@app.route('/download', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def download_s3_file():
    request_body = json.loads(app.current_request.raw_body)
    return ddb_handler.handle_download_file_req(request_body, app.current_request.context)

@app.route('/', methods=['GET'], authorizer=authorizer, cors=True)
def get_s3_ddb_data():
    queryParams = app.current_request.query_params
    return s3_handler.get_s3_ddb_data(bucket_name=queryParams.get('bucketName'), next_token=queryParams.get('nextIdToken'), keyPrefix=queryParams.get('prefix'), req_cxt=app.current_request.context)

@app.route('/admin', methods=['POST'], cors=True)
def handle_admin_checkin():
    request_body = json.loads(app.current_request.raw_body)
    queryParams = app.current_request.query_params
    if (app.current_request.context['authorizer']['claims']['cognito:groups'] != "admin"):
        return util.generate_response_body(resp_code=400, body='')
    else:
        return ddb_handler.handle_admin_operation(request_body, queryParams, app.current_request.context)
    
@app.route('/bucket', methods=['GET'], authorizer=authorizer, cors=True)
def get_s3_buckets():
    queryParams = app.current_request.query_params
    return s3_handler.get_s3_buckets(queryParams.get('bucketName'))

@app.route('/object', methods=['GET'], authorizer=authorizer, cors=True)
def get_s3_obj_data():
    queryParams = app.current_request.query_params
    return s3_handler.get_s3_obj(bucket_name=queryParams.get('bucketName'), key=queryParams.get('key'))
    
@app.route('/rename', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def rename_s3_file():
    request_body = json.loads(app.current_request.raw_body)
    return ddb_handler.handle_rename_move_req(request_body, app.current_request.context)
    
@app.route('/move', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def move_s3_files():
    request_body = json.loads(app.current_request.raw_body)
    return ddb_handler.handle_fsx_move_req(request_body, app.current_request.context, app.current_request)

@app.route('/delete', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def delete_s3_file():
    request_body = json.loads(app.current_request.raw_body)
    return ddb_handler.handle_delete_file_req(request_body, app.current_request.context)

@app.route('/folder', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def create_new_folder():
    request_body = json.loads(app.current_request.raw_body)
    return s3_handler.check_folder_exists(request_body)

@app.route('/folder/permissions', methods=['GET'], authorizer=authorizer, cors=True)
def get_folder_permissions():
    queryParams = app.current_request.query_params
    return ddb_handler.get_folder_permissions(bucket_name=queryParams.get('bucketName'), folder_key=queryParams.get('folderKey'), request_cxt=app.current_request.context)

@app.route('/folder/permissions', methods=['POST'], content_types=['application/json'], authorizer=authorizer, cors=True)
def update_folder_permissions():
    request_body = json.loads(app.current_request.raw_body)
    return ddb_handler.update_folder_permissions(request_body, app.current_request.context)

@app.route('/user/groups', methods=['GET'], authorizer=authorizer, cors=True)
def get_user_groups():
    return s3_handler.get_user_groups(app.current_request.context)