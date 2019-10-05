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

import { Component, ViewChild, Input } from '@angular/core';
import { Content, NavController } from 'ionic-angular';
import { CoreAppProvider } from '@providers/app';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { AddonVideoplaytimeProvider } from '../../providers/videoplaytime';
// import { AddonCompetencyHelperProvider } from '../../providers/helper';

/**
 * Component that displays the competencies of a course.
 */
@Component({
    selector: 'addon-videoplaytime-course',
    templateUrl: 'addon-videoplaytime-course.html',
})
export class AddonVideoplaytimeCourseComponent {
    @ViewChild(Content) content: Content;

    @Input() courseId: number;
    @Input() userId: number;

    playtimeLoaded = false;
    playtime: {maximum_time: '', play_time: '', available_time: ''};
    user: any;

    constructor(private navCtrl: NavController, private appProvider: CoreAppProvider, private domUtils: CoreDomUtilsProvider,
            private videoplaytimeProvider: AddonVideoplaytimeProvider /*private helperProvider: AddonCompetencyHelperProvider*/) {
    }

    /**
     * View loaded.
     */
    ngOnInit(): void {
        
        this.fetchCoursePlaytime().finally(() => {
            this.playtimeLoaded = true;
        });
    }

    
     /**
     * Fetches the competencies and updates the view.
     *
     * @return {Promise<void>} Promise resolved when done.
     */
    protected fetchCoursePlaytime(): Promise<void> {
        return this.videoplaytimeProvider.getCourseVideoplaytime(this.courseId, this.userId).then((playtime) => {
            this.playtime = playtime;
            
        }).catch((message) => {
            this.domUtils.showErrorModalDefault(message, 'Error getting course video playtime data.');
        });
    }

    secondsToDhms(seconds: number): String {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600*24));
        var h = Math.floor(seconds % (3600*24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);

        var dDisplay = (d) ? d : '00';
        var hDisplay = (h) ? h : '00';
        var mDisplay = (m) ? m : '00';
        var sDisplay = (s) ? s : '00';
        return dDisplay + ':' + hDisplay + ':' + mDisplay + ':' + sDisplay;
    }

    /**
     * Refreshes the competencies.
     *
     * @param {any} refresher Refresher.
     */
    refreshCoursePlaytime(refresher: any): void {
        // this.videoplayProvider.invalidateCourseCompetencies(this.courseId, this.userId).finally(() => {
            this.fetchCoursePlaytime().finally(() => {
                refresher.complete();
            });
        // });
    }
    
}
