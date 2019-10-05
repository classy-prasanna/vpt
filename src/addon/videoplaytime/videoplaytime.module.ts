import { NgModule } from '@angular/core';
import { AddonVideoplaytimeProvider } from './providers/videoplaytime';
import { AddonVideoplaytimeCourseOptionHandler } from './providers/course-option-handler';
import { CoreCourseOptionsDelegate } from '@core/course/providers/options-delegate';
import { AddonVideoplaytimeComponentsModule } from './components/components.module';


// List of providers (without handlers).
export const ADDON_VIDOEPLAYTIME_PROVIDERS: any[] = [
	AddonVideoplaytimeProvider    
];

@NgModule({
    declarations: [
    ],
    imports: [
        AddonVideoplaytimeComponentsModule
    ],
    providers: [
        AddonVideoplaytimeProvider,
		AddonVideoplaytimeCourseOptionHandler
    ]
})

export class AddonVideoplaytimeModule {

	constructor( courseOptionsDelegate: CoreCourseOptionsDelegate, courseOptionHandler: AddonVideoplaytimeCourseOptionHandler ) {
		 courseOptionsDelegate.registerHandler(courseOptionHandler);
         //alert('test');
	}
}