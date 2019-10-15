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

import { Component, OnInit, NgZone } from '@angular/core';
import { Platform, IonicApp } from 'ionic-angular';
import { CoreAppProvider } from '@providers/app';
import { CoreEventsProvider } from '@providers/events';
import { CoreLangProvider } from '@providers/lang';
import { CoreLoggerProvider } from '@providers/logger';
import { CoreSitesProvider } from '@providers/sites';
import { CoreUrlUtilsProvider } from '@providers/utils/url';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { CoreCustomURLSchemesProvider } from '@providers/urlschemes';
import { CoreLoginHelperProvider } from '@core/login/providers/helper';
import { Keyboard } from '@ionic-native/keyboard';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { CoreLoginSitesPage } from '@core/login/pages/sites/sites';
import { CoreWSProvider, CoreWSPreSets, CoreWSFileUploadOptions } from '@providers/ws';


declare global {
    interface Window {
        H5P:any;
    }
}

@Component({
    templateUrl: 'app.html'
})

export class MoodleMobileApp implements OnInit {
    // Use page name (string) because the page is lazy loaded (Ionic feature). That way we can load pages without importing them.
    // The downside is that each page needs to implement a ngModule.
    rootPage: any = 'CoreLoginInitPage';
    protected logger;
    protected lastUrls = {};
    protected lastInAppUrl: string;
    
    public vptDetails = {userid: 0, timespent: 0, available_time: 0 };
    public timespent;
    public starttime;
    public endtime;
    public siteurl;
    public videoSrc;
    public refreshVideo;
    public videoElement: any;
    //  declare global {
    //     interface Window {
    //         H5P:any;
    //     }
    // }


    constructor(private platform: Platform, logger: CoreLoggerProvider, keyboard: Keyboard, private app: IonicApp,
            private eventsProvider: CoreEventsProvider, private loginHelper: CoreLoginHelperProvider, private zone: NgZone,
            private appProvider: CoreAppProvider, private langProvider: CoreLangProvider, private sitesProvider: CoreSitesProvider,
            private screenOrientation: ScreenOrientation, private urlSchemesProvider: CoreCustomURLSchemesProvider,
            private utils: CoreUtilsProvider, private urlUtils: CoreUrlUtilsProvider, private wsProvider: CoreWSProvider) {
        this.logger = logger.getInstance('AppComponent');

        // this.vptDetails =  { userid:'', timespent:'', available_time: '' };
        

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.

            // Set StatusBar properties.
            this.appProvider.setStatusBarColor();

            keyboard.hideFormAccessoryBar(false);

            if (this.appProvider.isDesktop()) {
                app.setElementClass('platform-desktop', true);

                if (this.appProvider.isMac()) {
                    app.setElementClass('platform-mac', true);
                } else if (this.appProvider.isLinux()) {
                    app.setElementClass('platform-linux', true);
                } else if (this.appProvider.isWindows()) {
                    app.setElementClass('platform-windows', true);
                }
            }

            // Register back button action to allow closing modals before anything else.
            this.appProvider.registerBackButtonAction(() => {
                return this.closeModal();
            }, 2000);

           // let this.videoEvents = [];
        });

    }

    /**
     * Component being initialized.
     */
    ngOnInit(): void {
        this.eventsProvider.on(CoreEventsProvider.LOGOUT, () => {
            // Go to sites page when user is logged out.
            // Due to DeepLinker, we need to use the ViewCtrl instead of name.
            // Otherwise some pages are re-created when they shouldn't.
            this.appProvider.getRootNavController().setRoot(CoreLoginSitesPage);

            // Unload lang custom strings.
            this.langProvider.clearCustomStrings();

            // Remove version classes from body.
            this.removeVersionClass();
        });

        // Listen for session expired events.
        this.eventsProvider.on(CoreEventsProvider.SESSION_EXPIRED, (data) => {
            this.loginHelper.sessionExpired(data);
        });

        // Listen for passwordchange and usernotfullysetup events to open InAppBrowser.
        this.eventsProvider.on(CoreEventsProvider.PASSWORD_CHANGE_FORCED, (data) => {
            this.loginHelper.openInAppForEdit(data.siteId, '/login/change_password.php', 'core.forcepasswordchangenotice', true);
        });
        this.eventsProvider.on(CoreEventsProvider.USER_NOT_FULLY_SETUP, (data) => {
            this.loginHelper.openInAppForEdit(data.siteId, '/user/edit.php', 'core.usernotfullysetup');
        });

        // Listen for sitepolicynotagreed event to accept the site policy.
        this.eventsProvider.on(CoreEventsProvider.SITE_POLICY_NOT_AGREED, (data) => {
            this.loginHelper.sitePolicyNotAgreed(data.siteId);
        });

        // Check URLs loaded in any InAppBrowser.
        this.eventsProvider.on(CoreEventsProvider.IAB_LOAD_START, (event) => {
            // URLs with a custom scheme can be prefixed with "http://" or "https://", we need to remove this.
            const url = event.url.replace(/^https?:\/\//, '');

            if (this.urlSchemesProvider.isCustomURL(url)) {
                // Close the browser if it's a valid SSO URL.
                this.urlSchemesProvider.handleCustomURL(url);
                this.utils.closeInAppBrowser(false);

            } else if (this.platform.is('android')) {
                // Check if the URL has a custom URL scheme. In Android they need to be opened manually.
                const urlScheme = this.urlUtils.getUrlProtocol(url);
                if (urlScheme && urlScheme !== 'file' && urlScheme !== 'cdvfile') {
                    // Open in browser should launch the right app if found and do nothing if not found.
                    this.utils.openInBrowser(url);

                    // At this point the InAppBrowser is showing a "Webpage not available" error message.
                    // Try to navigate to last loaded URL so this error message isn't found.
                    if (this.lastInAppUrl) {
                        this.utils.openInApp(this.lastInAppUrl);
                    } else {
                        // No last URL loaded, close the InAppBrowser.
                        this.utils.closeInAppBrowser(false);
                    }
                } else {
                    this.lastInAppUrl = url;
                }
            }
        });

        // Check InAppBrowser closed.
        this.eventsProvider.on(CoreEventsProvider.IAB_EXIT, () => {
            this.loginHelper.waitingForBrowser = false;
            this.lastInAppUrl = '';
            this.loginHelper.checkLogout();
        });

        this.platform.resume.subscribe(() => {
            // Wait a second before setting it to false since in iOS there could be some frozen WS calls.
            setTimeout(() => {
                this.loginHelper.waitingForBrowser = false;
                this.loginHelper.checkLogout();
            }, 1000);
        });

        // Handle app launched with a certain URL (custom URL scheme).
        (<any> window).handleOpenURL = (url: string): void => {
            // Execute the callback in the Angular zone, so change detection doesn't stop working.
            this.zone.run(() => {
                // First check that the URL hasn't been treated a few seconds ago. Sometimes this function is called more than once.
                if (this.lastUrls[url] && Date.now() - this.lastUrls[url] < 3000) {
                    // Function called more than once, stop.
                    return;
                }

                this.logger.debug('App launched by URL ', url);

                this.lastUrls[url] = Date.now();

                this.eventsProvider.trigger(CoreEventsProvider.APP_LAUNCHED_URL, url);
                this.urlSchemesProvider.handleCustomURL(url);
            });
        };

        // Load custom lang strings. This cannot be done inside the lang provider because it causes circular dependencies.
        const loadCustomStrings = (): void => {
            const currentSite = this.sitesProvider.getCurrentSite(),
                customStrings = currentSite && currentSite.getStoredConfig('tool_mobile_customlangstrings');

            if (typeof customStrings != 'undefined') {
                this.langProvider.loadCustomStrings(customStrings);
            }
        };

        this.eventsProvider.on(CoreEventsProvider.LOGIN, (data) => {
            if (data.siteId) {
                this.sitesProvider.getSite(data.siteId).then((site) => {
                    const info = site.getInfo();
                    if (info) {
                        // Add version classes to body.
                        this.removeVersionClass();
                        this.addVersionClass(this.sitesProvider.getReleaseNumber(info.release || ''));
                    }
                });
            }

            loadCustomStrings();
        });

        this.eventsProvider.on(CoreEventsProvider.SITE_UPDATED, (data) => {
            if (data.siteId == this.sitesProvider.getCurrentSiteId()) {
                loadCustomStrings();

                // Add version classes to body.
                this.removeVersionClass();
                this.addVersionClass(this.sitesProvider.getReleaseNumber(data.release || ''));
            }
        });

        this.eventsProvider.on(CoreEventsProvider.SITE_ADDED, (data) => {
            if (data.siteId == this.sitesProvider.getCurrentSiteId()) {
                loadCustomStrings();

                // Add version classes to body.
                this.removeVersionClass();
                this.addVersionClass(this.sitesProvider.getReleaseNumber(data.release || ''));
            }
        });

        // Pause Youtube videos in Android when app is put in background or screen is locked.
        this.platform.pause.subscribe(() => {
            if (!this.platform.is('android')) {
                return;
            }

            const pauseVideos = (window: Window): void => {
                // Search videos in iframes recursively.
                for (let i = 0; i < window.length; i++) {
                    pauseVideos(window[i]);
                }

                if (window.location.hostname.match(/^www\.youtube(-nocookie)?\.com$/)) {
                    // Embedded Youtube video, pause it.
                    const videos = window.document.querySelectorAll('video');
                    for (let i = 0; i < videos.length; i++) {
                        videos[i].pause();
                    }
                }
            };

            pauseVideos(window);
        });

        // Detect orientation changes.
        this.screenOrientation.onChange().subscribe(
            () => {
                if (this.platform.is('ios')) {
                    // Force ios to recalculate safe areas when rotating.
                    // This can be erased when https://issues.apache.org/jira/browse/CB-13448 issue is solved or
                    // After switching to WkWebview.
                    const viewport = document.querySelector('meta[name=viewport]');
                    viewport.setAttribute('content', viewport.getAttribute('content').replace('viewport-fit=cover,', ''));

                    setTimeout(() => {
                        viewport.setAttribute('content', 'viewport-fit=cover,' + viewport.getAttribute('content'));
                    });
                }

                this.eventsProvider.trigger(CoreEventsProvider.ORIENTATION_CHANGE);
            }
        );

        /*this.eventsProvider.on(CoreEventsProvider.CORE_LOADING_CHANGED, (data) => {

            if (data.loaded) {
                // LMSACE VPT - Add event listener for video events.
                const videos = document.querySelectorAll('video');
                for (let i = 0; i < videos.length; i++ ) {                   
                    videos[i].addEventListener('play', (e) => {
                       // var src = this.src;
                       videos[i].pause();
                       console.log(videos[i].src);
                    });
                } 
            }
        })*/

        // window.addEventListener('play', () => {//
         //   document.querySelector('body').addEventListener('click', (e) => {
             //   alert();    
            //    console.log(e)
            //    // if (e.target.tagName.toLowerCase() === 'video') {

            //    // }
         //   })
            
           
        // })

        // Video element event Handlers.


        document.body.addEventListener('playing', (e) => { this.videoStart(e) } , true) ;      

        document.body.addEventListener('ended', (e) => { this.videoStopped(e) } , true);
        
        document.body.addEventListener('pause', (e) => { this.videoStopped(e) } , true);

        /*var self = this;
        document.body.addEventListener('load', function(e) { 
             var element = e.target as HTMLElement;  
            
            if (element.tagName.toLowerCase() === 'iframe') { 
                console.log(element.contentWindow.getElementsByClassName('h5p-iframe').length);
                self.h5pVideoEventListener();                                
            }
        }, true);*/

        
       

        /**/

    }

    // H5P video element event Handlers.
   /* public h5pVideoEventListener() {
            console.log(document.getElementsByClassName('h5p-iframe').length);
        if (document.getElementsByClassName('h5p-iframe').length != 0) {
            var iframeH5PElem = document.getElementsByClassName('h5p-iframe')[0] as HTMLIFrameElement;
            if ("H5P" in iframeH5PElem.contentWindow) {
                var iframeH5P = iframeH5PElem.contentWindow.H5P;
                var iframeVideo = iframeH5P.instances[0].video;
                iframeVideo.on('stateChange', function (event) { 
                  switch (event.data) {
                    case iframeH5P.Video.ENDED:
                      console.log('Video ended after ' + iframeVideo.getCurrentTime() + ' seconds!');
                 
                      // Start over again?
                      iframeVideo.play();
                 
                      if (iframeVideo.getDuration() > 15) {
                        iframeVideo.seek(10);
                      }
                 
                      break;
                 
                    case iframeH5P.Video.PLAYING:
                      console.log('Playing'); 
                      break;
                 
                    case iframeH5P.Video.PAUSED:
                      console.log('Why you stop?');
                 
                      iframeVideo.setPlaybackRate(1.5); // Go fast
                      break;
                 
                    case iframeH5P.Video.BUFFERING:
                      console.log('Wait on your slow internet connection...');
                      break;
                  }
                });
            }
        }
    }*/

    public timeout() {

        this.cleartimeout();

        if (this.vptDetails.available_time > 0) { 
            this.refreshVideo = setTimeout(function() {
                // this.videoElement.pause();
                this.appProvider.getRootNavController().setRoot('CoreCoursesDashboardPage');
            }, this.vptDetails.available_time * 1000);
        }
    }
    public cleartimeout() {
        clearTimeout(this.refreshVideo);
    }

    public videoStart(e) {

        if (e.target.tagName.toLowerCase() === 'video') { 
            this.videoElement = e.target as HTMLIFrameElement;
            this.starttime = Date.now();
            this.timespent = 0;
            this.videoSrc = e.target.textContent;
            this.timeout();
        }
    }

    public videoStopped(e) {
        if (e.target.tagName.toLowerCase() === 'video') { 
            this.endtime = Date.now();
            this.findTimeSpent();
           this.UpdateUserTimeSpent();
        }
    }

    public findTimeSpent()  {
        if (this.starttime != '' ) {
            this.timespent = Math.floor( (this.endtime - this.starttime ) / 1000 );
            // alert(this.timespent);
            this.starttime = '';
            this.endtime = '';
        }
    }

    public UpdateUserTimeSpent() {
        let userid = this.sitesProvider.getCurrentSiteUserId();
        
        let userTime = { timespent: this.timespent, source: this.videoSrc, userid: userid };
        this.siteurl = this.sitesProvider.getCurrentSite().getURL();
        var siteId = this.sitesProvider.getCurrentSiteId();
        // console.log(this.sitesProvider.getCurrentSiteId());
               
        var vptWSavailable = this.sitesProvider.wsAvailableInCurrentSite('local_vpt_addUserTime_mobile');
        this.sitesProvider.getSite(siteId).then((site) => {
            site.read('local_vpt_addUserTime_mobile', userTime, {}).then((result) => {
                if (result.available_time) {
                    this.vptDetails = result;
                                     
                    
                }
            });
        })
    }

    /**
     * Convenience function to add version to body classes.
     *
     * @param {string} release Current release number of the site.
     */
    protected addVersionClass(release: string): void {
        const parts = release.split('.');

        parts[1] = parts[1] || '0';
        parts[2] = parts[2] || '0';

        document.body.classList.add('version-' + parts[0], 'version-' + parts[0] + '-' + parts[1],
            'version-' + parts[0] + '-' + parts[1] + '-' + parts[2]);

    }

    /**
     * Convenience function to remove all version classes form body.
     */
    protected removeVersionClass(): void {
        const remove = [];
        Array.from(document.body.classList).forEach((tempClass) => {
            if (tempClass.substring(0, 8) == 'version-') {
                remove.push(tempClass);
            }
        });

        remove.forEach((tempClass) => {
            document.body.classList.remove(tempClass);
        });
    }

    /**
     * Close one modal if any.
     *
     * @return {boolean} True if one modal was present.
     */
    closeModal(): boolean {
        // Following function is hidden in Ionic Code, however there's no solution for that.
        const portal = this.app._getActivePortal();
        if (portal) {
            portal.pop();

            return true;
        }

        return false;
    }
}
