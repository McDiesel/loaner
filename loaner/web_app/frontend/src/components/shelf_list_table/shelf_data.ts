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
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {tap} from 'rxjs/operators/tap';

import {Shelf} from '../../models/shelf';
import {ShelfService} from '../../services/shelf';

/** Shelf data class to be displayed in a mat-table. */
@Injectable()
export class ShelfData {
  /** Data that the backend streams to the frontend. */
  dataChange = new BehaviorSubject<Shelf[]>([]);

  constructor(private readonly shelfService: ShelfService) {
    this.refresh();
  }

  /** Property to return a list of shelves based on streamed data. */
  get data(): Shelf[] {
    return this.dataChange.value;
  }

  /** Updates the shelf data from the ShelfService. */
  refresh(): Observable<Shelf[]> {
    return this.shelfService.list().pipe(tap(shelves => {
      this.dataChange.next(shelves);
    }));
  }
}
