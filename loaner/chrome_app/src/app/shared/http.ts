// Copyright 2018 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Functions used for oauth http requests in the background script.
 * Note: Not a standard angular module.
 */

import {HeaderInit} from 'node-fetch';
import {LOGGING} from '../config';

let accessToken: string;

export type HeaderInitTs26 = HeaderInit&string[][];

/**
 * Headers to be used in the request with oauth information
 */
function HEADERS() {
  return {
    'Content-type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

/**
 * Execute a HTTP GET request.
 * @param url a string of the URL which you want to make a request to.
 * @param headers Any other http header request information.
 */

export function get(url: string, headers?: HeaderInitTs26) {
  return makeRequest('get', url, undefined, headers);
}

/**
 * Execute a HTTP POST request.
 * @param url A string of the URL which you want to make a request to.
 * @param body The data to be send over the POST HTTP request
 * @param headers Any other http header request information.
 */
export function post(url: string, body: string, headers?: HeaderInitTs26) {
  return makeRequest('post', url, body, headers);
}

/**
 * Execute a HTTP request when given a http method and url.
 * @param method string value of the http method used for the request.
 * @param url a string of the URL which you want to make a request to.
 * @param body The data to be send over the POST HTTP request.
 * @param headers Any other http header request information.
 */
function makeRequest(
    method: string, url: string, body?: string, headers?: HeaderInitTs26) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
        {interactive: false}, (newAccessToken: string) => {
          if (LOGGING) {
            console.info(`Access token: ${newAccessToken}`);
          }
          accessToken = newAccessToken;
          let removedCacheToken = false;

          const attemptFetch = () => {
            const options: RequestInit = {
              method,
              headers: headers || HEADERS(),
            };

            if (method !== 'head' && method !== 'get') {
              options.body = body || '';
            }

            fetch(`${url}`, options)
                .then(
                    (response: Response) => {
                      if (response.status === 401 && !removedCacheToken) {
                        removedCacheToken = true;

                        chrome.identity.removeCachedAuthToken(
                            {token: newAccessToken}, attemptFetch);
                        return;
                      }

                      if (response.status === 204) {
                        resolve(undefined);
                      } else {
                        resolve(response.json());
                      }
                    },
                    (reason: {}) => {
                      reject(reason);
                    });
          };

          attemptFetch();
        });
  });
}