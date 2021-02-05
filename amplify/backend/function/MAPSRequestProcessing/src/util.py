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
import math
from datetime import datetime, timezone

sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

map_storage = {
  'STANDARD': 'Standard',
  'STANDARD_IA': 'Standard IA',
  'ONEZONE_IA': 'One Zone-IA',
  'REDUCED_REDUNDANCY': 'Reduced Redundancy',
  'GLACIER': 'Glacier',
  'INTELLIGENT_TIERING': 'Intelligent Tiering',
  'DEEP_ARCHIVE': 'Deep Archive',
}

def convert_size(size_bytes):
   if size_bytes == 0:
       return "0B"
   i = int(math.floor(math.log(size_bytes, 1024)))
   p = math.pow(1024, i)
   s = round(size_bytes / p)
   return "%s %s" % (s, sizes[i])
   
def generate_response_body(resp_code, body):
    return {
        'statusCode': resp_code,
        'timestamp': datetime.now(timezone.utc).timestamp(),
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*"
        },
        'body': body
    }