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

import {Injectable} from '@angular/core';
import {Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {map, tap} from 'rxjs/operators';

import {ListShelfResponse, Shelf, ShelfApiParams} from '../models/shelf';

import {ApiService} from './api';

@Injectable()
/** Class to connect to the backend's Shelf Service API methods. */
export class ShelfService extends ApiService {
  /** Implements ApiService's apiEndpoint requirement. */
  apiEndpoint = 'shelf';

  /**
   * Get specific shelf from the backend.
   * @param shelfId Identifier for the Shelf to be gotten from the backend.
   */
  getShelf(shelfId: string) {
    return this.post<Shelf>('get', {'location': shelfId})
        .pipe(map(res => new Shelf(res)));
  }

  /**
   * Creates a particular shelf into the Grab n Go Loaners program.
   * @param newShelf Shelf that will be created in the program.
   */
  create(newShelf: Shelf) {
    this.post('enroll', newShelf.toApiMessage()).subscribe(res => {
      this.snackBar.open(`Shelf ${newShelf.location} created.`);
    });
  }

  /**
   * Update a particular shelf calling the backend.
   * @param newShelf New shelf information.
   * @param oldLocation Old shelf location to retrive old shelf info.
   */
  update(oldLocation: string, newShelf: Shelf) {
    const shelfToBeUpdated = newShelf.toApiMessage();
    shelfToBeUpdated['current_location'] = oldLocation;
    this.post('update', shelfToBeUpdated).subscribe(() => {
      this.snackBar.open(`Shelf ${oldLocation} updated.`);
    });
  }

  /**
   * Disables a shelf in the backend API.
   * @param shelf Shelf that will be disabled in the program.
   */
  disable(shelf: Shelf) {
    this.post('disable', shelf.toApiMessage()).subscribe(res => {
      this.snackBar.open(`Shelf ${shelf.location} disabled.`);
    });
  }

  /**
   * Lists all shelves enrolled in the program.
   */
  list(): Observable<Shelf[]> {
    return this.post<ListShelfResponse>('list').pipe(map(res => {
      const retrievedShelves = res;
      return (retrievedShelves['shelves'] || [])
          .map((retrievedShelf: ShelfApiParams) => new Shelf(retrievedShelf));
    }));
  }

  /**
   * Performs an audit to a particular shelf, adding the devices to the shelf.
   * @param shelf Shelf that will be audited on this call.
   * @param deviceIdList List of device ids that will be added to the shelf.
   */
  audit(shelf: Shelf, deviceIdList: string[]): Observable<void> {
    const shelfMessage = shelf.toApiMessage();
    shelfMessage['device_identifiers'] = deviceIdList;

    return this.post<void>('audit', shelfMessage).pipe(tap(() => {
      this.snackBar.open(`Shelf ${shelf.name} audited with devices
                          ${deviceIdList.toString().replace(/,/g, ', ')}.`);
    }));
  }
}
