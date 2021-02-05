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
import moment from 'moment';

const getBucketKey = (bucketObjKey) => {
    const idx = bucketObjKey.indexOf('/');
    const bucket = bucketObjKey.slice(0, idx);
    const key = bucketObjKey.slice(idx+1);
    return {bucket: bucket, key: key}
};

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';  
    const ii = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${Math.round(bytes / (1024 ** ii), 2)} ${sizes[ii]}`;
};

const formattedDuration = (fileLength) => {
    let duration = moment.duration(fileLength);
    let formattedDuration = String(duration.hours()).padStart(2, "0") + ':' + String(duration.minutes()).padStart(2, "0") + ':' + String(duration.seconds()).padStart(2, "0");
    return formattedDuration
}

export {
    getBucketKey,
    bytesToSize,
    formattedDuration
}