// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreSplitViewComponent } from '@components/split-view/split-view';
import { AddonVideoplaytimeProvider } from '../../providers/videoplaytime';

/**
 * Page that displays the list of competencies of a learning plan.
 */
@IonicPage({ segment: 'addon-videoplaytime-block' })
@Component({
    selector: 'page-addon-videoplaytime-block',
    templateUrl: 'block.html',
})
export class AddonVideoplaytimeBlockPage {
    @ViewChild(CoreSplitViewComponent) splitviewCtrl: CoreSplitViewComponent;

    protected planId: number;
    protected courseId: number;
    protected videoplaytimeId: number;
    protected userId: number;

    playtimeLoaded = false;
    competencies = [];
    title: string;

    constructor(navParams: NavParams, private translate: TranslateService, private domUtils: CoreDomUtilsProvider,
            private videoplaytimeProvider: AddonVideoplaytimeProvider) {
        this.planId = navParams.get('planId');
        this.courseId = navParams.get('courseId');
        this.videoplaytimeId = navParams.get('videoplaytimeId');
        this.userId = navParams.get('userId');
    }

    /**
     * View loaded.
     */
    ionViewDidLoad(): void {
        
        this.playtimeLoaded = true;
    }

   
}
