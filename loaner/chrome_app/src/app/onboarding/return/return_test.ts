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

import {HttpClient} from '@angular/common/http';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {of} from 'rxjs/observable/of';
import * as moment from 'moment';

import {LoaderModule} from '../../../../../shared/components/loader';
import {APIService} from '../../config';
import {FailureModule} from '../../shared/failure';
import {Loan} from '../../shared/loan';
import {ReturnDateService} from '../../shared/return_date_service';

import {ReturnComponent} from './index';
import {MaterialModule} from './material_module';

describe('ReturnComponent', () => {
  let app: ReturnComponent;
  let fixture: ComponentFixture<ReturnComponent>;
  let loan: Loan;
  let returnService: ReturnDateService;

  // Mock response of loan info
  const testLoanInfo: LoanResponse = {
    due_date: moment().toDate(),
    max_extend_date: moment().add(1, 'w').toDate(),
    given_name: 'John',
    guest_enabled: false,
    guest_permitted: true,
  };

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          declarations: [ReturnComponent],
          imports: [
            FailureModule,
            FormsModule,
            LoaderModule,
            MaterialModule,
            HttpClientTestingModule,
          ],
          providers: [
            APIService,
            HttpClient,
            Loan,
            ReturnDateService,
          ],
        })
        .compileComponents();

    loan = TestBed.get(Loan);
    returnService = TestBed.get(ReturnDateService);
    fixture = TestBed.createComponent(ReturnComponent);
    app = fixture.debugElement.componentInstance;
  });

  it('renders the page as loading', () => {
    app.waiting();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('loaner-loader')).toBeTruthy();
  });

  it('renders content on the page', () => {
    app.ready();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent)
        .toContain('Choose your return date');
  });

  it('retrieves the loan information', () => {
    spyOn(loan, 'getLoan').and.returnValue(of(testLoanInfo));
    app.ready();
    fixture.detectChanges();
    expect(app.dueDate).toEqual(testLoanInfo.due_date);
  });

  it('allows the loan to be extended 1 day', () => {
    spyOn(loan, 'getLoan').and.returnValue(of(testLoanInfo));
    app.ready();
    fixture.detectChanges();
    app.newReturnDate = moment().add(1, 'd').toDate(), app.sendNewReturnDate();
    expect(returnService.changeReturnDate()).toBeTruthy();
  });

  it('does NOT allow the loan to be extended 2 weeks', () => {
    spyOn(loan, 'getLoan').and.returnValue(of(testLoanInfo));
    app.ready();
    fixture.detectChanges();
    app.newReturnDate = moment().add(2, 'w').toDate(), app.sendNewReturnDate();
    expect(returnService.changeReturnDate()).toBeFalsy();
  });
});
