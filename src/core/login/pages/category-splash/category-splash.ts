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

import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { CoreAppProvider } from '@providers/app';
import { CoreSitesProvider } from '@providers/sites';
// import { CoreCategorySplashDelegate } from '@providers/category-splash';
import { CoreConstants } from '../../../constants';
import { CoreLoginHelperProvider } from '../../providers/helper';

/**
 * Page that displays a "splash screen" while the app is being initialized.
 */
@IonicPage({ segment: 'core-login-category-splash' })
@Component({
    selector: 'page-core-login-category-splash',
    templateUrl: 'category-splash.html',
})
// @injectable();
export class CoreLoginCategorySplashPage {
	public categorySplash='';
	public pageLoaded;
    public categoryTitle: string;
    // public siteName;

    constructor(private navCtrl: NavController, private appProvider: CoreAppProvider, /*private initDelegate: CoreInitDelegate,*/
        private sitesProvider: CoreSitesProvider, private loginHelper: CoreLoginHelperProvider,
        private splashScreen: SplashScreen) { 

       // this.siteName= this.loadCategoryTitle();
    }

    /**
     * View loaded.
     */
    ionViewDidLoad(): void /*Promise<any>*/ {
    	this.loginHelper.getCategorySplash().then((result) => {
	    	//console.log(this.categorySplash);
	    	if (result != '') {
    		    this.categorySplash = result.image;
                this.categoryTitle  = result.title;
	    		this.pageLoaded = true;
	    		setTimeout(() => {
	    			return this.loginHelper.goToSiteInitialPage();	
	    		}, 5000)	
	    	} else {
	    		return this.loginHelper.goToSiteInitialPage();	
	    	}
	    	// return result;
    	});
    	
    }

    
}













