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

import {PlatformLocation} from '@angular/common';
import {Component, NgModule, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {BrowserModule, Title} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {FlowState, LoanerFlowSequence, LoanerFlowSequenceButtons, LoanerFlowSequenceModule, NavigationLabels, Step} from '../../../../shared/components/flow_sequence';
import {LoanerProgressModule} from '../../../../shared/components/progress';
import {FlowsEnum, LoanerReturnInstructions, LoanerReturnInstructionsModule} from '../../../../shared/components/return_instructions';
import {Survey, SurveyAnswer, SurveyComponent, SurveyModule, SurveyType} from '../../../../shared/components/survey';
import {ApiConfig, apiConfigFactory} from '../../../../shared/services/api_config';
import {APIService, BACKGROUND_LOGO, BACKGROUND_LOGO_ENABLED,
PROGRAM_NAME, TOOLBAR_ICON,
TOOLBAR_ICON_ENABLED} from '../config';
import {Background} from '../shared/background_service';
import {ChromeAppPlatformLocation,} from '../shared/chrome_app_platform_location';
import {FailAction, FailType, Failure, FailureModule} from '../shared/failure';
import {HttpModule} from '../shared/http/http_module';
import {ReturnDateService} from '../shared/return_date_service';

import {MaterialModule} from './material_module';
import {ReturnComponent, ReturnModule} from './return';
import {WelcomeComponent, WelcomeModule} from './welcome';

const apiService = new APIService();

/** Steps for navigation. */
const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to Grab n Go',
  },
  {
    id: 'survey',
    title: 'One quick question',
  },
  {
    id: 'return',
    title: 'Choose your return date',
  },
  {
    id: 'return_instructions',
    title: 'All set!',
  },
];

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-root',
  styleUrls: ['./app.scss'],
  templateUrl: './app.ng.html',
})
export class AppRoot implements OnInit {
  readonly backgroundLogo = BACKGROUND_LOGO;
  readonly backgroundLogoEnabled = BACKGROUND_LOGO_ENABLED;
  readonly toolbarIcon = TOOLBAR_ICON;
  readonly toolbarIconEnabled = TOOLBAR_ICON_ENABLED;

  /** Labels to be used on navigation buttons. */
  readonly labels = {
    previous: {aria: 'Previous step', toolTip: 'Previous Step'},
    next: {aria: 'Next step', toolTip: 'Next Step'},
    done: {
      aria:
          'All done! This button will open the management page for your loaner',
      toolTip:
          'All done! This button will open the management page for your loaner.',
    }
  };
  flows = FlowsEnum;
  currentStep = 0;
  maxStep = 0;
  readonly steps = STEPS;
  @ViewChild(LoanerFlowSequence) flowSequence: LoanerFlowSequence;
  @ViewChild(LoanerFlowSequenceButtons)
  flowSequenceButtons: LoanerFlowSequenceButtons;

  surveyAnswer: SurveyAnswer;
  surveySent = false;

  // Flow components to be manipulated.
  @ViewChild(WelcomeComponent) welcomeComponent: WelcomeComponent;
  @ViewChild(SurveyComponent) surveyComponent: SurveyComponent;
  @ViewChild(ReturnComponent) returnComponent: ReturnComponent;
  @ViewChild(LoanerReturnInstructions)
  returnInstructions: LoanerReturnInstructions;


  constructor(
      private readonly bg: Background, private readonly failure: Failure,
      private readonly returnService: ReturnDateService,
      private readonly survey: Survey, public readonly title: Title) {
    this.title.setTitle(`Welcome to ${PROGRAM_NAME}`);
    this.survey.answer.subscribe(val => this.surveyAnswer = val);
    this.survey.surveySent.subscribe(val => this.surveySent = val);
  }

  ngOnInit() {
    this.flowSequence.steps = this.steps;
    this.maxStep = this.flowSequence.maxStepNumber;

    // Setup navigation buttons
    this.flowSequence.flowSequenceButtons = this.flowSequenceButtons;
    this.flowSequenceButtons.flowState = this.flowSequence.flowState;
    this.flowSequence.setupFlowButtonsListener();

    // Setup survey component
    this.surveySetup();
    this.surveyListener();

    // Setup return instructions
    this.returnInstructions.programName = PROGRAM_NAME;

    // Listen for flow finished
    this.flowSequenceButtons.finished.subscribe(finished => {
      if (finished) this.launchManageView();
    });

    // Listen for changes on the valid date observable.
    this.returnService.validDate.subscribe(val => {
      this.flowSequenceButtons.canProceed = val;
    });

    // Subscribe to flow state
    this.flowSequence.flowState.subscribe(state => {
      this.updateStepNumber(state);
      // Actions to be taken when certain previous step is shown.
      switch (state.previousStep.id) {
        case 'survey':
          if (!this.surveySent) {
            this.sendSurvey(this.surveyAnswer);
          }
          break;
        case 'return':
          // Ensure that can proceed isn't disabled because of a previous check.
          this.flowSequenceButtons.canProceed = true;

          // If the due date and the selected date are different, make the
          // call to change the return date.
          if (state.activeStep.id === 'return_instructions' &&
              this.returnService.dueDate !== this.returnService.newReturnDate) {
            this.returnService.changeReturnDate();
          }
          break;
        default:
          break;
      }

      // Actions to be taken when certain active/next step is show.
      switch (state.activeStep.id) {
        // Ensure that the button has been properly set with view changes.
        case 'return':
          this.returnService.validDate.subscribe(val => {
            this.flowSequenceButtons.canProceed = val;
          });
          break;
        case 'return_instructions':
          this.bg.onboardingComplete();
          break;
        default:
          break;
      }
    });
  }

  /**
   * Update the step number based off of information from the current flow
   * state.
   * @param state FlowState of the application.
   */
  updateStepNumber(state: FlowState) {
    if (state.optional) {
      if (state.optional.activeStepNumber === 0 ||
          state.optional.activeStepNumber) {
        this.currentStep = state.optional.activeStepNumber;
      }
    }
  }

  launchManageView() {
    this.bg.openView('manage');
  }

  // Survey related items
  /**
   * Setup and configure the survey component.
   */
  surveySetup() {
    this.surveyComponent.surveyDescription =
        `To get started, we would like to gather some information about how you
plan to use this device. This information will help us monitor usage trends and
ensure we have an appropriate amount of loaners.`;

    this.surveyComponent.surveyType = SurveyType.Assignment;
    this.surveyComponent.surveySent = this.surveySent;
  }

  /**
   * Handle changes from survey related items including the SurveyComponent.
   */
  surveyListener() {
    this.survey.answer.subscribe(val => this.surveyAnswer = val);
    this.surveyComponent.surveyError.subscribe(val => {
      const message = `We are unable to retrieve the survey at the moment,
continue using the app as normal.`;
      this.failure.register(message, FailType.Network, FailAction.Ignore, val);
    });
  }

  /**
   * Sends the survey answer via a service.
   * @param answer The answer object for the survey
   */
  sendSurvey(answer: SurveyAnswer) {
    if (answer) {
      this.surveyComponent.waiting();
      this.survey.submitSurvey(answer).subscribe(() => {
        this.surveySent = true;
        this.surveyComponent.surveySent = true;
        this.surveyComponent.ready();
      });
    }
  }
}

@NgModule({
  bootstrap: [AppRoot],
  declarations: [AppRoot],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FlexLayoutModule,
    LoanerFlowSequenceModule,
    MaterialModule,
    LoanerProgressModule,
    LoanerReturnInstructionsModule,
    ReturnModule,
    FailureModule,
    SurveyModule,
    WelcomeModule,
    HttpModule,
  ],
  providers: [
    {provide: PlatformLocation, useClass: ChromeAppPlatformLocation},
    APIService,
    Background,
    ReturnDateService,
    Survey,
    // useValue used in this provide since useFactory with parameters doesn't
    // work in AOT land.
    {
      provide: ApiConfig,
      useValue: apiConfigFactory(apiService.endpoints(), apiService.chrome()),
    },
  ],
})
export class AppModule {
}
