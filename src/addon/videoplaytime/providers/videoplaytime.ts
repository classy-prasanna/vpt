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

import { Injectable } from '@angular/core';
import { CoreLoggerProvider } from '@providers/logger';
import { CoreSitesProvider } from '@providers/sites';
import { CoreCoursesProvider } from '@core/courses/providers/courses';
// import { CorePushNotificationsProvider } from '@core/pushnotifications/providers/pushnotifications';

/**
 * Service to provide grade functionalities.
 */
@Injectable()
export class AddonVideoplaytimeProvider {

	protected logger;
	protected siteId;
	protected courseid;
	protected userId;
	constructor(logger: CoreLoggerProvider, private sitesProvider: CoreSitesProvider,
            private coursesProvider: CoreCoursesProvider) {
        this.logger = logger.getInstance('AddonVideoplaytimeProvider');
        this.siteId = this.sitesProvider.getCurrentSiteId();
        
    }

    isPluginForCourseEnabled(courseId: number): Promise<any> {

    	return this.sitesProvider.getSite(this.siteId).then((site) => {
    		this.userId = this.sitesProvider.getCurrentSiteUserId();
    		console.log(this.userId);
    		let data = {
    			courseid: courseId
    			
    		}

            /*let preset = {
                saveToCache: false,
                reusePending: false,
            };*/
    		
    		let result = site.read('local_vpt_isCoursePlaytimeEnabled', data, {}).then((result) => {
    			return result.status;
    		});
    		
    		return result;
    	})
    }

    getCourseVideoplaytime(courseId: number, userId: number): Promise<any> {
    	return this.sitesProvider.getSite(this.siteId).then((site) => {
    		let data = {
    			courseid: courseId,
    			userid: userId || this.userId
    		};

            let preset = {
                saveToCache: false,
                reusePending: false,
            };

    		let result = site.read('local_vpt_userCoursePlaytime', data, preset).then((result) => { 
    			return result;
    		});

    		return result;
    	})
    }

    userCoursePlaytimeAccess(courseId: number, userId?: number): Promise<any> {
        return this.isPluginForCourseEnabled(courseId).then((result)=>{
            if (result == 'true') {
                return this.sitesProvider.getSite(this.siteId).then((site) => {
                    let data = {
                        courseid: courseId,
                        userid: userId || site.getUserId()
                    };
                    return site.read('local_vpt_userCoursePlaytimeAccess', data, {}).then((accessData) => {
                        return accessData
                    })      
                })
            }
            return "true";
        })
    }

    
}











