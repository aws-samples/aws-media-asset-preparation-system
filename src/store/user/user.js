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
const SET_USER = 'SET_USER';
const SET_USER_GROUPS = 'SET_USER_GROUPS';
const SET_ALL_GROUPS = 'SET_ALL_GROUPS';

// Define actions
export function setUser(user) {
    return {
        type: SET_USER,
        user
    }
};

export function setUserGroups(userGroups) {
    return {
        type: SET_USER_GROUPS,
        userGroups
    }
};

export function setAllGroups(allGroups) {
    return {
        type: SET_ALL_GROUPS,
        allGroups
    }
};

// Default values for user/group information
const defaultUserConfig = {
    user: undefined, 
    userGroups: [],
    allGroups: []
};

// Reducers
export function userConfig(state=defaultUserConfig, action) {
    switch(action.type) {
        case SET_USER:
            return { ...state, user: action.user };
        case SET_USER_GROUPS:
            return { ...state, userGroups: action.userGroups };
        case SET_ALL_GROUPS:
            return { ...state, allGroups: action.allGroups };
        default:
            return state;
    }
};