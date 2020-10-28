// must be after firebase app is imported
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/analytics';
import 'firebase/performance';

import {Injectable} from '@angular/core';
import * as firebase from 'firebase/app';
import {BehaviorSubject} from 'rxjs';

interface ErrorInfo {
  errorCode: any;
  errorMessage: string;
  email: string;
  credential: firebase.auth.AuthCredential;
}

export type GoogleAuthCredentials =
    firebase.auth.AuthCredential&{accessToken: string};


@Injectable({providedIn: 'root'})
export class FirebaseService {
  private readonly firebaseConfig = {
    apiKey: 'AIzaSyCXZhrrY8YCqHYRikn_zoexzSE_4GF4hc0',
    authDomain: 'sidmenon-playground.firebaseapp.com',
    databaseURL: 'https://sidmenon-playground.firebaseio.com',
    projectId: 'sidmenon-playground',
    storageBucket: 'sidmenon-playground.appspot.com',
    messagingSenderId: '651061023794',
    appId: '1:651061023794:web:cb185286a891456214582b',
    measurementId: 'G-3HSTYVL8Y7'
  };
  app: firebase.app.App;
  user = new BehaviorSubject<firebase.User|undefined>(undefined);
  credential?: GoogleAuthCredentials;
  errorInfo?: ErrorInfo;
  get db() {
    return firebase.firestore();
  }
  get storage() {
    return firebase.storage();
  }
  constructor() {
    this.app = firebase.initializeApp(this.firebaseConfig);
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.user.next(user);
      }
    });
    firebase.analytics();
    firebase.performance();
  }

  checkLoadedServices() {
    try {
      const app = this.app;
      const features = [
        'auth',
        'firestore',
        'messaging',
        'storage',
        'analytics',
        'remoteConfig',
        'performance',
      ].filter(feature => typeof app[feature] === 'function');
      console.log(`Firebase SDK loaded with ${features.join(', ')}`);
    } catch (e) {
      console.error(e);
      console.log('Error loading the Firebase SDK, check the console.');
    }
  }

  authenticate() {
    return new Promise((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth()
          .setPersistence(firebase.auth.Auth.Persistence.SESSION)
          .then(() => {
            firebase.auth()
                .signInWithPopup(provider)
                .then((result) => {
                  // This contains a Google Access Token. You can use it to
                  // access the Google API.
                  this.credential = result.credential as GoogleAuthCredentials;
                  // ...
                  resolve(result.user);
                })
                .catch((error) => {
                  this.errorInfo = {
                    // Handle Errors here.
                    errorCode: error.code,
                    errorMessage: error.message,
                    // The email of the user's account used.
                    email: error.email,
                    // The firebase.auth.AuthCredential type that was used.
                    credential: error.credential,
                    // ...
                  };
                  reject(this.errorInfo);
                });
          });
    });
  }
}
