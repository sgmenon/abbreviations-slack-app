// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {firebaseConfig} from 'firebase-config';
import {EnvironmentType} from './envTypes';

export const environment: EnvironmentType = {
  production: false,
  firestoreDbPort: 8080,
  uploadFromCSVURL:
      'http://localhost:5001/sidmenon-playground/us-central1/uploadFromCSV',
  getFirebaseConfig: () => {
    return new Promise((resolve) => {
      resolve(firebaseConfig);
    });
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`,
 * `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a
 * negative impact on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
