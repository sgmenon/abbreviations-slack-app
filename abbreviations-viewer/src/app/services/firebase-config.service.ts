// must be after firebase app is imported
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/analytics';
import 'firebase/performance';

import {Injectable} from '@angular/core';
import firebase from 'firebase/app';
import {BehaviorSubject} from 'rxjs';
import {environment} from 'src/environments/environment';

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
  app: firebase.app.App;
  user = new BehaviorSubject<firebase.User|undefined>(undefined);
  credential?: GoogleAuthCredentials;
  errorInfo?: ErrorInfo;
  db: firebase.firestore.Firestore;
  get storage() {
    return firebase.storage();
  }
  constructor() {
    environment.getFirebaseConfig().then(firebaseConfig => {
      this.app = firebase.initializeApp(firebaseConfig);
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.user.next(user);
        } else {
          this.user.next(undefined);
          this.credential = undefined;
        }
      });
      firebase.analytics();
      firebase.performance();
      this.db = firebase.firestore();
      if (environment.production !== true && environment.firestoreDbPort) {
        this.db.useEmulator('localhost', environment.firestoreDbPort);
      }
    });
  }

  checkLoadedServices() {
    try {
      const features = [
        'auth',
        'firestore',
        'messaging',
        'storage',
        'analytics',
        'remoteConfig',
        'performance',
      ].filter(feature => typeof this.app[feature] === 'function');
      console.log(`Firebase SDK loaded with ${features.join(', ')}`);
    } catch (e) {
      console.error(e);
      console.log('Error loading the Firebase SDK, check the console.');
    }
  }

  authenticate() {
    return new Promise((resolve, reject) => {
      if (!this.app) {
        reject('App not initialized');
        return;
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({hd: 'motional.com'});
      firebase.auth()
          .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
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

  signOut() {
    return new Promise<boolean>((resolve, reject) => {
      if (this.user.getValue()) {
        firebase.auth()
            .signOut()
            .then(() => {
              resolve(true);
            })
            .catch((err) => {
              reject(err);
            });
      } else {
        resolve(false);
      }
    });
  }
}
