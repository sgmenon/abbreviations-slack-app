import {EnvironmentType} from './envTypes';

export const environment: EnvironmentType = {
  production: true,
  uploadFromCSVURL:
      'https://us-central1-sidmenon-playground.cloudfunctions.net/uploadFromCSV',
  getFirebaseConfig: () => {
    return fetch('__/firebase/init.json').then(async response => {
      return await response.json();
    });
  }
};
