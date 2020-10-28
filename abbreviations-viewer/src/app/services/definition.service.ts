import {Injectable} from '@angular/core';
import * as csv from 'csvtojson';
import {Observable} from 'rxjs';

import {FirebaseService} from './firebase-config.service';

export interface DefinitionItem {
  id: string;
  abbreviation: string;
  expansion: string;
  context?: string;
  description?: string;
  usage?: string;
  contributor: string;
}

@Injectable({providedIn: 'root'})
export class DefinitionService {
  private userEmail: string;
  constructor(public firebaseServices: FirebaseService) {
    this.firebaseServices.user.subscribe(user => {
      if (user) {
        this.userEmail = user.email;
      }
    });
  }

  definitionConverter = {
    toFirestore: (data: DefinitionItem) => {
      const {id, contributor, ...retVal} = data;
      return {
        ...retVal,
        contributor: this.userEmail,
      };
    },
    fromFirestore: (snapshot, options):
        DefinitionItem => {
          const data = snapshot.data(options);
          return {...data, id: snapshot.id};
        }
  };

  add(item: DefinitionItem) {
    return new Promise((resolve, reject) => {
      this.firebaseServices.db.collection('entries')
          .withConverter(this.definitionConverter)
          .add(item)
          .then((docRef) => {
            resolve(docRef);
          })
          .catch((error) => {
            reject(error);
          });
    });
  }

  update(item: DefinitionItem) {
    return new Promise((resolve, reject) => {
      this.firebaseServices.db.collection('entries')
          .doc(item.id)
          .withConverter(this.definitionConverter)
          .update(item)
          .then(() => {
            resolve(item.id);
          })
          .catch((error) => {
            reject(error);
          });
    });
  }

  find(name: string): Promise<DefinitionItem[]> {
    return new Promise<DefinitionItem[]>((resolve) => {
      const retVal: DefinitionItem[] = [];
      this.firebaseServices.db.collection('entries')
          .withConverter(this.definitionConverter)
          .where('abbreviation', '==', name)
          .get()
          .then(querySnapshots => {
            querySnapshots.forEach((doc) => {
              if (doc.exists) {
                retVal.push(doc.data());
              }
            });
            resolve(retVal);
          });
    });
  }

  getAll(): Observable<DefinitionItem[]> {
    return new Observable<DefinitionItem[]>(subscriber => {
      const retVal: DefinitionItem[] = [];
      this.firebaseServices.db.collection('entries')
          .withConverter(this.definitionConverter)
          .onSnapshot(querySnapshots => {
            querySnapshots.forEach((doc) => {
              if (doc.exists) {
                retVal.push(doc.data());
              }
            });
            subscriber.next(retVal);
          });
    });
  }

  resetDb(csvFileName: string = 'AcronymsSeed') {
    const pathReference =
        this.firebaseServices.storage.ref(`acronyms/${csvFileName}.csv`);
    return new Promise((resolve, reject) => {
      pathReference.getDownloadURL()
          .then((url) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
              const blob: Blob = xhr.response;
              blob.text().then((value) => {
                const converter = csv().fromString(value).then((jsonValues) => {
                  jsonValues.forEach(
                      jsonValue => this.add(jsonValue as DefinitionItem));
                  resolve(true);
                });
              });
            };
            xhr.open('GET', url);
            xhr.send();
          })
          .catch((error) => {
            reject(error);
          });
    });
  }
}
